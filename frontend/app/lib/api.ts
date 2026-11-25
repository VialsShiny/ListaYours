import { voice } from "@/content/voice";

export const NETWORK_ERROR_MESSAGE = voice.errors.network;
export const UNAUTHORIZED_EVENT = "listayours:unauthorized";

type ValidationIssue = { loc?: unknown; msg: string; type?: string };

export type ApiErrorBody = { detail?: string | ValidationIssue[] } | null;

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  session?: boolean;
  signal?: AbortSignal;
};

/**
 * Turns an API error body (`{detail: string}` or `{detail: [{msg}]}`) into one French sentence.
 * A 422 whose detail is not a sentence is raw validator output, so it becomes a generic message.
 */
export function detailToMessage(body: ApiErrorBody, fallback: string, status?: number): string {
  if (!body || body.detail === undefined || body.detail === null) return fallback;
  if (typeof body.detail === "string") return body.detail;
  if (status === 422) return voice.errors.invalid;
  if (Array.isArray(body.detail)) {
    const messages = body.detail.map((issue) => issue.msg).filter(Boolean);
    return messages.length > 0 ? messages.join(" ") : fallback;
  }
  return fallback;
}

/**
 * Extracts a user-facing French message from anything thrown by `apiFetch`.
 */
export function errorMessage(error: unknown, fallback: string = voice.errors.generic): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof TypeError) return NETWORK_ERROR_MESSAGE;
  if (error instanceof DOMException && error.name === "AbortError") return fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function statusFallback(status: number): string {
  switch (status) {
    case 401:
      return voice.errors.unauthorized;
    case 403:
      return voice.errors.forbidden;
    case 404:
      return voice.errors.notFound;
    case 409:
      return voice.errors.conflict;
    case 429:
      return voice.errors.tooMany;
    default:
      return voice.errors.server(status);
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Builds the `ApiError` for a failed response, reading its JSON body when there is one.
 */
export async function parseError(response: Response, fallback?: string): Promise<ApiError> {
  const body = ((await parseBody(response)) ?? null) as ApiErrorBody;
  const message = detailToMessage(
    body,
    fallback ?? statusFallback(response.status),
    response.status,
  );
  return new ApiError(response.status, body, message);
}

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);

/**
 * Thin fetch wrapper for the same-origin ListaYours API: JSON in/out, cookie session, typed errors.
 * `session: true` marks calls that need the session, so a 401 signs the user out.
 * Network failures are rethrown as `TypeError` so `errorMessage` can name them. Other methods
 * without a body send an empty one so the request declares `Content-Length: 0` for the proxy.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const method = options.method ?? "GET";
  const binary = options.body instanceof Blob;
  if (binary) headers["Content-Type"] = (options.body as Blob).type || "application/octet-stream";
  else if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(path, {
    method,
    headers,
    body: binary
      ? (options.body as Blob)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : BODYLESS_METHODS.has(method)
          ? undefined
          : "",
    signal: options.signal,
  });

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    if (response.status === 401 && options.session && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw await parseError(response);
  }

  return (await parseBody(response)) as T;
}

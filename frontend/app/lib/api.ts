export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const NETWORK_ERROR_MESSAGE = "Impossible de joindre le serveur. Vérifiez votre connexion.";
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
  token?: string | null;
  signal?: AbortSignal;
};

/**
 * Turns an API error body (`{detail: string}` or `{detail: [{msg}]}`) into one French sentence.
 */
export function detailToMessage(body: ApiErrorBody, fallback: string): string {
  if (!body || body.detail === undefined || body.detail === null) return fallback;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    const messages = body.detail.map((issue) => issue.msg).filter(Boolean);
    return messages.length > 0 ? messages.join(" ") : fallback;
  }
  return fallback;
}

/**
 * Extracts a user-facing French message from anything thrown by `apiFetch`.
 */
export function errorMessage(error: unknown, fallback = "Une erreur est survenue."): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof TypeError) return NETWORK_ERROR_MESSAGE;
  if (error instanceof DOMException && error.name === "AbortError") return fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function statusFallback(status: number): string {
  switch (status) {
    case 401:
      return "Vous devez être connecté pour effectuer cette action.";
    case 403:
      return "Vous n'avez pas les droits nécessaires.";
    case 404:
      return "Ressource introuvable.";
    case 409:
      return "Conflit : cette action n'est plus possible.";
    case 429:
      return "Trop de requêtes. Réessayez dans quelques instants.";
    default:
      return `Erreur serveur (${status}).`;
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
 * Thin fetch wrapper for the ListaYours API: JSON in/out, Bearer auth, typed errors.
 * Network failures are rethrown as `TypeError` so `errorMessage` can name them.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (response.status === 204) return undefined as T;
  const body = await parseBody(response);

  if (!response.ok) {
    const errorBody = (body ?? null) as ApiErrorBody;
    if (response.status === 401 && options.token && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      response.status,
      errorBody,
      detailToMessage(errorBody, statusFallback(response.status)),
    );
  }

  return body as T;
}

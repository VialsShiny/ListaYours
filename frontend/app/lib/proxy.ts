/**
 * Pure helpers for the `/api/*` proxy in `middleware.ts`: client address, header hygiene, body
 * size limits and the rewrite target check. They read only what they are given, so they are
 * unit-testable without a running server.
 */
export const MAX_BODY_BYTES = 3 * 1024 * 1024;

export const ALLOWED_METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);

const BODYLESS_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const STRIPPED_HEADERS = [
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "forwarded",
  "x-real-ip",
  "x-client-ip",
  "x-proxy-secret",
  "connection",
  "keep-alive",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "proxy-authorization",
  "proxy-authenticate",
];

const ADDRESS_PATTERN = /^[0-9A-Fa-f:.]{2,45}$/;

type Env = Record<string, string | undefined>;

function cleanAddress(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return ADDRESS_PATTERN.test(trimmed) ? trimmed : null;
}

function forwardedEntries(headers: Headers): string[] {
  return (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * The caller's address. On Vercel the platform overwrites `x-real-ip` and `x-forwarded-for`
 * with the real client, so they are trusted. Self-hosted, `x-forwarded-for` is trusted only
 * when `TRUST_PROXY_HOPS` names how many proxies sit in front, reading that many hops from the
 * right; otherwise the address is "unknown" rather than a value the client chose.
 */
export function clientAddress(headers: Headers, env: Env): string {
  if (env.VERCEL) {
    return (
      cleanAddress(headers.get("x-real-ip")) ??
      cleanAddress(forwardedEntries(headers)[0]) ??
      "unknown"
    );
  }
  const hops = Number(env.TRUST_PROXY_HOPS ?? "");
  if (!Number.isInteger(hops) || hops <= 0) return "unknown";
  const entries = forwardedEntries(headers);
  return cleanAddress(entries[entries.length - hops]) ?? "unknown";
}

/**
 * Copy of the incoming headers without forwarding, hop-by-hop or proxy-secret headers, with
 * `x-client-ip` set to the computed address and `x-proxy-secret` set only when configured.
 */
export function forwardedHeaders(source: Headers, clientIp: string, secret: string): Headers {
  const headers = new Headers(source);
  for (const name of STRIPPED_HEADERS) headers.delete(name);
  headers.set("x-client-ip", clientIp);
  if (secret) headers.set("x-proxy-secret", secret);
  return headers;
}

/**
 * Status to answer instead of proxying the body, or `null` when the body may go through: a
 * numeric Content-Length of at most 3 MB, never a chunked transfer. A missing Content-Length is
 * an empty body: Vercel's edge drops the `Content-Length: 0` that browsers send on body-less
 * writes such as logout and deletes, so requiring it would refuse them.
 */
export function bodyRejection(method: string, headers: Headers): number | null {
  if (BODYLESS_METHODS.has(method)) return null;
  if (headers.has("transfer-encoding")) return 411;
  const length = headers.get("content-length");
  if (length === null) return null;
  if (!/^\d+$/.test(length)) return 400;
  return Number(length) > MAX_BODY_BYTES ? 413 : null;
}

/**
 * True when the rewrite stays on the upstream origin and under its `/api` prefix.
 */
export function isAllowedTarget(target: URL, upstream: string): boolean {
  if (target.origin !== new URL(upstream).origin) return false;
  return target.pathname === "/api" || target.pathname.startsWith("/api/");
}

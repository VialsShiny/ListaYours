import { NextResponse, type NextRequest } from "next/server";

/**
 * Same-origin API: the browser only ever talks to this site. `/api/*` is proxied here to the
 * FastAPI upstream with the shared secret that the API requires, plus the caller's address for
 * its rate limiter. The session cookie therefore stays first-party and httpOnly. Bodies above
 * the API's own limit are refused here, before any byte is forwarded.
 */
const upstream = process.env.API_INTERNAL_URL ?? "http://localhost:8000";
const proxySecret = process.env.API_PROXY_SECRET ?? "";
const maxBodyBytes = 3 * 1024 * 1024;

export const config = { matcher: "/api/:path*" };

export function middleware(request: NextRequest) {
  if (Number(request.headers.get("content-length") ?? 0) > maxBodyBytes) {
    return new NextResponse(null, { status: 413 });
  }
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, upstream);
  const headers = new Headers(request.headers);
  headers.set("x-client-ip", clientAddress(request));
  if (proxySecret) headers.set("x-proxy-secret", proxySecret);
  else headers.delete("x-proxy-secret");
  return NextResponse.rewrite(target, { request: { headers } });
}

function clientAddress(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return request.ip ?? (first || "unknown");
}

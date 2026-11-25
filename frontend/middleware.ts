import { NextResponse, type NextRequest } from "next/server";
import {
  ALLOWED_METHODS,
  bodyRejection,
  clientAddress,
  forwardedHeaders,
  isAllowedTarget,
} from "@/lib/proxy";

/**
 * Same-origin API: the browser only ever talks to this site. `/api/*` is proxied here to the
 * FastAPI upstream with the shared secret that the API requires, plus the caller's address for
 * its rate limiter. The session cookie therefore stays first-party and httpOnly. Unknown
 * methods, undeclared or oversized bodies are refused here, before any byte is forwarded, and a
 * production deployment without its upstream or secret fails closed.
 */
export const config = { matcher: "/api/:path*" };

/**
 * Each variable is named in full: the edge bundle only exposes `process.env.NAME` accesses it can
 * see statically.
 */
function readEnv() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    TRUST_PROXY_HOPS: process.env.TRUST_PROXY_HOPS,
    API_INTERNAL_URL: process.env.API_INTERNAL_URL,
    API_PROXY_SECRET: process.env.API_PROXY_SECRET,
  };
}

export function middleware(request: NextRequest) {
  const env = readEnv();
  const production = env.NODE_ENV === "production";
  if (production && (!env.API_INTERNAL_URL || !env.API_PROXY_SECRET)) {
    return new NextResponse(null, { status: 503 });
  }
  if (!ALLOWED_METHODS.has(request.method)) {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: Array.from(ALLOWED_METHODS).join(", ") },
    });
  }
  const rejection = bodyRejection(request.method, request.headers);
  if (rejection !== null) return new NextResponse(null, { status: rejection });

  const upstream = env.API_INTERNAL_URL ?? "http://localhost:8000";
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, upstream);
  if (!isAllowedTarget(target, upstream)) return new NextResponse(null, { status: 400 });

  const headers = forwardedHeaders(
    request.headers,
    clientAddress(request.headers, env),
    env.API_PROXY_SECRET ?? "",
  );
  return NextResponse.rewrite(target, { request: { headers } });
}

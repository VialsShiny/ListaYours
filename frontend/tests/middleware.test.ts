import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "../middleware";
import { MAX_BODY_BYTES } from "@/lib/proxy";

const UPSTREAM = "http://api.internal:8000";

function call(path: string, init: { method?: string; headers?: Record<string, string> } = {}) {
  return middleware(new NextRequest(`http://site.test${path}`, init));
}

function forwarded(response: Response, name: string): string | null {
  return response.headers.get(`x-middleware-request-${name}`);
}

function overridden(response: Response): string[] {
  return (response.headers.get("x-middleware-override-headers") ?? "").split(",");
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("TRUST_PROXY_HOPS", "");
  vi.stubEnv("API_INTERNAL_URL", UPSTREAM);
  vi.stubEnv("API_PROXY_SECRET", "s3cret");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("middleware rewrite", () => {
  it("rewrites /api/* to the upstream with the secret and browser headers", () => {
    const response = call("/api/gifts?x=1", {
      headers: {
        origin: "http://site.test",
        "sec-fetch-site": "same-origin",
        cookie: "session=abc",
        "content-type": "application/json",
      },
    });
    expect(response.headers.get("x-middleware-rewrite")).toBe(`${UPSTREAM}/api/gifts?x=1`);
    expect(forwarded(response, "x-proxy-secret")).toBe("s3cret");
    expect(forwarded(response, "origin")).toBe("http://site.test");
    expect(forwarded(response, "sec-fetch-site")).toBe("same-origin");
    expect(forwarded(response, "cookie")).toBe("session=abc");
  });

  it("strips spoofed forwarding headers and computes x-client-ip", () => {
    const response = call("/api/gifts", {
      headers: {
        "x-forwarded-for": "6.6.6.6",
        "x-real-ip": "6.6.6.6",
        "x-client-ip": "6.6.6.6",
        forwarded: "for=6.6.6.6",
        "x-forwarded-host": "evil.example",
      },
    });
    const names = overridden(response);
    for (const name of ["x-forwarded-for", "x-real-ip", "forwarded", "x-forwarded-host"]) {
      expect(names).not.toContain(name);
    }
    expect(forwarded(response, "x-client-ip")).toBe("unknown");
  });

  it("trusts x-forwarded-for only as far as TRUST_PROXY_HOPS allows", () => {
    vi.stubEnv("TRUST_PROXY_HOPS", "1");
    const headers = { "x-forwarded-for": "6.6.6.6, 203.0.113.7" };
    expect(forwarded(call("/api/gifts", { headers }), "x-client-ip")).toBe("203.0.113.7");
    vi.stubEnv("TRUST_PROXY_HOPS", "2");
    expect(forwarded(call("/api/gifts", { headers }), "x-client-ip")).toBe("6.6.6.6");
    vi.stubEnv("TRUST_PROXY_HOPS", "abc");
    expect(forwarded(call("/api/gifts", { headers }), "x-client-ip")).toBe("unknown");
  });

  it("uses x-real-ip on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    const response = call("/api/gifts", {
      headers: { "x-real-ip": "198.51.100.4", "x-forwarded-for": "198.51.100.9" },
    });
    expect(forwarded(response, "x-client-ip")).toBe("198.51.100.4");
  });
});

describe("middleware refusals", () => {
  it("treats a missing body length as empty and refuses chunked writes", () => {
    const bodyless = call("/api/auth/logout", { method: "POST" });
    expect(bodyless.headers.get("x-middleware-rewrite")).toBe(`${UPSTREAM}/api/auth/logout`);
    const chunked = { "content-length": "10", "transfer-encoding": "chunked" };
    expect(call("/api/gifts", { method: "POST", headers: chunked }).status).toBe(411);
    const bad = { "content-length": "1e3" };
    expect(call("/api/gifts", { method: "POST", headers: bad }).status).toBe(400);
  });

  it("accepts exactly 3 MB and refuses one byte more", () => {
    const exact = { "content-length": String(MAX_BODY_BYTES) };
    const exactResponse = call("/api/account/avatar", { method: "PUT", headers: exact });
    expect(exactResponse.headers.get("x-middleware-rewrite")).toBe(
      `${UPSTREAM}/api/account/avatar`,
    );
    const over = { "content-length": String(MAX_BODY_BYTES + 1) };
    expect(call("/api/account/avatar", { method: "PUT", headers: over }).status).toBe(413);
  });

  it("refuses unknown methods", () => {
    expect(call("/api/gifts", { method: "PROPFIND" }).status).toBe(405);
  });

  it("refuses targets outside the upstream /api prefix", () => {
    expect(call("//evil.example/api/x").status).toBe(400);
    expect(call("/apix").status).toBe(400);
  });

  it("fails closed in production without upstream or secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_PROXY_SECRET", "");
    expect(call("/api/gifts").status).toBe(503);
    vi.stubEnv("API_PROXY_SECRET", "s3cret");
    expect(call("/api/gifts").headers.get("x-middleware-rewrite")).toBe(`${UPSTREAM}/api/gifts`);
  });
});

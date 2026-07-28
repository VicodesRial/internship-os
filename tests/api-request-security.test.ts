import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  ApiRequestError,
  assertSameOriginRequest,
  getExpectedOrigin,
  readSecureJson,
} from "@/lib/api/request-security";
import { apiDataResultResponse, apiErrorResponse } from "@/lib/api/server";
import { getCsrfCookieName } from "@/lib/security/csrf";
import { updateSession } from "@/lib/supabase/middleware";

const ORIGIN = "http://localhost:3000";
const TOKEN = "a".repeat(64);

function mutationRequest(
  body: BodyInit = JSON.stringify({ valid: true }),
  headers: Record<string, string> = {},
) {
  return new Request(`${ORIGIN}/api/applications`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `${getCsrfCookieName("localhost")}=${TOKEN}`,
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      "x-csrf-token": TOKEN,
      ...headers,
    },
    body,
  });
}

function expectRequestError(
  action: () => unknown | Promise<unknown>,
  status: ApiRequestError["status"],
) {
  return expect(action).rejects.toMatchObject({ status });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("API request security", () => {
  it("accepts an exact same-origin JSON mutation with matching CSRF tokens", async () => {
    await expect(readSecureJson(mutationRequest())).resolves.toEqual({ valid: true });
  });

  it("rejects an external Origin header", async () => {
    await expectRequestError(
      () => readSecureJson(mutationRequest(undefined, { origin: "https://evil.example" })),
      403,
    );
  });

  it("rejects same-site requests that are not same-origin", async () => {
    await expectRequestError(
      () => readSecureJson(mutationRequest(undefined, { "sec-fetch-site": "same-site" })),
      403,
    );
  });

  it("requires an Origin header for mutations", async () => {
    const request = mutationRequest();
    request.headers.delete("origin");
    await expectRequestError(() => readSecureJson(request), 403);
  });

  it("rejects non-JSON request media types", async () => {
    await expectRequestError(
      () => readSecureJson(mutationRequest(undefined, { "content-type": "text/plain" })),
      415,
    );
  });

  it("rejects a missing CSRF header", async () => {
    const request = mutationRequest();
    request.headers.delete("x-csrf-token");
    await expectRequestError(() => readSecureJson(request), 403);
  });

  it("rejects a mismatched CSRF token", async () => {
    await expectRequestError(
      () => readSecureJson(mutationRequest(undefined, { "x-csrf-token": "b".repeat(64) })),
      403,
    );
  });

  it("returns a client error for malformed JSON", async () => {
    await expectRequestError(() => readSecureJson(mutationRequest("{")), 400);
  });

  it("rejects an oversized Content-Length before reading", async () => {
    await expectRequestError(
      () => readSecureJson(mutationRequest("{}", { "content-length": "100" }), 10),
      413,
    );
  });

  it("enforces the streamed byte limit without Content-Length", async () => {
    await expectRequestError(
      () => readSecureJson(mutationRequest(JSON.stringify({ value: "x".repeat(100) })), 32),
      413,
    );
  });

  it("rejects cross-origin reads when Fetch Metadata identifies them", () => {
    const request = new Request(`${ORIGIN}/api/data-controls`, {
      headers: { "sec-fetch-site": "cross-site" },
    });
    expect(() => assertSameOriginRequest(request, { requireOrigin: false }))
      .toThrowError(ApiRequestError);
  });

  it("requires a valid configured production origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ORIGIN", "https://example.com/path");
    expect(() => getExpectedOrigin(new Request("https://example.com/api/test")))
      .toThrowError(ApiRequestError);
  });
});

describe("safe API errors", () => {
  it("returns a stable error envelope without CORS or stack details", async () => {
    const request = new Request(`${ORIGIN}/api/test`, {
      headers: { "x-request-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    });
    const response = apiErrorResponse(
      request,
      "INTERNAL_ERROR",
      "The request could not be completed.",
      500,
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "The request could not be completed.",
        requestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
    });
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("serializes thrown data failures as generic errors", async () => {
    const request = new Request(`${ORIGIN}/api/test`);
    const response = await apiDataResultResponse(
      request,
      Promise.reject(new Error("database-password-and-stack")),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("database-password-and-stack");
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("middleware security boundary", () => {
  it("issues a locked __Host- CSRF cookie outside localhost", async () => {
    const response = await updateSession(
      new NextRequest("https://app.example/offline"),
    );
    const cookie = response.cookies.get("__Host-internship-csrf");

    expect(cookie?.path).toBe("/");
    expect(cookie?.sameSite).toBe("strict");
    expect(cookie?.secure).toBe(true);
    expect(cookie?.httpOnly).toBe(false);
    expect(cookie?.domain).toBeUndefined();
  });

  it("uses the non-secure development CSRF cookie on localhost only", async () => {
    const response = await updateSession(
      new NextRequest("http://localhost:3000/offline"),
    );
    const cookie = response.cookies.get("internship-csrf");

    expect(cookie?.secure).toBe(false);
    expect(cookie?.sameSite).toBe("strict");
  });

  it("rejects cross-origin API requests before authentication", async () => {
    vi.stubEnv("APP_ORIGIN", "https://app.example");
    const response = await updateSession(
      new NextRequest("https://app.example/api/applications", {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          "sec-fetch-site": "cross-site",
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});

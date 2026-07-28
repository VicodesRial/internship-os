import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  applyResponseSecurityHeaders,
  buildContentSecurityPolicy,
  createContentSecurityPolicyNonce,
} from "@/lib/security/headers";
import {
  logApiOutcome,
  pseudonymizeUserId,
} from "@/lib/security/logging";
import { updateSession } from "@/lib/supabase/middleware";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("content security policy", () => {
  it("uses a per-request nonce and allows only required external services", () => {
    const nonce = createContentSecurityPolicyNonce();
    const policy = buildContentSecurityPolicy(nonce, {
      development: false,
      supabaseUrl: "https://project.supabase.co/rest/v1",
    });

    expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(policy).toContain(`'nonce-${nonce}'`);
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("https://challenges.cloudflare.com");
    expect(policy).toContain("https://project.supabase.co");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("permits eval only for the Next.js development runtime", () => {
    expect(
      buildContentSecurityPolicy("test", { development: true }),
    ).toContain("'unsafe-eval'");
  });

  it("applies CSP and anti-framing headers to rendered responses", async () => {
    const response = await updateSession(
      new NextRequest("https://app.example/offline"),
    );
    const policy = response.headers.get("content-security-policy");

    expect(policy).toContain("'nonce-");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("adds HSTS only in the production security profile", () => {
    vi.stubEnv("NODE_ENV", "production");
    const headers = new Headers();

    applyResponseSecurityHeaders(headers, "default-src 'self'");

    expect(headers.get("strict-transport-security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
  });
});

describe("structured security logging", () => {
  it("logs allowlisted metadata without request secrets or raw user IDs", () => {
    const output = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const rawUserId = "user-secret-id";
    const bodySecret = "password=super-secret";
    const request = new Request(
      "https://app.example/api/applications?token=secret-token",
      {
        method: "POST",
        headers: {
          authorization: "Bearer secret-token",
          cookie: "session=secret-cookie",
          "x-request-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          "x-user-ref": pseudonymizeUserId(rawUserId),
        },
        body: bodySecret,
      },
    );

    logApiOutcome(request, 403, "FORBIDDEN");

    const serialized = String(output.mock.calls[0][0]);
    const record = JSON.parse(serialized);
    expect(record).toMatchObject({
      event: "api_request",
      method: "POST",
      route: "/api/applications",
      status: 403,
      errorCode: "FORBIDDEN",
      userRef: pseudonymizeUserId(rawUserId),
    });
    expect(serialized).not.toContain(rawUserId);
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("secret-cookie");
    expect(serialized).not.toContain("super-secret");
    expect(serialized).not.toContain("authorization");
    expect(serialized).not.toContain("cookie");
  });
});

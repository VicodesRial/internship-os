import { afterEach, describe, expect, it, vi } from "vitest";

import { getCsrfCookieName } from "@/lib/security/csrf";
import {
  createRecoveryMarker,
  getRecoveryCookieName,
} from "@/lib/security/auth-cookies";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { POST as login } from "@/app/api/auth/login/route";
import { POST as password } from "@/app/api/auth/password/route";
import { POST as recovery } from "@/app/api/auth/recovery/route";
import { GET as confirm } from "@/app/auth/confirm/route";

const ORIGIN = "http://localhost:3000";
const CSRF_TOKEN = "a".repeat(64);

function authRequest(
  path: string,
  body: Record<string, unknown>,
  extraCookie?: string,
) {
  const cookie = [
    `${getCsrfCookieName("localhost")}=${CSRF_TOKEN}`,
    extraCookie,
  ].filter(Boolean).join("; ");

  return new Request(`${ORIGIN}${path}`, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie,
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      "x-csrf-token": CSRF_TOKEN,
    },
    method: "POST",
  });
}

afterEach(() => {
  createClientMock.mockReset();
  vi.unstubAllEnvs();
});

describe("server authentication routes", () => {
  it("passes the Turnstile token server-side and returns a generic login error", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: new Error("upstream stack and account detail"),
    });
    createClientMock.mockResolvedValue({ auth: { signInWithPassword } });

    const response = await login(
      authRequest("/api/auth/login", {
        captchaToken: "turnstile-token",
        email: "operator@example.com",
        next: "/applications",
        password: "incorrect",
      }),
    );
    const body = await response.json();

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "operator@example.com",
      password: "incorrect",
      options: { captchaToken: "turnstile-token" },
    });
    expect(response.status).toBe(401);
    expect(JSON.stringify(body)).not.toContain("upstream");
    expect(body.error.message).toBe("The email or password is incorrect.");
  });

  it("does not enumerate recovery accounts or upstream failures", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({
      error: new Error("email does not exist"),
    });
    createClientMock.mockResolvedValue({ auth: { resetPasswordForEmail } });

    const response = await recovery(
      authRequest("/api/auth/recovery", {
        captchaToken: "turnstile-token",
        email: "missing@example.com",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(JSON.stringify(body)).not.toContain("does not exist");
    expect(body.data.message).toContain("If the account exists");
  });

  it("requires a verified recovery marker before changing a password", async () => {
    const response = await password(
      authRequest("/api/auth/password", {
        password: "new-password-value",
      }),
    );

    expect(response.status).toBe(403);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("consumes the recovery marker and globally revokes sessions", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-a" } },
        }),
        signOut,
        updateUser,
      },
    });
    const markerName = getRecoveryCookieName("localhost");
    const marker = createRecoveryMarker();
    const response = await password(
      authRequest(
        "/api/auth/password",
        { password: "new-password-value" },
        `${markerName}=${marker}`,
      ),
    );

    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith({ password: "new-password-value" });
    expect(signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(response.cookies.get(markerName)?.value).toBe("");
    expect(response.cookies.get(markerName)?.maxAge).toBe(0);

    const reused = await password(
      authRequest("/api/auth/password", {
        password: "another-password",
      }),
    );
    expect(reused.status).toBe(403);
  });

  it("accepts a fresh recovery PKCE code from the default email template", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      data: {
        user: {
          recovery_sent_at: new Date(Date.now() - 60_000).toISOString(),
        },
      },
      error: null,
    });
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession,
        signOut: vi.fn(),
      },
    });

    const response = await confirm(
      new Request(`${ORIGIN}/auth/confirm?code=recovery-code`),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("recovery-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/reset-password`);
    expect(
      response.cookies.get(getRecoveryCookieName("localhost"))?.value,
    ).toHaveLength(43);
  });

  it("rejects a stale or non-recovery PKCE code and clears its session", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          data: {
            user: {
              recovery_sent_at: new Date(
                Date.now() - 31 * 60_000,
              ).toISOString(),
            },
          },
          error: null,
        }),
        signOut,
      },
    });

    const response = await confirm(
      new Request(`${ORIGIN}/auth/confirm?code=stale-code`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `${ORIGIN}/login?error=confirmation-failed`,
    );
    expect(response.cookies.get(getRecoveryCookieName("localhost"))).toBeUndefined();
    expect(signOut).toHaveBeenCalledOnce();
  });
});

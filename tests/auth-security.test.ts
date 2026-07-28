import { describe, expect, it, vi } from "vitest";

import {
  MINIMUM_PASSWORD_LENGTH,
  parseLoginRequest,
  parsePasswordUpdateRequest,
  parseRecoveryRequest,
  parseSignupRequest,
} from "@/lib/auth/requests";
import {
  createRecoveryMarker,
  getAuthCookieOptions,
  getRecoveryCookieOptions,
  isValidRecoveryMarker,
} from "@/lib/security/auth-cookies";

describe("authentication request validation", () => {
  it("normalizes email and applies the centralized safe redirect", () => {
    expect(
      parseLoginRequest({
        captchaToken: "token",
        email: " Operator@Example.com ",
        next: "https://evil.example/private",
        password: "password",
      }),
    ).toMatchObject({
      email: "operator@example.com",
      next: "/",
    });
  });

  it("requires a CAPTCHA token for public auth requests", () => {
    expect(() =>
      parseRecoveryRequest({ email: "operator@example.com" }),
    ).toThrow("authentication request is invalid");
  });

  it("enforces the twelve-character password boundary", () => {
    expect(() =>
      parsePasswordUpdateRequest({
        password: "x".repeat(MINIMUM_PASSWORD_LENGTH - 1),
      }),
    ).toThrow(`at least ${MINIMUM_PASSWORD_LENGTH}`);
    expect(
      parsePasswordUpdateRequest({
        password: "x".repeat(MINIMUM_PASSWORD_LENGTH),
      }),
    ).toEqual({ password: "x".repeat(MINIMUM_PASSWORD_LENGTH) });
  });

  it("bounds account metadata", () => {
    expect(() =>
      parseSignupRequest({
        captchaToken: "token",
        displayName: "x".repeat(121),
        email: "operator@example.com",
        password: "x".repeat(MINIMUM_PASSWORD_LENGTH),
      }),
    ).toThrow("Display name is too long");
  });
});

describe("authentication cookies", () => {
  it("locks production session and recovery cookies to the host", () => {
    expect(getAuthCookieOptions("app.example")).toMatchObject({
      httpOnly: true,
      name: "__Host-internship-auth",
      path: "/",
      sameSite: "lax",
      secure: true,
    });
    expect(getAuthCookieOptions("app.example")).not.toHaveProperty("domain");
    expect(getRecoveryCookieOptions("app.example")).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("uses a non-secure local session cookie only on localhost", () => {
    expect(getAuthCookieOptions("localhost")).toMatchObject({
      name: "internship-auth",
      secure: false,
    });
  });

  it("creates only valid, unpredictable recovery markers", () => {
    const first = createRecoveryMarker();
    const second = createRecoveryMarker();
    expect(isValidRecoveryMarker(first)).toBe(true);
    expect(first).not.toBe(second);
    expect(isValidRecoveryMarker("predictable")).toBe(false);
  });
});

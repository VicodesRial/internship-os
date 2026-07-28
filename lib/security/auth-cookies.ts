import { randomBytes } from "node:crypto";

import { isLocalHostname } from "@/lib/security/csrf";

export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const RECOVERY_COOKIE_MAX_AGE = 60 * 30;

const AUTH_COOKIE_NAME = "internship-auth";
const RECOVERY_COOKIE_NAME = "internship-recovery";
const RECOVERY_MARKER_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function resolveCookieHostname(requestHostname?: string) {
  const configuredOrigin = process.env.APP_ORIGIN?.trim();
  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin).hostname;
    } catch {
      // Request security reports malformed production origins before API handlers run.
    }
  }
  return requestHostname || "localhost";
}

function productionCookieName(name: string, hostname: string) {
  return isLocalHostname(hostname) ? name : `__Host-${name}`;
}

export function getAuthCookieOptions(hostname: string) {
  return {
    httpOnly: true,
    maxAge: AUTH_COOKIE_MAX_AGE,
    name: productionCookieName(AUTH_COOKIE_NAME, hostname),
    path: "/",
    sameSite: "lax" as const,
    secure: !isLocalHostname(hostname),
  };
}

export function getRecoveryCookieName(hostname: string) {
  return productionCookieName(RECOVERY_COOKIE_NAME, hostname);
}

export function getRecoveryCookieOptions(hostname: string) {
  return {
    httpOnly: true,
    maxAge: RECOVERY_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: !isLocalHostname(hostname),
  };
}

export function createRecoveryMarker() {
  return randomBytes(32).toString("base64url");
}

export function isValidRecoveryMarker(value: string | null | undefined) {
  return typeof value === "string" && RECOVERY_MARKER_PATTERN.test(value);
}

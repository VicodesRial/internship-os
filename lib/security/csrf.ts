export const CSRF_HEADER_NAME = "x-csrf-token";

const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "::1", "[::1]", "localhost"]);
const CSRF_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function isLocalHostname(hostname: string) {
  return LOCAL_HOSTNAMES.has(hostname);
}

export function getCsrfCookieName(hostname: string) {
  return isLocalHostname(hostname)
    ? "internship-csrf"
    : "__Host-internship-csrf";
}

export function isValidCsrfToken(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && CSRF_TOKEN_PATTERN.test(value);
}

export function createCsrfToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

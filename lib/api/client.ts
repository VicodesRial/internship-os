"use client";

import { isApiErrorPayload, type ApiEnvelope } from "@/lib/api/contracts";
import type { DataResult } from "@/lib/data/applications";
import {
  CSRF_HEADER_NAME,
  getCsrfCookieName,
  isValidCsrfToken,
} from "@/lib/security/csrf";

function readBrowserCookie(name: string) {
  for (const part of document.cookie.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

function isMutation(method: string) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = init.method ?? "GET";
  const headers = new Headers(init.headers);

  if (isMutation(method)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const cookieName = getCsrfCookieName(window.location.hostname);
    const token = readBrowserCookie(cookieName);
    if (isValidCsrfToken(token)) headers.set(CSRF_HEADER_NAME, token);
  }

  return fetch(input, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers,
  });
}

export async function parseApiResponse<T>(
  response: Response,
  fallback: string,
): Promise<DataResult<T>> {
  try {
    const result = (await response.json()) as ApiEnvelope<T>;
    if (result.data !== null && result.error === null) {
      return { data: result.data, error: null };
    }
    if (result.data === null && isApiErrorPayload(result.error)) {
      return { data: null, error: result.error.message || fallback };
    }
  } catch {
    // Fall through to the stable client-facing error.
  }
  return { data: null, error: fallback };
}

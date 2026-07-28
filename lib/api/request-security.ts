import { timingSafeEqual } from "node:crypto";

import {
  CSRF_HEADER_NAME,
  getCsrfCookieName,
  isValidCsrfToken,
} from "@/lib/security/csrf";

export const DEFAULT_MUTATION_BODY_LIMIT = 64 * 1024;
export const IMPORT_BODY_LIMIT = 1024 * 1024;

export class ApiRequestError extends Error {
  constructor(
    readonly code:
      | "CONFIGURATION_ERROR"
      | "FORBIDDEN"
      | "INVALID_JSON"
      | "PAYLOAD_TOO_LARGE"
      | "UNSUPPORTED_MEDIA_TYPE",
    readonly status: 400 | 403 | 413 | 415 | 500,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function parseConfiguredOrigin(value: string) {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function getExpectedOrigin(request: Request) {
  const configured = process.env.APP_ORIGIN?.trim();
  if (configured) {
    const origin = parseConfiguredOrigin(configured);
    if (origin) return origin;
    throw new ApiRequestError(
      "CONFIGURATION_ERROR",
      500,
      "The application security configuration is invalid.",
    );
  }

  const requestUrl = new URL(request.url);
  if (process.env.NODE_ENV !== "production") return requestUrl.origin;

  throw new ApiRequestError(
    "CONFIGURATION_ERROR",
    500,
    "The application security configuration is incomplete.",
  );
}

export function assertSameOriginRequest(
  request: Request,
  options: { requireOrigin: boolean },
) {
  const expectedOrigin = getExpectedOrigin(request);
  const fetchSite = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");

  if (fetchSite && fetchSite !== "same-origin") {
    throw new ApiRequestError("FORBIDDEN", 403, "Cross-origin requests are not allowed.");
  }

  if (options.requireOrigin && !origin) {
    throw new ApiRequestError("FORBIDDEN", 403, "A trusted request origin is required.");
  }

  if (origin && origin !== expectedOrigin) {
    throw new ApiRequestError("FORBIDDEN", 403, "Cross-origin requests are not allowed.");
  }
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }

  return null;
}

export function assertCsrfToken(request: Request) {
  const cookieName = getCsrfCookieName(new URL(request.url).hostname);
  const cookieToken = readCookie(request.headers.get("cookie"), cookieName);
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!isValidCsrfToken(cookieToken) || !isValidCsrfToken(headerToken)) {
    throw new ApiRequestError("FORBIDDEN", 403, "The security token is missing or invalid.");
  }

  const cookieBytes = Buffer.from(cookieToken);
  const headerBytes = Buffer.from(headerToken);
  if (
    cookieBytes.length !== headerBytes.length ||
    !timingSafeEqual(cookieBytes, headerBytes)
  ) {
    throw new ApiRequestError("FORBIDDEN", 403, "The security token is missing or invalid.");
  }
}

function assertJsonContentType(request: Request) {
  const contentType = request.headers.get("content-type");
  const mediaType = contentType?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new ApiRequestError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
      "Requests must use application/json.",
    );
  }
}

async function readBodyBytes(request: Request, maximumBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maximumBytes) {
    throw new ApiRequestError("PAYLOAD_TOO_LARGE", 413, "The request body is too large.");
  }

  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maximumBytes) {
      await reader.cancel();
      throw new ApiRequestError("PAYLOAD_TOO_LARGE", 413, "The request body is too large.");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function readSecureJson(
  request: Request,
  maximumBytes = DEFAULT_MUTATION_BODY_LIMIT,
): Promise<unknown> {
  assertSameOriginRequest(request, { requireOrigin: true });
  assertJsonContentType(request);
  assertCsrfToken(request);

  try {
    const bytes = await readBodyBytes(request, maximumBytes);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError("INVALID_JSON", 400, "The JSON request body is invalid.");
  }
}

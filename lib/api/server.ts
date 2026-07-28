import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import type { ApiEnvelope, ApiErrorCode } from "@/lib/api/contracts";
import {
  ApiRequestError,
  assertSameOriginRequest,
  readSecureJson,
} from "@/lib/api/request-security";
import type { DataResult } from "@/lib/data/applications";
import { logApiOutcome } from "@/lib/security/logging";
import { createClient } from "@/lib/supabase/server";

export type RateLimitScope = "normal" | "sensitive";

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getRequestId(request: Request) {
  const requestId = request.headers.get("x-request-id");
  return requestId && REQUEST_ID_PATTERN.test(requestId) ? requestId : randomUUID();
}

function responseHeaders(requestId: string, extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "no-store");
  headers.set("Vary", "Origin, Sec-Fetch-Site");
  headers.set("X-Request-Id", requestId);
  return headers;
}

export function apiErrorResponse(
  request: Request,
  code: ApiErrorCode,
  message: string,
  status: number,
  extraHeaders?: HeadersInit,
) {
  const requestId = getRequestId(request);
  const body: ApiEnvelope<never> = {
    data: null,
    error: { code, message, requestId },
  };
  logApiOutcome(request, status, code);
  return NextResponse.json(body, {
    status,
    headers: responseHeaders(requestId, extraHeaders),
  });
}

export function apiSuccessResponse<T>(request: Request, data: T) {
  const requestId = getRequestId(request);
  const body: ApiEnvelope<T> = { data, error: null };
  logApiOutcome(request, 200);
  return NextResponse.json(body, {
    status: 200,
    headers: responseHeaders(requestId),
  });
}

export async function apiDataResultResponse<T>(
  request: Request,
  operation: DataResult<T> | Promise<DataResult<T>>,
) {
  try {
    const result = await operation;
    if (result.data !== null) return apiSuccessResponse(request, result.data);
    if (result.error === "Your session has expired.") {
      return apiErrorResponse(
        request,
        "AUTH_REQUIRED",
        "Authentication is required.",
        401,
      );
    }
    if (result.error === "A goal already exists for that week.") {
      return apiErrorResponse(request, "INVALID_REQUEST", result.error, 400);
    }
    return apiErrorResponse(
      request,
      "INTERNAL_ERROR",
      "The request could not be completed.",
      500,
    );
  } catch {
    return apiErrorResponse(
      request,
      "INTERNAL_ERROR",
      "The request could not be completed.",
      500,
    );
  }
}

export function apiRequestErrorResponse(request: Request, error: unknown) {
  if (error instanceof ApiRequestError) {
    return apiErrorResponse(request, error.code, error.message, error.status);
  }
  return apiErrorResponse(
    request,
    "INTERNAL_ERROR",
    "The request could not be completed.",
    500,
  );
}

export async function readApiMutation(request: Request, maximumBytes?: number) {
  try {
    return { data: await readSecureJson(request, maximumBytes), response: null };
  } catch (error) {
    return { data: null, response: apiRequestErrorResponse(request, error) };
  }
}

export function guardApiRead(request: Request) {
  try {
    assertSameOriginRequest(request, { requireOrigin: false });
    return null;
  } catch (error) {
    return apiRequestErrorResponse(request, error);
  }
}

export async function enforceRateLimit(
  request: Request,
  scope: RateLimitScope,
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return apiErrorResponse(
        request,
        "AUTH_REQUIRED",
        "Authentication is required.",
        401,
      );
    }

    const { data, error } = await supabase.rpc("consume_api_rate_limit", {
      p_scope: scope,
    });
    const result = data?.[0];
    if (error || !result) {
      return apiErrorResponse(
        request,
        "INTERNAL_ERROR",
        "The request could not be completed.",
        500,
      );
    }
    if (!result.allowed) {
      return apiErrorResponse(
        request,
        "RATE_LIMITED",
        "Too many requests. Try again later.",
        429,
        { "Retry-After": String(result.retry_after_seconds) },
      );
    }
    return null;
  } catch {
    return apiErrorResponse(
      request,
      "INTERNAL_ERROR",
      "The request could not be completed.",
      500,
    );
  }
}

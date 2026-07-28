import { randomUUID } from "node:crypto";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { ApiEnvelope, ApiErrorCode } from "@/lib/api/contracts";
import {
  ApiRequestError,
  assertSameOriginRequest,
  getExpectedOrigin,
} from "@/lib/api/request-security";
import type { Database } from "@/lib/database.types";
import { getOptionalPublicSupabaseEnv } from "@/lib/env";
import {
  getAuthCookieOptions,
  getRecoveryCookieName,
  isValidRecoveryMarker,
  resolveCookieHostname,
} from "@/lib/security/auth-cookies";
import {
  createCsrfToken,
  getCsrfCookieName,
  isLocalHostname,
  isValidCsrfToken,
} from "@/lib/security/csrf";
import {
  applyResponseSecurityHeaders,
  buildContentSecurityPolicy,
  createContentSecurityPolicyNonce,
} from "@/lib/security/headers";
import {
  logApiOutcome,
  pseudonymizeUserId,
} from "@/lib/security/logging";

type PendingCookie = { name: string; options: CookieOptions; value: string };

const guestOnlyRoutes = new Set(["/login", "/signup", "/forgot-password"]);
const publicRoutes = new Set(["/offline"]);
const publicAuthApiRoutes = new Set([
  "/api/auth/login",
  "/api/auth/recovery",
  "/api/auth/signup",
]);

function isPublicRoute(pathname: string) {
  return (
    guestOnlyRoutes.has(pathname) ||
    publicRoutes.has(pathname) ||
    publicAuthApiRoutes.has(pathname) ||
    pathname.startsWith("/auth/")
  );
}

function applyCookies(
  response: NextResponse,
  pendingCookies: PendingCookie[],
  contentSecurityPolicy: string,
) {
  pendingCookies.forEach(({ name, options, value }) => {
    response.cookies.set(name, value, options);
  });
  applyResponseSecurityHeaders(response.headers, contentSecurityPolicy);
  return response;
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  pendingCookies: PendingCookie[],
  contentSecurityPolicy: string,
  params?: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
  return applyCookies(
    NextResponse.redirect(url),
    pendingCookies,
    contentSecurityPolicy,
  );
}

function apiError(
  request: NextRequest,
  requestId: string,
  code: ApiErrorCode,
  message: string,
  status: number,
  contentSecurityPolicy: string,
  pendingCookies: PendingCookie[] = [],
) {
  const body: ApiEnvelope<never> = {
    data: null,
    error: { code, message, requestId },
  };
  const response = NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Vary": "Origin, Sec-Fetch-Site",
      "X-Request-Id": requestId,
    },
  });
  logApiOutcome(
    new Request(request.url, {
      headers: { "x-request-id": requestId },
      method: request.method,
    }),
    status,
    code,
  );
  return applyCookies(response, pendingCookies, contentSecurityPolicy);
}

function csrfCookie(request: NextRequest): PendingCookie | null {
  const hostname = request.nextUrl.hostname;
  const name = getCsrfCookieName(hostname);
  const current = request.cookies.get(name)?.value;
  if (isValidCsrfToken(current)) return null;

  return {
    name,
    value: createCsrfToken(),
    options: {
      httpOnly: false,
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "strict",
      secure: !isLocalHostname(hostname),
    },
  };
}

export async function updateSession(request: NextRequest) {
  const requestId = randomUUID();
  const nonce = createContentSecurityPolicyNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, {
    development: process.env.NODE_ENV !== "production",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-ref");
  requestHeaders.delete("x-request-start");
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-request-start", String(Date.now()));
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  const { pathname, search } = request.nextUrl;
  const isApiRequest = pathname.startsWith("/api/");

  if (isApiRequest) {
    try {
      getExpectedOrigin(request);
      assertSameOriginRequest(request, {
        requireOrigin: !["GET", "HEAD"].includes(request.method),
      });
      if (request.method === "OPTIONS") {
        return apiError(
          request,
          requestId,
          "FORBIDDEN",
          "Cross-origin requests are not allowed.",
          403,
          contentSecurityPolicy,
        );
      }
    } catch (error) {
      if (error instanceof ApiRequestError) {
        return apiError(
          request,
          requestId,
          error.code,
          error.message,
          error.status,
          contentSecurityPolicy,
        );
      }
      return apiError(
        request,
        requestId,
        "INTERNAL_ERROR",
        "The request could not be completed.",
        500,
        contentSecurityPolicy,
      );
    }
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const pendingCookies: PendingCookie[] = [];
  const csrf = csrfCookie(request);
  if (csrf) pendingCookies.push(csrf);
  const environment = getOptionalPublicSupabaseEnv();

  if (!environment) {
    if (isApiRequest) {
      return apiError(
        request,
        requestId,
        "CONFIGURATION_ERROR",
        "The application is not configured.",
        500,
        contentSecurityPolicy,
        pendingCookies,
      );
    }
    if (isPublicRoute(pathname)) {
      return applyCookies(response, pendingCookies, contentSecurityPolicy);
    }
    return redirectWithCookies(
      request,
      "/login",
      pendingCookies,
      contentSecurityPolicy,
      { error: "configuration" },
    );
  }

  const { publishableKey, url } = environment;
  const cookieHostname = resolveCookieHostname(request.nextUrl.hostname);
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookieOptions: getAuthCookieOptions(cookieHostname),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet);
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
      },
    },
  });

  let user: User | null;
  try {
    const authResult = await supabase.auth.getUser();
    user = authResult.data.user;
  } catch {
    if (isApiRequest) {
      return apiError(
        request,
        requestId,
        "INTERNAL_ERROR",
        "The request could not be completed.",
        500,
        contentSecurityPolicy,
        pendingCookies,
      );
    }
    return redirectWithCookies(
      request,
      "/login",
      pendingCookies,
      contentSecurityPolicy,
      { error: "session" },
    );
  }

  if (user) {
    requestHeaders.set("x-user-ref", pseudonymizeUserId(user.id));
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (user && guestOnlyRoutes.has(pathname)) {
    return redirectWithCookies(
      request,
      "/",
      pendingCookies,
      contentSecurityPolicy,
    );
  }

  const recoveryMarker = request.cookies.get(
    getRecoveryCookieName(cookieHostname),
  )?.value;
  if (
    pathname === "/reset-password" &&
    (!user || !isValidRecoveryMarker(recoveryMarker))
  ) {
    return redirectWithCookies(
      request,
      "/forgot-password",
      pendingCookies,
      contentSecurityPolicy,
      { error: "recovery-required" },
    );
  }

  if (!user && !isPublicRoute(pathname)) {
    if (isApiRequest) {
      return apiError(
        request,
        requestId,
        "AUTH_REQUIRED",
        "Authentication is required.",
        401,
        contentSecurityPolicy,
        pendingCookies,
      );
    }

    return redirectWithCookies(
      request,
      "/login",
      pendingCookies,
      contentSecurityPolicy,
      { next: `${pathname}${search}` },
    );
  }

  return applyCookies(response, pendingCookies, contentSecurityPolicy);
}

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";
import { getOptionalPublicSupabaseEnv } from "@/lib/env";

type PendingCookie = { name: string; options: CookieOptions; value: string };

const guestOnlyRoutes = new Set(["/login", "/signup", "/forgot-password"]);
const publicRoutes = new Set(["/offline", "/api/sync"]);

function isPublicRoute(pathname: string) {
  return (
    guestOnlyRoutes.has(pathname) ||
    publicRoutes.has(pathname) ||
    pathname.startsWith("/auth/")
  );
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  pendingCookies: PendingCookie[],
  params?: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  Object.entries(params ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));
  const redirect = NextResponse.redirect(url);
  pendingCookies.forEach(({ name, options, value }) => redirect.cookies.set(name, value, options));
  return redirect;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pendingCookies: PendingCookie[] = [];
  const environment = getOptionalPublicSupabaseEnv();
  const { pathname, search } = request.nextUrl;

  if (!environment) {
    if (isPublicRoute(pathname)) return response;
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured." },
        { status: 503 },
      );
    }
    return redirectWithCookies(request, "/login", [], { error: "configuration" });
  }

  const { anonKey, url } = environment;
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.splice(0, pendingCookies.length, ...cookiesToSet);
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && guestOnlyRoutes.has(pathname)) {
    return redirectWithCookies(request, "/", pendingCookies);
  }

  if (!user && pathname === "/reset-password") {
    return redirectWithCookies(request, "/forgot-password", pendingCookies, {
      error: "recovery-required",
    });
  }

  if (!user && !isPublicRoute(pathname)) {
    if (pathname.startsWith("/api/")) {
      const unauthorized = NextResponse.json(
        { error: "Your session has expired." },
        { status: 401 },
      );
      pendingCookies.forEach(({ name, options, value }) => {
        unauthorized.cookies.set(name, value, options);
      });
      return unauthorized;
    }

    return redirectWithCookies(request, "/login", pendingCookies, {
      next: `${pathname}${search}`,
    });
  }

  return response;
}

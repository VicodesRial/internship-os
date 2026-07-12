import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";
import { getOptionalPublicSupabaseEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const environment = getOptionalPublicSupabaseEnv();

  // Phase 2 keeps the existing local-first app operational before project setup.
  // Phase 3 will require this configuration when route protection is enabled.
  if (!environment) {
    return response;
  }

  const { anonKey, url } = environment;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Do not remove this call: it refreshes expired auth cookies when possible.
  await supabase.auth.getUser();

  return response;
}

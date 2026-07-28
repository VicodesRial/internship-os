import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { getPublicSupabaseEnv } from "@/lib/env";
import {
  getAuthCookieOptions,
  resolveCookieHostname,
} from "@/lib/security/auth-cookies";

export async function createClient(requestHostname?: string) {
  const cookieStore = await cookies();
  const { publishableKey, url } = getPublicSupabaseEnv();
  const hostname = resolveCookieHostname(requestHostname);

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions: getAuthCookieOptions(hostname),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Middleware refreshes sessions.
        }
      },
    },
  });
}

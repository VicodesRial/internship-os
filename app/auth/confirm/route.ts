import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  createRecoveryMarker,
  getRecoveryCookieName,
  getRecoveryCookieOptions,
  resolveCookieHostname,
} from "@/lib/security/auth-cookies";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const hostname = resolveCookieHostname(url.hostname);
    const supabase = await createClient(hostname);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const next = type === "recovery" ? "/reset-password" : "/";
      const response = NextResponse.redirect(new URL(next, url.origin));
      if (type === "recovery") {
        response.cookies.set(
          getRecoveryCookieName(hostname),
          createRecoveryMarker(),
          getRecoveryCookieOptions(hostname),
        );
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirmation-failed", url.origin));
}

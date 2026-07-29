import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  RECOVERY_COOKIE_MAX_AGE,
  createRecoveryMarker,
  getRecoveryCookieName,
  getRecoveryCookieOptions,
  resolveCookieHostname,
} from "@/lib/security/auth-cookies";

const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

function isRecentRecovery(recoverySentAt: string | undefined) {
  if (!recoverySentAt) return false;

  const sentAt = Date.parse(recoverySentAt);
  if (!Number.isFinite(sentAt)) return false;

  const age = Date.now() - sentAt;
  return (
    age >= -CLOCK_SKEW_TOLERANCE_MS &&
    age <= RECOVERY_COOKIE_MAX_AGE * 1000
  );
}

function recoveryResponse(url: URL, hostname: string) {
  const response = NextResponse.redirect(new URL("/reset-password", url.origin));
  response.cookies.set(
    getRecoveryCookieName(hostname),
    createRecoveryMarker(),
    getRecoveryCookieOptions(hostname),
  );
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const hostname = resolveCookieHostname(url.hostname);

  if (code) {
    const supabase = await createClient(hostname);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && isRecentRecovery(data.user?.recovery_sent_at)) {
      return recoveryResponse(url, hostname);
    }

    if (!error) await supabase.auth.signOut();
  }

  if (tokenHash && type) {
    const supabase = await createClient(hostname);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const next = type === "recovery" ? "/reset-password" : "/";
      if (type === "recovery") return recoveryResponse(url, hostname);
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirmation-failed", url.origin));
}

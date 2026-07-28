import { NextResponse } from "next/server";

import { getSafeRelativePath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeRelativePath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient(url.hostname);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=callback-failed", url.origin));
}

import type { User } from "@supabase/supabase-js";

import type { ProfileDatabaseRow } from "@/lib/database.types";
import { getOptionalPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type CurrentAuthState = {
  configured: boolean;
  profile: ProfileDatabaseRow | null;
  user: User | null;
};

export async function getCurrentAuthState(): Promise<CurrentAuthState> {
  if (!getOptionalPublicSupabaseEnv()) {
    return { configured: false, profile: null, user: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { configured: true, profile: null, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url, legacy_migrated_at, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  return { configured: true, profile, user };
}

type PublicSupabaseEnv = {
  anonKey: string;
  url: string;
};

function requirePublicEnv(name: string, value: string | undefined) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return normalizedValue;
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return {
    anonKey: requirePublicEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    url: requirePublicEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
  };
}

export function getOptionalPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  return anonKey && url ? { anonKey, url } : null;
}

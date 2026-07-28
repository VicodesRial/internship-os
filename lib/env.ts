type PublicSupabaseEnv = {
  publishableKey: string;
  url: string;
};

export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

function requirePublicEnv(name: string, value: string | undefined) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return normalizedValue;
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return {
    publishableKey: requirePublicEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    url: requirePublicEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
  };
}

export function getOptionalPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  return publishableKey && url ? { publishableKey, url } : null;
}

export function getPublicTurnstileSiteKey() {
  const configured = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : TURNSTILE_TEST_SITE_KEY;
}

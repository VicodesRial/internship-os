import { afterEach, describe, expect, it, vi } from "vitest";

import { getOptionalPublicSupabaseEnv } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("production environment contract", () => {
  it("accepts a modern Supabase publishable key", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_test_key",
    );
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://project.supabase.co",
    );

    expect(getOptionalPublicSupabaseEnv()).toEqual({
      publishableKey: "sb_publishable_test_key",
      url: "https://project.supabase.co",
    });
  });

  it("does not fall back to the legacy anon environment variable", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "legacy-anon-key");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://project.supabase.co",
    );

    expect(getOptionalPublicSupabaseEnv()).toBeNull();
  });
});

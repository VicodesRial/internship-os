"use client";

import type { DataResult } from "@/lib/data/applications";
import type { LegacyMigrationResult } from "@/lib/data/legacy-migration";
import type { AppDataStore } from "@/lib/types";
import { apiFetch, parseApiResponse } from "@/lib/api/client";

export async function migrateLegacyDataRequest(data: AppDataStore): Promise<DataResult<LegacyMigrationResult>> {
  try {
    const response = await apiFetch("/api/migrate-legacy", {
      method: "POST",
      body: JSON.stringify({ data }),
    });
    return parseApiResponse<LegacyMigrationResult>(
      response,
      "Migration response was invalid.",
    );
  } catch {
    return { data: null, error: "Unable to reach the migration service." };
  }
}

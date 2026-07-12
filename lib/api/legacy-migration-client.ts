"use client";

import type { DataResult } from "@/lib/data/applications";
import type { LegacyMigrationResult } from "@/lib/data/legacy-migration";
import type { AppDataStore } from "@/lib/types";

export async function migrateLegacyDataRequest(data: AppDataStore): Promise<DataResult<LegacyMigrationResult>> {
  try {
    const response = await fetch("/api/migrate-legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    const result = await response.json() as DataResult<LegacyMigrationResult>;
    return result.error || result.data !== null
      ? result
      : { data: null, error: "Migration response was invalid." };
  } catch {
    return { data: null, error: "Unable to reach the migration service." };
  }
}

"use client";

import { apiFetch, parseApiResponse } from "@/lib/api/client";
import type { DataResult } from "@/lib/data/applications";
import type { DataControlResult, ImportMode } from "@/lib/data/user-data-controls";
import type { AppDataBackup, AppDataStore } from "@/lib/types";

async function parseResult<T>(response: Response, fallback: string): Promise<DataResult<T>> {
  return parseApiResponse<T>(response, fallback);
}

export async function exportUserDataRequest() {
  try {
    return parseResult<AppDataBackup>(await apiFetch("/api/data-controls"), "Unable to export account data.");
  } catch { return { data: null, error: "Unable to export account data." } as DataResult<AppDataBackup>; }
}

export async function importUserDataRequest(backup: AppDataBackup, mode: ImportMode) {
  try {
    const response = await apiFetch("/api/data-controls", {
      method: "POST",
      body: JSON.stringify({ action: "import", backup, mode }),
    });
    return parseResult<DataControlResult>(response, "Unable to import account data.");
  } catch { return { data: null, error: "Unable to import account data." } as DataResult<DataControlResult>; }
}

export async function seedUserDemoDataRequest() {
  try {
    const response = await apiFetch("/api/data-controls", {
      method: "POST",
      body: JSON.stringify({ action: "seed" }),
    });
    return parseResult<DataControlResult>(response, "Unable to seed demo data.");
  } catch { return { data: null, error: "Unable to seed demo data." } as DataResult<DataControlResult>; }
}

export async function replaceUserCollectionRequest(
  collection: keyof AppDataStore,
  records: Array<AppDataStore[keyof AppDataStore][number]>,
) {
  try {
    const response = await apiFetch("/api/data-controls", {
      method: "PUT",
      body: JSON.stringify({ collection, records }),
    });
    return parseResult<DataControlResult>(response, "Unable to import this collection.");
  } catch { return { data: null, error: "Unable to import this collection." } as DataResult<DataControlResult>; }
}

export async function clearUserDataRequest() {
  try {
    return parseResult<DataControlResult>(
      await apiFetch("/api/data-controls", {
        method: "DELETE",
        body: JSON.stringify({ action: "clear" }),
      }),
      "Unable to delete account data.",
    );
  } catch { return { data: null, error: "Unable to delete account data." } as DataResult<DataControlResult>; }
}

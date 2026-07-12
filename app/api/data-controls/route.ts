import { NextResponse } from "next/server";

import { isValidLegacyData } from "@/lib/data/legacy-migration-validation";
import {
  clearUserData,
  exportUserData,
  importUserData,
  replaceUserCollection,
  seedUserDemoData,
  type ImportMode,
} from "@/lib/data/user-data-controls";
import type { AppDataStore } from "@/lib/types";

export const dynamic = "force-dynamic";

const collections: (keyof AppDataStore)[] = ["applications", "targetCompanies", "contacts", "weeklyGoals"];

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const payload: unknown = await request.json();
    return payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
  } catch { return null; }
}

function response<T>(result: { data: T | null; error: string | null }) {
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

export async function GET() {
  return response(await exportUserData());
}

export async function POST(request: Request) {
  const payload = await readJson(request);
  if (payload?.action === "seed") return response(await seedUserDemoData());

  const backup = payload?.backup;
  const mode = payload?.mode;
  if (
    payload?.action !== "import" ||
    (mode !== "merge" && mode !== "replace") ||
    !backup || typeof backup !== "object" ||
    !("version" in backup) || backup.version !== 1 ||
    !("exportedAt" in backup) || typeof backup.exportedAt !== "string" ||
    !("data" in backup) || !isValidLegacyData(backup.data)
  ) {
    return response({ data: null, error: "Backup is invalid or uses an incompatible schema version." });
  }
  return response(await importUserData(backup.data, mode as ImportMode));
}

export async function PUT(request: Request) {
  const payload = await readJson(request);
  const collection = payload?.collection;
  if (typeof collection !== "string" || !collections.includes(collection as keyof AppDataStore) || !Array.isArray(payload?.records)) {
    return response({ data: null, error: "Collection import request is invalid." });
  }
  const candidate = { applications: [], targetCompanies: [], contacts: [], weeklyGoals: [], [collection]: payload.records };
  if (!isValidLegacyData(candidate)) {
    return response({ data: null, error: "Collection records are invalid." });
  }
  return response(await replaceUserCollection(collection as keyof AppDataStore, payload.records as AppDataStore[keyof AppDataStore]));
}

export async function DELETE() {
  return response(await clearUserData());
}

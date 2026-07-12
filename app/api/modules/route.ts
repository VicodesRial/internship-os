import { NextResponse } from "next/server";

import { isUuid } from "@/lib/data/application-validation";
import { isModuleResource, isValidModuleRecord } from "@/lib/data/module-validation";
import {
  createModuleRecord,
  deleteModuleRecord,
  updateModuleRecord,
  updateProfile,
  type ModuleRecord,
} from "@/lib/data/modules";
import type { DataResult } from "@/lib/data/applications";

export const dynamic = "force-dynamic";

function jsonResult<T>(result: DataResult<T>) {
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return value && typeof value === "object" ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export async function POST(request: Request) {
  const payload = await readJson(request);
  if (!payload || !isModuleResource(payload.resource) || !isValidModuleRecord(payload.resource, payload.record, false)) {
    return jsonResult({ data: null, error: "Record details are invalid." });
  }
  return jsonResult(await createModuleRecord(payload.resource, payload.record as ModuleRecord));
}

export async function PUT(request: Request) {
  const payload = await readJson(request);
  if (payload?.resource === "profile") {
    return typeof payload.displayName === "string" && payload.displayName.length <= 100
      ? jsonResult(await updateProfile(payload.displayName))
      : jsonResult({ data: null, error: "Display name is invalid." });
  }
  if (!payload || !isModuleResource(payload.resource) || !isValidModuleRecord(payload.resource, payload.record, true)) {
    return jsonResult({ data: null, error: "Record details are invalid." });
  }
  return jsonResult(await updateModuleRecord(payload.resource, payload.record as ModuleRecord));
}

export async function DELETE(request: Request) {
  const payload = await readJson(request);
  if (!payload || !isModuleResource(payload.resource) || !isUuid(payload.id)) {
    return jsonResult({ data: null, error: "Delete request is invalid." });
  }
  return jsonResult(await deleteModuleRecord(payload.resource, payload.id));
}

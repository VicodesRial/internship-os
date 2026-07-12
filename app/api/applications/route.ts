import { NextResponse } from "next/server";

import {
  isApplicationStatus,
  isUuid,
  isValidApplication,
} from "@/lib/data/application-validation";
import {
  insertApplication,
  removeApplication,
  saveApplication,
  saveApplicationStatus,
  type DataResult,
} from "@/lib/data/applications";
import type { Application } from "@/lib/types";

export const dynamic = "force-dynamic";

function jsonResult<T>(result: DataResult<T>) {
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const payload = await readJson(request);
  if (!isValidApplication(payload, false)) {
    return jsonResult<Application>({ data: null, error: "Application details are invalid." });
  }

  return jsonResult(await insertApplication(payload));
}

export async function PUT(request: Request) {
  const payload = await readJson(request);
  if (!isValidApplication(payload, true)) {
    return jsonResult<Application>({ data: null, error: "Application details are invalid." });
  }

  return jsonResult(await saveApplication(payload));
}

export async function PATCH(request: Request) {
  const payload = await readJson(request);
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("applicationId" in payload) ||
    !("status" in payload) ||
    !isUuid(payload.applicationId) ||
    !isApplicationStatus(payload.status)
  ) {
    return jsonResult<Application>({
      data: null,
      error: "Application status request is invalid.",
    });
  }

  return jsonResult(await saveApplicationStatus(payload.applicationId, payload.status));
}

export async function DELETE(request: Request) {
  const payload = await readJson(request);
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("applicationId" in payload) ||
    !isUuid(payload.applicationId)
  ) {
    return jsonResult<true>({ data: null, error: "Application delete request is invalid." });
  }

  return jsonResult(await removeApplication(payload.applicationId));
}


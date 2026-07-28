import {
  apiDataResultResponse,
  apiErrorResponse,
  enforceRateLimit,
  guardApiRead,
  readApiMutation,
} from "@/lib/api/server";
import { IMPORT_BODY_LIMIT } from "@/lib/api/request-security";
import { parseLegacyData } from "@/lib/data/legacy-migration-validation";
import {
  InputValidationError,
  normalizeIsoTimestamp,
} from "@/lib/data/validation";
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

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : null;
}

export async function GET(request: Request) {
  const rejected = guardApiRead(request);
  if (rejected) return rejected;
  return apiDataResultResponse(request, exportUserData());
}

export async function POST(request: Request) {
  const parsed = await readApiMutation(request, IMPORT_BODY_LIMIT);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "sensitive");
  if (limited) return limited;
  const payload = asRecord(parsed.data);
  if (payload?.action === "seed") {
    return apiDataResultResponse(request, seedUserDemoData());
  }

  const backup = asRecord(payload?.backup);
  const mode = payload?.mode;
  let normalizedData: AppDataStore | null = null;
  let validExportedAt = false;
  try {
    normalizedData = parseLegacyData(backup?.data);
    validExportedAt = Boolean(
      backup && normalizeIsoTimestamp(backup.exportedAt),
    );
  } catch (error) {
    if (!(error instanceof InputValidationError)) {
      return apiErrorResponse(
        request,
        "INTERNAL_ERROR",
        "The request could not be completed.",
        500,
      );
    }
  }
  if (
    payload?.action !== "import" ||
    (mode !== "merge" && mode !== "replace") ||
    backup?.version !== 1 ||
    !validExportedAt ||
    !normalizedData
  ) {
    return apiErrorResponse(
      request,
      "INVALID_REQUEST",
      "Backup is invalid or uses an incompatible schema version.",
      400,
    );
  }
  return apiDataResultResponse(
    request,
    importUserData(normalizedData, mode as ImportMode),
  );
}

export async function PUT(request: Request) {
  const parsed = await readApiMutation(request, IMPORT_BODY_LIMIT);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "sensitive");
  if (limited) return limited;
  const payload = asRecord(parsed.data);
  const collection = payload?.collection;
  if (typeof collection !== "string" || !collections.includes(collection as keyof AppDataStore) || !Array.isArray(payload?.records)) {
    return apiErrorResponse(
      request,
      "INVALID_REQUEST",
      "Collection import request is invalid.",
      400,
    );
  }
  const candidate = parseLegacyData({
    applications: [],
    targetCompanies: [],
    contacts: [],
    weeklyGoals: [],
    [collection]: payload.records,
  });
  if (!candidate) {
    return apiErrorResponse(
      request,
      "INVALID_REQUEST",
      "Collection records are invalid.",
      400,
    );
  }
  return apiDataResultResponse(
    request,
    replaceUserCollection(
      collection as keyof AppDataStore,
      candidate[collection as keyof AppDataStore],
    ),
  );
}

export async function DELETE(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "sensitive");
  if (limited) return limited;
  const payload = asRecord(parsed.data);
  if (payload?.action !== "clear") {
    return apiErrorResponse(request, "INVALID_REQUEST", "Delete request is invalid.", 400);
  }
  return apiDataResultResponse(request, clearUserData());
}

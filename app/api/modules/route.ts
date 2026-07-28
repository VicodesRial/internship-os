import {
  apiDataResultResponse,
  apiErrorResponse,
  enforceRateLimit,
  readApiMutation,
} from "@/lib/api/server";
import { isUuid } from "@/lib/data/application-validation";
import {
  isModuleResource,
  parseModuleRecord,
} from "@/lib/data/module-validation";
import {
  INPUT_LIMITS,
  InputValidationError,
  normalizeSingleLineText,
} from "@/lib/data/validation";
import {
  createModuleRecord,
  deleteModuleRecord,
  updateModuleRecord,
  updateProfile,
  type ModuleRecord,
} from "@/lib/data/modules";

export const dynamic = "force-dynamic";

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : null;
}

export async function POST(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "normal");
  if (limited) return limited;
  const payload = asRecord(parsed.data);
  if (!payload || !isModuleResource(payload.resource)) {
    return apiErrorResponse(request, "INVALID_REQUEST", "Record details are invalid.", 400);
  }
  const record = parseModuleRecord(payload.resource, payload.record, {
    requireDatabaseId: false,
  });
  if (!record) {
    return apiErrorResponse(request, "INVALID_REQUEST", "Record details are invalid.", 400);
  }
  return apiDataResultResponse(
    request,
    createModuleRecord(payload.resource, record as ModuleRecord),
  );
}

export async function PUT(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "normal");
  if (limited) return limited;
  const payload = asRecord(parsed.data);
  if (payload?.resource === "profile") {
    try {
      const displayName = normalizeSingleLineText(
        payload.displayName,
        INPUT_LIMITS.name,
      );
      return apiDataResultResponse(request, updateProfile(displayName));
    } catch (error) {
      return error instanceof InputValidationError
        ? apiErrorResponse(
            request,
            "INVALID_REQUEST",
            "Display name is invalid.",
            400,
          )
        : apiErrorResponse(
            request,
            "INTERNAL_ERROR",
            "The request could not be completed.",
            500,
          );
    }
  }
  if (!payload || !isModuleResource(payload.resource)) {
    return apiErrorResponse(request, "INVALID_REQUEST", "Record details are invalid.", 400);
  }
  const record = parseModuleRecord(payload.resource, payload.record, {
    requireDatabaseId: true,
  });
  if (!record) {
    return apiErrorResponse(request, "INVALID_REQUEST", "Record details are invalid.", 400);
  }
  return apiDataResultResponse(
    request,
    updateModuleRecord(payload.resource, record as ModuleRecord),
  );
}

export async function DELETE(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "sensitive");
  if (limited) return limited;
  const payload = asRecord(parsed.data);
  if (!payload || !isModuleResource(payload.resource) || !isUuid(payload.id)) {
    return apiErrorResponse(request, "INVALID_REQUEST", "Delete request is invalid.", 400);
  }
  return apiDataResultResponse(
    request,
    deleteModuleRecord(payload.resource, payload.id),
  );
}

import {
  apiDataResultResponse,
  apiErrorResponse,
  enforceRateLimit,
  readApiMutation,
} from "@/lib/api/server";
import {
  isApplicationStatus,
  isUuid,
  parseApplication,
} from "@/lib/data/application-validation";
import {
  insertApplication,
  removeApplication,
  saveApplication,
  saveApplicationStatus,
} from "@/lib/data/applications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "normal");
  if (limited) return limited;
  const payload = parseApplication(parsed.data, { requireDatabaseId: false });
  if (!payload) {
    return apiErrorResponse(
      request,
      "INVALID_REQUEST",
      "Application details are invalid.",
      400,
    );
  }
  return apiDataResultResponse(request, insertApplication(payload));
}

export async function PUT(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "normal");
  if (limited) return limited;
  const payload = parseApplication(parsed.data, { requireDatabaseId: true });
  if (!payload) {
    return apiErrorResponse(
      request,
      "INVALID_REQUEST",
      "Application details are invalid.",
      400,
    );
  }
  return apiDataResultResponse(request, saveApplication(payload));
}

export async function PATCH(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "normal");
  if (limited) return limited;
  const payload = parsed.data;
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("applicationId" in payload) ||
    !("status" in payload) ||
    !isUuid(payload.applicationId) ||
    !isApplicationStatus(payload.status)
  ) {
    return apiErrorResponse(
      request,
      "INVALID_REQUEST",
      "Application status request is invalid.",
      400,
    );
  }
  return apiDataResultResponse(
    request,
    saveApplicationStatus(payload.applicationId, payload.status),
  );
}

export async function DELETE(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "sensitive");
  if (limited) return limited;
  const payload = parsed.data;
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("applicationId" in payload) ||
    !isUuid(payload.applicationId)
  ) {
    return apiErrorResponse(
      request,
      "INVALID_REQUEST",
      "Application delete request is invalid.",
      400,
    );
  }
  return apiDataResultResponse(request, removeApplication(payload.applicationId));
}

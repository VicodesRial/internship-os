import {
  apiDataResultResponse,
  apiErrorResponse,
  enforceRateLimit,
  readApiMutation,
} from "@/lib/api/server";
import { IMPORT_BODY_LIMIT } from "@/lib/api/request-security";
import { migrateLegacyData } from "@/lib/data/legacy-migration";
import { parseLegacyData } from "@/lib/data/legacy-migration-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await readApiMutation(request, IMPORT_BODY_LIMIT);
  if (parsed.response) return parsed.response;
  const limited = await enforceRateLimit(request, "sensitive");
  if (limited) return limited;
  const payload = parsed.data;

  const normalized = payload && typeof payload === "object" && "data" in payload
    ? parseLegacyData(payload.data)
    : null;
  if (!normalized) {
    return apiErrorResponse(
      request,
      "INVALID_REQUEST",
      "Legacy browser data is invalid or incompatible.",
      400,
    );
  }

  return apiDataResultResponse(request, migrateLegacyData(normalized));
}

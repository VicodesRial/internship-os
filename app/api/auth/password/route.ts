import { apiErrorResponse, apiSuccessResponse, readApiMutation } from "@/lib/api/server";
import { authRequestErrorResponse, genericAuthFailure } from "@/lib/auth/route-helpers";
import { parsePasswordUpdateRequest } from "@/lib/auth/requests";
import {
  getRecoveryCookieName,
  getRecoveryCookieOptions,
  isValidRecoveryMarker,
} from "@/lib/security/auth-cookies";
import { createClient } from "@/lib/supabase/server";

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

export async function POST(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;

  const hostname = new URL(request.url).hostname;
  const recoveryCookieName = getRecoveryCookieName(hostname);
  const marker = readCookie(request.headers.get("cookie"), recoveryCookieName);
  if (!isValidRecoveryMarker(marker)) {
    return apiErrorResponse(
      request,
      "FORBIDDEN",
      "A verified recovery session is required.",
      403,
    );
  }

  try {
    const input = parsePasswordUpdateRequest(parsed.data);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return genericAuthFailure(request, 401);

    const { error: updateError } = await supabase.auth.updateUser({
      password: input.password,
    });
    if (updateError) return genericAuthFailure(request);

    const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
    if (signOutError) {
      return apiErrorResponse(
        request,
        "INTERNAL_ERROR",
        "The request could not be completed.",
        500,
      );
    }

    const response = apiSuccessResponse(request, { updated: true });
    response.cookies.set(recoveryCookieName, "", {
      ...getRecoveryCookieOptions(hostname),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return authRequestErrorResponse(request, error);
  }
}

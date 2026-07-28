import { apiSuccessResponse, readApiMutation } from "@/lib/api/server";
import { authRequestErrorResponse } from "@/lib/auth/route-helpers";
import { parseRecoveryRequest } from "@/lib/auth/requests";
import { getExpectedOrigin } from "@/lib/api/request-security";
import { createClient } from "@/lib/supabase/server";

const RECOVERY_RESPONSE = {
  message: "If the account exists, a recovery link will be sent.",
};

export async function POST(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;

  try {
    const input = parseRecoveryRequest(parsed.data);
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(input.email, {
      captchaToken: input.captchaToken,
      redirectTo: `${getExpectedOrigin(request)}/auth/confirm`,
    });

    return apiSuccessResponse(request, RECOVERY_RESPONSE);
  } catch (error) {
    return authRequestErrorResponse(request, error);
  }
}

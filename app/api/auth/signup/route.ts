import { apiSuccessResponse, readApiMutation } from "@/lib/api/server";
import { authRequestErrorResponse } from "@/lib/auth/route-helpers";
import { parseSignupRequest } from "@/lib/auth/requests";
import { getExpectedOrigin } from "@/lib/api/request-security";
import { createClient } from "@/lib/supabase/server";

const SIGNUP_RESPONSE = {
  message: "Check your email for the next step if the account can be created.",
};

export async function POST(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;

  try {
    const input = parseSignupRequest(parsed.data);
    const supabase = await createClient();
    await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        captchaToken: input.captchaToken,
        data: { display_name: input.displayName },
        emailRedirectTo: `${getExpectedOrigin(request)}/auth/callback?next=/`,
      },
    });

    return apiSuccessResponse(request, SIGNUP_RESPONSE);
  } catch (error) {
    return authRequestErrorResponse(request, error);
  }
}

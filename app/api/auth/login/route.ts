import { apiSuccessResponse, readApiMutation } from "@/lib/api/server";
import {
  authRequestErrorResponse,
  genericAuthFailure,
} from "@/lib/auth/route-helpers";
import { parseLoginRequest } from "@/lib/auth/requests";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;

  try {
    const input = parseLoginRequest(parsed.data);
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
      options: { captchaToken: input.captchaToken },
    });

    if (error) return genericAuthFailure(request, 401);
    return apiSuccessResponse(request, { redirectTo: input.next });
  } catch (error) {
    return authRequestErrorResponse(request, error);
  }
}

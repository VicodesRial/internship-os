import { apiErrorResponse, apiSuccessResponse, readApiMutation } from "@/lib/api/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = await readApiMutation(request);
  if (parsed.response) return parsed.response;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      return apiErrorResponse(
        request,
        "INTERNAL_ERROR",
        "The request could not be completed.",
        500,
      );
    }
    return apiSuccessResponse(request, { signedOut: true });
  } catch {
    return apiErrorResponse(
      request,
      "INTERNAL_ERROR",
      "The request could not be completed.",
      500,
    );
  }
}

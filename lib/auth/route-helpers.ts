import {
  apiErrorResponse,
  apiRequestErrorResponse,
} from "@/lib/api/server";
import { AuthRequestValidationError } from "@/lib/auth/requests";

export function authRequestErrorResponse(request: Request, error: unknown) {
  if (error instanceof AuthRequestValidationError) {
    return apiErrorResponse(request, "INVALID_REQUEST", error.message, 400);
  }
  return apiRequestErrorResponse(request, error);
}

export function genericAuthFailure(request: Request, status = 400) {
  return apiErrorResponse(
    request,
    status === 401 ? "AUTH_REQUIRED" : "INVALID_REQUEST",
    status === 401
      ? "The email or password is incorrect."
      : "The authentication request could not be completed.",
    status,
  );
}

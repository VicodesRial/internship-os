export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "CONFIGURATION_ERROR"
  | "FORBIDDEN"
  | "INTERNAL_ERROR"
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "UNSUPPORTED_MEDIA_TYPE";

export type ApiErrorPayload = {
  code: ApiErrorCode;
  message: string;
  requestId: string;
};

export type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: ApiErrorPayload };

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.requestId === "string"
  );
}

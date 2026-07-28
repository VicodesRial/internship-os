import { createHash } from "node:crypto";

const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const USER_REFERENCE_PATTERN = /^[a-f0-9]{20}$/;

export function pseudonymizeUserId(userId: string) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 20);
}

export function logApiOutcome(
  request: Request,
  status: number,
  errorCode?: string,
) {
  const requestId = request.headers.get("x-request-id");
  const userReference = request.headers.get("x-user-ref");
  const startedAt = Number(request.headers.get("x-request-start"));
  const durationMs =
    Number.isFinite(startedAt) && startedAt > 0
      ? Math.max(0, Math.min(Date.now() - startedAt, 3_600_000))
      : undefined;
  const record = {
    timestamp: new Date().toISOString(),
    level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
    event: "api_request",
    requestId:
      requestId && REQUEST_ID_PATTERN.test(requestId) ? requestId : undefined,
    method: request.method,
    route: new URL(request.url).pathname,
    status,
    durationMs,
    userRef:
      userReference && USER_REFERENCE_PATTERN.test(userReference)
        ? userReference
        : undefined,
    errorCode,
  };
  const serializedRecord = JSON.stringify(record);

  if (status >= 500) {
    console.error(serializedRecord);
  } else if (status >= 400) {
    console.warn(serializedRecord);
  } else {
    console.log(serializedRecord);
  }
}

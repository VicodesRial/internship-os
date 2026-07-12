import {
  applicationStatusOptions,
  interestLevelOptions,
  interviewStageOptions,
  referralStatusOptions,
} from "@/lib/applications";
import type { Application, ApplicationStatus } from "@/lib/types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableDate(value: unknown) {
  return value === null || (isString(value) && datePattern.test(value));
}

export function isUuid(value: unknown): value is string {
  return isString(value) && uuidPattern.test(value);
}

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return isString(value) && applicationStatusOptions.includes(value as ApplicationStatus);
}

export function isValidApplication(
  value: unknown,
  requireDatabaseId: boolean,
): value is Application {
  if (!isRecord(value)) return false;

  return (
    (!requireDatabaseId || isUuid(value.id)) &&
    isString(value.company) &&
    value.company.trim().length > 0 &&
    isString(value.role) &&
    value.role.trim().length > 0 &&
    isString(value.location) &&
    isString(value.applicationLink) &&
    isNullableDate(value.dateApplied) &&
    isNullableDate(value.deadline) &&
    isApplicationStatus(value.status) &&
    typeof value.oaReceived === "boolean" &&
    isString(value.interviewStage) &&
    interviewStageOptions.includes(value.interviewStage as Application["interviewStage"]) &&
    isString(value.recruiterContact) &&
    isString(value.referralStatus) &&
    referralStatusOptions.includes(value.referralStatus as Application["referralStatus"]) &&
    isNullableDate(value.followUpDate) &&
    isString(value.resumeVersion) &&
    isString(value.notes) &&
    typeof value.interestLevel === "number" &&
    interestLevelOptions.includes(value.interestLevel as Application["interestLevel"])
  );
}


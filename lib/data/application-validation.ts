import {
  applicationStatusOptions,
  interestLevelOptions,
  interviewStageOptions,
  referralStatusOptions,
} from "@/lib/applications";
import type { Application, ApplicationStatus } from "@/lib/types";
import {
  INPUT_LIMITS,
  InputValidationError,
  asInputRecord,
  normalizeBoolean,
  normalizeEnum,
  normalizeIdentifier,
  normalizeIsoTimestamp,
  normalizeNotes,
  normalizeNullableCalendarDate,
  normalizeOptionalExternalUrl,
  normalizeSingleLineText,
} from "@/lib/data/validation";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && applicationStatusOptions.includes(value as ApplicationStatus);
}

export function parseApplication(
  value: unknown,
  options: { requireDatabaseId: boolean; requireIdentity?: boolean },
): Application | null {
  try {
    const record = asInputRecord(value);
    const now = new Date().toISOString();
    const id = options.requireIdentity || options.requireDatabaseId
      ? normalizeIdentifier(record.id)
      : typeof record.id === "string"
        ? normalizeSingleLineText(record.id, INPUT_LIMITS.identifier)
        : "";
    if (options.requireDatabaseId && !isUuid(id)) return null;

    return {
      id,
      company: normalizeSingleLineText(record.company, INPUT_LIMITS.name, true),
      role: normalizeSingleLineText(record.role, INPUT_LIMITS.contact, true),
      location: normalizeSingleLineText(record.location, INPUT_LIMITS.contact),
      applicationLink: normalizeOptionalExternalUrl(record.applicationLink),
      dateApplied: normalizeNullableCalendarDate(record.dateApplied),
      deadline: normalizeNullableCalendarDate(record.deadline),
      status: normalizeEnum(record.status, applicationStatusOptions),
      oaReceived: normalizeBoolean(record.oaReceived),
      interviewStage: normalizeEnum(record.interviewStage, interviewStageOptions),
      recruiterContact: normalizeSingleLineText(
        record.recruiterContact,
        INPUT_LIMITS.contact,
      ),
      referralStatus: normalizeEnum(record.referralStatus, referralStatusOptions),
      followUpDate: normalizeNullableCalendarDate(record.followUpDate),
      resumeVersion: normalizeSingleLineText(
        record.resumeVersion,
        INPUT_LIMITS.contact,
      ),
      notes: normalizeNotes(record.notes),
      interestLevel: normalizeEnum(record.interestLevel, interestLevelOptions),
      createdAt: options.requireIdentity
        ? normalizeIsoTimestamp(record.createdAt)
        : now,
      updatedAt: options.requireIdentity
        ? normalizeIsoTimestamp(record.updatedAt)
        : now,
    };
  } catch (error) {
    if (error instanceof InputValidationError) return null;
    throw error;
  }
}

export function isValidApplication(
  value: unknown,
  requireDatabaseId: boolean,
): value is Application {
  return parseApplication(value, { requireDatabaseId }) !== null;
}

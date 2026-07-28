import { isUuid } from "@/lib/data/application-validation";
import type { ModuleResource } from "@/lib/data/modules";
import {
  INPUT_LIMITS,
  InputValidationError,
  asInputRecord,
  normalizeBoolean,
  normalizeCount,
  normalizeEnum,
  normalizeIdentifier,
  normalizeIsoTimestamp,
  normalizeNotes,
  normalizeNullableCalendarDate,
  normalizeOptionalExternalUrl,
  normalizeSingleLineText,
} from "@/lib/data/validation";
import type {
  NetworkingContact,
  TargetCompany,
  WeeklyGoal,
} from "@/lib/types";

const resources: ModuleResource[] = ["contacts", "targetCompanies", "weeklyGoals"];
const roleTypes = ["SWE", "AI", "Backend", "Frontend", "ML"] as const;
const priorities = ["Low", "Medium", "High"] as const;

export function isModuleResource(value: unknown): value is ModuleResource {
  return typeof value === "string" && resources.includes(value as ModuleResource);
}

export type ParsedModuleRecord =
  | NetworkingContact
  | TargetCompany
  | WeeklyGoal;

export function parseModuleRecord(
  resource: ModuleResource,
  value: unknown,
  options: { requireDatabaseId: boolean; requireIdentity?: boolean },
): ParsedModuleRecord | null {
  try {
    const record = asInputRecord(value);
    const now = new Date().toISOString();
    const id = options.requireIdentity || options.requireDatabaseId
      ? normalizeIdentifier(record.id)
      : typeof record.id === "string"
        ? normalizeSingleLineText(record.id, INPUT_LIMITS.identifier)
        : "";
    if (options.requireDatabaseId && !isUuid(id)) return null;
    const createdAt = options.requireIdentity
      ? normalizeIsoTimestamp(record.createdAt)
      : now;
    const updatedAt = options.requireIdentity
      ? normalizeIsoTimestamp(record.updatedAt)
      : now;

    if (resource === "targetCompanies") {
      return {
        id,
        company: normalizeSingleLineText(record.company, INPUT_LIMITS.name, true),
        roleType: normalizeEnum(record.roleType, roleTypes),
        applicationSeason: normalizeSingleLineText(
          record.applicationSeason,
          INPUT_LIMITS.contact,
        ),
        priorityLevel: normalizeEnum(record.priorityLevel, priorities),
        notes: normalizeNotes(record.notes),
        createdAt,
        updatedAt,
      };
    }

    if (resource === "contacts") {
      return {
        id,
        name: normalizeSingleLineText(record.name, INPUT_LIMITS.name, true),
        company: normalizeSingleLineText(record.company, INPUT_LIMITS.name, true),
        role: normalizeSingleLineText(record.role, INPUT_LIMITS.contact),
        linkedInUrl: normalizeOptionalExternalUrl(record.linkedInUrl),
        connected: normalizeBoolean(record.connected),
        referralRequested: normalizeBoolean(record.referralRequested),
        referralReceived: normalizeBoolean(record.referralReceived),
        lastContactedDate: normalizeNullableCalendarDate(
          record.lastContactedDate,
        ),
        notes: normalizeNotes(record.notes),
        createdAt,
        updatedAt,
      };
    }

    const week = normalizeSingleLineText(record.week, 8, true);
    if (!/^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/.test(week)) return null;
    return {
      id,
      week,
      applicationGoal: normalizeCount(record.applicationGoal),
      applicationsCompleted: normalizeCount(record.applicationsCompleted),
      networkingGoal: normalizeCount(record.networkingGoal),
      networkingCompleted: normalizeCount(record.networkingCompleted),
      leetCodeGoal: normalizeCount(record.leetCodeGoal),
      leetCodeCompleted: normalizeCount(record.leetCodeCompleted),
      createdAt,
      updatedAt,
    };
  } catch (error) {
    if (error instanceof InputValidationError) return null;
    throw error;
  }
}

export function isValidModuleRecord(
  resource: ModuleResource,
  value: unknown,
  requireId: boolean,
) {
  return parseModuleRecord(resource, value, {
    requireDatabaseId: requireId,
  }) !== null;
}

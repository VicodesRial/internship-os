import { isValidApplication } from "@/lib/data/application-validation";
import { isValidModuleRecord } from "@/lib/data/module-validation";
import type { AppDataStore } from "@/lib/types";

const MAX_RECORDS_PER_COLLECTION = 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasLegacyIdentity(value: unknown) {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.trim().length > 0 && value.id.length <= 200 &&
    typeof value.createdAt === "string" && !Number.isNaN(Date.parse(value.createdAt)) &&
    typeof value.updatedAt === "string" && !Number.isNaN(Date.parse(value.updatedAt));
}

function hasUniqueValues(values: string[]) {
  return new Set(values).size === values.length;
}

export function isValidLegacyData(value: unknown): value is AppDataStore {
  if (!isRecord(value)) return false;
  const { applications, targetCompanies, contacts, weeklyGoals } = value;
  if (!Array.isArray(applications) || !Array.isArray(targetCompanies) || !Array.isArray(contacts) || !Array.isArray(weeklyGoals)) return false;
  if ([applications, targetCompanies, contacts, weeklyGoals].some((items: unknown[]) => items.length > MAX_RECORDS_PER_COLLECTION)) return false;

  if (!applications.every((item) => hasLegacyIdentity(item) && isValidApplication(item, false))) return false;
  if (!targetCompanies.every((item) => hasLegacyIdentity(item) && isValidModuleRecord("targetCompanies", item, false))) return false;
  if (!contacts.every((item) => hasLegacyIdentity(item) && isValidModuleRecord("contacts", item, false))) return false;
  if (!weeklyGoals.every((item) => hasLegacyIdentity(item) && isValidModuleRecord("weeklyGoals", item, false))) return false;

  return hasUniqueValues(applications.map((item) => item.id)) &&
    hasUniqueValues(targetCompanies.map((item) => item.id)) &&
    hasUniqueValues(contacts.map((item) => item.id)) &&
    hasUniqueValues(weeklyGoals.map((item) => item.id)) &&
    hasUniqueValues(weeklyGoals.map((item) => item.week));
}

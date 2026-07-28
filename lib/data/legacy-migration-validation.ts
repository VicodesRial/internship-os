import { parseApplication } from "@/lib/data/application-validation";
import { parseModuleRecord } from "@/lib/data/module-validation";
import {
  InputValidationError,
  asInputRecord,
  normalizeIdentifier,
} from "@/lib/data/validation";
import type { AppDataStore } from "@/lib/types";

const MAX_RECORDS_PER_COLLECTION = 1000;

function hasUniqueValues(values: string[]) {
  return new Set(values).size === values.length;
}

export function parseLegacyData(value: unknown): AppDataStore | null {
  try {
    const record = asInputRecord(value);
    const collections = [
      record.applications,
      record.targetCompanies,
      record.contacts,
      record.weeklyGoals,
    ];
    if (
      collections.some(
        (items) =>
          !Array.isArray(items) || items.length > MAX_RECORDS_PER_COLLECTION,
      )
    ) {
      return null;
    }

    const applications = (record.applications as unknown[]).map((item) =>
      parseApplication(item, {
        requireDatabaseId: false,
        requireIdentity: true,
      }),
    );
    const targetCompanies = (record.targetCompanies as unknown[]).map((item) =>
      parseModuleRecord("targetCompanies", item, {
        requireDatabaseId: false,
        requireIdentity: true,
      }),
    );
    const contacts = (record.contacts as unknown[]).map((item) =>
      parseModuleRecord("contacts", item, {
        requireDatabaseId: false,
        requireIdentity: true,
      }),
    );
    const weeklyGoals = (record.weeklyGoals as unknown[]).map((item) =>
      parseModuleRecord("weeklyGoals", item, {
        requireDatabaseId: false,
        requireIdentity: true,
      }),
    );

    if (
      applications.includes(null) ||
      targetCompanies.includes(null) ||
      contacts.includes(null) ||
      weeklyGoals.includes(null)
    ) {
      return null;
    }

    const parsed = {
      applications,
      targetCompanies,
      contacts,
      weeklyGoals,
    } as AppDataStore;

    return hasUniqueValues(parsed.applications.map((item) => normalizeIdentifier(item.id))) &&
      hasUniqueValues(parsed.targetCompanies.map((item) => normalizeIdentifier(item.id))) &&
      hasUniqueValues(parsed.contacts.map((item) => normalizeIdentifier(item.id))) &&
      hasUniqueValues(parsed.weeklyGoals.map((item) => normalizeIdentifier(item.id))) &&
      hasUniqueValues(parsed.weeklyGoals.map((item) => item.week))
      ? parsed
      : null;
  } catch (error) {
    if (error instanceof InputValidationError) return null;
    throw error;
  }
}

export function isValidLegacyData(value: unknown): value is AppDataStore {
  return parseLegacyData(value) !== null;
}

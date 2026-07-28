import { createDemoData } from "@/lib/demo-data";
import { parseLegacyData } from "@/lib/data/legacy-migration-validation";
import { normalizeIsoTimestamp } from "@/lib/data/validation";
import type { AppDataBackup, AppDataStore, AppRecordCounts } from "@/lib/types";

export const APP_DATA_STORAGE_KEY = "internship-tracker-data";
export const APP_DATA_BACKUP_VERSION = 1;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function hasStoredAppData() {
  return isBrowser() && window.localStorage.getItem(APP_DATA_STORAGE_KEY) !== null;
}

export function countRecords(data: AppDataStore): AppRecordCounts {
  return {
    applications: data.applications.length,
    targetCompanies: data.targetCompanies.length,
    contacts: data.contacts.length,
    weeklyGoals: data.weeklyGoals.length,
  };
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function withoutUnchangedDemoRecords(data: AppDataStore): AppDataStore {
  const demo = createDemoData();
  const removeMatches = <T extends { id: string }>(records: T[], demoRecords: T[]) => {
    const demoById = new Map(demoRecords.map((record) => [record.id, record]));
    return records.filter((record) => {
      const demoRecord = demoById.get(record.id);
      return !demoRecord || stableSerialize(record) !== stableSerialize(demoRecord);
    });
  };

  return {
    applications: removeMatches(data.applications, demo.applications),
    targetCompanies: removeMatches(data.targetCompanies, demo.targetCompanies),
    contacts: removeMatches(data.contacts, demo.contacts),
    weeklyGoals: removeMatches(data.weeklyGoals, demo.weeklyGoals),
  };
}

export function getMeaningfulLegacyData(payload: unknown): AppDataStore | null {
  const parsed = parseLegacyData(payload);
  if (!parsed) return null;
  const meaningfulData = withoutUnchangedDemoRecords(parsed);
  return Object.values(countRecords(meaningfulData)).some((count) => count > 0)
    ? meaningfulData
    : null;
}

export function hasMeaningfulLegacyData(payload: unknown) {
  return getMeaningfulLegacyData(payload) !== null;
}

export function createLegacyDataFingerprint(data: AppDataStore) {
  const serialized = stableSerialize(data);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createAppDataBackup(data: AppDataStore): AppDataBackup {
  return {
    version: APP_DATA_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(data)) as AppDataStore,
  };
}

export function serializeAppDataBackup(backup: AppDataBackup): string {
  return JSON.stringify(backup, null, 2);
}

export function parseAppDataBackup(input: string): AppDataBackup | null {
  try {
    const parsed: unknown = JSON.parse(input);
    if (!isObject(parsed) || parsed.version !== APP_DATA_BACKUP_VERSION) {
      return null;
    }
    const data = parseLegacyData(parsed.data);
    const exportedAt = normalizeIsoTimestamp(parsed.exportedAt);
    return data ? { version: APP_DATA_BACKUP_VERSION, exportedAt, data } : null;
  } catch {
    return null;
  }
}

export function loadStoredAppData(): AppDataStore | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(APP_DATA_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  const backup = parseAppDataBackup(rawValue);

  return backup ? backup.data : null;
}

export function removeStoredAppData() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(APP_DATA_STORAGE_KEY);
}

export function saveStoredAppData(data: AppDataStore) {
  if (!isBrowser()) {
    return;
  }

  const backup = createAppDataBackup(data);

  window.localStorage.setItem(
    APP_DATA_STORAGE_KEY,
    serializeAppDataBackup(backup),
  );
}

export function resetStoredAppData(): AppDataStore {
  const demoData = createDemoData();

  saveStoredAppData(demoData);

  return demoData;
}

export function exportAppData(data: AppDataStore): string {
  return serializeAppDataBackup(createAppDataBackup(data));
}

export function importAppData(input: string): AppDataStore | null {
  const backup = parseAppDataBackup(input);

  if (!backup) {
    return null;
  }

  return JSON.parse(JSON.stringify(backup.data)) as AppDataStore;
}

import type { Json } from "@/lib/database.types";
import type { DataResult } from "@/lib/data/applications";
import { listApplications } from "@/lib/data/applications";
import {
  createUserScopedRows,
  type ExistingUserRecordIds,
} from "@/lib/data/legacy-migration";
import { listContacts, listTargetCompanies, listWeeklyGoals } from "@/lib/data/modules";
import { createDemoData } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import type { AppDataBackup, AppDataStore, AppRecordCounts } from "@/lib/types";

export type ImportMode = "merge" | "replace";
export type DataControlResult = { operation: "clear" | "import" | "seed"; recordCounts: AppRecordCounts };

const emptyData = (): AppDataStore => ({ applications: [], targetCompanies: [], contacts: [], weeklyGoals: [] });

async function currentUserAndRecords() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [applications, targets, contacts, goals] = await Promise.all([
    supabase.from("applications").select("id").eq("user_id", user.id),
    supabase.from("target_companies").select("id").eq("user_id", user.id),
    supabase.from("networking_contacts").select("id").eq("user_id", user.id),
    supabase.from("weekly_goals").select("id, week").eq("user_id", user.id),
  ]);
  if (applications.error || targets.error || contacts.error || goals.error) return null;
  const ids: ExistingUserRecordIds = {
    applications: new Set(applications.data.map((item) => item.id)),
    targetCompanies: new Set(targets.data.map((item) => item.id)),
    contacts: new Set(contacts.data.map((item) => item.id)),
    weeklyGoals: new Set(goals.data.map((item) => item.id)),
  };
  return { supabase, user, ids, existingWeeks: new Set(goals.data.map((item) => item.week)) };
}

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

async function replaceAll(source: AppDataStore, operation: DataControlResult["operation"]): Promise<DataResult<DataControlResult>> {
  const current = await currentUserAndRecords();
  if (!current) return { data: null, error: "Unable to access your account data." };
  const rows = createUserScopedRows(current.user.id, source, current.ids);
  const { data, error } = await current.supabase.rpc("replace_user_data", {
    p_applications: asJson(rows.applications),
    p_target_companies: asJson(rows.targetCompanies),
    p_contacts: asJson(rows.contacts),
    p_weekly_goals: asJson(rows.weeklyGoals),
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return { data: null, error: `Unable to ${operation === "clear" ? "delete" : operation} your account data.` };
  }
  return {
    data: {
      operation,
      recordCounts: {
        applications: rows.applications.length,
        targetCompanies: rows.targetCompanies.length,
        contacts: rows.contacts.length,
        weeklyGoals: rows.weeklyGoals.length,
      },
    },
    error: null,
  };
}

async function mergeData(source: AppDataStore): Promise<DataResult<DataControlResult>> {
  const current = await currentUserAndRecords();
  if (!current) return { data: null, error: "Unable to access your account data." };
  const rows = createUserScopedRows(current.user.id, source, current.ids);
  const newGoals = rows.weeklyGoals.filter((item) => !current.existingWeeks.has(item.week));

  if (rows.applications.length) {
    const { error } = await current.supabase.from("applications").upsert(rows.applications, { onConflict: "id" });
    if (error) return { data: null, error: "Unable to merge applications." };
  }
  if (rows.targetCompanies.length) {
    const { error } = await current.supabase.from("target_companies").upsert(rows.targetCompanies, { onConflict: "id" });
    if (error) return { data: null, error: "Unable to merge target companies." };
  }
  if (rows.contacts.length) {
    const { error } = await current.supabase.from("networking_contacts").upsert(rows.contacts, { onConflict: "id" });
    if (error) return { data: null, error: "Unable to merge contacts." };
  }
  if (newGoals.length) {
    const { error } = await current.supabase.from("weekly_goals").upsert(newGoals, { onConflict: "id" });
    if (error) return { data: null, error: "Unable to merge weekly goals." };
  }
  return {
    data: {
      operation: "import",
      recordCounts: {
        applications: rows.applications.length,
        targetCompanies: rows.targetCompanies.length,
        contacts: rows.contacts.length,
        weeklyGoals: newGoals.length,
      },
    },
    error: null,
  };
}

export async function exportUserData(): Promise<DataResult<AppDataBackup>> {
  const [applications, targets, contacts, goals] = await Promise.all([
    listApplications(), listTargetCompanies(), listContacts(), listWeeklyGoals(),
  ]);
  const error = applications.error ?? targets.error ?? contacts.error ?? goals.error;
  if (error || !applications.data || !targets.data || !contacts.data || !goals.data) {
    return { data: null, error: error ?? "Unable to export account data." };
  }
  return {
    data: {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        applications: applications.data,
        targetCompanies: targets.data,
        contacts: contacts.data,
        weeklyGoals: goals.data,
      },
    },
    error: null,
  };
}

export function importUserData(source: AppDataStore, mode: ImportMode) {
  return mode === "replace" ? replaceAll(source, "import") : mergeData(source);
}

export function clearUserData() {
  return replaceAll(emptyData(), "clear");
}

export function seedUserDemoData() {
  return replaceAll(createDemoData(), "seed");
}

export async function replaceUserCollection(
  collection: keyof AppDataStore,
  records: AppDataStore[keyof AppDataStore],
) {
  const exported = await exportUserData();
  if (!exported.data) return { data: null, error: exported.error } as DataResult<DataControlResult>;
  const nextData = { ...exported.data.data, [collection]: records } as AppDataStore;
  return replaceAll(nextData, "import");
}

import { createHash } from "node:crypto";

import type { DataResult } from "@/lib/data/applications";
import { isUuid } from "@/lib/data/application-validation";
import { createClient } from "@/lib/supabase/server";
import type { AppDataStore, AppRecordCounts } from "@/lib/types";

export type LegacyMigrationResult = {
  alreadyMigrated: boolean;
  migratedAt: string;
  recordCounts: AppRecordCounts;
};

function deterministicId(userId: string, collection: string, legacyId: string) {
  const hex = createHash("sha256").update(`${userId}:${collection}:${legacyId}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}

export type ExistingUserRecordIds = Partial<Record<keyof AppDataStore, Set<string>>>;

export function createUserScopedRows(
  userId: string,
  source: AppDataStore,
  existingIds: ExistingUserRecordIds = {},
) {
  const recordId = (collection: keyof AppDataStore, sourceId: string) =>
    isUuid(sourceId) && existingIds[collection]?.has(sourceId)
      ? sourceId
      : deterministicId(userId, collection, sourceId);

  return {
    applications: source.applications.map((item) => ({
      id: recordId("applications", item.id), user_id: userId,
      company: item.company, role: item.role, location: item.location,
      application_link: item.applicationLink, date_applied: item.dateApplied,
      deadline: item.deadline, status: item.status, oa_received: item.oaReceived,
      interview_stage: item.interviewStage, recruiter_contact: item.recruiterContact,
      referral_status: item.referralStatus, follow_up_date: item.followUpDate,
      resume_version: item.resumeVersion, notes: item.notes, interest_level: item.interestLevel,
      created_at: item.createdAt, updated_at: item.updatedAt,
    })),
    targetCompanies: source.targetCompanies.map((item) => ({
      id: recordId("targetCompanies", item.id), user_id: userId,
      company: item.company, role_type: item.roleType, application_season: item.applicationSeason,
      priority_level: item.priorityLevel, notes: item.notes,
      created_at: item.createdAt, updated_at: item.updatedAt,
    })),
    contacts: source.contacts.map((item) => ({
      id: recordId("contacts", item.id), user_id: userId,
      name: item.name, company: item.company, role: item.role, linkedin_url: item.linkedInUrl,
      connected: item.connected, referral_requested: item.referralRequested,
      referral_received: item.referralReceived, last_contacted_date: item.lastContactedDate,
      notes: item.notes, created_at: item.createdAt, updated_at: item.updatedAt,
    })),
    weeklyGoals: source.weeklyGoals.map((item) => ({
      id: recordId("weeklyGoals", item.id), user_id: userId,
      week: item.week, application_goal: item.applicationGoal,
      applications_completed: item.applicationsCompleted, networking_goal: item.networkingGoal,
      networking_completed: item.networkingCompleted, leetcode_goal: item.leetCodeGoal,
      leetcode_completed: item.leetCodeCompleted, created_at: item.createdAt, updated_at: item.updatedAt,
    })),
  };
}

function emptyCounts(): AppRecordCounts {
  return { applications: 0, targetCompanies: 0, contacts: 0, weeklyGoals: 0 };
}

export async function migrateLegacyData(legacy: AppDataStore): Promise<DataResult<LegacyMigrationResult>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Your session has expired." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("legacy_migrated_at")
    .eq("id", user.id)
    .single();
  if (profileError) return { data: null, error: "Unable to check migration status." };
  if (profile.legacy_migrated_at) {
    return {
      data: { alreadyMigrated: true, migratedAt: profile.legacy_migrated_at, recordCounts: emptyCounts() },
      error: null,
    };
  }

  const rows = createUserScopedRows(user.id, legacy);
  const { applications, targetCompanies, contacts } = rows;

  const { data: existingGoals, error: goalsReadError } = await supabase
    .from("weekly_goals").select("week").eq("user_id", user.id);
  if (goalsReadError) return { data: null, error: "Unable to check existing weekly goals." };
  const existingWeeks = new Set(existingGoals.map((goal) => goal.week));
  const weeklyGoals = rows.weeklyGoals.filter((item) => !existingWeeks.has(item.week));

  if (applications.length) {
    const { error } = await supabase.from("applications").upsert(applications, { onConflict: "id" });
    if (error) return { data: null, error: "Unable to migrate applications." };
  }
  if (targetCompanies.length) {
    const { error } = await supabase.from("target_companies").upsert(targetCompanies, { onConflict: "id" });
    if (error) return { data: null, error: "Unable to migrate target companies." };
  }
  if (contacts.length) {
    const { error } = await supabase.from("networking_contacts").upsert(contacts, { onConflict: "id" });
    if (error) return { data: null, error: "Unable to migrate networking contacts." };
  }
  if (weeklyGoals.length) {
    const { error } = await supabase.from("weekly_goals").upsert(weeklyGoals, { onConflict: "id" });
    if (error) return { data: null, error: "Unable to migrate weekly goals." };
  }

  const migratedAt = new Date().toISOString();
  const { error: completionError } = await supabase
    .from("profiles").update({ legacy_migrated_at: migratedAt }).eq("id", user.id);
  if (completionError) return { data: null, error: "Records were uploaded, but migration could not be finalized. Retry safely." };

  return {
    data: {
      alreadyMigrated: false,
      migratedAt,
      recordCounts: {
        applications: applications.length,
        targetCompanies: targetCompanies.length,
        contacts: contacts.length,
        weeklyGoals: weeklyGoals.length,
      },
    },
    error: null,
  };
}

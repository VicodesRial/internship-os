import type {
  NetworkingContactDatabaseRow,
  TargetCompanyDatabaseRow,
  WeeklyGoalDatabaseRow,
} from "@/lib/database.types";
import type { DataResult } from "@/lib/data/applications";
import { createClient } from "@/lib/supabase/server";
import type {
  NetworkingContact,
  PriorityLevel,
  RoleType,
  TargetCompany,
  WeeklyGoal,
} from "@/lib/types";

export type ModuleRecord = NetworkingContact | TargetCompany | WeeklyGoal;
export type ModuleResource = "contacts" | "targetCompanies" | "weeklyGoals";

function mapTargetCompany(row: TargetCompanyDatabaseRow): TargetCompany {
  return {
    id: row.id,
    company: row.company,
    roleType: row.role_type as RoleType,
    applicationSeason: row.application_season,
    priorityLevel: row.priority_level as PriorityLevel,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTargetCompanyInput(value: TargetCompany) {
  return {
    company: value.company,
    role_type: value.roleType,
    application_season: value.applicationSeason,
    priority_level: value.priorityLevel,
    notes: value.notes,
  };
}

function mapContact(row: NetworkingContactDatabaseRow): NetworkingContact {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    role: row.role,
    linkedInUrl: row.linkedin_url,
    connected: row.connected,
    referralRequested: row.referral_requested,
    referralReceived: row.referral_received,
    lastContactedDate: row.last_contacted_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContactInput(value: NetworkingContact) {
  return {
    name: value.name,
    company: value.company,
    role: value.role,
    linkedin_url: value.linkedInUrl,
    connected: value.connected,
    referral_requested: value.referralRequested,
    referral_received: value.referralReceived,
    last_contacted_date: value.lastContactedDate,
    notes: value.notes,
  };
}

function mapWeeklyGoal(row: WeeklyGoalDatabaseRow): WeeklyGoal {
  return {
    id: row.id,
    week: row.week,
    applicationGoal: row.application_goal,
    applicationsCompleted: row.applications_completed,
    networkingGoal: row.networking_goal,
    networkingCompleted: row.networking_completed,
    leetCodeGoal: row.leetcode_goal,
    leetCodeCompleted: row.leetcode_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWeeklyGoalInput(value: WeeklyGoal) {
  return {
    week: value.week,
    application_goal: value.applicationGoal,
    applications_completed: value.applicationsCompleted,
    networking_goal: value.networkingGoal,
    networking_completed: value.networkingCompleted,
    leetcode_goal: value.leetCodeGoal,
    leetcode_completed: value.leetCodeCompleted,
  };
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export async function listTargetCompanies(): Promise<DataResult<TargetCompany[]>> {
  try {
    const auth = await authenticatedClient();
    if (!auth) return { data: null, error: "Your session has expired." };
    const { data, error } = await auth.supabase.from("target_companies").select("*").eq("user_id", auth.user.id).order("updated_at", { ascending: false });
    return error ? { data: null, error: "Unable to load target companies." } : { data: data.map(mapTargetCompany), error: null };
  } catch { return { data: null, error: "Unable to reach the target company database." }; }
}

export async function listContacts(): Promise<DataResult<NetworkingContact[]>> {
  try {
    const auth = await authenticatedClient();
    if (!auth) return { data: null, error: "Your session has expired." };
    const { data, error } = await auth.supabase.from("networking_contacts").select("*").eq("user_id", auth.user.id).order("updated_at", { ascending: false });
    return error ? { data: null, error: "Unable to load networking contacts." } : { data: data.map(mapContact), error: null };
  } catch { return { data: null, error: "Unable to reach the networking database." }; }
}

export async function listWeeklyGoals(): Promise<DataResult<WeeklyGoal[]>> {
  try {
    const auth = await authenticatedClient();
    if (!auth) return { data: null, error: "Your session has expired." };
    const { data, error } = await auth.supabase.from("weekly_goals").select("*").eq("user_id", auth.user.id).order("week", { ascending: false });
    return error ? { data: null, error: "Unable to load weekly goals." } : { data: data.map(mapWeeklyGoal), error: null };
  } catch { return { data: null, error: "Unable to reach the weekly goals database." }; }
}

export async function createModuleRecord(resource: ModuleResource, record: ModuleRecord): Promise<DataResult<ModuleRecord>> {
  const auth = await authenticatedClient();
  if (!auth) return { data: null, error: "Your session has expired." };
  if (resource === "targetCompanies") {
    const { data, error } = await auth.supabase.from("target_companies").insert({ ...mapTargetCompanyInput(record as TargetCompany), user_id: auth.user.id }).select("*").single();
    return error ? { data: null, error: "Unable to create the target company." } : { data: mapTargetCompany(data), error: null };
  }
  if (resource === "contacts") {
    const { data, error } = await auth.supabase.from("networking_contacts").insert({ ...mapContactInput(record as NetworkingContact), user_id: auth.user.id }).select("*").single();
    return error ? { data: null, error: "Unable to create the contact." } : { data: mapContact(data), error: null };
  }
  const { data, error } = await auth.supabase.from("weekly_goals").insert({ ...mapWeeklyGoalInput(record as WeeklyGoal), user_id: auth.user.id }).select("*").single();
  return error ? { data: null, error: error.code === "23505" ? "A goal already exists for that week." : "Unable to create the weekly goal." } : { data: mapWeeklyGoal(data), error: null };
}

export async function updateModuleRecord(resource: ModuleResource, record: ModuleRecord): Promise<DataResult<ModuleRecord>> {
  const auth = await authenticatedClient();
  if (!auth) return { data: null, error: "Your session has expired." };
  if (resource === "targetCompanies") {
    const { data, error } = await auth.supabase.from("target_companies").update(mapTargetCompanyInput(record as TargetCompany)).eq("id", record.id).eq("user_id", auth.user.id).select("*").single();
    return error ? { data: null, error: "Unable to update the target company." } : { data: mapTargetCompany(data), error: null };
  }
  if (resource === "contacts") {
    const { data, error } = await auth.supabase.from("networking_contacts").update(mapContactInput(record as NetworkingContact)).eq("id", record.id).eq("user_id", auth.user.id).select("*").single();
    return error ? { data: null, error: "Unable to update the contact." } : { data: mapContact(data), error: null };
  }
  const { data, error } = await auth.supabase.from("weekly_goals").update(mapWeeklyGoalInput(record as WeeklyGoal)).eq("id", record.id).eq("user_id", auth.user.id).select("*").single();
  return error ? { data: null, error: error.code === "23505" ? "A goal already exists for that week." : "Unable to update the weekly goal." } : { data: mapWeeklyGoal(data), error: null };
}

export async function deleteModuleRecord(resource: ModuleResource, id: string): Promise<DataResult<true>> {
  const auth = await authenticatedClient();
  if (!auth) return { data: null, error: "Your session has expired." };
  const table = resource === "targetCompanies" ? "target_companies" : resource === "contacts" ? "networking_contacts" : "weekly_goals";
  const { error } = await auth.supabase.from(table).delete().eq("id", id).eq("user_id", auth.user.id);
  return error ? { data: null, error: "Unable to delete this record." } : { data: true, error: null };
}

export async function updateProfile(displayName: string): Promise<DataResult<string>> {
  const auth = await authenticatedClient();
  if (!auth) return { data: null, error: "Your session has expired." };
  const normalizedName = displayName.trim();
  const { error } = await auth.supabase.from("profiles").update({ display_name: normalizedName || null }).eq("id", auth.user.id);
  return error ? { data: null, error: "Unable to update your profile." } : { data: normalizedName, error: null };
}

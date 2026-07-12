import type {
  ApplicationDatabaseInsert,
  ApplicationDatabaseRow,
  ApplicationDatabaseUpdate,
} from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  Application,
  ApplicationStatus,
  InterestLevel,
  InterviewStage,
  ReferralStatus,
} from "@/lib/types";

export type DataResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

function mapApplicationRow(row: ApplicationDatabaseRow): Application {
  return {
    applicationLink: row.application_link,
    company: row.company,
    createdAt: row.created_at,
    dateApplied: row.date_applied,
    deadline: row.deadline,
    followUpDate: row.follow_up_date,
    id: row.id,
    interestLevel: row.interest_level as InterestLevel,
    interviewStage: row.interview_stage as InterviewStage,
    location: row.location,
    notes: row.notes,
    oaReceived: row.oa_received,
    recruiterContact: row.recruiter_contact,
    referralStatus: row.referral_status as ReferralStatus,
    resumeVersion: row.resume_version,
    role: row.role,
    status: row.status as ApplicationStatus,
    updatedAt: row.updated_at,
  };
}

function mapApplicationInsert(application: Application): ApplicationDatabaseInsert {
  return {
    application_link: application.applicationLink,
    company: application.company,
    date_applied: application.dateApplied,
    deadline: application.deadline,
    follow_up_date: application.followUpDate,
    interest_level: application.interestLevel,
    interview_stage: application.interviewStage,
    location: application.location,
    notes: application.notes,
    oa_received: application.oaReceived,
    recruiter_contact: application.recruiterContact,
    referral_status: application.referralStatus,
    resume_version: application.resumeVersion,
    role: application.role,
    status: application.status,
  };
}

function mapApplicationUpdate(application: Application): ApplicationDatabaseUpdate {
  return mapApplicationInsert(application);
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? { supabase, user } : null;
}

export async function listApplications(): Promise<DataResult<Application[]>> {
  try {
    const authentication = await getAuthenticatedClient();
    if (!authentication) return { data: null, error: "Your session has expired." };

    const { data, error } = await authentication.supabase
      .from("applications")
      .select("*")
      .eq("user_id", authentication.user.id)
      .order("updated_at", { ascending: false });

    if (error) return { data: null, error: "Unable to load applications." };
    return { data: data.map(mapApplicationRow), error: null };
  } catch {
    return { data: null, error: "Unable to reach the application database." };
  }
}

export async function insertApplication(
  application: Application,
): Promise<DataResult<Application>> {
  const authentication = await getAuthenticatedClient();
  if (!authentication) return { data: null, error: "Your session has expired." };

  const { data, error } = await authentication.supabase
    .from("applications")
    .insert(mapApplicationInsert(application))
    .select("*")
    .single();

  if (error) return { data: null, error: "Unable to create the application." };
  return { data: mapApplicationRow(data), error: null };
}

export async function saveApplication(
  application: Application,
): Promise<DataResult<Application>> {
  const authentication = await getAuthenticatedClient();
  if (!authentication) return { data: null, error: "Your session has expired." };

  const { data, error } = await authentication.supabase
    .from("applications")
    .update(mapApplicationUpdate(application))
    .eq("id", application.id)
    .eq("user_id", authentication.user.id)
    .select("*")
    .single();

  if (error) return { data: null, error: "Unable to update the application." };
  return { data: mapApplicationRow(data), error: null };
}

export async function saveApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<DataResult<Application>> {
  const authentication = await getAuthenticatedClient();
  if (!authentication) return { data: null, error: "Your session has expired." };

  const { data, error } = await authentication.supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("user_id", authentication.user.id)
    .select("*")
    .single();

  if (error) return { data: null, error: "Unable to change application status." };
  return { data: mapApplicationRow(data), error: null };
}

export async function removeApplication(applicationId: string): Promise<DataResult<true>> {
  const authentication = await getAuthenticatedClient();
  if (!authentication) return { data: null, error: "Your session has expired." };

  const { error } = await authentication.supabase
    .from("applications")
    .delete()
    .eq("id", applicationId)
    .eq("user_id", authentication.user.id);

  if (error) return { data: null, error: "Unable to delete the application." };
  return { data: true, error: null };
}

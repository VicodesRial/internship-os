begin;

create or replace function public.replace_user_data(
  p_applications jsonb,
  p_target_companies jsonb,
  p_contacts jsonb,
  p_weekly_goals jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.applications where user_id = current_user_id;
  delete from public.target_companies where user_id = current_user_id;
  delete from public.networking_contacts where user_id = current_user_id;
  delete from public.weekly_goals where user_id = current_user_id;

  insert into public.applications (
    id, user_id, company, role, location, application_link, date_applied, deadline,
    status, oa_received, interview_stage, recruiter_contact, referral_status,
    follow_up_date, resume_version, notes, interest_level, created_at, updated_at
  )
  select
    row.id, current_user_id, row.company, row.role, row.location, row.application_link,
    row.date_applied, row.deadline, row.status, row.oa_received, row.interview_stage,
    row.recruiter_contact, row.referral_status, row.follow_up_date, row.resume_version,
    row.notes, row.interest_level, row.created_at, row.updated_at
  from jsonb_to_recordset(coalesce(p_applications, '[]'::jsonb)) as row(
    id uuid, company text, role text, location text, application_link text,
    date_applied date, deadline date, status text, oa_received boolean,
    interview_stage text, recruiter_contact text, referral_status text,
    follow_up_date date, resume_version text, notes text, interest_level smallint,
    created_at timestamptz, updated_at timestamptz
  );

  insert into public.target_companies (
    id, user_id, company, role_type, application_season, priority_level, notes,
    created_at, updated_at
  )
  select row.id, current_user_id, row.company, row.role_type, row.application_season,
    row.priority_level, row.notes, row.created_at, row.updated_at
  from jsonb_to_recordset(coalesce(p_target_companies, '[]'::jsonb)) as row(
    id uuid, company text, role_type text, application_season text,
    priority_level text, notes text, created_at timestamptz, updated_at timestamptz
  );

  insert into public.networking_contacts (
    id, user_id, name, company, role, linkedin_url, connected, referral_requested,
    referral_received, last_contacted_date, notes, created_at, updated_at
  )
  select row.id, current_user_id, row.name, row.company, row.role, row.linkedin_url,
    row.connected, row.referral_requested, row.referral_received,
    row.last_contacted_date, row.notes, row.created_at, row.updated_at
  from jsonb_to_recordset(coalesce(p_contacts, '[]'::jsonb)) as row(
    id uuid, name text, company text, role text, linkedin_url text, connected boolean,
    referral_requested boolean, referral_received boolean, last_contacted_date date,
    notes text, created_at timestamptz, updated_at timestamptz
  );

  insert into public.weekly_goals (
    id, user_id, week, application_goal, applications_completed, networking_goal,
    networking_completed, leetcode_goal, leetcode_completed, created_at, updated_at
  )
  select row.id, current_user_id, row.week, row.application_goal,
    row.applications_completed, row.networking_goal, row.networking_completed,
    row.leetcode_goal, row.leetcode_completed, row.created_at, row.updated_at
  from jsonb_to_recordset(coalesce(p_weekly_goals, '[]'::jsonb)) as row(
    id uuid, week text, application_goal integer, applications_completed integer,
    networking_goal integer, networking_completed integer, leetcode_goal integer,
    leetcode_completed integer, created_at timestamptz, updated_at timestamptz
  );

  return jsonb_build_object(
    'applications', jsonb_array_length(coalesce(p_applications, '[]'::jsonb)),
    'targetCompanies', jsonb_array_length(coalesce(p_target_companies, '[]'::jsonb)),
    'contacts', jsonb_array_length(coalesce(p_contacts, '[]'::jsonb)),
    'weeklyGoals', jsonb_array_length(coalesce(p_weekly_goals, '[]'::jsonb))
  );
end;
$$;

revoke all on function public.replace_user_data(jsonb, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.replace_user_data(jsonb, jsonb, jsonb, jsonb) to authenticated;

commit;

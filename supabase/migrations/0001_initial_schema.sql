begin;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text not null,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company text not null check (length(trim(company)) > 0),
  role text not null check (length(trim(role)) > 0),
  location text not null default '',
  application_link text not null default '',
  date_applied date,
  deadline date,
  status text not null default 'Wishlist' check (
    status in ('Wishlist', 'Applied', 'OA Received', 'Interview', 'Offer', 'Rejected', 'Withdrawn')
  ),
  oa_received boolean not null default false,
  interview_stage text not null default 'None' check (
    interview_stage in ('None', 'Recruiter Screen', 'Technical Interview', 'Final Round', 'Completed')
  ),
  recruiter_contact text not null default '',
  referral_status text not null default 'None' check (
    referral_status in ('None', 'Requested', 'Received')
  ),
  follow_up_date date,
  resume_version text not null default '',
  notes text not null default '',
  interest_level smallint not null default 3 check (interest_level between 1 and 5),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.target_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company text not null check (length(trim(company)) > 0),
  role_type text not null check (role_type in ('SWE', 'AI', 'Backend', 'Frontend', 'ML')),
  application_season text not null default '',
  priority_level text not null default 'Medium' check (priority_level in ('Low', 'Medium', 'High')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.networking_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  company text not null default '',
  role text not null default '',
  linkedin_url text not null default '',
  connected boolean not null default false,
  referral_requested boolean not null default false,
  referral_received boolean not null default false,
  last_contacted_date date,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week text not null check (week ~ '^[0-9]{4}-W[0-9]{2}$'),
  application_goal integer not null default 0 check (application_goal >= 0),
  applications_completed integer not null default 0 check (applications_completed >= 0),
  networking_goal integer not null default 0 check (networking_goal >= 0),
  networking_completed integer not null default 0 check (networking_completed >= 0),
  leetcode_goal integer not null default 0 check (leetcode_goal >= 0),
  leetcode_completed integer not null default 0 check (leetcode_completed >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, week)
);

create index applications_user_id_idx on public.applications (user_id);
create index applications_user_updated_idx on public.applications (user_id, updated_at desc);
create index applications_user_status_idx on public.applications (user_id, status);
create index applications_user_deadline_idx on public.applications (user_id, deadline) where deadline is not null;
create index applications_user_follow_up_idx on public.applications (user_id, follow_up_date) where follow_up_date is not null;
create index target_companies_user_id_idx on public.target_companies (user_id);
create index target_companies_user_priority_idx on public.target_companies (user_id, priority_level);
create index networking_contacts_user_id_idx on public.networking_contacts (user_id);
create index networking_contacts_user_last_contacted_idx on public.networking_contacts (user_id, last_contacted_date desc);
create index weekly_goals_user_id_idx on public.weekly_goals (user_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

create trigger target_companies_set_updated_at
before update on public.target_companies
for each row execute function public.set_updated_at();

create trigger networking_contacts_set_updated_at
before update on public.networking_contacts
for each row execute function public.set_updated_at();

create trigger weekly_goals_set_updated_at
before update on public.weekly_goals
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    coalesce(new.email, ''),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.target_companies enable row level security;
alter table public.networking_contacts enable row level security;
alter table public.weekly_goals enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, update, delete on public.target_companies to authenticated;
grant select, insert, update, delete on public.networking_contacts to authenticated;
grant select, insert, update, delete on public.weekly_goals to authenticated;

create policy "profiles_select_own"
on public.profiles for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_delete_own"
on public.profiles for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "applications_select_own"
on public.applications for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "applications_insert_own"
on public.applications for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "applications_update_own"
on public.applications for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "applications_delete_own"
on public.applications for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "target_companies_select_own"
on public.target_companies for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "target_companies_insert_own"
on public.target_companies for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "target_companies_update_own"
on public.target_companies for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "target_companies_delete_own"
on public.target_companies for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "networking_contacts_select_own"
on public.networking_contacts for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "networking_contacts_insert_own"
on public.networking_contacts for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "networking_contacts_update_own"
on public.networking_contacts for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "networking_contacts_delete_own"
on public.networking_contacts for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "weekly_goals_select_own"
on public.weekly_goals for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "weekly_goals_insert_own"
on public.weekly_goals for insert to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "weekly_goals_update_own"
on public.weekly_goals for update to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "weekly_goals_delete_own"
on public.weekly_goals for delete to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

revoke all on function public.handle_new_user() from public, anon, authenticated;

commit;

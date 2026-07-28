begin;

revoke all on schema public from public, anon;
revoke create on schema public from authenticated;
grant usage on schema public to authenticated;

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.applications to authenticated;
grant select, insert, update, delete on table public.target_companies to authenticated;
grant select, insert, update, delete on table public.networking_contacts to authenticated;
grant select, insert, update, delete on table public.weekly_goals to authenticated;

create table public.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('normal', 'sensitive')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, scope, window_started_at)
);

comment on table public.api_rate_limits is
  'Internal ownership-scoped counters. Direct Data API access is intentionally denied.';

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(p_scope text)
returns table (
  allowed boolean,
  request_limit integer,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_window timestamptz;
  window_duration interval;
  maximum_requests integer;
  consumed_count integer;
begin
  if current_user_id is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  if p_scope = 'normal' then
    current_window := date_trunc('minute', now());
    window_duration := interval '1 minute';
    maximum_requests := 60;
  elsif p_scope = 'sensitive' then
    current_window := date_trunc('hour', now());
    window_duration := interval '1 hour';
    maximum_requests := 10;
  else
    raise invalid_parameter_value using message = 'Invalid rate limit scope';
  end if;

  delete from public.api_rate_limits
  where user_id = current_user_id
    and window_started_at < now() - interval '25 hours';

  insert into public.api_rate_limits (
    user_id,
    scope,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    current_user_id,
    p_scope,
    current_window,
    1,
    timezone('utc', now())
  )
  on conflict (user_id, scope, window_started_at)
  do update set
    request_count = public.api_rate_limits.request_count + 1,
    updated_at = timezone('utc', now())
  returning request_count into consumed_count;

  return query
  select
    consumed_count <= maximum_requests,
    maximum_requests,
    greatest(maximum_requests - consumed_count, 0),
    greatest(
      ceil(extract(epoch from current_window + window_duration - now()))::integer,
      1
    );
end;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.replace_user_data(jsonb, jsonb, jsonb, jsonb)
  to authenticated;
grant execute on function public.consume_api_rate_limit(text)
  to authenticated;

alter default privileges in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from public, anon, authenticated;

commit;

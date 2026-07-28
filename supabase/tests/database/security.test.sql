begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

select is_empty(
  $$
    select c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  $$,
  'every public table has row level security enabled'
);

select is_empty(
  $$
    select table_name
    from information_schema.table_privileges
    where table_schema = 'public'
      and grantee = 'anon'
  $$,
  'anon has no privileges on public tables'
);

select is_empty(
  $$
    select table_name
    from information_schema.table_privileges
    where table_schema = 'public'
      and grantee = 'PUBLIC'
  $$,
  'PUBLIC has no privileges on public tables'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.api_rate_limits',
    'select, insert, update, delete'
  ),
  'authenticated users cannot access rate limit rows directly'
);

select is_empty(
  $$
    select routine_name
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and grantee in ('anon', 'PUBLIC')
  $$,
  'anon and PUBLIC cannot execute public functions'
);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'security-user-a@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'security-user-b@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  );

insert into public.applications (id, user_id, company, role)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'User A Company',
    'Intern'
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'User B Company',
    'Intern'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select results_eq(
  $$ select company from public.applications order by company $$,
  $$ values ('User A Company'::text) $$,
  'User A can read only User A rows'
);

update public.applications
set company = 'Tampered Company'
where id = 'b0000000-0000-4000-8000-000000000002';

reset role;

select is(
  (
    select company
    from public.applications
    where id = 'b0000000-0000-4000-8000-000000000002'
  ),
  'User B Company',
  'User A cannot update User B rows'
);

set local role authenticated;

delete from public.applications
where id = 'b0000000-0000-4000-8000-000000000002';

reset role;

select ok(
  exists (
    select 1
    from public.applications
    where id = 'b0000000-0000-4000-8000-000000000002'
  ),
  'User A cannot delete User B rows'
);

set local role authenticated;

do $$
begin
  for counter in 1..60 loop
    perform public.consume_api_rate_limit('normal');
  end loop;
end;
$$;

select is(
  (select allowed from public.consume_api_rate_limit('normal')),
  false,
  'normal mutations are limited to 60 requests per minute'
);

do $$
begin
  for counter in 1..10 loop
    perform public.consume_api_rate_limit('sensitive');
  end loop;
end;
$$;

select is(
  (select allowed from public.consume_api_rate_limit('sensitive')),
  false,
  'sensitive mutations are limited to 10 requests per hour'
);

reset role;

select * from finish();

rollback;

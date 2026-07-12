begin;

alter table public.profiles
add column legacy_migrated_at timestamptz;

comment on column public.profiles.legacy_migrated_at is
  'Set after the user explicitly imports the legacy browser dataset.';

commit;

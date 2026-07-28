begin;

create policy api_rate_limits_deny_direct_access
  on public.api_rate_limits
  for all
  to anon, authenticated
  using (false)
  with check (false);

commit;

# Security and multi-user verification

Run this checklist against the production candidate after all migrations are applied. Use two unrelated email accounts and separate browser profiles or private windows.

## Automated project checks

```bash
npm run typecheck
npm run build
```

If local Supabase is running, inspect migration status before testing:

```bash
npx supabase status
npx supabase migration list
```

Supabase recommends testing database policies, including RLS, as part of local database testing; see its [testing overview](https://supabase.com/docs/guides/local-development/testing/overview) and [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

## User A

1. Sign up and confirm the email if required.
2. Create an application with a distinctive company name.
3. Create a target company.
4. Create a networking contact.
5. Create a weekly goal.
6. Record the visible counts and log out.

## User B

1. Sign up using a different email address.
2. Verify every module starts empty.
3. Verify User A’s distinctive values do not appear in search, filters, dashboard metrics, activity, exports, or Settings counts.
4. Create separate records in every module.
5. Export JSON and verify it contains only User B’s records.
6. Log out.

## User A returns

1. Log back in as User A.
2. Verify only User A’s original records are present.
3. Verify User B’s values do not appear anywhere.
4. Export JSON and verify it contains only User A’s records.

## Direct route and API access

While logged out:

- Private page routes must redirect to `/login`.
- `GET /api/data-controls` must return `401`.
- Mutation endpoints under `/api/applications`, `/api/modules`, `/api/migrate-legacy`, and `/api/data-controls` must return `401` without modifying data.

While logged in as User B:

- Attempting to update or delete a known User A record ID through a direct API request must not alter User A’s row.
- Requests must never accept a browser-supplied `user_id` as ownership authority.

## Database verification

In Supabase SQL Editor, verify RLS remains enabled:

```sql
select relname, relrowsecurity
from pg_class
where relname in (
  'profiles',
  'applications',
  'target_companies',
  'networking_contacts',
  'weekly_goals'
)
order by relname;
```

Every result must have `relrowsecurity = true`.

Review policies:

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;
```

Each user-owned table must have authenticated select, insert, update, and delete coverage using `auth.uid()` ownership checks.

## Data controls

1. Export User A’s JSON backup and inspect it for authentication tokens, cookies, passwords, or service keys. None should exist.
2. Merge the same backup twice and verify the second import creates no duplicate records.
3. Replace data from a validated backup and verify all four collections update together.
4. Import one CSV collection and verify other collections remain unchanged.
5. Seed demo data and verify only the active account changes.
6. Delete tracker data and verify the account remains usable while its four collections become empty.
7. Repeat a check as User B to prove User A’s destructive actions had no effect on User B.

## Legacy migration

1. Place a valid version-1 legacy backup under `internship-tracker-data` in a test browser.
2. Log in with a profile whose `legacy_migrated_at` is null.
3. Verify the consent dialog reports counts and uploads nothing before confirmation.
4. Import and verify `profiles.legacy_migrated_at` is set.
5. Retry the same payload and verify no duplicates are created.
6. Dismiss the detected payload and verify that the same user and payload are not prompted again after reopening the browser.
7. Verify local data is deleted only when that option is selected and the import succeeds.

## PWA and cache safety

- Confirm `public/sw.js` does not cache `/api/*` responses.
- Confirm navigation requests use the network and fall back only to `/offline` on network failure.
- Log out, go offline, and verify previously rendered private pages are not served from the service-worker cache.

## Release decision

Do not release if any account can read or mutate another account’s records, if an unauthenticated API mutation succeeds, if private responses are cached, or if exports contain authentication material.

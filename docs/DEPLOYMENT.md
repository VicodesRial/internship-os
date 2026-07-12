# Deployment guide

## 1. Create the Supabase project

Create a Supabase project and retain:

- Project reference
- Project URL
- Anon or publishable key
- Database password for CLI linking

Do not use or configure a service-role key in this application.

## 2. Apply database migrations

From the repository root:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

The migrations create the profile trigger, user-owned tables, indexes, `updated_at` triggers, RLS policies, legacy migration state, and transactional user-data controls. Supabase documents `db push` and its dry-run option in the [CLI reference](https://supabase.com/docs/reference/cli/supabase-db-push).

## 3. Configure Supabase Auth URLs

In Supabase Dashboard, open Authentication > URL Configuration.

- Site URL: the canonical production URL, such as `https://internship-os.example.com`
- Additional redirect URLs:
  - `http://localhost:3000/**`
  - `https://YOUR_PRODUCTION_PROJECT.vercel.app/**`
  - `https://*-YOUR_TEAM_OR_ACCOUNT.vercel.app/**` if Vercel previews must support Auth

The wildcard preview pattern should be scoped to your Vercel team or account, not a global `vercel.app` wildcard. See Supabase’s [redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls).

If email confirmation is enabled, update the Supabase email templates only if needed. The application accepts confirmation links through `/auth/confirm` and callback links through `/auth/callback`.

## 4. Create the Vercel project

1. Push the repository to GitHub.
2. In Vercel, create a project and import the repository.
3. Keep the detected Next.js framework preset.
4. Keep the default install and build commands.
5. Do not override the output directory.

Vercel automatically applies the appropriate Next.js build defaults; see [Vercel Builds](https://vercel.com/docs/builds).

## 5. Configure Vercel environment variables

Add both variables to Production and Preview:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Use the URL and anon/publishable key from the same Supabase project that received the migrations. Environment changes apply only to new deployments, so redeploy after changing them. Vercel’s environment scopes are documented in [Environment Variables](https://vercel.com/docs/environment-variables).

For stronger preview isolation, use a separate Supabase project for previews and configure branch-specific Preview variables. If previews use production Supabase, preview users and test writes operate against production data even though RLS still isolates accounts.

## 6. Deploy

Trigger a Vercel deployment from the production branch. Verify that the build completes and that the deployment has both required environment variables.

## 7. Production smoke test

1. Open `/signup` and create a new account.
2. Complete email confirmation if enabled.
3. Log in and create one record in every tracker module.
4. Refresh and verify all records remain.
5. Log out and confirm `/`, `/applications`, `/networking`, `/target-companies`, `/weekly-goals`, and `/settings` redirect to `/login`.
6. Request a password reset and confirm the link reaches `/reset-password`.
7. Export a JSON backup and verify it contains version `1`, an export timestamp, and no tokens or authentication secrets.
8. Run the complete isolation checklist in `docs/SECURITY_VERIFICATION.md`.

## 8. Preview deployment checks

- Confirm Preview has both Supabase variables.
- Confirm its URL matches an allowed Supabase Auth redirect pattern.
- Never place a service-role key in Preview or Production variables.
- Treat public preview URLs as real clients of whichever Supabase project they reference.
- Re-run signup, callback, reset-password, and route-protection checks on at least one preview deployment.

## Rollback

- Roll back application code through Vercel’s deployment history.
- Database migrations are forward-only. Create a new corrective migration instead of editing an already-applied migration.
- Export user data before exercising replacement, demo-seed, or deletion controls during release testing.

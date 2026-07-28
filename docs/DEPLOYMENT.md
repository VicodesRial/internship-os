# Deployment guide

## 1. Create the Supabase project

Create a Supabase project and retain:

- Project reference
- Project URL
- Publishable key (`sb_publishable_...`)
- Database password for CLI linking

Do not use or configure a service-role key in this application.
For the managed production sequence and operational evidence requirements,
follow [PRODUCTION_RUNBOOK.md](PRODUCTION_RUNBOOK.md).

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

Enable email confirmation and install the recovery template from
`supabase/templates/recovery.html`. The verified recovery flow enters through
`/auth/confirm`; ordinary confirmation and PKCE callbacks use `/auth/callback`.
Apply every Auth control in [AUTH_SECURITY.md](AUTH_SECURITY.md), including the
seven-day session time-box, 24-hour inactivity timeout, and 30-minute recovery
expiry.

## 4. Create the Vercel project

1. Push the repository to GitHub.
2. In Vercel, create a project and import the repository.
3. Keep the detected Next.js framework preset.
4. Keep the default install and build commands.
5. Do not override the output directory.

Vercel automatically applies the appropriate Next.js build defaults; see [Vercel Builds](https://vercel.com/docs/builds).

## 5. Configure Vercel environment variables

Add these variables to Production and Preview:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
APP_ORIGIN
```

Use the URL and modern publishable key from the same Supabase project that
received the migrations. Do not configure a legacy anon key or a service-role
key. Environment changes apply only to new deployments, so redeploy after
changing them. Vercel’s environment scopes are documented in [Environment
Variables](https://vercel.com/docs/environment-variables).

`APP_ORIGIN` must exactly match each environment's browser origin. The
Turnstile site key is public; its secret belongs only in Supabase Auth. Never
add a Turnstile secret or Supabase service-role key to Vercel.

For stronger preview isolation, use a separate Supabase project for previews and configure branch-specific Preview variables. If previews use production Supabase, preview users and test writes operate against production data even though RLS still isolates accounts.

## 6. Deploy

Trigger a Vercel deployment from the production branch. Verify that the build
completes and that the deployment has all required environment variables. Add
and publish the ordered Vercel WAF rules from
[AUTH_SECURITY.md](AUTH_SECURITY.md) after validating them in log mode.

## 7. Production smoke test

1. Open `/signup` and create a new account.
2. Complete the required email confirmation.
3. Log in and create one record in every tracker module.
4. Refresh and verify all records remain.
5. Log out and confirm `/`, `/applications`, `/networking`, `/target-companies`, `/weekly-goals`, and `/settings` redirect to `/login`.
6. Request a password reset, confirm the verified link reaches
   `/reset-password`, and verify the link cannot be reused.
7. Export a JSON backup and verify it contains version `1`, an export timestamp, and no tokens or authentication secrets.
8. Inspect `/login` response headers for nonce CSP, production HSTS, framing
   denial, and the restrictive referrer and permissions policies.
9. Open Vercel Runtime Logs and verify API events are structured JSON with
   pseudonymous user references and no request bodies or user-entered fields.
10. Run the complete isolation checklist in `docs/SECURITY_VERIFICATION.md`.

## 8. Preview deployment checks

- Confirm Preview has all four required variables and its own exact
  `APP_ORIGIN`.
- Confirm its URL matches an allowed Supabase Auth redirect pattern.
- Never place a service-role key in Preview or Production variables.
- Treat public preview URLs as real clients of whichever Supabase project they reference.
- Re-run signup, callback, reset-password, and route-protection checks on at least one preview deployment.

## Rollback

- Roll back application code through Vercel’s deployment history.
- Database migrations are forward-only. Create a new corrective migration instead of editing an already-applied migration.
- Export user data before exercising replacement, demo-seed, or deletion controls during release testing.

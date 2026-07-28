# Internship OS

Internship OS is a multi-user internship search workspace built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, and PostgreSQL.

## Features

- Server-owned email/password auth with confirmation and one-time recovery
- Cloudflare Turnstile protection on login, signup, and recovery
- Protected application routes with server-side session refresh
- Private applications, target companies, networking contacts, and weekly goals
- Dashboard metrics and activity derived from authenticated database records
- JSON export with merge or transactional replacement import
- Collection-level CSV export and transactional replacement import
- Consent-based migration of legacy browser data
- Current-user demo seeding and data deletion
- Row Level Security on every user-owned table
- Installable PWA shell without caching authenticated pages or API responses

## Architecture

- Next.js 15 App Router and React 19
- Supabase SSR authentication
- Supabase PostgreSQL with versioned migrations
- Repository and route-handler data layer
- RLS policies based on `auth.uid()`
- Same-origin JSON APIs with CSRF, streamed body limits, and per-user rate limits
- HttpOnly host-scoped session cookies; no browser Supabase auth client
- Vercel-compatible runtime and environment configuration

The application uses only the Supabase public key and never configures a
service-role key. Session and refresh tokens are available only to same-origin
server code through `HttpOnly` cookies.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and provide your Supabase project URL
   and publishable key. Local auth uses Cloudflare's official Turnstile
   test credentials automatically.

3. Link the Supabase CLI and apply migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push --dry-run
   npx supabase db push
   ```

4. In Supabase Auth URL Configuration, add `http://localhost:3000/**` as an allowed redirect URL.

5. Start the app:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm test
npx supabase start
npm run test:db
npx supabase stop --no-backup
npm run typecheck
npm audit --omit=dev --audit-level=high
npm run build
```

GitHub Actions runs the same release checks and scans repository history for
committed secrets. Follow [docs/AUTH_SECURITY.md](docs/AUTH_SECURITY.md) and
[docs/SECURITY_VERIFICATION.md](docs/SECURITY_VERIFICATION.md) before production
releases.

## Deployment

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Supabase project setup, migrations, Auth redirect URLs, Vercel environment variables, preview deployments, and release verification.
Use [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md) as the release
gate for backups, provider controls, WAF rollout, spend alerts, 2FA, rollback,
and quarterly restore drills.

## Data and security

- Supabase is the source of truth for authenticated tracker data.
- Every database read and mutation verifies the session server-side.
- Repository mutations also constrain updates and deletes by the authenticated user ID.
- RLS independently enforces ownership in PostgreSQL.
- Public and anonymous database grants are revoked; authenticated grants are explicit.
- Mutations require exact-origin Fetch Metadata, JSON, and matching CSRF cookie/header tokens.
- Auth mutations run only on same-origin server routes and require Turnstile on public forms.
- Session cookies are `HttpOnly`, host-scoped, secure in production, and expire with the configured Supabase session policy.
- Normal mutations are limited to 60 per minute per user; destructive and import operations are limited to 10 per hour.
- Imports are schema-validated, limited to JSON/CSV, capped at 1 MB, and
  limited to 1,000 records per collection.
- Spreadsheet exports neutralize formula-leading cells before CSV download.
- A nonce-based Content Security Policy allows only the app, Supabase, and
  Cloudflare Turnstile; production responses also enforce HSTS and framing
  denial.
- API runtime logs contain request metadata and pseudonymous account
  references only, never request bodies, credentials, cookies, or user fields.
- Destructive operations require confirmation and affect only the signed-in user.
- React safely escapes user-entered notes and text; no user content is rendered as HTML.
- The service worker caches static assets only, never API responses or authenticated navigation responses.

# Internship OS

Internship OS is a multi-user internship search workspace built with Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth, and PostgreSQL.

## Features

- Email/password signup, login, logout, confirmation, and password recovery
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
- Vercel-compatible runtime and environment configuration

The browser receives only the public Supabase URL and anon/publishable key. No service-role key is used by the application.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and provide your Supabase project URL and anon or publishable key.

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
npm run typecheck
npm run build
```

The repository currently has no automated lint or unit-test framework. Follow the manual security checklist in [docs/SECURITY_VERIFICATION.md](docs/SECURITY_VERIFICATION.md) before production releases.

## Deployment

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Supabase project setup, migrations, Auth redirect URLs, Vercel environment variables, preview deployments, and release verification.

## Data and security

- Supabase is the source of truth for authenticated tracker data.
- Every database read and mutation verifies the session server-side.
- Repository mutations also constrain updates and deletes by the authenticated user ID.
- RLS independently enforces ownership in PostgreSQL.
- Imports are schema-validated and capped at 1,000 records per collection.
- Destructive operations require confirmation and affect only the signed-in user.
- React safely escapes user-entered notes and text; no user content is rendered as HTML.
- The service worker caches static assets only, never API responses or authenticated navigation responses.

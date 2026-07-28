# Production rollout and operations

This runbook is the release authority for Internship OS. Do not mark a control
complete from configuration intent alone; record the provider screen, command
output, or test result that proves it.

## Current rollout state

As of July 28, 2026:

- Supabase project: `internship.os`
- Supabase region: `us-east-1`
- Supabase state: active and healthy on the Free tier
- Supabase project paused to free the slot: `VicodesRial's Project`
- Database security migrations: applied and verified
- Vercel team: `Internship OS`
- Vercel project: not created
- Custom domain: not configured; launch uses the canonical Vercel domain

The initial release remains on Supabase Free by operator choice. Managed daily
backups, seven-day retention, restore drills, leaked-password protection, and
paid network controls are not release claims. Treat them as deferred controls
until a dedicated production organization is upgraded.

## Supabase release gate

1. Confirm `internship.os` remains `ACTIVE_HEALTHY`.
2. Export a logical backup before every material schema change and retain it
   outside the project.
3. Confirm the backup timestamp and size before changing the schema.
4. Link the CLI to the production project and inspect migration drift:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list
npx supabase db push --dry-run
```

5. Apply committed migrations only after the dry run matches the repository:

```bash
npx supabase db push
```

6. Run Security Advisor and the SQL/RLS checks in
   `docs/SECURITY_VERIFICATION.md`.
7. Confirm every public application table has RLS enabled, `anon` has no table
   privileges, and authenticated grants are limited to required operations.
   Supabase-owned `supabase_admin` default ACLs are provider-managed and cannot
   be changed by project migrations; application migrations use the locked
   `postgres` defaults, and CI must continue enumerating every public table.
8. Confirm the only browser credential is an enabled `sb_publishable_...` key.
   Do not add a service-role, secret, database, or master key to Vercel.
9. Apply the available Auth and Turnstile controls in
   `docs/AUTH_SECURITY.md`.
10. Record paid-only SSL/network restrictions and leaked-password protection as
    deferred until upgrade; do not report them as enabled.

## Vercel release gate

1. Import the public GitHub repository into a new project under the
   `Internship OS` team.
2. Configure Production and Preview separately with:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
APP_ORIGIN
```

3. Use a non-production Supabase project for Preview. Do not point public
   previews at production data.
4. Deploy Preview first and complete the full browser, authentication,
   two-account isolation, CSP, cookie, import, and recovery checks.
5. Stage WAF rules in log mode, in this order:
   - `/api/auth/login`: 10 requests per 10 minutes per IP
   - `/api/auth/signup`: 5 requests per hour per IP
   - `/api/auth/recovery`: 5 requests per hour per IP
   - `/api/*`: 300 requests per minute per IP
6. Review Preview traffic, change the actions to HTTP `429`, and publish the
   rules.
7. Promote the exact verified Preview deployment to Production.
8. Inspect Runtime Logs for structured JSON and verify no email, password,
   token, cookie, notes, links, or payment data appears.
9. Configure Spend Management for $25 metered usage with notifications at
   50%, 75%, and 100%. Do not automatically pause production.

## Account and repository gate

1. Require 2FA or passkeys for GitHub, Vercel, Supabase, and Cloudflare.
2. Enforce organization or team MFA where the provider supports it.
3. Protect the production branch with required CI and secret-scan checks.
4. Revoke the legacy GitHub Gist token only after Supabase data is verified.
5. Require registrar MFA and registrar lock before attaching a custom domain.

## Backup and restore

While the project remains on Free:

1. Export an operator-managed logical backup before schema changes.
2. Store the backup outside Supabase and verify its timestamp and size.
3. Do not claim managed recovery-point or recovery-time guarantees.

After a future upgrade:

1. Enable daily Supabase backups with at least seven-day retention.
2. Restore a backup into a non-production project.
3. Verify schema version, record counts, authentication configuration, and
   two-account isolation in the restored project.
4. Delete the drill project after preserving the evidence and recording the
   recovery time.
5. Repeat the restore drill quarterly and after material schema changes.

## Rollback

1. Roll back the Vercel production alias to the last known-good deployment.
2. Do not edit an applied database migration. Create a forward corrective
   migration.
3. If data integrity is compromised, disable mutations at the deployment
   boundary, preserve logs, and restore into a separate project before deciding
   whether to replace production.
4. Rotate affected publishable or provider credentials and revoke active
   sessions when authentication integrity is uncertain.

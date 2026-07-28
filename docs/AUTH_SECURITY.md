# Authentication Security Controls

The application owns every authentication mutation through same-origin server
routes. Browser code never creates a Supabase client and cannot read the
Supabase access or refresh token.

## Implemented in code

- Login, signup, recovery, password update, and logout accept JSON only and
  require exact Origin, Fetch Metadata, and double-submit CSRF validation.
- Supabase auth cookies are `HttpOnly`, `SameSite=Lax`, path `/`, and use the
  `__Host-` prefix with `Secure` outside localhost.
- Login, signup, and recovery pass a single-use Cloudflare Turnstile token to
  Supabase Auth. Local development uses Cloudflare's documented always-pass
  test credentials.
- Recovery links verify a Supabase `recovery` OTP before issuing a 30-minute
  `HttpOnly` recovery marker. A successful password update clears that marker
  and calls global sign-out to revoke all refresh tokens.
- Login failures are generic. Signup and recovery responses do not reveal
  whether an email address is registered.

## Supabase production configuration

Complete these settings in the existing production project before release:

1. Set Authentication > URL Configuration > Site URL to the canonical Vercel
   production origin. Allow only the exact production callback and confirm URLs.
2. Enable email confirmation and set email OTP expiry to 1800 seconds.
3. Install the recovery template from
   `supabase/templates/recovery.html`. The hosted template must use the
   `token_hash` and `type=recovery` link shown there.
4. Set JWT expiry to 3600 seconds, session time-box to 7 days, and inactivity
   timeout to 24 hours.
5. Require at least 12 password characters and enable all available character
   requirements.
6. On Supabase Pro, enable leaked-password protection and secure password
   changes.
7. Under Bot and Abuse Protection, select Cloudflare Turnstile and store the
   production Turnstile secret in Supabase. Do not put the secret in Vercel or
   this repository.

## Cloudflare Turnstile

Create one managed Turnstile widget and allow only the canonical production
Vercel hostname. Do not allow `localhost` on the production widget. Vercel gets
only `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; Supabase gets only the widget secret.

Cloudflare's official test site key and secret are intentionally used only by
local Supabase configuration. Production must use real keys.

## Vercel WAF rules

Create these rules in this order after the Phase 5 Vercel project exists:

| Priority | Path | Limit | Key | Action |
| --- | --- | --- | --- | --- |
| 1 | `/api/auth/login` | 10 requests / 10 minutes | IP | Return 429 |
| 2 | `/api/auth/signup` | 5 requests / 1 hour | IP | Return 429 |
| 3 | `/api/auth/recovery` | 5 requests / 1 hour | IP | Return 429 |
| 4 | `/api/*` | 300 requests / 1 minute | IP | Return 429 |

Start each rule in log mode on Preview, inspect legitimate traffic, then change
the action to rate limit with HTTP 429 and publish it to Production. Specific
auth rules must precede the general API rule.

## Release checks

1. Inspect cookies in browser developer tools. Production auth and recovery
   cookies must be `HttpOnly`, `Secure`, `SameSite=Lax`, path `/`, and have no
   Domain attribute.
2. Confirm browser storage contains no Supabase session or bearer token.
3. Verify Turnstile succeeds on the production hostname and fails from an
   unapproved hostname.
4. Verify a recovery link expires after 30 minutes, cannot be reused, and signs
   every existing device out after a password update.
5. Verify login, signup, and recovery WAF rules return 429 at their thresholds.

References:

- [Supabase CAPTCHA protection](https://supabase.com/docs/guides/auth/auth-captcha)
- [Supabase session controls](https://supabase.com/docs/guides/auth/sessions)
- [Supabase password security](https://supabase.com/docs/guides/auth/password-security)
- [Cloudflare Turnstile test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [Vercel WAF custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)

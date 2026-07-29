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
  `HttpOnly` recovery marker. The confirmation route supports both the default
  Supabase PKCE email and the repository's custom token-hash template, and
  rejects PKCE sessions without a fresh recovery timestamp. A successful
  password update clears the marker and calls global sign-out to revoke all
  refresh tokens.
- Login failures are generic. Signup and recovery responses do not reveal
  whether an email address is registered.

## Supabase production configuration

The `internship.os` production project currently has:

1. Production Site URL and redirect allowlist configured for the canonical
   Vercel origin.
2. Email confirmation enabled and email OTP expiry set to 1800 seconds.
3. JWT expiry set to 3600 seconds with refresh-token replay detection enabled.
4. Minimum password length set to 12 characters.
5. Secure email and password changes enabled.
6. Cloudflare Turnstile enabled under Bot and Abuse Protection.

Supabase Free does not provide the planned seven-day session time-box,
24-hour inactivity timeout, or leaked-password protection. These controls are
deferred and must not be reported as active. The application still validates
sessions server-side with `auth.getUser()`, and verified password recovery uses
a 30-minute single-use application marker before revoking refresh tokens.

## Cloudflare Turnstile

Create one managed Turnstile widget and allow only the canonical production
Vercel hostname. Do not allow `localhost` on the production widget. Vercel gets
only `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; Supabase gets only the widget secret.

Cloudflare's official test site key and secret are intentionally used only by
local Supabase configuration. Production must use real keys.

Production status: the managed widget is active and restricted to
`internship-os.vercel.app`. A direct Supabase password request without a
Turnstile token is rejected with `captcha_failed`.

## Vercel WAF rules

The target rules remain:

| Priority | Path | Limit | Key | Action |
| --- | --- | --- | --- | --- |
| 1 | `/api/auth/login` | 10 requests / 10 minutes | IP | Return 429 |
| 2 | `/api/auth/signup` | 5 requests / 1 hour | IP | Return 429 |
| 3 | `/api/auth/recovery` | 5 requests / 1 hour | IP | Return 429 |
| 4 | `/api/*` | 300 requests / 1 minute | IP | Return 429 |

Start each rule in log mode on Preview, inspect legitimate traffic, then change
the action to rate limit with HTTP 429 and publish it to Production. Specific
auth rules must precede the general API rule.

Current Hobby status:

| Path | Active limit | Status |
| --- | --- | --- |
| `/api/auth/login` | 10 requests / 10 minutes / IP | Published, HTTP 429 |
| `/api/auth/signup` | 5 requests / 1 hour / IP | Deferred; Pro required |
| `/api/auth/recovery` | 5 requests / 1 hour / IP | Deferred; Pro required |
| `/api/*` | 300 requests / 1 minute / IP | Deferred; Pro required |

Vercel Hobby permits one rate-limit rule and a maximum 600-second window.
Turnstile protects all three public auth forms. Exact same-origin, Fetch
Metadata, CSRF, media-type, and body-size checks protect every mutation, while
authenticated data mutations also use the atomic Supabase rate-limit RPC.

## Release checks

1. Inspect cookies in browser developer tools. Production auth and recovery
   cookies must be `HttpOnly`, `Secure`, `SameSite=Lax`, path `/`, and have no
   Domain attribute.
2. Confirm browser storage contains no Supabase session or bearer token.
3. Verify Turnstile succeeds on the production hostname and fails from an
   unapproved hostname.
4. Verify a recovery link expires after 30 minutes, cannot be reused, and signs
   every existing device out after a password update.
5. Verify the login WAF rule returns 429 at its threshold. Verify additional
   WAF thresholds only after upgrading and publishing those rules.

References:

- [Supabase CAPTCHA protection](https://supabase.com/docs/guides/auth/auth-captcha)
- [Supabase session controls](https://supabase.com/docs/guides/auth/sessions)
- [Supabase password security](https://supabase.com/docs/guides/auth/password-security)
- [Cloudflare Turnstile test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [Vercel WAF custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)

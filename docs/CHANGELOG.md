# Changelog

## Unreleased

- Added a redacted staging/production configuration matrix and explicit
  deployment boundaries. CI now emits only safe environment fingerprints,
  validates immutable per-environment Supabase refs, and the Production
  workflow no longer invokes a Staging smoke target. Credential replacement,
  provider-side verification, and revocation remain release gates.

- Recorded read-only GitHub confirmation that both protected Environments now
  contain the expected secret names and separate publishable-key variables.
  GitHub does not reveal values, so origin, scope, uniqueness, and functional
  credential validation remain outstanding.

- Added explicit local administration secret-file separation: the ignored
  staging file remains `config/.env.dns.local`, while
  `config/.env.dns.production.local` is production-only. Administration
  commands now require an explicit target and source, validate the immutable
  target identity before use, and cannot fall back across environments.

- Updated the Production Auth preflight for current Supabase Custom Providers:
  it now verifies that `custom:line` initiates an authorization redirect to
  LINE instead of relying on the obsolete global configuration field. Provider
  initiation passed; a completed Production LINE login remains a post-deploy
  smoke test.

- Applied the approved MVP 1.0 and MVP 1.5 dashboard-series migrations to the
  confirmed Production Supabase project after read-only history/SQL preflight.
  Verified the resulting migration history and schema contract with temporary
  schema-only dumps; no data dump, deployment, or domain attachment was made.

- Added `RELEASE-STATUS.md` as the operational MVP 1.5 release record. It
  distinguishes owner-reported Staging authenticated acceptance from
  independently observed evidence, records the completed Staging dashboard
  migration, and retains a NO-GO decision pending credential containment,
  Production recovery/migrations, LINE Custom OAuth, Worker domain attachment,
  and controlled Production smoke tests.

- Replaced the unavailable Production PITR assumption with recorded logical
  roles, schema, and data dumps for the Free-plan project. The owner waived
  independently verified restore only for the initial MVP 1.5 release; it is
  explicitly not a proven recovery point. Provider settings, Storage objects,
  and secrets remain outside the dump, and a repeatable independently verified
  recovery procedure remains a post-launch requirement.

- Configured GitHub's protected `production` Environment for the repository:
  `main` is the sole deployment branch and repository owner `WinterGriffin` is
  the required reviewer. Self-review prevention is deliberately disabled
  because the owner is the sole reviewer; this limitation is recorded in the
  release status. Stored the verified Production Supabase publishable key as an
  Environment variable without recording its value. No Production deployment
  or database change was made.

- Recorded the user-confirmed LINE Developers provider/channel split:
  `LangSuanAppDev` for Local and Staging, `LangSuanAppPrd` for Production.
  Environment validation now rejects swapped provider/channel names and
  mismatched Supabase OAuth callbacks. Production LINE Custom OAuth in Supabase
  remains a deployment blocker even though the Production LINE callback was
  confirmed in LINE Developers Console. No Channel credentials were stored.

- Validated the trusted Local HTTPS Docker/Caddy runtime and deployed the HTTPS
  fixes to Staging. Live HTTPS, security headers, TLS 1.2/1.3, and Staging Auth
  configuration passed; the user confirmed signup/confirmation, LINE login,
  password reset, logout, session persistence, and staging-only redirects.
  After these gates, changed Production Supabase Auth to the canonical
  `https://app.langsuanapp.com` Site URL and three exact redirects. Installed a
  dedicated, domain-scoped Resend sending key directly into Production
  Supabase SMTP without recording its value. Strengthened the read-only CI
  preflight to reject missing SMTP details and disabled Custom OAuth when LINE
  is enabled. Production LINE, Worker/DNS, and application deployment remain
  blocked; no Production Worker was deployed.

- Confirmed `app.langsuanapp.com` as the canonical Production application
  origin; the apex is reserved for an independent Marketing/Landing site and
  `www` for its canonical redirect. Removed automatic root redirect Worker
  deployment from the Production workflow and disabled root-domain attachment
  in the domain script. Retained legacy Worker files without deploying them.
  Final pre-production audit found the remote Production Supabase Auth Site
  URL still at localhost; Production remains blocked. Added a read-only
  hosted-Auth preflight to the Production workflow so this mismatch and the
  missing Production Resend SMTP prevent deployment.

- Prepared HTTPS-only local development behind a loopback-bound Caddy proxy
  with ignored mkcert certificates. Browser Supabase requests now use the
  HTTPS proxy while the web container uses the Docker-internal Supabase URL.
  Centralized app/callback URLs, Secure/Lax Auth cookies, environment guards,
  security headers, and public HTTPS smoke gates were added. After a complete
  five-record DNS inventory, Cloudflare zone-wide Always Use HTTPS was enabled
  and minimum TLS raised to 1.2; TLS 1.3 remains on, HSTS remains off. The
  Staging redirect now passes, but the deployed Worker does not yet have the
  new security headers. No Staging or Production Worker was deployed.

- Replaced the Staging signup confirmation subject, plain-text body, and HTML
  button copy with the user-approved Thai LangSuan wording. Confirmation links
  remain staging-only; recovery email and Production delivery were unchanged.
- Clarified the Staging registration page's test-recipient restriction and
  differentiated email rate-limit and connection errors. A non-allowlisted
  signup was correctly denied by the Auth Hook; the recipient allowlist and
  signup email copy were not changed.
- Fixed the staging Resend Auth Hook's recovery and signup token validation to
  accept Supabase's `pkce_`-prefixed hash as well as a plain hexadecimal hash.
  Malformed hashes remain denied; the signed hash is preserved in staging-only
  links. The browser forgot-password request had failed at the hook with
  `invalid_auth_token`, not an email rate limit.
- Corrected the reset-password error message: Staging Auth returned
  `same_password` when the old password was reused, not an expired link.
  The form now explains that a different password is required and lets the
  user retry in the same recovery session.
- Diagnosed live staging Auth Hook rejection: Supabase's signed `site_url`
  differed from the verified remote Auth Site URL. Treat it as diagnostic-only;
  keep the signed redirect-origin check and generate all Auth email links on the
  fixed staging origin. Recipient allowlist, signature, and project guards remain
  mandatory. A live recovery request succeeded; Resend reported delivery, and
  the message contained a staging-only reset link. User-completed reset/login
  and signup confirmation E2E still require verification.
- Registered the staging Auth sending domain with Resend, audited the
  Cloudflare zone, added only Resend's four non-conflicting DNS records, and
  verified the domain and records. Deployed the staging Web recovery routes and
  staging-only Auth Hook with a recipient allowlist and scoped Resend sending
  key. Removed non-staging Auth redirects. Negative delivery testing passed;
  recovery delivery was later verified and Production was not changed.
  Corrected zone-relative DNS name handling in the audit script and tested it.
  Added metadata-only denial categories for staging Hook diagnostics.
- Added a staging-only Supabase Send Email Auth Hook with signed-request
  verification, strict test-recipient allowlist, staging URL checks, and
  Resend delivery for signup/recovery. Added recovery UI/routes and negative
  tests. Domain verification and staging secrets were completed before the
  hook was enabled; production Auth delivery was not changed.
- Prepared Resend transactional email integration without changing Supabase
  Auth: non-secret environment sender settings, a server-side Resend API service
  with fail-closed staging recipients and bounded retries, exact-record DNS
  reconciliation tooling, tests, and a production CI secret gate. Hosted SMTP,
  DNS, and production sending remain inactive pending Resend domain access and
  staging Auth-email recipient controls; see `docs/EMAIL.md`.
- Mapped staging Web to `staging.langsuanapp.com` through a Cloudflare Worker
  Custom Domain, updated staging Supabase Auth Site URL and redirect allow-list,
  and retained the previous `workers.dev` redirects for rollback.
- Added idempotent owned-domain reconciliation, deployment smoke checks, a
  prepared root-domain redirect Worker, and manual-only production workflow.
  API hostnames remain reserved because this repository has no separate API.
- Build/deploy now checks hosted Supabase key/project pairing and refuses to
  read a production key from `.env.local`.
- GitHub Environment publishable keys now use variables because they are
  bundled into browser code; Cloudflare deployment tokens remain secrets.

- Fixed Windows Vinext environment commands by invoking the local CLI through
  Node directly, with explicit local/staging/production Worker names and
  environment-specific Supabase URLs. Added a local Vinext development command.
- Exposed the unauthenticated health route for deployment smoke tests and
  documented the separate Supabase Auth SMTP setup for Resend.

## 1.5.1 — 2026-09-23

- Added the Cloudflare staging origin as the hosted Supabase Auth Site URL and
  explicit redirect allow-list entries for the PKCE OAuth callback and email
  confirmation. This prevents a successful LINE Login from falling back to the
  Docker-local `localhost:3000` Site URL.

## 1.5.0 — 2026-09-23

- Added the approved MVP 1.5 amendment: Supabase-managed multi-provider identity
  architecture, LINE Login as the active new provider, and no duplicate public
  identity table.
- Added a Supabase PKCE OAuth callback and minimal Thai LINE sign-in entry point;
  existing email registration, confirmation, login and shared SSR session cookie
  remain in place. LINE credentials are configured only in Supabase.
- Configured `custom:line` as manual OAuth2 with LINE's authorization, token and
  userinfo endpoints, with `localhost` as the Docker-local post-login callback
  host.
- Bound the Docker-local web port explicitly to `127.0.0.1:3000`, preventing
  Docker's `0.0.0.0:3000` listen notation from being mistaken for a browser URL.
- Added the exact LINE post-login callback URLs to the hosted Supabase Auth
  Redirect URLs and the tracked local Auth configuration. This prevents Auth from
  falling back to a stale Site URL after LINE has authenticated the user.
- Fixed the confirmed Docker callback defect: Route Handlers had built browser
  redirects from the container request host (`0.0.0.0`). They now use the
  configured browser-facing `APP_URL`, defaulting to `http://localhost:3000`.
- Dashboard now distinguishes an empty selected period from a read error and
  presents the Thai empty-state message with a direct first-sale action.
- Added a RLS-respecting Dashboard trend fallback that derives daily points from
  authorized sales rows when an older hosted database has not yet received the
  `sales_daily_summary` migration.
- Manually verified the complete LINE Login flow, authenticated Dashboard entry,
  first-sale empty state, and Dashboard display after recording a sale.
- Reworked dashboard hierarchy to Total Sales, Owner Share, Worker Share and
  previous-period Total Sales comparison. Existing weight, weighted price and
  sale-count analytics remain available as secondary information.
- Added authorized daily-sales aggregate data and real sales trend, Farm comparison
  and Owner/Worker share visualizations. The ledger share rule is unchanged.
- Documented Thai/Buddhist Era display versus Gregorian ISO storage and query
  boundaries as an explicit MVP 1.5 regression contract.

## 1.0.5 — 2026-09-23

- Added a Node.js 22 standalone Next.js Docker image, Compose configuration for local `localhost:3000`, and manual Docker operation guide. Added `scripts/deploy-docker.ps1` to validate configuration, start Docker Desktop, build/recreate the service, and verify the local HTTP response in one command. This supports local/self-hosted runs only and does not change the production-readiness gates.
- Added an optional server-only `SUPABASE_URL_INTERNAL` endpoint so Dockerized server routes can reach a local Supabase stack while browser code continues to use its host-reachable public URL.
- Updated the session proxy to use that server-only endpoint too, preventing local Docker requests from hanging against the container's own loopback address.
- Fixed local email confirmation to trust a successful `verifyOtp` result instead of relying on a response field not populated by the current GoTrue version.
- Made Login recover from authentication/network exceptions and use a full navigation after a successful sign-in, avoiding an indefinitely disabled submit button and client-router refresh race.
- Unified the Supabase SSR session cookie name across the browser URL and Docker-internal server URL so authenticated navigation reaches the dashboard instead of being redirected back to Login.
- Documented the local Supabase Auth/Inbucket email-confirmation workflow, service commands, local Docker endpoint split, and hosted SMTP boundary.

## 1.0.4 — 2026-09-22

- User explicitly approved expanding scope with self-registration using display name, email, and password.
- Supabase email confirmation is mandatory before password sign-in; the confirmation route creates the application profile from authenticated user metadata and returns the user to Login.
- Login no longer asks for a display name and contains only email and password fields.
- Fixed registration success handling by retaining the form element before the asynchronous signup request, preventing a null `currentTarget.reset()` runtime error.

## 1.0.3 — 2026-09-22

- Dashboard and Sales List month filters now use the shared Thai month calendar instead of the device-native English month input.
- Month labels use full Thai month names and Buddhist years while query values remain Gregorian `YYYY-MM`; keyboard arrows, Escape, year navigation, and a Bangkok-current-month action are supported.

## 1.0.2 — 2026-09-22

- User explicitly approved expanding the MVP screen scope with authenticated Farm creation.
- Added FR-13 and D-13: `/farms/new` collects Farm name, `produce_name`, and `default_share_input`; `create_farm` creates the Farm and assigns its creator as the first ADMIN in one transaction.
- Member-management UI remains outside MVP scope. Existing per-Farm RLS/RPC authorization is unchanged.

## 1.0.1 — 2026-09-19

- Application renamed by user request to หลังสวน (Lang Suan); technical folder paths retained for link compatibility.
- Sale date input now explicitly DD/MM/YYYY (Buddhist year); custom calendar uses full Thai month names on Desktop and Mobile.
- Date can be typed or picked; Gregorian ISO storage, Bangkok default and historic dates preserved.

## 1.0 — 2026-09-19

- Created complete requested responsive screen set and 20 reference captures.
- Froze FR-01–12 from latest request and prior accepted workflow.
- Recorded D-01–12 as explicit implementation design decisions, not retroactive user approvals.
- Added design system, user flow, ERD, full dictionary, SQL migration, RLS/RPC/Audit contracts and implementation handoff.
- Verified prototype arithmetic, interactions and responsive layout; fixed mobile navigation direction, narrow-table overflow and KPI typography.
- Future months in current-year reports display unavailable period rather than misleading −100% comparison.
- Replaced external font import with local font fallbacks for offline portability.

### Open evidence / implementation gates

- Original two Google Form screenshots were unavailable through the conversation connector. Workflow uses transcript interpretation plus latest explicit requirements.
- SQL migration and verification harness await execution on disposable Supabase PostgreSQL; real JWT isolation, concurrent editing and auth flows are not validated by the local prototype.
- Production deployment, native apps, account administration UI and accessibility assistive-technology review are not delivered by this design package.

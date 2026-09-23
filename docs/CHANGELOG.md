# Changelog

## 1.5.0 — 2026-09-23

- Added the approved MVP 1.5 amendment: Supabase-managed multi-provider identity
  architecture, LINE Login as the active new provider, and no duplicate public
  identity table.
- Added a Supabase PKCE OAuth callback and minimal Thai LINE sign-in entry point;
  existing email registration, confirmation, login and shared SSR session cookie
  remain in place. LINE credentials are configured only in Supabase.
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

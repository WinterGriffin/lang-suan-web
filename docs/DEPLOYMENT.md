# Cloudflare deployment

## Actual architecture and domain ownership

The application is Next.js 16 via Vinext on Cloudflare Workers. One Worker
contains the Web UI, Auth callback, and `/api/health`. Business data uses
Supabase directly; there is **no separate application API service** yet. Do not
point the API hostnames at the Web Worker and call them a functioning API.

| Environment | Web origin | Worker | Supabase project |
|---|---|---|---|
| Local | `https://localhost` | Caddy → Docker Web | Docker local |
| Staging | `https://staging.langsuanapp.com` | `lang-suan-staging` | `orhdmqeojhesaldsuild` |
| Production | `https://app.langsuanapp.com` | `lang-suan` | `carrbgyuqqnofczoavyg` |

`api-staging.langsuanapp.com` and `api.langsuanapp.com` are reserved until an
application API exists. `langsuanapp.com` is reserved for an independently
deployed Marketing/Landing site; `www.langsuanapp.com` should permanently
redirect to that root. The old `lang-suan-root-redirect` Worker artifacts are
retained only as legacy files: the Production workflow no longer deploys or
attaches them, and root-domain attachment through the domain script is
disabled. No landing page is deployed.

`config/*-parameter.conf` is the source of non-secret environment values. The
Cloudflare account, zone, and project-owned custom domains are declared in
`config/cloudflare-domains.json`. The domain script only attaches an absent
project-owned custom domain, leaves a correct mapping unchanged, and refuses to
reassign a hostname attached to another Worker. It never deletes DNS records.
Cloudflare Custom Domains create their own DNS records and TLS certificates;
do not create placeholder A/CNAME records. [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

## Secrets and Cloudflare token

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is public by design but must be the key
for the matching project. Set it separately in local ignored `.env.local` and
each GitHub Environment as an Environment variable (`vars` context). It is
embedded in browser bundles and is not a server secret. Set
`CLOUDFLARE_API_TOKEN` as an Environment secret.
Production builds reject the ignored local key and check the supplied key
against the production Supabase Auth health endpoint before building.
Never commit LINE Channel Secret, Supabase service-role key, Resend API key,
database passwords, or Cloudflare tokens. `.env*` (except `.env.example`) and
`.dev.vars*` are ignored. Do not set LINE or Resend secrets in `NEXT_PUBLIC_*`.

For CI, create an **API token**, never a Global API Key, scoped to this account
and `langsuanapp.com`: Workers Scripts Edit for the existing app Workers,
Workers Routes Write for the zone, and DNS Read if DNS inventory is desired.
Creating the root Worker additionally needs Workers Admin/create permission.
The domain script itself uses the Worker Domains API and public DNS preflight;
it will not edit unrelated records. See [Cloudflare Workers roles and
permissions](https://developers.cloudflare.com/workers/authorization/workers/).

The locally logged-in Wrangler OAuth credential has Worker/route write but
**not DNS records read**. Cloudflare API DNS inventory therefore remains an
outstanding audit; public DNS and custom-domain mappings were checked before
attaching staging. Do not infer that hidden/non-address records are absent.

## Local and staging

For normal browser testing, use the [local HTTPS Docker workflow](HTTPS_TLS.md)
after starting Docker Supabase. `npm run dev:local` is a direct-port Vinext
debug command and does not replace the trusted HTTPS path. Local mail goes to
the Supabase local email inbox. `npm run validate:staging`, `npm run build:staging`,
and `npm run deploy:staging` build from staging parameters and deploy only
`lang-suan-staging`. `npm run domain:audit:staging` inspects its custom domain;
`npm run domain:apply:staging` attaches it if absent. `npm run smoke:staging`
checks HTTPS, health, manifest, login, and a missing-code callback redirect.
The old `workers.dev` URL remains available as a rollback origin.

Supabase staging Auth Site URL is `https://staging.langsuanapp.com`. Its Redirect
URLs include the exact `/auth/callback` and `/auth/confirm` paths on that host,
plus the previous `workers.dev` URLs during the transition. Supabase owns
`custom:line` OAuth; the LINE Developers callback is the **Supabase** URL
`https://orhdmqeojhesaldsuild.supabase.co/auth/v1/callback`, not the Web URL.
LINE Channel Secret stays in Supabase. Complete a browser LINE login and check
the session and Dashboard on the staging host before production approval.

## Auth email delivery

Supabase Auth still owns signup, confirmation, and sessions. Staging will use
a signed Supabase Send Email Auth Hook with a recipient allowlist and Resend
API. Production will use Resend custom SMTP only after staging passes. Local
Docker keeps its test inbox. Never put API keys in Git or browser variables.
[Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)

The Resend Auth Hook is **active in Staging only**. See [EMAIL.md](EMAIL.md)
for the sender, exact-record DNS audit/apply workflow, staging recipient safety
gate, separate Worker API key, and step-by-step Auth SMTP acceptance checks.
Do not enable staging Auth SMTP; the application mail allowlist does not control
SMTP traffic. The staging hook has its own allowlist, signing secret, and
Resend key; positive signup confirmation E2E remains a gate.
Production email and production deployment remain gated on a separate
`RESEND_API_KEY` GitHub Environment secret, verified Worker secret, and the
staging end-to-end results.

## CI/CD and production gate

Pull requests run typecheck, unit tests, and a Next build with a non-secret CI
placeholder key. Pushes to `main` test and deploy staging, reconcile its
custom domain, then run a smoke test. Production is `workflow_dispatch` only
and must use the protected `production` GitHub Environment with required
reviewers. Configure those reviewers in GitHub before enabling the workflow;
repository YAML alone cannot grant protection. Production deploy builds from
production parameters, attaches `app.langsuanapp.com`, and smokes the Web
Worker. It does not deploy Marketing or the root domain. A read-only Auth
preflight requires a Production-scoped Supabase token with `auth_config_read`
in the Production GitHub Environment as `SUPABASE_ACCESS_TOKEN`; it refuses
wrong Site/Redirect URLs, missing Resend SMTP, or the Staging Send Email Hook.
It must not run until
staging Auth, database/RLS, LINE, email, and responsive checks have passed.

Production Supabase Site URL must be `https://app.langsuanapp.com`; allow the
exact `/auth/callback`, `/auth/confirm`, and `/auth/reset` URLs there. The
2026-09-25 read-only audit found the remote Production Site URL still at
`http://localhost:3000`, an empty redirect allowlist, and no SMTP host. Fix
and retest these before manual Production deployment. Register the production
Supabase callback `https://carrbgyuqqnofczoavyg.supabase.co/auth/v1/callback`
with the production LINE Login channel. Configure a production Resend sender,
rate limits, backups, and monitoring before the manual production run. These
remote settings are not changed by Web deployment.

## Verification and rollback

After each deployment, check DNS resolution, HTTPS certificate, `/api/health`,
`/login`, missing-code callback redirect, manifest commit, Supabase connection,
email confirmation, LINE login, session, Dashboard, Thai calendar, and mobile
layout. The scripted smoke test covers only the unauthenticated checks; record
the authenticated/browser checks separately. API hosts cannot be tested until
an actual API is designed and deployed.

To roll back a Worker, use Cloudflare Workers Versions or redeploy the last
known-good Git tag built with that environment's parameters. Leave the custom
domain mapping in place. If Auth Site URL caused the regression, restore its
previous value using a reviewed Supabase config diff; keep both redirect sets
until users' sessions have settled. Do not change production DNS to a staging
Worker during rollback.

## Remaining manual gates before production

1. In GitHub repository **Settings → Environments**, open `staging` and add
   `CLOUDFLARE_API_TOKEN` as an Environment secret and the staging
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as an Environment variable. The
   staging Action failed at build while that variable was empty; rerun it after
   setting the value. For `production`, add a separate token secret and
   publishable-key variable, set
   required reviewers, disable self-review, and restrict deployment to the
   approved release branch. The repository is public, so these environment
   protections are available on GitHub Free.
2. In Cloudflare **My Profile → API Tokens**, create a scoped token with the
   Worker and zone permissions above. Restrict it to this account/zone and use
   the token only in GitHub Environment secrets. Add DNS Read to perform a full
   Cloudflare DNS inventory; the local OAuth session lacks that permission.
3. In Resend, verify `auth.langsuanapp.com` using only exact provider-supplied
   DNS records. Deploy and configure the **staging-only** Send Email Auth Hook
   with its signing secret, Resend key, and test-recipient allowlist as detailed
   in `docs/EMAIL.md`. Verify signup confirmation and password recovery links
   return to staging. Do not enable production SMTP yet.
4. Complete staged browser acceptance: signup/confirmation, email login,
   Supabase session, LINE login and `/auth/callback`, Dashboard, Thai calendar,
   and mobile widths. Scripted smoke cannot substitute for this signed-in test.
5. Before manually running production workflow, verify the production Supabase
   migration/RLS contract in a disposable project, configure production Auth
   Site/Redirect URLs, register the production Supabase callback in LINE,
   configure SMTP/rate limits/backups/monitoring, and review the production
   publishable key. Only then approve the protected GitHub production job.

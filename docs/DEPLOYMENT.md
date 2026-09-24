# Cloudflare deployment

## Actual architecture and domain ownership

The application is Next.js 16 via Vinext on Cloudflare Workers. One Worker
contains the Web UI, Auth callback, and `/api/health`. Business data uses
Supabase directly; there is **no separate application API service** yet. Do not
point the API hostnames at the Web Worker and call them a functioning API.

| Environment | Web origin | Worker | Supabase project |
|---|---|---|---|
| Local | `http://localhost:3000` | Vinext dev | Docker local |
| Staging | `https://staging.langsuanapp.com` | `lang-suan-staging` | `orhdmqeojhesaldsuild` |
| Production | `https://app.langsuanapp.com` | `lang-suan` | `carrbgyuqqnofczoavyg` |

`api-staging.langsuanapp.com` and `api.langsuanapp.com` are reserved until an
application API exists. `www.langsuanapp.com` is reserved for a future site.
After production approval, a separate `lang-suan-root-redirect` Worker will
redirect `https://langsuanapp.com` to `https://app.langsuanapp.com`, preserving
the path and query string. No landing page is deployed.

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
each GitHub Environment. Set `CLOUDFLARE_API_TOKEN` as an Environment secret.
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

Start Docker Supabase first, then `npm run dev:local`. Local mail goes to the
Supabase local email inbox. `npm run validate:staging`, `npm run build:staging`,
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

Supabase Auth still owns signup, confirmation, and sessions. Configure Resend
as custom SMTP **inside each hosted Supabase project**, not in the Web Worker.
The SMTP host is `smtp.resend.com`, port `465`, user `resend`, and password a
Resend API key. Use a verified sender address. Configure and test staging first;
do not put the API key in Git or browser variables. Local Docker keeps its test
inbox. [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

## CI/CD and production gate

Pull requests run typecheck, unit tests, and a Next build with a non-secret CI
placeholder key. Pushes to `main` test and deploy staging, reconcile its
custom domain, then run a smoke test. Production is `workflow_dispatch` only
and must use the protected `production` GitHub Environment with required
reviewers. Configure those reviewers in GitHub before enabling the workflow;
repository YAML alone cannot grant protection. Production deploy builds from
production parameters, attaches `app.langsuanapp.com`, smokes the Web Worker,
then deploys/attaches the root redirect and checks it. It must not run until
staging Auth, database/RLS, LINE, email, and responsive checks have passed.

Production Supabase Site URL must be `https://app.langsuanapp.com`; allow the
exact `/auth/callback` and `/auth/confirm` URLs there. Register the production
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
   `CLOUDFLARE_API_TOKEN` and the staging
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as Environment secrets. The existing
   staging Action has failed at deploy, so rerun it and inspect its log after
   setting the secrets. For `production`, add separate token/key secrets, set
   required reviewers, disable self-review, and restrict deployment to the
   approved release branch. The repository is public, so these environment
   protections are available on GitHub Free.
2. In Cloudflare **My Profile → API Tokens**, create a scoped token with the
   Worker and zone permissions above. Restrict it to this account/zone and use
   the token only in GitHub Environment secrets. Add DNS Read to perform a full
   Cloudflare DNS inventory; the local OAuth session lacks that permission.
3. In Resend, verify the sending domain/address. In **Supabase staging →
   Authentication → SMTP Settings**, enable custom SMTP with the verified
   sender, `smtp.resend.com:465`, user `resend`, and a Resend API key entered
   directly there. Send a fresh signup confirmation and verify its staging
   `/auth/confirm` return. Repeat with production's sender/key only after
   staging succeeds.
4. Complete staged browser acceptance: signup/confirmation, email login,
   Supabase session, LINE login and `/auth/callback`, Dashboard, Thai calendar,
   and mobile widths. Scripted smoke cannot substitute for this signed-in test.
5. Before manually running production workflow, verify the production Supabase
   migration/RLS contract in a disposable project, configure production Auth
   Site/Redirect URLs, register the production Supabase callback in LINE,
   configure SMTP/rate limits/backups/monitoring, and review the production
   publishable key. Only then approve the protected GitHub production job.

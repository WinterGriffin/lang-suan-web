# Environment configuration and credential separation

This is the redacted configuration map for independently deployable LangSuan
environments. It records names, targets, and procedures only; it never records
credentials or credential-derived values.

## Invariants

| Environment | App host | Supabase project | Cloudflare Worker | LINE channel |
|---|---|---|---|---|
| Staging | `staging.langsuanapp.com` | `orhdmqeojhesaldsuild` | `lang-suan-staging` | `LangSuanAppDev` |
| Production | `app.langsuanapp.com` | `carrbgyuqqnofczoavyg` | `lang-suan` | `LangSuanAppPrd` |

The apex `langsuanapp.com` and `www.langsuanapp.com` are reserved for the
independent landing site and are never deployment targets here.

`config/staging-parameter.conf` and `config/production-parameter.conf` are the
tracked sources for these non-secret identities. The environment validator
rejects a swapped host, Worker, LINE channel, or Supabase project ref. The
fingerprint script emits only these safe fields in CI logs.

## Local administration secret files

| Target | Local file | Current intended contents | Commands needing it |
|---|---|---|---|
| Staging | `config/.env.dns.local` | staging-only values | Cloudflare domain/TLS audit, Resend DNS administration, or hosted-Auth administration when invoked for `staging` |
| Production | `config/.env.dns.production.local` | template only; all four values unset until entered through an approved local mechanism | the same commands when invoked for `production` |

Both files are ignored by Git. They are never renamed, copied across
environments, read by browser code, or used as a CI fallback. Local
administration commands load exactly one file after validating the explicit
target's hostname, Worker, and Supabase ref. GitHub Actions has a separate,
explicit `--ci` path and reads only its selected Environment's secret context.

`CLOUDFLARE_API_TOKEN` is required for Cloudflare domain/TLS commands;
`CLOUDFLARE_WORKERS_READ_TOKEN` is reserved for a read-only Worker audit but
is not consumed by a current repository command;
`RESEND_API_KEY` plus `CLOUDFLARE_API_TOKEN` is required only for Resend DNS
reconciliation; `SUPABASE_ACCESS_TOKEN` is required only for the hosted Auth
configuration audit. An unrelated missing provider credential must not block a
command that does not use it.

## Redacted configuration matrix

| Setting | Purpose / consumer | Staging source → target | Production source → target | Class | Scope / rotation and validation |
|---|---|---|---|---|---|
| App URL and callback | Browser and Auth redirects | staging parameter file → staging host | production parameter file → production host | public | Validate parameter file and hosted Auth redirects. |
| Supabase project ref, URL, OAuth callback | App build and Auth/OAuth | staging parameter file → `orhdmqeojhesaldsuild` | production parameter file → `carrbgyuqqnofczoavyg` | public | Validator binds each ref to its environment; publishable-key health check confirms pairing. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser client/build | GitHub `staging` Environment variable → staging project | GitHub `production` Environment variable → production project | public | Set independently; verify health endpoint project-ref. |
| `CLOUDFLARE_API_TOKEN` | Worker deploy/domain reconciliation | GitHub `staging` Environment secret → `lang-suan-staging` | GitHub `production` Environment secret → `lang-suan` | secret | Separate least-privilege tokens. Zone-wide DNS action needs a distinct controlled token or manual action. Deploy intended Worker/domain before revoking old token. |
| `CLOUDFLARE_WORKERS_READ_TOKEN` | Read-only domain/audit tooling | Protected operator store → staging audit, if needed | Protected operator store → production audit, if needed | secret | Not a deployment-workflow input. Replace with read-only, environment-scoped credentials where supported; validate only read requests. |
| `RESEND_API_KEY` | Application email service/deployment validation | Staging Auth Hook or Worker secret store → staging-controlled mail | Production GitHub Environment and Worker secret store → production application mail | secret | Use distinct sending keys per consumer; validate an allowlisted staging path. Production sending only after production gates authorize it. |
| Supabase SMTP password | Supabase Auth SMTP | Staging provider configuration, separate from hook | Production provider configuration → production SMTP | secret | Provider-managed only; rotate independently from Worker Resend key and validate permitted Auth delivery. |
| `SUPABASE_ACCESS_TOKEN` | Auth preflight/approved management | GitHub `staging` Environment only if introduced | GitHub `production` Environment → production preflight | secret | Create separately scoped PATs where supported; verify effective read-only project access. It is not a publishable, service-role, database, or SMTP credential. |
| LINE channel ID/secret/provider | Supabase Custom OAuth | Supabase staging → `LangSuanAppDev`, staging callback | Supabase production → `LangSuanAppPrd`, production callback | secret/public ID | Keep channels and callbacks distinct; verify end-to-end per environment. |

## GitHub deployment boundary

Every deployment job declares its intended GitHub Environment before reading
`secrets` or `vars`. `production` is manual-only and uses the protected
`production` Environment; `staging` uses `staging`. Deployment commands load
only the named parameter file. The safe fingerprint runs before every build.
Production does not invoke any staging deployment or smoke target.

Read-only GitHub metadata audit on 26 September 2026 confirmed that both
Environment branch policies permit only `main`; Production requires
`WinterGriffin` review and leaves self-review prevention disabled because that
owner is the sole reviewer. Both Environments now contain the three required
secret names and their own publishable-key variable. These are names/presence
observations, not evidence that a credential is safe, new, environment-unique,
properly scoped, or usable.

Workflow bindings were also reviewed by name only: the Staging deployment uses
only `CLOUDFLARE_API_TOKEN`; its `RESEND_API_KEY` and
`SUPABASE_ACCESS_TOKEN` are intentionally unused. The Production workflow
binds `SUPABASE_ACCESS_TOKEN` to the hosted-Auth audit,
`CLOUDFLARE_API_TOKEN` to build/deploy/domain reconciliation, and
`RESEND_API_KEY` to build/deploy validation. No workflow receives a secret
from the other Environment.

## Exposed credential replacement sequence

1. Create distinct protected destinations in both GitHub Environments and the
   provider secret stores. Never replace a staging value with a production one.
2. Create one replacement per environment/consumer, update that consumer, and
   validate a least-privilege operation without logging a credential.
3. For a shared exposed token, update all dependent consumers first, then
   revoke it only after both environments pass validation.
4. Remove the exposed values from their previous environment file after all
   consumers have moved. A replacement may be stored only in its corresponding
   ignored local administration file and protected provider/CI secret stores;
   it never belongs in a generic `.env`, parameter file, or repository.
5. Run controlled staging deployment/smoke. Before production, re-check
   protection, secret presence by name only, and the production fingerprint.

The exposed Resend key and Supabase Management PAT remain unrotated until their
replacements and revocations are independently verified. The legacy local
Cloudflare tokens returned `401`; after the production-specific local file was
introduced, its Cloudflare token returned `400` to read-only verification and
the staging local token still returned `401`. New scoped Cloudflare deployment
credentials are therefore still required before either environment can deploy.

Read-only local validation on 26 September reached the intended Production
Resend domain endpoint and Production Supabase Auth-configuration endpoint
with HTTP `200`. This proves only endpoint access from the production-specific
file; it does not prove that the credentials are new, distinct from Staging,
or scoped appropriately. No production write, migration, deployment, or email
was performed.

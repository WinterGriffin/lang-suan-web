# Staging QA access audit

Date: 22 October 2026. Auditor: Claude Code. The audit is based on repository code, documentation, variable and file names, and public unauthenticated endpoints. No secret value, token, password, cookie or credential-store content was read, printed or committed. Presence of the ignored local file was checked by name only.

Classifications used:

- **EXISTS**: available now.
- **EXISTS_BUT_AGENT_NOT_AUTHORIZED**: the mechanism exists, but an agent may use it only with the owner's approval or the owner's own session.
- **NOT_PROVISIONED**: evidence shows it does not exist.
- **NOT_VERIFIABLE_WITH_CURRENT_PERMISSIONS**: it can't be confirmed without access that hasn't been granted.

## 1. How staging configuration is loaded

| Layer | Mechanism | Evidence |
|---|---|---|
| Non-secret identity | Tracked `config/staging-parameter.conf`, parsed by `scripts/load-parameters.mjs` | Required keys; `APP_ENV` and `CLOUDFLARE_ENV` must both be `staging` |
| Identity guard | `scripts/validate-environment.mjs` | Hard-binds staging to Worker `lang-suan-staging`, Supabase ref `orhdmqeojhesaldsuild` and origin `https://staging.langsuanapp.com`; rejects any production host or ref |
| Build/runtime env | `buildEnvironment()` in `load-parameters.mjs`; `scripts/run-environment-command.mjs` | Deploy passes `--name` from the parameter file |
| CI secrets | GitHub Environment `staging` (branch policy: `main` only) | `docs/ENVIRONMENT-CONFIGURATION.md` "GitHub deployment boundary"; `docs/RELEASE-STATUS.md:58`. The secret names present are `CLOUDFLARE_API_TOKEN`, `RESEND_API_KEY` and `SUPABASE_ACCESS_TOKEN`, plus the variable `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Only `CLOUDFLARE_API_TOKEN` is bound by `deploy-staging.yml`; the other two are present but intentionally unused. |
| Local operator secrets | `scripts/load-admin-secrets.mjs` reads exactly one ignored file, `config/.env.dns.local` for staging. Names are allowlisted: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_WORKERS_READ_TOKEN`, `CLOUDFLARE_WEB`, `RESEND_API_KEY`, `SUPABASE_ACCESS_TOKEN` | The file exists by name and is git-ignored (`.gitignore:18`). A `source: "ci"` mode reads the same names from the selected GitHub Environment and runs only when `CI=true`. |

## 2. Existing commands that validate staging without exposing secrets

| Command | Needs | Read-only | Output |
|---|---|---|---|
| `npm run validate:staging` | nothing secret | yes | "Validated staging." |
| `npm run config:fingerprint:staging` | nothing secret | yes | Host, Supabase ref, Worker and LINE channel name only |
| `npm run smoke:staging` | nothing secret | yes | Health, **deployment manifest**, login and callback origin; in CI it asserts `gitCommit === GITHUB_SHA` |
| `npm run smoke:https:staging` | nothing secret | yes | TLS/HTTPS checks |
| `npm run domain:audit:staging` | `CLOUDFLARE_API_TOKEN` (local file) | yes | Domain attachment |
| `npm run auth:audit:staging` | `SUPABASE_ACCESS_TOKEN` | yes | Hosted Auth configuration |
| `npm run diagnose:staging:farm-rpc` | `SUPABASE_ACCESS_TOKEN` (local file) | yes (catalog `select`) | Runs `supabase db query --linked --file …` against the staging ref |
| `npm run test:staging:farm-rpc`, `test:staging:create-farm-rpc` | `SUPABASE_ACCESS_TOKEN` | **no**: writes inside a transaction that is rolled back | Shows the established pattern of impersonating an **existing** user with `request.jwt.claims` and `set local role authenticated` |

## 3. Answers to the six audit questions

1. **Configuration loading**: described in §1. It **EXISTS** and is robust: target identity is validated before any secret is used, and there is no cross-environment fallback.
2. **Validation without secrets**: `validate:staging`, `config:fingerprint:staging`, `smoke:staging` and `smoke:https:staging` all **EXIST**.
3. **Credential injection**: **EXISTS** through two mechanisms:
   - (a) the GitHub `staging` Environment, which contains a `SUPABASE_ACCESS_TOKEN` that no workflow uses yet;
   - (b) the owner's local `config/.env.dns.local`, read by `load-admin-secrets.mjs`.

   An agent may use either only with the owner's approval: **EXISTS_BUT_AGENT_NOT_AUTHORIZED**. This session's permission policy refused agent exploration of local credentials, and it was not bypassed.
4. **Staging test identities and fixtures**:
   - Dedicated, documented staging QA identities are **NOT_PROVISIONED**. No documentation, secret name or workflow refers to them. Staging acceptance to date is "owner-reported manual acceptance" (`docs/RELEASE-STATUS.md:34-40`). Fixture identities exist only in local and disposable SQL (`supabase/tests/*.sql`, `docs/PROGRESS.md`).
   - Existing real staging users and farm memberships do exist; the farm-RPC diagnostics select one from `user_farm_roles`. Whether two users have disjoint farm permissions, and whether there are enough sales for the selected years, is **NOT_VERIFIABLE_WITH_CURRENT_PERMISSIONS**.
5. **Verifiable active version and source commit**: **EXISTS**, and was observed during this audit.
   - Every build writes `public/deployment-manifest.json` with `gitCommit` from `git rev-parse HEAD` (`scripts/run-environment-command.mjs:35`).
   - Staging currently serves `{"environment":"staging","version":"main","gitCommit":"3f71b17506f5363c995082fa8afa6a9932a74b6d","buildTimestamp":"2026-10-22T03:26:51.581Z"}`, with `Cache-Control: public, max-age=0, must-revalidate`.
   - The build timestamp falls inside run `39716824022` (03:26:18Z to 03:27:10Z), whose `smoke:staging` step asserted the manifest commit equals `GITHUB_SHA`.
   - Limitation (also in `RELEASE-STATUS.md:31`): the manifest records `HEAD`, so a build from a dirty working tree would report the same SHA. A Cloudflare Worker version listing would add provider-side confirmation. `CLOUDFLARE_WORKERS_READ_TOKEN` is reserved for that, but no command uses it yet.
6. **Authenticated Reports QA through approved CI**: **NOT_PROVISIONED** as a workflow. The building blocks exist: the GitHub `staging` Environment's unused `SUPABASE_ACCESS_TOKEN`, the `source: "ci"` secret loader, the `supabase db query` pattern and existing-user JWT impersonation. A browser-rendered authenticated path needs a session (see the plan).

## 4. Security observations

- `supabase db query` through the Management API runs as a privileged database role and bypasses RLS until `set local role authenticated` is applied. Read-only behaviour must therefore be enforced inside the SQL (`set transaction read only`, `rollback`) and through code review of the SQL file. The token itself doesn't enforce it.
- Supabase personal access tokens may cover every project in the account. The documentation already says to "verify effective read-only project access" (`ENVIRONMENT-CONFIGURATION.md`, `SUPABASE_ACCESS_TOKEN` row). Until scoping is proven, the repository's guard is `assertAdministrationTarget("staging")` plus the explicit `--project-ref orhdmqeojhesaldsuild`.
- The `staging` GitHub Environment has a `main`-only branch policy but no documented required reviewer. Only `production` requires `WinterGriffin` review.
- No workflow currently runs on `pull_request_target`, and none exposes environment secrets to pull-request code (`ci.yml` uses `pull_request` with no secrets).

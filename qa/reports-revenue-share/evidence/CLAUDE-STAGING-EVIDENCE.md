# Claude staging evidence — Reports revenue share

Collected 22 October 2026, ending 04:02 UTC, by Claude Code. This was evidence collection only: no application code, configuration, deployment, migration or staging/production data changed.

- Reviewed feature commit: `3f71b17506f5363c995082fa8afa6a9932a74b6d` (on `main` and `origin/main`)
- QA commit read: `9765537f8e2003fb7fc78000ca496fee7444e0f2` on `qa/reports-revenue-share-review`. It is a descendant of the feature commit and adds only the three `GEMINI-QA-*` files.
- Evidence branch: `evidence/reports-revenue-share-staging`, based on `3f71b17`

**Summary: 0 PASS, 0 FAIL, 9 BLOCKED** (STAGING-IDENTITY, QA-01 to QA-06, QA-11, QA-12).

## Access limitation (applies to every check except STAGING-IDENTITY)

Claude had no authorized authenticated staging session, staging user identity, or read-only staging database access in this task. An attempt to look up locally stored staging access was refused by the session's permission policy as credential exploration, and it was not retried or worked around. Without authenticated access:

- the Reports page cannot be opened (`/reports` returns 307 to `/login`),
- the RLS-governed `sales_summary` RPC cannot be called as a real user, and
- no expected aggregates can be computed.

No values were invented. Every financial, isolation and rendering check is therefore BLOCKED, not FAIL.

## STAGING-IDENTITY — BLOCKED (strongly corroborated)

| Evidence | Observed | Source |
|---|---|---|
| Latest GitHub `staging` deployment record | id `7242925439`, sha `3f71b17…`, created 03:26:19Z; final status `success` at 03:27:10Z | `GET /repos/WinterGriffin/lang-suan-web/deployments?environment=staging`, `/deployments/7242925439/statuses` |
| Workflow run | `39716824022`, head_sha `3f71b17…`, conclusion `success`; the `deploy:staging`, smoke and HTTPS smoke steps all succeeded | https://github.com/WinterGriffin/lang-suan-web/actions/runs/39716824022 |
| Later staging runs or deployments | None after `39716824022` / `7242925439` up to 04:02Z | same APIs |
| Later commits on `main` | None (`origin/main` = `3f71b17`) | `git fetch` |
| Live chunk containing the amendment | `/_next/static/chunks/page-C7tE2Hqi.js`: HTTP 200, 8384 bytes, ETag `"b0946b902eb55c0683fd2874cb2aab13"`, `CF-Cache-Status: HIT`, sha256 `27ad36614becae364b07ba59a5cdadb6309a04189b01e819425c286aa33b9b19`; contains "การแบ่งส่วนแบ่งรายได้" | unauthenticated GET, crawl of 27 chunks from `/login` |
| Health | `{"status":"ok","environment":"staging","version":"unknown"}` | `GET /api/health` |
| Build artifacts | Run has 0 uploaded artifacts, so there is no digest to compare | `/actions/runs/39716824022/artifacts` |

Why this is BLOCKED:

- The GitHub records prove what CI deployed, not what the Worker is serving now.
- The staging runs before this one all failed, which suggests earlier staging deploys were made from local machines (`npm run deploy:staging`) outside GitHub. A deploy made that way would leave no GitHub record.
- The served chunk is cached (`HIT`) and is only one file of the bundle.
- Exact identity requires the Cloudflare Worker version or deployment record for `lang-suan-staging`. It can be obtained read-only with `wrangler deployments list --name lang-suan-staging` or `wrangler versions view <id>` and a staging-scoped token, matched against the deployment time and message of run `39716824022`. Claude did not have that access.

## QA-01 to QA-06 — financial checks — BLOCKED

| ID | Check | Expected | Observed | Status |
|---|---|---|---|---|
| QA-01 | Selected-year total sales | not computed | not observed | BLOCKED |
| QA-02 | Owner allocation sums | not computed | not observed | BLOCKED |
| QA-03 | Worker allocation sums | not computed | not observed | BLOCKED |
| QA-04 | Year filter | not computed | not observed | BLOCKED |
| QA-05 | Monthly totals and allocations | not computed | not observed | BLOCKED |
| QA-06 | Farm comparison | not computed | not observed | BLOCKED |

Reason: there was no authenticated session and no read-only data access (see "Access limitation"). The method to use once access exists is in `CLAUDE-QA-HANDOFF.md`. No zero-value or no-sales states were observed on staging.

## QA-11 — farm isolation — BLOCKED

Two existing staging identities with different farm permissions were not available to Claude. No users or permissions were created, and `supabase/tests/report-shares.sql` was not executed anywhere. The static source evidence is unchanged from the Gemini report (security-invoker `sales_summary`, `deleted_at is null`, the `sales` select policy) and is not a live result.

## QA-12 — responsive UI — BLOCKED

There was no authenticated browser session, so the amended Reports page was not rendered at 375, 768 or ≥1100 px. No screenshots were captured.

## Production

No production endpoint, credential or workflow was used for this evidence. The most recent production workflow runs listed by the public API are for `750ba0f` (28 September 2026). There is none for `3f71b17`.

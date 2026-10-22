# Reports revenue-share QA unblocking matrix

Feature commit: `3f71b17506f5363c995082fa8afa6a9932a74b6d`. Previous evidence: `evidence/reports-revenue-share-staging` (all 9 checks BLOCKED). Access paths are described in `STAGING-QA-ACCESS-PLAN.md`.

| Check | Previous | Existing execution path | Classification | Needed to complete | Owner approval |
|---|---|---|---|---|---|
| STAGING-IDENTITY | BLOCKED | `/deployment-manifest.json` (written by every build) plus the `smoke:staging` `GITHUB_SHA` assertion in run `39716824022` | **EXISTS**. Observed now: manifest `gitCommit` = `3f71b17…`, built 03:26:51Z, inside that run's window | Nothing for commit identity. A Cloudflare Worker version listing is optional extra confirmation | None (optional Worker audit: approve use of `CLOUDFLARE_WORKERS_READ_TOKEN`) |
| QA-01 Total sales | BLOCKED | Read-only `supabase db query` with the staging `SUPABASE_ACCESS_TOKEN` (local file or `staging` Environment), following the farm-RPC diagnostics pattern | EXISTS_BUT_AGENT_NOT_AUTHORIZED | Plan path A or B and the read-only SQL in §3 | Path A or B |
| QA-02 Owner allocation | BLOCKED | same | EXISTS_BUT_AGENT_NOT_AUTHORIZED | same | same |
| QA-03 Worker allocation | BLOCKED | same | EXISTS_BUT_AGENT_NOT_AUTHORIZED | same | same |
| QA-04 Year filter | BLOCKED | same SQL, run for each year in the selector, plus a rendered check for the UI switch | EXISTS_BUT_AGENT_NOT_AUTHORIZED | SQL plus one signed-in session | Path A/B, and an owner session or QA identity |
| QA-05 Monthly figures | BLOCKED | same SQL, grouped by month | EXISTS_BUT_AGENT_NOT_AUTHORIZED | same as QA-01 | same |
| QA-06 Farm comparison | BLOCKED | same SQL, grouped by farm | EXISTS_BUT_AGENT_NOT_AUTHORIZED | same as QA-01 | same |
| QA-11 Farm isolation | BLOCKED | JWT-claims impersonation of **existing** users inside a read-only rolled-back transaction (pattern in `supabase/diagnostics/staging-farm-rpc-transaction-test.sql`) | Mechanism EXISTS_BUT_AGENT_NOT_AUTHORIZED. Whether a disjoint user pair exists is NOT_VERIFIABLE_WITH_CURRENT_PERMISSIONS | The SQL reports `NO_DISJOINT_PAIR` if none exists. Never create users | Path A or B. If no pair exists, the owner decides whether to provision a second QA identity |
| QA-12 Responsive UI | BLOCKED | The owner's authenticated browser session | EXISTS_BUT_AGENT_NOT_AUTHORIZED. A dedicated staging QA identity is NOT_PROVISIONED (no doc, secret name or workflow refers to one) | Owner session (plan §4.1) or a QA identity with Playwright (§4.2) | Owner consent to drive their session, or approval to create a QA identity and secret |

## Not blocked by infrastructure

QA-07 to QA-10 already passed in Gemini's report and are out of scope here.

## Fastest unblock sequence

1. STAGING-IDENTITY can be marked VERIFIED now from the manifest evidence above. Record it in the evidence branch.
2. The owner approves path A. Claude or Codex adds `qa/sql/reports-revenue-share.sql` and `scripts/qa-staging-sql.mjs` for review. The owner runs `npm run qa:staging:sql -- qa/sql/reports-revenue-share.sql`, and the sanitized output closes QA-01 to QA-06 and QA-11.
3. The owner opens `/reports` signed in, and the agent captures 375 / 768 / ≥1100 px views with consent. The owner reviews them before commit. This closes QA-12 and the on-screen half of QA-04.
4. Later, adopt path B so future amendments need only one environment-approval click.

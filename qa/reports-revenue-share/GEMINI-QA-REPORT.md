# LangSuan Reports independent QA

Date: 22 October 2026 (Asia/Bangkok). Reviewer: Codex performing independent verification of the supplied handoff; filenames follow the requested Gemini convention.

Repository: https://github.com/WinterGriffin/lang-suan-web.git
Reviewed commit and workspace HEAD: `3f71b17506f5363c995082fa8afa6a9932a74b6d`; parent `750ba0f`. Initial git status was clean.
Final decision: **QA_BLOCKED**.

## Exact scope and baseline

Reviewed commit against its parent. Exactly six changed files: app/reports/page.tsx, lib/analytics.ts, docs/SPECIFICATION.md, docs/CHANGELOG.md, tests/reports-revenue-share.test.mjs, supabase/tests/report-shares.sql. Read START-HERE, relevant specification/database/schema/design contracts, changelog and accessible QA handoff. Direct dependencies reviewed only for aggregation, styling and sales_summary authorization. No application/configuration changes, deploys, database writes, commits or pushes. Production endpoints and credentials were not accessed. No unrelated tests ran.

## Requirements and source evidence

- Existing stored sales_summary totals and owner/worker sums feed selected-year overview and monthly/farm share columns (app/reports/page.tsx:20-35; lib/analytics.ts:9-14).
- Revenue-share wording is correct: generated allocations divide gross sales, not net profit (docs/schema.sql:49-62; docs/SPECIFICATION.md section 3.3). No assumed sharing percentages, expense workflow, new financial calculation or migration was introduced.
- Visual proportions use owner / (owner + worker), truncate to two percentage decimals, and do not mutate records (lib/analytics.ts:34-39). Amounts remain separately visible. Empty rows omit chart and state no sales; existing stored zero displays 0.00.
- Existing year/metric selectors and tabs remain as expressly accepted in specification section 3.3. Additional yearly comparison totals are existing tab content, not a new duplicate aggregation path.
- RPC boundaries remain Gregorian start-inclusive/end-exclusive; monthly and farm arrays filter existing summary rows. No changed query or join. Active-only security-invoker aggregation is defined in supabase/migrations/20260927000000_mvp_1_6_usability_data_safety.sql:92-96; sales membership policy is docs/schema.sql:101-102. Static evidence is not a live isolation result.
- New overview is gated by existing loading/error status. Currency change handles negative comparison signs. Existing broader async/error behaviors were not expanded into a general review.
- CSS supplies mobile stacking, share styling and horizontally scrolling tables. No rendered responsiveness verdict is claimed.

## Targeted execution

Executed `node --test tests/reports-revenue-share.test.mjs`: **9 passed, 0 failed**, exit 0. These are arithmetic fixtures and source/CSS assertions, not browser or real database integration tests. Full suite was not run. SQL fixture was read but not executed: it inserts records and is expressly disposable-only; no verified disposable database was available. It must not run on shared staging.

Mandatory QA matrix: **4 passed, 0 failed, 8 blocked**. Partial fixture evidence is retained below without treating it as a complete staging result.

| ID | Check | Status | Evidence |
|---|---|---|---|
| QA-01 | Total sales matches database records | BLOCKED | Fixture total 1,350.49 passed; authenticated staging database-to-display comparison unavailable. |
| QA-02 | Owner allocation matches database records | BLOCKED | Fixture owner 700.24 passed; no authenticated staging records/display comparison. |
| QA-03 | Laborer allocation matches database records | BLOCKED | Fixture worker 650.25 passed; no authenticated staging records/display comparison. |
| QA-04 | Selected-year filter | BLOCKED | Source retains selected-year exclusive end boundaries; runtime filter interaction not verified. |
| QA-05 | Monthly figures | BLOCKED | Fixture January owner 700.24 and worker 400.25 pass; staging monthly display not verified. |
| QA-06 | Farm comparison | BLOCKED | Fixture farm B sales 99.99 and worker 0.00 pass; staging farm comparison not verified. |
| QA-07 | Missing allocation | PASS | Source assertion verifies no-sales state, distinct from zero. Schema-generated NOT NULL input-derived allocations cannot be missing on valid stored sales; this does not prove handling malformed RPC payloads. |
| QA-08 | Zero allocations | PASS | Executed zero-value fixtures; worker 0.00, owner-only/worker-only ratios, and both-zero bar suppression pass. |
| QA-09 | Financial formatting | PASS | Executed formatting assertions: grouping, two decimals, zero, fractional cents representation and negative comparison signs pass. |
| QA-10 | Distribution bar | PASS | Executed stored-sum ratio 51.85%, zero and invalid-negative guards; source only sets visual widths, no writes. |
| QA-11 | Farm isolation | BLOCKED | Static security-invoker RPC and sales RLS reviewed; real JWT isolation fixture not executed. |
| QA-12 | Desktop/mobile UI | BLOCKED | CSS/markup assertions pass; no authenticated rendered Reports checks at 375, 768, >=1100 pixels. |

## Read-only staging verification

- https://staging.langsuanapp.com/api/health: HTTP 200, {"status":"ok","environment":"staging","version":"unknown"}.
- https://staging.langsuanapp.com/reports: HTTP 307, Location /login (redirect not followed for the accessibility check).
- GitHub Actions API independently confirms run https://github.com/WinterGriffin/lang-suan-web/actions/runs/39716824022 has the reviewed full head_sha and conclusion success. Jobs API confirms successful staging build, typecheck, deployment and smoke steps. These historical results were observed, not rerun by QA.
- Live staging /_next/static/chunks/page-C7tE2Hqi.js: HTTP 200 text/javascript; decoded bundle independently contains the exact revenue-share heading extracted from the reviewed source, sales_summary and share-track. This corroborates feature deployment but does not prove exact current runtime SHA.
- Exact current deployment identity remains BLOCKED because health reports unknown and no immutable runtime-to-SHA version evidence was available. Branch state alone was not used.
- Authenticated Reports values, filters, visual layout and JWT isolation remain BLOCKED. No staging financial data was created or modified.

## Findings and required evidence

No verified in-scope defects; severity counts: critical 0, high 0, medium 0, low 0. Missing access/evidence is recorded as blocked checks rather than invented defects. No out-of-scope issue was investigated.

Needed: an existing authorized staging session with known permitted records and a second restricted-farm identity, read-only expected sums for active sales by year/month/farm, desktop/mobile rendered verification, and staging provider deployment/version evidence mapping the currently served artifact to the reviewed SHA. Execute report-shares.sql only in a verified disposable Supabase project when available; retain actual JWT assertions. Do not deploy or alter shared financial records to unblock this review.

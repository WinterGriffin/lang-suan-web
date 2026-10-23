# Codex Reports revenue-share re-review

Date: 23 October 2026 (Asia/Bangkok).
Decision: **QA_PASS_WITH_WAIVER** for the requested evidence review. The nine previously pending checks are accepted: eight PASS and QA-12 PASS WITH OWNER WAIVER. No merge or deployment is authorized by this decision.

Scope: STAGING-IDENTITY, QA-01–QA-06, QA-11 and QA-12 only. QA-07–QA-10 retain their earlier decisions and were not rerun. This report supersedes the pending-check assessment in `1109267`, not its historical observations.

## Sources and method

- Evidence branch snapshot: `aa29dfe0d0dc47c8a7547ba38cbe064f735fd413`. Reviewed `CLAUDE-CODEX-REREVIEW-HANDOFF.md`, `CLAUDE-PATH-A-RESULTS.md` and `CLAUDE-QA-12-RESULTS.md` under `qa/reports-revenue-share/evidence/`.
- Path A source: `24cc062ae1ff58f5911996c8a554981439850101`, including SQL, runner, tests and package script. Read the access audit from Git object `accefd7:docs/qa/STAGING-QA-ACCESS-AUDIT.md`; it is absent from the evidence branch.
- Feature under test: `3f71b17506f5363c995082fa8afa6a9932a74b6d`. Checked specification §3.3, database contracts/schema, accepted changelog and manifest/smoke/workflow source.
- Independently ran the eight runner tests in an isolated checkout of Path A. No live SQL, authenticated browser checks, provider API calls or public endpoint checks were rerun. Financial/UI results and workflow success are attributed to the supplied Claude evidence; raw SQL transcripts and screenshots were not supplied. Remote branch freshness was not independently checked.

## Decisions

| Check | Decision | Basis |
|---|---|---|
| STAGING-IDENTITY | PASS, bounded evidence acceptance | The staging manifest read at 09:08 UTC identifies the full feature SHA. The build writes HEAD into the served artifact; smoke source asserts equality with GITHUB_SHA, and the supplied audit records successful run 39716824022. This is a build-embedded source mapping rather than a timestamp-only inference. |
| QA-01 | PASS | Independent stored-sale sums and identity-scoped sales_summary totals agree for both users; user_b's displayed total matches its SQL result. |
| QA-02 | PASS | Stored and RPC owner sums agree; displayed user_b owner amount agrees; balance checks report zero violations. |
| QA-03 | PASS | Stored and RPC worker sums agree; displayed user_b worker amount agrees; share bar renders. |
| QA-04 | PASS | SQL uses inclusive Gregorian year start and exclusive next-year start across three selectable years; counts and boundaries agree. Browser evidence records switching to the prior year and updated empty-state/headers. |
| QA-05 | PASS | Full farm-month comparison reports zero mismatches; user_b monthly table matches the occupied month and distinguishes empty/future months. |
| QA-06 | PASS | Full farm-year comparison reports zero mismatches; user_b table includes both permitted farms, including the empty farm. |
| QA-11 | PASS | Two existing identities have disjoint farm memberships; unpermitted rows and explicit foreign-farm-filter rows are zero in both directions. Each foreign target has active sales, avoiding a vacuous isolation check. |
| QA-12 | PASS WITH OWNER WAIVER | Supplied measurements establish contained table/chart scrolling and no page overflow at 1536, 768 and 502 px. The evidence explicitly records the owner's acceptance of 502 px as the mobile substitute. **375 px remains untested**; sharing a breakpoint does not prove fit at 375 px. |

Identity acceptance applies to the recorded staging observation, not perpetual current deployment identity. A dirty local build can embed the same HEAD, and a manifest alone does not prove every active Worker version or traffic split. For this evidence review, the CI-linked build mapping meets the requested identity bar; a Cloudflare active-version record is not an additional blocking requirement. Provider-side attestation would be needed to certify all actively served versions or investigate contradictory observations.

## Path A assessment and findings

The reviewed SQL contains only reads and transaction-local settings/role changes, begins with a read-only transaction, and ends in rollback. Expected aggregates come from active stored sales under the privileged role; observed aggregates come from sales_summary under each existing user's authenticated role and JWT claims. The report checks selected-year totals, share balance, counts, farm-month/farm-year aggregates and explicit foreign-farm filters.

The runner checks the exact LF-normalized SHA-256 pin, statement lint, environment, Supabase hostname/project ref and linked ref before loading the staging token. Only four report columns are emitted on successful execution, with detail redaction. The pin and review of the exact SQL are the central safety boundary: the regex lint is defense in depth, not a general SQL security parser. The reviewed flow has no blocking implementation defect for this fixed query.

**Low — Windows test portability:** `tests/qa-staging-sql.test.mjs:19` requires literal LF between transaction statements (and line 20 similarly assumes LF before rollback). In the isolated default Windows CRLF checkout, `node --test tests/qa-staging-sql.test.mjs` produced **7 PASS, 1 FAIL** at line 19, after the pin and lint assertions passed. Replacing only the isolated SQL checkout with the exact committed Git blob (LF), leaving test/runner code unchanged, produced **8 PASS, 0 FAIL**. Normalize newlines in assertions or accept `\r?\n` in a future change. This test failure does not invalidate the runner's normalized pin or the attributed live SQL results.

Nonblocking follow-ups: the readable 768 px amount wrap may be improved with nowrap after checking overflow; DEP0190 from Windows shell execution remains low risk for the reviewed fixed arguments and allowlisted key. No implementation changes were made.

## Limits and delivery boundary

The live SQL evidence reports 13 PASS, no FAIL/BLOCKED, over five active sales across the two identities in the window. It does not exercise a stored-zero share, negative values, large datasets or all authorization scenarios. On-screen reconciliation covers user_b, not both identities. Preserve existing fixture coverage for cases absent from staging. QA acceptance here is an assessment of supplied sanitized observations plus independent source/test review, not a claim that Codex reran the live checks.

Only this report is committed on `qa/reports-revenue-share-rereview`, based on the evidence snapshot. No implementation, secrets, permissions, database, deployment or main branch changes were made. The untracked `.claude/` directory was left untouched. Branches remain unmerged pending the owner's decision.

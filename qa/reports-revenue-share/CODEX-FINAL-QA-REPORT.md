# LangSuan Reports final independent QA

Review date: 22 October 2026, Asia/Bangkok.
Repository: https://github.com/WinterGriffin/lang-suan-web
Feature SHA: `3f71b17506f5363c995082fa8afa6a9932a74b6d`
QA branch: `qa/reports-revenue-share-final-review`, based directly on the feature SHA.
Overall decision: **QA_BLOCKED**. Pending checks: **0 PASS, 0 FAIL, 9 BLOCKED**.

## GitHub source of truth

Fetched both named branches from origin and verified their remote full SHAs using git ls-remote. Read all four source documents from the exact fetched commit objects, not mutable workspace copies. Remote original QA SHA: `9765537f8e2003fb7fc78000ca496fee7444e0f2`. Remote Claude evidence SHA: `31f11353ea28c5cdfd7d4ac3515440aaab75f231`.

- [qa/reports-revenue-share/GEMINI-QA-REPORT.md](https://github.com/WinterGriffin/lang-suan-web/blob/9765537f8e2003fb7fc78000ca496fee7444e0f2/qa/reports-revenue-share/GEMINI-QA-REPORT.md) (branch `qa/reports-revenue-share-review`)
- [qa/reports-revenue-share/GEMINI-QA-FINDINGS.json](https://github.com/WinterGriffin/lang-suan-web/blob/9765537f8e2003fb7fc78000ca496fee7444e0f2/qa/reports-revenue-share/GEMINI-QA-FINDINGS.json) (branch `qa/reports-revenue-share-review`)
- [qa/reports-revenue-share/evidence/CLAUDE-STAGING-EVIDENCE.md](https://github.com/WinterGriffin/lang-suan-web/blob/31f11353ea28c5cdfd7d4ac3515440aaab75f231/qa/reports-revenue-share/evidence/CLAUDE-STAGING-EVIDENCE.md) (branch `evidence/reports-revenue-share-staging`)
- [qa/reports-revenue-share/evidence/CLAUDE-QA-HANDOFF.md](https://github.com/WinterGriffin/lang-suan-web/blob/31f11353ea28c5cdfd7d4ac3515440aaab75f231/qa/reports-revenue-share/evidence/CLAUDE-QA-HANDOFF.md) (branch `evidence/reports-revenue-share-staging`)

Original QA preserves QA-07 through QA-10 as passed. They were not rerun, and no full test suite was executed. This review covers only STAGING-IDENTITY, QA-01 through QA-06, QA-11 and QA-12.

## Authorization and evidence assessment

The owner authorized staging verification within strict limits and supplied the GitHub evidence references. The owner did not explicitly supply a staging user/session, authorized read-only record access, two isolation identities, or Cloudflare staging version access in this request. The referenced Claude documents explicitly report the same missing access and contain no sufficient sanitized results to close any pending check. General authorization to verify does not supply credentials or a session.

No local credential files, configuration, environment variables, browser profiles or credential stores were searched. No previous access denial was retried or circumvented. No live staging request or browser inspection was needed after the evidence prerequisite assessment failed.

## Pending check results

| Check | Status | Evidence limitation |
|---|---|---|
| STAGING-IDENTITY: Current active Worker version to feature SHA | BLOCKED | No owner-provided staging Worker active-version record or verifiable artifact-to-feature-SHA mapping. GitHub run, cached chunk, timestamps and unknown health version do not establish exact current deployment identity. |
| QA-01: Selected-year total sales | BLOCKED | No explicitly supplied authenticated staging session or authorized read-only sales evidence paired with Reports output. |
| QA-02: Owner allocation | BLOCKED | No authorized staging owner-share aggregates paired with Reports output. |
| QA-03: Laborer allocation | BLOCKED | No authorized staging worker-share aggregates paired with Reports output. |
| QA-04: Selected-year filter | BLOCKED | No authenticated year-switch observations or equivalent sanitized evidence of selected boundaries and updated sections. |
| QA-05: Monthly figures | BLOCKED | No authorized monthly aggregates paired with amended monthly Reports output. |
| QA-06: Farm comparison | BLOCKED | No authorized per-farm aggregates paired with amended farm Reports output. |
| QA-11: Farm-data isolation | BLOCKED | No two existing explicitly authorized identities with disjoint farm permissions or sanitized identity-scoped isolation results. |
| QA-12: Responsive Reports UI | BLOCKED | No authenticated Reports renders or sanitized observations at 375px, 768px and >=1100px. |

## Deployment identity evidence

Claude records successful staging workflow run [39716824022](https://github.com/WinterGriffin/lang-suan-web/actions/runs/39716824022) for the feature SHA, GitHub staging deployment 7242925439, a cached amendment chunk, and health version unknown. These are prior attributed observations, not newly executed requests. They corroborate a historical feature deployment but cannot prove the active Worker is exactly that feature revision.

The Claude handoff proposes accepting a version by creation-time window and absence of newer versions. The owner's current requirement expressly rejects timestamps alone. Require a sanitized current active deployment record for `lang-suan-staging`, including all active version IDs and traffic percentages where relevant, plus immutable version/build/artifact metadata linking every served version to `3f71b17506f5363c995082fa8afa6a9932a74b6d`. A timestamp-only association will remain BLOCKED. No configuration change or redeployment is authorized or necessary for this evidence review.

## Financial, authorization and rendering evidence

No staging financial figures or isolation observations were invented. Existing fixture/static evidence remains in the original QA; it does not substitute for authorized database-to-UI validation. Expected checks use active sales only and the selected Gregorian year range [Y-01-01, (Y+1)-01-01), preserving the tested user's permitted farms. Comparison through the UI and independent existing-record sums remains unexecuted. Likewise, no authenticated render at the three required widths was inspected.

## Findings and release boundary

No verified in-scope defect. Critical/high/medium/low findings: 0 each. Missing evidence is BLOCKED, not a functional failure. This decision does not certify staging correctness or release readiness.

Only these three final QA documents are added on the dedicated branch. No application code, configuration, database data, deployment or permissions changed. No production endpoint, database or credential was accessed. No merge into main. The exact remaining owner actions are in CODEX-OWNER-ACTION-REQUIRED.md. QA documents are committed and pushed as explicitly requested; delivery verification is reported separately with the resulting full commit SHA.

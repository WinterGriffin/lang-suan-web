# Path A staging results — Reports revenue share

The owner approved the run on 23 October 2026, and Claude Code executed it through an owner-added permission rule for this exact command. The run finished at about 09:08 UTC. It was read-only: no data, configuration or deployment changed.

- Feature SHA under test: `3f71b17506f5363c995082fa8afa6a9932a74b6d`
- Runner commit: `24cc062ae1ff58f5911996c8a554981439850101` (`chore/staging-qa-local`)
- SQL: `qa/sql/reports-revenue-share.sql`, sha256 (LF-normalized) `c58e34d490bb7b4aa7b609308b33fa8e15447bde197c7ad622a19008a77508c5`, pinned in the runner
- Command: `npm run qa:staging:sql -- qa/sql/reports-revenue-share.sql`
- Runner target line: `Target verified: staging (orhdmqeojhesaldsuild). Running qa/sql/reports-revenue-share.sql read-only.`

**Summary: 13 PASS, 0 FAIL, 0 BLOCKED** (QA-01 to QA-06 for two identities, plus QA-11).

## Staging identity (re-read at 09:08 UTC)

`GET https://staging.langsuanapp.com/deployment-manifest.json` returned `{"environment":"staging","version":"main","gitCommit":"3f71b17506f5363c995082fa8afa6a9932a74b6d","buildTimestamp":"2026-10-22T03:26:51.581Z"}`.

- Every build writes this manifest with `git rev-parse HEAD` (`scripts/run-environment-command.mjs:35`).
- In run `39716824022`, `smoke:staging` asserted that the manifest commit equals `GITHUB_SHA`.
- See `docs/qa/STAGING-QA-ACCESS-AUDIT.md` §3.5 on `chore/staging-qa-access` for the limitations.

## Method

- **Expected values:** read as the privileged role directly from `public.sales`, using active sales only (`deleted_at is null`). They are summed per farm and month over the three years the selector offers, with Gregorian `[Y-01-01, (Y+1)-01-01)` bounds, restricted to each identity's farm memberships.
- **Observed values:** `public.sales_summary` called once per year under the identity's JWT claims with `set local role authenticated`, the same RLS context the Reports page uses.
- **Identities:** existing users only.
  - `user_a` is the user with the most active sales.
  - `user_b` is an existing user whose farm permissions do not overlap with `user_a`'s.
  - No user, farm or sale was created.

## Results (sanitized aggregates, THB)

| Check | Identity | Status | Detail |
|---|---|---|---|
| QA-01 Total sales | user_a | PASS | 2026 (BE 2569): 26,511.00 / 26,511.00; 2025: 2,769.00 / 2,769.00; 2024: 0.00 / 0.00 |
| QA-01 Total sales | user_b | PASS | 2026: 7,250.00 / 7,250.00; 2025: 0.00 / 0.00; 2024: 0.00 / 0.00 |
| QA-02 Owner share | user_a | PASS | 2026: 21,420.00 / 21,420.00; 2025: 2,000.00 / 2,000.00; 2024: 0.00 / 0.00; unbalanced rows 0 |
| QA-02 Owner share | user_b | PASS | 2026: 7,000.00 / 7,000.00; 2025: 0.00 / 0.00; 2024: 0.00 / 0.00; unbalanced rows 0 |
| QA-03 Worker share | user_a | PASS | 2026: 5,091.00 / 5,091.00; 2025: 769.00 / 769.00; 2024: 0.00 / 0.00; unbalanced rows 0 |
| QA-03 Worker share | user_b | PASS | 2026: 250.00 / 250.00; 2025: 0.00 / 0.00; 2024: 0.00 / 0.00; unbalanced rows 0 |
| QA-04 Year filter (database) | user_a | PASS | sales 3/3 (2026), 1/1 (2025), 0/0 (2024); rows outside their year 0 |
| QA-04 Year filter (database) | user_b | PASS | sales 1/1 (2026), 0/0, 0/0; rows outside their year 0 |
| QA-05 Monthly | user_a | PASS | farm-month rows compared 4; mismatches 0 |
| QA-05 Monthly | user_b | PASS | farm-month rows compared 1; mismatches 0 |
| QA-06 Farm comparison | user_a | PASS | permitted farms 4; farm-year totals compared 4; mismatches 0 |
| QA-06 Farm comparison | user_b | PASS | permitted farms 2; farm-year totals compared 1; mismatches 0 |
| QA-11 Farm isolation | user_a+user_b | PASS | each: unpermitted rows visible 0; explicit foreign-farm filter rows 0; each foreign farm holds active sales (1 and 2), so the check is not vacuous |

Format: expected / observed. Owner + worker = total holds in every year shown.

## Limitations

- **Small sample:** staging holds few active sales (5 in the window across both identities). The data allowed no check of a stored-zero share or a negative value.
- **Database half only:** these results prove the stored records and `sales_summary` agree under RLS, which is the database half of QA-01 to QA-06. Proving the same figures on screen (Reports to UI) and QA-12 still needs a signed-in browser check. No browser tools were available to Claude in this session.
- **Low-severity runner note:** on Windows, Node printed `DEP0190`, which warns about `spawnSync` with `shell: true` and an argument list. The arguments are fixed strings plus the allowlisted file key, so nothing user-supplied reaches the shell.

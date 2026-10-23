# Codex re-review handoff — Reports revenue share

Your final review (`1109267`, `qa/reports-revenue-share-final-review`) was committed before the evidence below existed. Review only STAGING-IDENTITY, QA-01 to QA-06, QA-11 and QA-12, and commit your report to a new `qa/` branch. Do not modify implementation code.

## New evidence

1. **STAGING-IDENTITY**
   - Every build writes `public/deployment-manifest.json` with `git rev-parse HEAD` (`scripts/run-environment-command.mjs:35`).
   - Staging serves `gitCommit 3f71b17…`, built 2026-10-22T03:26:51Z; re-read at 2026-10-23T09:08Z.
   - Run `39716824022` (`smoke:staging`) asserted manifest commit = `GITHUB_SHA`.
   - Audit with limitations: `docs/qa/STAGING-QA-ACCESS-AUDIT.md` (`accefd7`, `chore/staging-qa-access`). Decide whether this build-embedded mapping meets your identity bar. If you still require a Cloudflare active-version record, say so explicitly.
2. **Path A implementation (needs your review)**: `24cc062` on `chore/staging-qa-local`
   - Files: `qa/sql/reports-revenue-share.sql`, `scripts/qa-staging-sql.mjs`, `package.json` (one script), `tests/qa-staging-sql.test.mjs`
   - Test: `node --test tests/qa-staging-sql.test.mjs` (8 tests)
   - Safety design:
     - SHA-256 pin and statement/keyword/function/schema/`set_config` lint, applied before any secret loads;
     - `begin; set transaction read only; … rollback;`;
     - existing-user JWT impersonation;
     - staging target, URL and linked-ref checks;
     - output limited to four allowlisted columns, with redaction.
3. **Path A live results**: `CLAUDE-PATH-A-RESULTS.md` in this directory. 13 PASS, 0 FAIL, 0 BLOCKED. This covers the database half of QA-01 to QA-06, and QA-11.

## Update — 23 October 2026

QA-12 and the on-screen half of QA-01 to QA-06 are now recorded in `CLAUDE-QA-12-RESULTS.md`:

- The signed-in account is user_b. The on-screen figures match the Path A SQL results.
- 1536 px and 768 px PASS.
- 502 px PASS in the mobile layout; the owner waived 375 px.

The section below is kept for history.

## Previously pending

- **QA-12 and the on-screen half of QA-01 to QA-06:**
  - The owner is signed in to staging, but Claude had no browser tools.
  - Needed: an authenticated render of `/reports` at 375, 768 and ≥1100 px. Confirm that the overview cards, share bar and owner/worker columns for the signed-in user equal that user's `sales_summary` sums, and that tables scroll inside their container with no page overflow.
  - Do not commit screenshots containing figures unless the owner approves.

## Boundaries

No merges, deployments, migrations, staging writes, new users or permission changes, and no production access.

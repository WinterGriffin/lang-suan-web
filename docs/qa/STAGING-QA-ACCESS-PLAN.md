# Staging QA access plan

Goal: let Codex (or any independent reviewer) run authenticated, read-only staging QA for each amendment without the owner locating credentials again. Nothing in this plan has been implemented yet. Every item marked **APPROVAL** needs the owner's explicit approval first. The audit evidence is in `STAGING-QA-ACCESS-AUDIT.md`.

## 0. Usable now, no change needed

- Deployed-commit identity:
  - Run `npm run smoke:staging` with `GITHUB_SHA=<reviewed sha>` set. It fails if `/deployment-manifest.json.gitCommit` differs.
  - Or read the manifest directly: `curl https://staging.langsuanapp.com/deployment-manifest.json`.
- Safe staging identity checks: `npm run validate:staging` and `npm run config:fingerprint:staging`.

## 1. Proposed path A: owner-run local command (smallest change) — APPROVAL

Add a read-only QA SQL file and a script that follows the existing `diagnose-staging-farm-rpc.mjs` pattern exactly:

- `qa/sql/reports-revenue-share.sql`. It must start with `begin; set transaction read only;` and end with `rollback;`. It contains `select` statements only and outputs aggregates only.
- `scripts/qa-staging-sql.mjs <file>`. It:
  - calls `loadAdministrationSecrets("staging", ["SUPABASE_ACCESS_TOKEN"])`;
  - refuses files outside `qa/sql/`, and files that lack the read-only header or the `rollback;` trailer;
  - runs `npx supabase db query --linked --file <file> --project-ref <staging ref from the parameter file>`.
- `package.json` entry: `"qa:staging:sql": "node scripts/qa-staging-sql.mjs"`.

The owner runs `npm run qa:staging:sql -- qa/sql/reports-revenue-share.sql` and commits the sanitized output to the QA branch. Security impact: low. It uses the owner's existing local token in the same way as `diagnose:staging:farm-rpc`, and it adds no new secret.

## 2. Proposed path B: approved CI workflow (repeatable for every amendment) — APPROVAL

`.github/workflows/qa-staging.yml` (draft, not committed):

```yaml
name: QA staging (read-only)
on:
  workflow_dispatch:
    inputs:
      sha: { description: "Reviewed commit (full SHA)", required: true }
      sql: { description: "qa/sql file to run", required: true }
permissions: { contents: read }
concurrency: { group: lang-suan-staging-qa, cancel-in-progress: false }
jobs:
  qa:
    runs-on: ubuntu-latest
    environment: staging-qa          # new Environment, required reviewer WinterGriffin, branch main
    steps:
      - uses: actions/checkout@v4
        with: { ref: "${{ inputs.sha }}", persist-credentials: false }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run config:fingerprint:staging
      - run: npm run smoke:staging
        env: { GITHUB_SHA: "${{ inputs.sha }}" }   # fail closed if staging is not serving the reviewed commit
      - run: node scripts/qa-staging-sql.mjs --ci "$QA_SQL" > qa-output.json
        env:
          QA_SQL: ${{ inputs.sql }}
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - uses: actions/upload-artifact@v4
        with: { name: staging-qa-evidence, path: qa-output.json, retention-days: 30 }
```

Controls:

- It runs only through manual `workflow_dispatch`.
- The new `staging-qa` Environment requires `WinterGriffin` approval and allows only `main`. Putting the reviewer on `staging-qa` keeps the `staging` auto-deploy ungated.
- `permissions: contents: read` and `persist-credentials: false`.
- The checkout is pinned to the reviewed SHA, and the job fails if the manifest doesn't match it.
- The secret is passed only to the SQL step, and the script never prints it.
- There is no `pull_request_target` trigger, so pull-request code never sees the secret.
- The SQL guard is enforced in the script; the SQL file is reviewed in the repository before dispatch.
- Output is aggregates and pseudonymous aliases only.

Owner actions required:

1. Approve adding the workflow and script.
2. Create the `staging-qa` Environment with a required reviewer.
3. Store a staging `SUPABASE_ACCESS_TOKEN` there. This is a new secret placement, so the owner must provision it; prefer a token with proven staging-only scope.

## 3. Read-only SQL content for the Reports amendment (to place in `qa/sql/`)

Per selected year Y (start inclusive, end exclusive):

1. **Expected (privileged, no RLS)**: `sum(total_amount)`, `sum(owner_share)`, `sum(worker_share)` and `count(*)` over `public.sales where deleted_at is null and sale_date >= Y-01-01 and sale_date < (Y+1)-01-01`, grouped by farm and month.
2. **Observed (as an existing user)**:
   - Choose an existing user from `public.user_farm_roles`.
   - `select set_config('request.jwt.claims', json_build_object('sub', <user>, 'role', 'authenticated')::text, true); set local role authenticated;`
   - Then `select * from public.sales_summary(Y-01-01, (Y+1)-01-01, null)`.
   - Compare with (1) restricted to that user's farms, for QA-01 to QA-06. These rows are exactly what the Reports page consumes.
3. **Isolation (QA-11)**:
   - Choose two existing users whose farm sets are disjoint.
   - For each, assert that `sales_summary(..., null)` returns only their farm IDs, and that `sales_summary(..., <other user's farm>)` returns 0 rows.
   - If no such pair exists, output `NO_DISJOINT_PAIR`. Do not create users.
4. **Sanitization**: output farm aliases (`farm_1`, `farm_2` …) and user aliases (`user_a`, `user_b`), never names, emails or UUIDs. Output totals rounded to cents, and booleans for the comparisons.

## 4. Rendered UI (QA-12) and display equality

The SQL proves database-to-RPC equality. To prove the RPC-to-screen step and the responsive layout, someone has to render the page while signed in. Options, smallest first:

1. **Owner session (no change)**: the owner signs in to `https://staging.langsuanapp.com/reports` in their own browser. Either the agent drives it with the owner's consent (Claude in Chrome or the built-in browser), or the owner captures 375 / 768 / ≥1100 px views. The owner reviews screenshots before they're committed.
2. **Dedicated QA identity — APPROVAL**: the owner creates one staging-only QA user with VIEWER access to a non-sensitive staging farm, and stores its password only in the `staging-qa` Environment. A Playwright step in path B then signs in and captures screenshots as artifacts. This creates a user and a secret, so it requires explicit owner approval and setup. It is not done here.

## 5. Avoiding this problem in future amendments

- Each amendment adds one reviewed `qa/sql/<amendment>.sql` that follows the read-only template above.
- The reviewer dispatches `qa-staging.yml` with the SHA; the owner approves the environment gate (one click). The artifact becomes the evidence.
- STAGING-IDENTITY always comes from the manifest plus the `smoke:staging` SHA assertion. Optionally, add a Worker version audit using `CLOUDFLARE_WORKERS_READ_TOKEN` (currently unused).
- Record the QA identity aliases and which farms they cover in this directory (no secrets), so later reviewers don't have to rediscover them.

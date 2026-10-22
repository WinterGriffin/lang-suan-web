# Handoff to Codex — Reports revenue-share staging evidence

Scope is limited to STAGING-IDENTITY, QA-01 to QA-06, QA-11 and QA-12 for commit `3f71b17506f5363c995082fa8afa6a9932a74b6d`. Do not rerun QA-07 to QA-10 or the full suite, and do not change code, configuration, data or deployments.

## Can be completed now

None. Every in-scope check needs access that Claude did not have. The supporting evidence for each check is in `CLAUDE-STAGING-EVIDENCE.md`.

## Still blocked, and what unblocks each check

1. **STAGING-IDENTITY**
   - Unblocked by: a read-only, staging-scoped Cloudflare token run with `wrangler deployments list --name lang-suan-staging`, then `wrangler versions view <current version id>`.
   - Pass if: the active version was created between 03:26:23Z and 03:27:10Z on 2026-10-22 (run `39716824022`), and no version is newer. Record the version ID and time only.
2. **QA-01 to QA-06**
   - Unblocked by: an existing authorized staging user, plus one of:
     - (a) a read-only SQL session, or
     - (b) that user's `sales_summary` call.
   - For each year Y offered by the selector, compute the expected values with
     `select farm_id, date_trunc('month', sale_date)::date, sum(total_amount), sum(owner_share), sum(worker_share), count(*) from public.sales where deleted_at is null and sale_date >= 'Y-01-01' and sale_date < '(Y+1)-01-01' and farm_id in (<user's permitted farms>) group by 1, 2`.
   - Compare against the overview cards (QA-01 to QA-03), the selected-year switch (QA-04), the monthly table (QA-05) and the farm-comparison table (QA-06).
   - Record aggregates only. Also note any no-sales month (it should show "ไม่มีรายการขาย") and any stored-zero share (it should show "0.00 บาท").
3. **QA-11**
   - Unblocked by: two existing identities with disjoint farms.
   - As each identity, check that:
     - Reports shows only its permitted farms;
     - `sales_summary(p_start, p_end, null)` returns only its farm IDs;
     - `sales_summary(..., p_farm_id => <other farm>)` returns zero rows.
   - Do not record JWTs or cookies. Do not run `supabase/tests/report-shares.sql` on staging.
4. **QA-12**
   - Unblocked by: an authenticated browser session on `https://staging.langsuanapp.com/reports`.
   - At 375, 768 and ≥1100 px, check:
     - the ยอดขายรวม card and the เจ้าของสวน / คนงาน amounts;
     - the stacked bar;
     - the new owner/worker columns;
     - horizontal scrolling inside the tables only;
     - no page overflow.
   - Keep screenshots only if they reveal no private figures. Otherwise record pass/fail notes.

## Not to do

No merges, deployments, migrations, staging data writes, new users or permission changes, and no production access.

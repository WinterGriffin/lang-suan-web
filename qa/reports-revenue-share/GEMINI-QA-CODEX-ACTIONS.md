# In-scope follow-up for Codex

No code corrections are required based on verified findings. QA is blocked, not passed; no implementation defect has been established.

1. Supply immutable staging deployment/version evidence for commit 3f71b17506f5363c995082fa8afa6a9932a74b6d. Existing successful run 39716824022 and matching feature bundle corroborate deployment, but health version is unknown. Do not change configuration or redeploy as part of this QA.
2. Using existing authorized staging identities and read-only records, open /reports and compare total_amount, owner_share and worker_share sums (active sales, Gregorian exclusive end boundary) for selected year, each month and each permitted farm. Change the year and all affected tabs; verify figures, no-sales states and stored zeros. Retest QA-01 through QA-06.
3. With existing identities restricted to different farms, confirm Reports/RPC cannot disclose the other farm, including an explicit foreign-farm filter. Retest QA-11. The SQL fixture supabase/tests/report-shares.sql must only run in a separately verified disposable database, never shared staging or production.
4. Render the authenticated amended page at 375px, 768px and >=1100px. Verify summary/share labels and values, card flow and table-contained horizontal scrolling. Retest QA-12; preserve observed evidence.
5. Rerun only tests/reports-revenue-share.test.mjs if an in-scope correction is later made. Do not modify unrelated app code, migrate, write shared records, commit, push or deploy under this QA request.

Affected verification sources: app/reports/page.tsx:20-35, lib/analytics.ts:9-14 and :34-39, app/reports/reports.css, app/dashboard.css, and the existing sales_summary/RLS contracts. Expected outcome: database-matched permitted figures, correct selected-period breakdowns and readable mobile/desktop output. No defect reproduction steps exist because no defect was verified; the procedures above reproduce the pending checks.

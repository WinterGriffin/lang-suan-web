import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { money, comparisonAmount, shareBarWidth, totalRows } from "../lib/analytics.ts";

const page = readFileSync("app/reports/page.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20260927000000_mvp_1_6_usability_data_safety.sql", "utf8");

// Fixture shaped like sales_summary rows: two farms, two months of one year.
const farmA = "f-a";
const farmB = "f-b";
const rows = [
  { farm_id: farmA, month_start: "2026-01-01", total_amount: 1000.5, weight_kg: 50.25, average_price: 19.91, sale_count: 2, owner_share: 600.25, worker_share: 400.25 },
  { farm_id: farmA, month_start: "2026-02-01", total_amount: 250, weight_kg: 10, average_price: 25, sale_count: 1, owner_share: 0, worker_share: 250 },
  { farm_id: farmB, month_start: "2026-01-01", total_amount: 99.99, weight_kg: 3.333, average_price: 30, sale_count: 1, owner_share: 99.99, worker_share: 0 },
];

test("total sales and owner/worker allocations sum stored amounts exactly", () => {
  const all = totalRows(rows);
  assert.equal(money(all.total), "1,350.49");
  assert.equal(money(all.owner), "700.24");
  assert.equal(money(all.worker), "650.25");
  assert.equal(all.owner + all.worker, all.total);
});

test("monthly and farm groupings use only their own rows", () => {
  const january = totalRows(rows.filter((row) => row.month_start === "2026-01-01"));
  assert.equal(money(january.owner), "700.24");
  assert.equal(money(january.worker), "400.25");
  const farmBTotals = totalRows(rows.filter((row) => row.farm_id === farmB));
  assert.equal(money(farmBTotals.total), "99.99");
  assert.equal(money(farmBTotals.worker), "0.00");
});

test("Thai Baht formatting keeps two decimals and signs negatives", () => {
  assert.equal(money(0n), "0.00");
  assert.equal(money(5n), "0.05");
  assert.equal(money(123456789n), "1,234,567.89");
  assert.equal(money(-150n), "-1.50");
  assert.equal(money(-5n), "-0.05");
  assert.equal(comparisonAmount(100n, 250n), "-1.50");
  assert.equal(comparisonAmount(250n, 100n), "+1.50");
});

test("share bar is visual-only and omitted for non-comparable amounts", () => {
  assert.equal(shareBarWidth(totalRows(rows)), 51.85);
  assert.equal(shareBarWidth(totalRows(rows.slice(1, 2))), 0);
  assert.equal(shareBarWidth(totalRows([])), null);
  assert.equal(shareBarWidth({ total: 0n, weight: 0n, count: 1n, owner: 0n, worker: 0n }), null);
  assert.equal(shareBarWidth({ total: 100n, weight: 0n, count: 1n, owner: -50n, worker: 150n }), null);
});

test("reports page shows total sales and revenue share without profit or percentage claims", () => {
  assert.match(page, /ยอดขายรวม/);
  assert.match(page, /การแบ่งส่วนแบ่งรายได้/);
  assert.match(page, /เจ้าของสวน/);
  assert.match(page, /คนงาน/);
  assert.doesNotMatch(page, /กำไร|ค่าใช้จ่าย|ต้นทุน|อนุมัติ/);
  assert.doesNotMatch(page, /\d+(\.\d+)?%\s*<|toFixed\(/);
  assert.match(page, /owner !== null && <div className="share-track"/);
});

test("missing allocation is distinct from a stored zero", () => {
  assert.match(page, /const noSales = "ไม่มีรายการขาย"/);
  assert.match(page, /rows\.length \? `\$\{money\(totalRows\(rows\)\[side\]\)\} บาท` : noSales/);
  assert.match(page, /if \(!rows\.length\) return <p className="muted">\{noSales\}ในช่วงนี้<\/p>/);
});

test("reports keep the existing filters, tabs and data source", () => {
  assert.match(page, /ปี \(พ\.ศ\.\)/);
  assert.match(page, /ตัวชี้วัด/);
  for (const tab of ["รายเดือน", "รายปี", "เทียบฟาร์ม"]) assert.match(page, new RegExp(tab));
  assert.match(page, /client\.rpc\("sales_summary", \{ p_start: `\$\{year\}-01-01`, p_end: `\$\{year \+ 1\}-01-01` \}\)/);
  assert.doesNotMatch(page, /from\("sales"\)/);
});

test("revenue share source stays security-invoker, active-only and unjoined", () => {
  const summary = migration.match(/create or replace function public\.sales_summary[\s\S]*?\$\$;/)[0];
  assert.match(summary, /security invoker/);
  assert.match(summary, /s\.deleted_at is null/);
  assert.match(summary, /sum\(s\.owner_share\),sum\(s\.worker_share\) from public\.sales s where/);
  assert.doesNotMatch(summary, /\bjoin\b/i);
});

test("reports page keeps responsive table and chart containers", () => {
  const css = readFileSync("app/reports/reports.css", "utf8");
  assert.match(css, /\.report-table-wrap\{overflow-x:auto\}/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(page, /className="two-column"/);
});

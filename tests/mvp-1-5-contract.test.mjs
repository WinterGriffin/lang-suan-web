import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const login = readFileSync("app/login/page.tsx", "utf8");
const callback = readFileSync("app/auth/callback/route.ts", "utf8");
const providers = readFileSync("lib/auth/providers.ts", "utf8");
const dashboard = readFileSync("app/page.tsx", "utf8");
const charts = readFileSync("app/components/dashboard-charts.tsx", "utf8");
const analytics = readFileSync("lib/analytics.ts", "utf8");
const sales = readFileSync("lib/sales.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260923000000_mvp_1_5_dashboard_series.sql", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const supabaseConfig = readFileSync("supabase/config.toml", "utf8");
const appUrl = readFileSync("lib/auth/app-url.ts", "utf8");

test("LINE uses the Supabase custom provider and PKCE callback", () => {
  assert.match(providers, /LINE: "custom:line"/);
  assert.match(login, /auth\.signInWithOAuth/);
  assert.match(login, /provider: authProviders\.LINE/);
  assert.match(login, /redirectTo: lineAuthCallbackUrl\(\)/);
  assert.match(login, /return config\.app\.callbackUrl/);
  assert.match(callback, /auth\.exchangeCodeForSession\(code\)/);
  assert.match(callback, /rpc\("ensure_profile"/);
  assert.match(proxy, /"\/auth\/callback"/);
  assert.match(supabaseConfig, /"https:\/\/localhost\/auth\/callback"/);
  assert.match(appUrl, /config\.app\.baseUrl/);
  assert.match(appUrl, /config\.app\.baseUrl/);
  assert.match(callback, /appUrl\("\/"\)/);
  assert.doesNotMatch(callback, /request\.url/);
  assert.doesNotMatch(callback, /client_secret|access_token|refresh_token/);
});

test("MVP 1.5 dashboard preserves exact data contracts", () => {
  for (const label of ["ยอดขายรวม", "ส่วนเจ้าของ", "ส่วนลูกจ้าง", "เปรียบเทียบช่วงเวลา"]) assert.match(dashboard, new RegExp(label));
  assert.match(dashboard, /rpc\("sales_daily_summary"/);
  assert.match(dashboard, /dailyResult\.error\?\.code === "PGRST202"/);
  assert.match(dashboard, /dailyPointsFromSales\(dailySales \?\? \[\]\)/);
  assert.match(dashboard, /from\("sales"\)\.select\("sale_date,total_amount,owner_share,worker_share"\)/);
  assert.match(dashboard, /setIsEmpty\(nextCurrent\.count === 0n\)/);
  assert.match(dashboard, /ยังไม่มีรายการขายในช่วงนี้/);
  assert.match(dashboard, /SalesTrendChart/);
  assert.match(dashboard, /FarmComparisonChart/);
  assert.match(dashboard, /OwnerWorkerChart/);
  assert.match(charts, /totals\.owner \+ totals\.worker/);
  assert.match(analytics, /comparisonAmount/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /sum\(s\.owner_share\)/);
  assert.match(migration, /sum\(s\.worker_share\)/);
});

test("Thai Buddhist Era display remains centralized while dates stay ISO", () => {
  assert.match(sales, /LangSuan UI displays dates\/months\/years using Thai locale and Buddhist Era/);
  assert.match(sales, /timeZone: "Asia\/Bangkok"/);
  assert.match(sales, /new Intl\.DateTimeFormat\("th-TH"/);
});

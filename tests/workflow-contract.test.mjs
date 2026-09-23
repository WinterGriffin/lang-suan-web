import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const createSale = readFileSync("app/sales/new/page.tsx", "utf8");
const editSale = readFileSync("app/sales/[id]/edit/page.tsx", "utf8");
const saleDetail = readFileSync("app/sales/[id]/page.tsx", "utf8");
const salesList = readFileSync("app/sales/page.tsx", "utf8");
const calendar = readFileSync("app/components/thai-date-input.tsx", "utf8");
const createFarm = readFileSync("app/farms/new/page.tsx", "utf8");
const thaiMonth = readFileSync("app/components/thai-month-input.tsx", "utf8");
const dashboard = readFileSync("app/page.tsx", "utf8");
const salesListPage = readFileSync("app/sales/page.tsx", "utf8");
const loginPage = readFileSync("app/login/page.tsx", "utf8");
const registerPage = readFileSync("app/register/page.tsx", "utf8");
const confirmationRoute = readFileSync("app/auth/confirm/route.ts", "utf8");
const authConfig = readFileSync("supabase/config.toml", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const browserSupabaseClient = readFileSync("lib/supabase/client.ts", "utf8");
const serverSupabaseClient = readFileSync("lib/supabase/server.ts", "utf8");
const authAppUrl = readFileSync("lib/auth/app-url.ts", "utf8");

test("sale retry paths confirm server state before reporting success", () => {
  assert.match(createSale, /eq\("id", requestId\.current\)\.maybeSingle/);
  assert.match(createSale, /decimalToUnits\(String\(confirmed\.input_share\)/);
  assert.match(editSale, /confirmed\.version > sale\.version/);
  assert.match(editSale, /router\.replace\(`\/sales\/\$\{confirmed\.id\}\?saved=1`\)/);
});

test("viewer edit controls remain hidden in addition to RPC enforcement", () => {
  assert.match(saleDetail, /membership\?\.role === "ADMIN" \|\| membership\?\.role === "EDITOR"/);
  assert.match(saleDetail, /canEdit && <Link/);
  assert.match(editSale, /membership\?\.role !== "ADMIN" && membership\?\.role !== "EDITOR"/);
});

test("sales pagination and calendar keyboard contracts remain wired", () => {
  assert.match(salesList, /previousPage/);
  assert.match(salesList, /หน้า \{history\.length \+ 1\}/);
  for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"]) assert.match(calendar, new RegExp(key));
});

test("farm creation uses the authorized RPC and confirms uncertain responses", () => {
  assert.match(createFarm, /rpc\("create_farm"/);
  assert.match(createFarm, /p_id: farmId\.current/);
  assert.match(createFarm, /from\("farms"\).*eq\("id", farmId\.current\)\.maybeSingle/);
  assert.doesNotMatch(createFarm, /from\("farms"\)\.insert/);
});

test("dashboard and sales list use the shared Thai Buddhist month picker", () => {
  assert.match(dashboard, /<ThaiMonthInput value=\{month\} onChange=\{setMonth\}/);
  assert.match(salesListPage, /<ThaiMonthInput value=\{month\} onChange=\{setMonth\}/);
  assert.doesNotMatch(dashboard, /type="month"/);
  assert.doesNotMatch(salesListPage, /type="month"/);
  assert.match(thaiMonth, /selected\.year \+ 543/);
  assert.match(thaiMonth, /timeZone: "Asia\/Bangkok"/);
  for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"]) assert.match(thaiMonth, new RegExp(key));
});

test("registration requires email confirmation and login no longer asks for display name", () => {
  assert.match(registerPage, /auth\.signUp/);
  assert.match(registerPage, /const formElement = event\.currentTarget/);
  assert.match(registerPage, /formElement\.reset\(\)/);
  assert.doesNotMatch(registerPage, /event\.currentTarget\.reset\(\)/);
  assert.match(registerPage, /data: \{ display_name: displayName \}/);
  assert.match(registerPage, /data\.session/);
  assert.match(confirmationRoute, /auth\.verifyOtp/);
  assert.match(confirmationRoute, /if \(!error && data\.user\)/);
  assert.doesNotMatch(confirmationRoute, /data\.user\?\.email_confirmed_at/);
  assert.match(confirmationRoute, /appUrl\("\/login"\)/);
  assert.doesNotMatch(confirmationRoute, /request\.headers\.get\("host"\)/);
  assert.match(authAppUrl, /config\.app\.baseUrl/);
  assert.match(confirmationRoute, /rpc\("ensure_profile"/);
  assert.match(confirmationRoute, /auth\.signOut/);
  assert.match(loginPage, /email_not_confirmed/);
  assert.match(loginPage, /window\.location\.assign\("\/"\)/);
  assert.match(loginPage, /finally \{\s*setBusy\(false\)/);
  assert.doesNotMatch(loginPage, /router\.refresh\(\)/);
  assert.doesNotMatch(loginPage, /name="name"/);
  assert.match(authConfig, /enable_confirmations = true/);
  assert.match(proxy, /appConfig\.supabase\.serverUrl/);
  for (const source of [browserSupabaseClient, serverSupabaseClient, proxy]) {
    assert.match(source, /name: "sb-langsuan-auth-token"/);
  }
});

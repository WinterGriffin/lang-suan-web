import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const createSale = readFileSync("app/sales/new/page.tsx", "utf8");
const editSale = readFileSync("app/sales/[id]/edit/page.tsx", "utf8");
const saleDetail = readFileSync("app/sales/[id]/page.tsx", "utf8");
const salesList = readFileSync("app/sales/page.tsx", "utf8");
const calendar = readFileSync("app/components/thai-date-input.tsx", "utf8");

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

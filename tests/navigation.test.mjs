import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("navigation exposes all five required top-level sections", () => {
  const source = readFileSync("app/components/app-shell.tsx", "utf8");
  for (const label of ["ภาพรวม", "การขาย", "บันทึก", "ฟาร์ม", "รายงาน"]) assert.match(source, new RegExp(label));
});

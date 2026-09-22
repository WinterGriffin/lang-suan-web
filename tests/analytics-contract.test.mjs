import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const analytics = readFileSync("lib/analytics.ts", "utf8");

test("dashboard analytics retains weighted-average and zero-baseline contracts", () => {
  assert.match(analytics, /all\.total \* 1000n/);
  assert.match(analytics, /previous === 0n\) return current === 0n \? "ไม่เปลี่ยนแปลง" : "ไม่มีฐานเปรียบเทียบ"/);
  assert.match(analytics, /difference < 0n \? "-"/);
  assert.match(analytics, /monthRange/);
});

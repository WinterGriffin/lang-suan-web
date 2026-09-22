import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20260921000000_lang_suan_mvp_1_0.sql", "utf8");

test("migration retains the frozen ledger, authorization, and RPC contracts", () => {
  for (const contract of [
    "total_amount numeric(16,2) generated always",
    "owner_share numeric(16,2) generated always",
    "worker_share numeric(16,2) generated always",
    "produce_name_snapshot text not null",
    "share_input_type public.share_input not null",
    "create function public.ensure_profile",
    "create function public.create_farm",
    "create function public.update_farm",
    "create function public.set_farm_member",
    "create function public.save_sale",
    "create function public.sales_summary",
    "create trigger audit_immutable",
    "revoke all on public.profiles,public.farms,public.user_farm_roles,public.sales,public.audit_logs from public,anon,authenticated",
  ]) assert.match(migration, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("fixtures are explicitly isolated from production", () => {
  const seed = readFileSync("supabase/seed.sql", "utf8");
  const verification = readFileSync("supabase/tests/verification.sql", "utf8");
  const analytics = readFileSync("supabase/tests/analytics.sql", "utf8");
  assert.match(seed, /Never run this on production/);
  assert.match(verification, /Never run against production/);
  assert.match(verification, /rollback;/);
  assert.match(analytics, /Never run against production/);
  assert.match(analytics, /generate_series\(1,1001\)/);
  assert.match(analytics, /rollback;/);
});

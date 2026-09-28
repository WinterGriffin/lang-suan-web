import { spawnSync } from "node:child_process";
import { loadAdministrationSecrets } from "./load-admin-secrets.mjs";

const { parameters, secrets } = loadAdministrationSecrets("staging", ["SUPABASE_ACCESS_TOKEN"]);
const result = spawnSync("npx", ["supabase", "db", "query", "--linked", "--file", "supabase/diagnostics/staging-create-farm-rpc-transaction-test.sql", "--project-ref", parameters.SUPABASE_PROJECT_REF], {
  stdio: "inherit",
  env: { ...process.env, SUPABASE_ACCESS_TOKEN: secrets.SUPABASE_ACCESS_TOKEN },
  shell: process.platform === "win32",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

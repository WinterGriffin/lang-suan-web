import { spawnSync } from "node:child_process";
import { loadAdministrationSecrets } from "./load-admin-secrets.mjs";

// Intentionally staging-only. Database migrations are never inferred from a
// Web deployment and Production needs its separately approved release path.
const { parameters, secrets } = loadAdministrationSecrets("staging", ["SUPABASE_ACCESS_TOKEN"]);
const executable = "npx";
const environment = { ...process.env, SUPABASE_ACCESS_TOKEN: secrets.SUPABASE_ACCESS_TOKEN };

function run(args) {
  const result = spawnSync(executable, ["supabase", ...args], { stdio: "inherit", env: environment, shell: process.platform === "win32" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["migration", "list", "--project-ref", parameters.SUPABASE_PROJECT_REF]);
run(["db", "push", "--project-ref", parameters.SUPABASE_PROJECT_REF]);
run(["migration", "list", "--project-ref", parameters.SUPABASE_PROJECT_REF]);

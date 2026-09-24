import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildEnvironment, loadParameters } from "./load-parameters.mjs";
import { validate } from "./validate-environment.mjs";
const [environment, action] = process.argv.slice(2);
if (!["build", "deploy", "dev"].includes(action)) throw new Error("Choose build, deploy, or dev.");
const parameters = loadParameters(environment);
const env = buildEnvironment(parameters);
if (environment === "production" && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Production publishable key must be supplied explicitly; .env.local is not accepted.");
}
if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  // Only this public key is read from the ignored local file. All environment
  // identities and URLs still come from the selected parameter file.
  try {
    const match = readFileSync(".env.local", "utf8").match(/^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)$/m);
    if (match) env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = match[1].trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
validate(parameters, { forDeploy: true, secretEnv: env });
if (environment !== "local") {
  const health = await fetch(new URL("/auth/v1/health", parameters.SUPABASE_URL), {
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
    signal: AbortSignal.timeout(10000),
  });
  if (!health.ok || (health.headers.get("sb-project-ref") && health.headers.get("sb-project-ref") !== parameters.SUPABASE_PROJECT_REF)) {
    throw new Error(`Supabase publishable key does not match ${environment} project or Auth is unavailable (${health.status}).`);
  }
}
env.BUILD_VERSION = process.env.GITHUB_REF_NAME || "local";
env.BUILD_TIMESTAMP = new Date().toISOString();
mkdirSync("public",{recursive:true}); writeFileSync("public/deployment-manifest.json",JSON.stringify({application:parameters.APP_NAME,environment,version:env.BUILD_VERSION,gitCommit:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),buildTimestamp:env.BUILD_TIMESTAMP},null,2));
const cli = action === "deploy" ? resolve("node_modules/@vinext/cloudflare/dist/cli.js") : resolve("node_modules/vinext/dist/cli.js");
const args = action === "build" ? [cli, "build"] : action === "dev" ? [cli, "dev", "--port", "3000"] : [cli, "deploy", "--config", "dist/server/wrangler.json", "--name", parameters.CLOUDFLARE_WORKER_NAME];
const result = spawnSync(process.execPath, args, { stdio: "inherit", env });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

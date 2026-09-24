import { spawnSync, execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildEnvironment, loadParameters } from "./load-parameters.mjs";
import { validate } from "./validate-environment.mjs";
const [environment, action] = process.argv.slice(2);
if (!["build", "deploy", "dev"].includes(action)) throw new Error("Choose build, deploy, or dev.");
const parameters = loadParameters(environment);
const env = buildEnvironment(parameters);
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
env.BUILD_VERSION = process.env.GITHUB_REF_NAME || "local";
env.BUILD_TIMESTAMP = new Date().toISOString();
mkdirSync("public",{recursive:true}); writeFileSync("public/deployment-manifest.json",JSON.stringify({application:parameters.APP_NAME,environment,version:env.BUILD_VERSION,gitCommit:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),buildTimestamp:env.BUILD_TIMESTAMP},null,2));
const cli = action === "deploy" ? resolve("node_modules/@vinext/cloudflare/dist/cli.js") : resolve("node_modules/vinext/dist/cli.js");
const args = action === "build" ? [cli, "build"] : action === "dev" ? [cli, "dev", "--port", "3000"] : [cli, "deploy", "--config", "dist/server/wrangler.json", "--name", parameters.CLOUDFLARE_WORKER_NAME];
const result = spawnSync(process.execPath, args, { stdio: "inherit", env });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

import { loadParameters } from "./load-parameters.mjs";

const environment = process.argv[2];
if (!["staging", "production"].includes(environment)) throw new Error("Choose staging or production.");
const parameters = loadParameters(environment);
const origin = parameters.APP_BASE_URL;

async function request(path, redirect = "follow") {
  const response = await fetch(new URL(path, origin), { redirect, signal: AbortSignal.timeout(10000) });
  return response;
}

const health = await request("/api/health");
if (!health.ok) throw new Error(`Health endpoint returned ${health.status}.`);
const healthBody = await health.json();
if (healthBody.status !== "ok" || healthBody.environment !== environment) throw new Error("Health endpoint environment mismatch.");

const manifest = await request("/deployment-manifest.json");
if (!manifest.ok) throw new Error(`Deployment manifest returned ${manifest.status}.`);
const manifestBody = await manifest.json();
if (manifestBody.environment !== environment) throw new Error("Deployment manifest environment mismatch.");
if (process.env.GITHUB_SHA && manifestBody.gitCommit !== process.env.GITHUB_SHA) throw new Error("Deployed commit does not match CI commit.");

const login = await request("/login");
if (!login.ok) throw new Error(`Login page returned ${login.status}.`);

const callback = await request("/auth/callback", "manual");
const callbackLocation = callback.headers.get("location");
if (callback.status !== 307 || !callbackLocation?.startsWith(`${origin}/login?status=oauth-error`)) {
  throw new Error("Auth callback redirected outside the selected environment.");
}

console.log(`${environment} smoke passed: TLS, health, manifest, login, and callback origin.`);

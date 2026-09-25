import { loadParameters } from "./load-parameters.mjs";

const environment = process.argv[2];
if (!["staging", "production"].includes(environment)) throw new Error("Choose staging or production.");
const { APP_BASE_URL } = loadParameters(environment);
const origin = new URL(APP_BASE_URL);

const plain = new URL(APP_BASE_URL);
plain.protocol = "http:";
const redirect = await fetch(plain, { redirect: "manual", signal: AbortSignal.timeout(10000) });
const location = redirect.headers.get("location");
if (![301, 302, 307, 308].includes(redirect.status) || !location || new URL(location, plain).protocol !== "https:") {
  throw new Error(`${environment} HTTP is not redirected to HTTPS at the public edge.`);
}
if (new URL(location, plain).hostname !== origin.hostname) throw new Error("HTTP redirect changed hostname.");

for (const path of ["/login", "/api/health"]) {
  const response = await fetch(new URL(path, origin), { redirect: "manual", signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`${path} returned ${response.status}.`);
  for (const name of ["x-content-type-options", "referrer-policy", "permissions-policy", "content-security-policy"]) {
    if (!response.headers.get(name)) throw new Error(`${path} is missing ${name}.`);
  }
  if (response.headers.get("x-content-type-options") !== "nosniff") throw new Error("Invalid nosniff policy.");
  const body = await response.text();
  if (/http:\/\/(?:localhost|127\.0\.0\.1)|https?:\/\/staging\.langsuanapp\.com/.test(body) && environment === "production") {
    throw new Error("Production response leaks a non-production URL.");
  }
  if (environment === "staging" && /http:\/\/(?:localhost|127\.0\.0\.1)|https?:\/\/app\.langsuanapp\.com/.test(body)) {
    throw new Error("Staging response leaks a local or production URL.");
  }
}

console.log(`${environment} HTTPS redirect, trusted TLS, response, and security headers passed.`);

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadParameters } from "./load-parameters.mjs";
import { validate } from "./validate-environment.mjs";

export const administrationSecretNames = Object.freeze([
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_WORKERS_READ_TOKEN",
  "RESEND_API_KEY",
  "SUPABASE_ACCESS_TOKEN",
]);

const files = Object.freeze({
  staging: "config/.env.dns.local",
  production: "config/.env.dns.production.local",
});

export function administrationSecretFile(environment) {
  if (!Object.hasOwn(files, environment)) throw new Error("Administration target must be staging or production.");
  return files[environment];
}

export function parseAdministrationSecrets(contents, filename = "secret file") {
  const values = {};
  for (const [index, raw] of contents.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const at = line.indexOf("=");
    const key = at > 0 ? line.slice(0, at) : "";
    if (!administrationSecretNames.includes(key) || Object.hasOwn(values, key)) {
      throw new Error(`Invalid administration secret entry at ${filename}:${index + 1}.`);
    }
    values[key] = line.slice(at + 1);
  }
  return values;
}

export function assertAdministrationTarget(environment) {
  if (!Object.hasOwn(files, environment)) throw new Error("Administration target must be staging or production.");
  const parameters = loadParameters(environment);
  validate(parameters);
  return parameters;
}

export function loadAdministrationSecrets(environment, required, { source = "local", env = process.env } = {}) {
  const parameters = assertAdministrationTarget(environment);
  if (!Array.isArray(required) || required.some((name) => !administrationSecretNames.includes(name))) {
    throw new Error("Requested administration secret is not allowlisted.");
  }
  let values;
  if (source === "local") {
    const filename = resolve(administrationSecretFile(environment));
    if (!existsSync(filename)) throw new Error(`Missing ${administrationSecretFile(environment)}; no other secret file will be used.`);
    values = parseAdministrationSecrets(readFileSync(filename, "utf8"), administrationSecretFile(environment));
  } else if (source === "ci") {
    if (env.CI !== "true") throw new Error("The CI secret source is available only in GitHub Actions.");
    values = Object.fromEntries(administrationSecretNames.map((name) => [name, env[name] ?? ""]));
  } else {
    throw new Error("Administration secret source must be local or ci.");
  }
  for (const name of required) if (!values[name]) throw new Error(`${name} is missing for ${environment} in the explicit ${source} secret source.`);
  return { parameters, secrets: Object.fromEntries(required.map((name) => [name, values[name]])) };
}

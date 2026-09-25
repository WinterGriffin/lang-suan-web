import { readFileSync } from "node:fs";
import { resolve } from "node:path";
export const environments = new Set(["local", "staging", "production"]);
export const required = ["APP_ENV","APP_NAME","APP_BASE_URL","APP_AUTH_CALLBACK_URL","SUPABASE_URL","SUPABASE_PROJECT_REF","SUPABASE_AUTH_CALLBACK_URL","THAI_LOCALE","THAI_BUDDHIST_ERA","ENABLE_LINE_LOGIN","LINE_DEVELOPERS_PROVIDER_NAME","LINE_LOGIN_CHANNEL_NAME","ENABLE_GOOGLE_LOGIN","ENABLE_FACEBOOK_LOGIN","ENABLE_APPLE_LOGIN","LOG_LEVEL","ENABLE_DEBUG_TOOLS","CLOUDFLARE_ENV","CLOUDFLARE_WORKER_NAME","EMAIL_PROVIDER","EMAIL_FROM_NAME","EMAIL_FROM_ADDRESS","EMAIL_ENV"];
export function loadParameters(environment) {
  if (!environments.has(environment)) throw new Error("Choose local, staging, or production.");
  const values = {};
  for (const [index, raw] of readFileSync(resolve("config", `${environment}-parameter.conf`), "utf8").split(/\r?\n/).entries()) {
    const line = raw.trim(); if (!line || line.startsWith("#")) continue;
    const at = line.indexOf("="); if (at < 1) throw new Error(`Invalid parameter line ${index + 1}.`);
    const key = line.slice(0, at), value = line.slice(at + 1);
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || !value || values[key]) throw new Error(`Invalid parameter ${key}.`);
    values[key] = value;
  }
  for (const key of required) if (!values[key]) throw new Error(`Missing ${key}.`);
  if (values.APP_ENV !== environment || values.CLOUDFLARE_ENV !== environment) throw new Error("Parameter file environment mismatch.");
  return values;
}
export function buildEnvironment(p) { return { ...process.env, APP_ENV:p.APP_ENV, APP_URL:p.APP_BASE_URL, SUPABASE_URL_INTERNAL:p.SUPABASE_URL_INTERNAL??p.SUPABASE_URL, LOG_LEVEL:p.LOG_LEVEL, ENABLE_DEBUG_TOOLS:p.ENABLE_DEBUG_TOOLS, EMAIL_PROVIDER:p.EMAIL_PROVIDER, EMAIL_FROM_NAME:p.EMAIL_FROM_NAME, EMAIL_FROM_ADDRESS:p.EMAIL_FROM_ADDRESS, EMAIL_ENV:p.EMAIL_ENV, EMAIL_ALLOWED_RECIPIENTS:p.EMAIL_ALLOWED_RECIPIENTS??"", NEXT_PUBLIC_APP_ENV:p.APP_ENV, NEXT_PUBLIC_APP_BASE_URL:p.APP_BASE_URL, NEXT_PUBLIC_APP_AUTH_CALLBACK_URL:p.APP_AUTH_CALLBACK_URL, NEXT_PUBLIC_SUPABASE_URL:p.SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PROJECT_REF:p.SUPABASE_PROJECT_REF, NEXT_PUBLIC_THAI_LOCALE:p.THAI_LOCALE, NEXT_PUBLIC_THAI_BUDDHIST_ERA:p.THAI_BUDDHIST_ERA, NEXT_PUBLIC_ENABLE_LINE_LOGIN:p.ENABLE_LINE_LOGIN, NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN:p.ENABLE_GOOGLE_LOGIN, NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN:p.ENABLE_FACEBOOK_LOGIN, NEXT_PUBLIC_ENABLE_APPLE_LOGIN:p.ENABLE_APPLE_LOGIN }; }

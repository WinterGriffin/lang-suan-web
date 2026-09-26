import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadParameters } from "./load-parameters.mjs";
import { loadAdministrationSecrets } from "./load-admin-secrets.mjs";

export function verifyHostedAuth(environment, parameters, auth) {
  if (!["staging", "production"].includes(environment)) throw new Error("Choose staging or production.");
  const origin = parameters.APP_BASE_URL;
  if (auth.site_url !== origin) throw new Error(`${environment} Auth Site URL does not match the application origin.`);

  const redirects = typeof auth.uri_allow_list === "string"
    ? auth.uri_allow_list.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
  const required = ["/auth/callback", "/auth/confirm", "/auth/reset"].map((path) => new URL(path, origin).toString());
  for (const callback of required) {
    if (!redirects.includes(callback)) throw new Error(`${environment} Auth redirect allowlist is missing a required callback.`);
  }
  for (const redirect of redirects) {
    let url;
    try { url = new URL(redirect); } catch { throw new Error(`${environment} Auth redirect allowlist contains an invalid URL.`); }
    if (url.origin !== origin || url.protocol !== "https:") {
      throw new Error(`${environment} Auth redirect allowlist contains another environment or insecure origin.`);
    }
  }

  if (auth.external_email_enabled !== true || auth.mailer_autoconfirm !== false) {
    throw new Error(`${environment} email confirmation policy is not ready.`);
  }
  if (environment === "staging" && auth.hook_send_email_enabled !== true) {
    throw new Error("Staging Send Email Auth Hook is not enabled.");
  }
  if (environment === "production" && (auth.hook_send_email_enabled !== false
    || auth.smtp_host !== "smtp.resend.com"
    || String(auth.smtp_port) !== "465"
    || auth.smtp_user !== "resend"
    || auth.smtp_admin_email !== "no-reply@auth.langsuanapp.com"
    || !auth.smtp_pass)) {
    throw new Error("Production must use Resend SMTP without the Staging Auth Hook.");
  }
}

export async function verifyLineAuthorization(parameters, fetchImpl = fetch) {
  if (parameters.APP_ENV !== "production" || parameters.ENABLE_LINE_LOGIN !== "true") return;
  const authorize = new URL("/auth/v1/authorize", parameters.SUPABASE_URL);
  authorize.searchParams.set("provider", "custom:line");
  authorize.searchParams.set("redirect_to", parameters.APP_AUTH_CALLBACK_URL);
  const response = await fetchImpl(authorize, { redirect: "manual", signal: AbortSignal.timeout(10000) });
  const location = response.headers.get("location");
  let host = "";
  try { host = location ? new URL(location).hostname : ""; } catch { /* handled below */ }
  if (response.status !== 302 || host !== "access.line.me") {
    throw new Error("Production LINE Custom OAuth did not redirect to LINE authorization.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const environment = process.argv[2];
  if (!["staging", "production"].includes(environment)) throw new Error("Choose staging or production.");
  const ci = process.argv.includes("--ci");
  const { parameters, secrets } = loadAdministrationSecrets(environment, ["SUPABASE_ACCESS_TOKEN"], { source: ci ? "ci" : "local" });
  const response = await fetch(`https://api.supabase.com/v1/projects/${parameters.SUPABASE_PROJECT_REF}/config/auth`, {
    headers: { authorization: `Bearer ${secrets.SUPABASE_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Supabase Auth config read failed (${response.status}).`);
  verifyHostedAuth(environment, parameters, await response.json());
  await verifyLineAuthorization(parameters);
  console.log(`${environment} hosted Auth URLs and delivery policy passed.`);
}

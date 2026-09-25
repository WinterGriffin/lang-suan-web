import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadParameters } from "../scripts/load-parameters.mjs";
import { verifyHostedAuth } from "../scripts/verify-hosted-auth.mjs";

function remoteFor(environment) {
  const p = loadParameters(environment);
  return {
    site_url: p.APP_BASE_URL,
    uri_allow_list: ["/auth/callback", "/auth/confirm", "/auth/reset"]
      .map((path) => new URL(path, p.APP_BASE_URL)).join(","),
    external_email_enabled: true,
    mailer_autoconfirm: false,
    hook_send_email_enabled: environment === "staging",
    smtp_host: environment === "production" ? "smtp.resend.com" : "",
  };
}

for (const environment of ["staging", "production"]) {
  test(`${environment} hosted Auth preflight accepts only its own secure URLs`, () => {
    const p = loadParameters(environment);
    const valid = remoteFor(environment);
    assert.doesNotThrow(() => verifyHostedAuth(environment, p, valid));
    assert.throws(() => verifyHostedAuth(environment, p, { ...valid, site_url: "http://localhost:3000" }), /Site URL/);
    const otherOrigin = environment === "staging" ? "https://app.langsuanapp.com" : "https://staging.langsuanapp.com";
    assert.throws(() => verifyHostedAuth(environment, p, { ...valid, uri_allow_list: `${valid.uri_allow_list},${otherOrigin}/other` }), /another environment/);
  });
}

test("Production preflight requires Resend SMTP, not the Staging hook", () => {
  const p = loadParameters("production");
  const valid = remoteFor("production");
  assert.throws(() => verifyHostedAuth("production", p, { ...valid, smtp_host: "" }), /Resend SMTP/);
  assert.throws(() => verifyHostedAuth("production", p, { ...valid, hook_send_email_enabled: true }), /Resend SMTP/);
});

test("Production workflow audits hosted Auth before deployment", () => {
  const workflow = readFileSync(".github/workflows/deploy-production.yml", "utf8");
  assert.match(workflow, /npm run auth:audit:production/);
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
  assert.ok(workflow.indexOf("auth:audit:production") < workflow.indexOf("deploy:production"));
});

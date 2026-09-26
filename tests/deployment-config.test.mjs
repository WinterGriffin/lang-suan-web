import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildEnvironment, loadParameters } from "../scripts/load-parameters.mjs";
import { validate } from "../scripts/validate-environment.mjs";

for (const environment of ["local", "staging", "production"]) {
  test(`${environment} parameter identity is valid`, () => {
    const parameters = loadParameters(environment);
    assert.doesNotThrow(() => validate(parameters));
  });
}

test("staging cannot use production origin, Worker, or Supabase project", () => {
  const parameters = loadParameters("staging");
  assert.throws(() => validate({ ...parameters, APP_BASE_URL: "https://app.langsuanapp.com" }), /application origin/);
  assert.throws(() => validate({ ...parameters, CLOUDFLARE_WORKER_NAME: "lang-suan" }), /Worker name/);
  assert.throws(() => validate({ ...parameters, SUPABASE_PROJECT_REF: "carrbgyuqqnofczoavyg" }), /project ref/);
});

test("LINE Developers provider, channel, and Supabase callback stay isolated", () => {
  for (const environment of ["local", "staging", "production"]) {
    const p = loadParameters(environment);
    const expectedName = environment === "production" ? "LangSuanAppPrd" : "LangSuanAppDev";
    assert.equal(p.LINE_DEVELOPERS_PROVIDER_NAME, expectedName);
    assert.equal(p.LINE_LOGIN_CHANNEL_NAME, expectedName);
    assert.throws(() => validate({ ...p, LINE_DEVELOPERS_PROVIDER_NAME: "WrongChannel" }), /LINE Developers provider\/channel/);
    assert.throws(() => validate({ ...p, LINE_LOGIN_CHANNEL_NAME: "WrongChannel" }), /LINE Developers provider\/channel/);
    assert.throws(() => validate({ ...p, SUPABASE_AUTH_CALLBACK_URL: "https://wrong.supabase.co/auth/v1/callback" }), /Supabase OAuth callback/);
  }
});

test("HTTPS origins and callbacks are isolated by environment", () => {
  for (const environment of ["local", "staging", "production"]) {
    const p = loadParameters(environment);
    assert.equal(new URL(p.APP_BASE_URL).protocol, "https:");
    assert.equal(new URL(p.APP_AUTH_CALLBACK_URL).origin, p.APP_BASE_URL);
    assert.equal(buildEnvironment(p).NEXT_PUBLIC_APP_BASE_URL, p.APP_BASE_URL);
    assert.throws(() => validate({ ...p, APP_BASE_URL: "http://localhost:3000" }), /application origin/);
  }
  const local = loadParameters("local");
  assert.equal(buildEnvironment(local).NEXT_PUBLIC_SUPABASE_URL, "https://localhost");
  assert.throws(() => validate({ ...local, SUPABASE_URL: "http://127.0.0.1:54321" }), /local Supabase/);
  const production = loadParameters("production");
  assert.throws(() => validate({ ...production, APP_BASE_URL: "https://staging.langsuanapp.com" }), /application origin/);
});

test("auth cookies are Secure across browser, server, and Proxy", () => {
  for (const path of ["lib/supabase/client.ts", "lib/supabase/server.ts", "proxy.ts"]) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /secure: true, sameSite: "lax"/);
  }
});

test("local proxy owns the sole HTTP redirect and keeps app port private", () => {
  const caddy = readFileSync("docker/caddy/Caddyfile", "utf8");
  const compose = readFileSync("compose.yaml", "utf8");
  assert.match(caddy, /http:\/\/localhost\s*\{\s*redir https:\/\/localhost\{uri\} 308/);
  assert.match(caddy, /tls \/certs\/localhost\.pem \/certs\/localhost-key\.pem/);
  assert.match(caddy, /reverse_proxy host\.docker\.internal:54321/);
  assert.match(compose, /127\.0\.0\.1:443:443/);
  assert.doesNotMatch(compose, /127\.0\.0\.1:3000:3000/);
  assert.match(readFileSync(".gitignore", "utf8"), /\.local-certs\//);
  assert.match(readFileSync(".dockerignore", "utf8"), /\.local-certs\//);
});

test("Production deployment leaves Marketing root independent", () => {
  const workflow = readFileSync(".github/workflows/deploy-production.yml", "utf8");
  const domains = readFileSync("scripts/cloudflare-domains.mjs", "utf8");
  assert.doesNotMatch(workflow, /deploy:root|root apply|smoke-root/);
  assert.doesNotMatch(domains, /\["staging", "production", "root"\]/);
});

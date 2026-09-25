import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createEmailService, EmailError, validateEmailConfig } from "../lib/email/service.mjs";
import { loadParameters } from "../scripts/load-parameters.mjs";
import { validate } from "../scripts/validate-environment.mjs";

const base = { EMAIL_PROVIDER: "resend", EMAIL_FROM_NAME: "LangsuanApp", EMAIL_FROM_ADDRESS: "no-reply@auth.langsuanapp.com", RESEND_API_KEY: "test-only", EMAIL_ENV: "staging", EMAIL_ALLOWED_RECIPIENTS: "tester@example.com" };
const message = { to: "tester@example.com", type: "test", subject: "Test", text: "Hello", idempotencyKey: "test-1" };

test("missing API key fails safely", async () => {
  assert.throws(() => validateEmailConfig({ ...base, RESEND_API_KEY: "" }), (error) => error instanceof EmailError && error.category === "configuration");
  const service = createEmailService({ env: { ...base, RESEND_API_KEY: "" }, transport: () => { throw new Error("transport must not run"); }, logger: { info() {} } });
  await assert.rejects(service.sendEmail(message), /configuration/);
});

test("sender and deployment configuration are validated", () => {
  assert.throws(() => validateEmailConfig({ ...base, EMAIL_FROM_ADDRESS: "bad" }), /configuration/);
  const staging = loadParameters("staging");
  assert.doesNotThrow(() => validate(staging));
  assert.throws(() => validate({ ...staging, EMAIL_ALLOWED_RECIPIENTS: "" }), /recipient guard/);
  const production = loadParameters("production");
  assert.throws(() => validate({ ...production, EMAIL_FROM_ADDRESS: "bad" }), /email sender/);
  assert.throws(() => validate(production, { forDeploy: true, secretEnv: { CLOUDFLARE_API_TOKEN: "test", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test" } }), /RESEND_API_KEY/);
});

test("staging blocks unapproved recipients before calling Resend", async () => {
  let called = false;
  const service = createEmailService({ env: base, transport: () => { called = true; }, logger: { info() {} } });
  await assert.rejects(service.sendEmail({ ...message, to: "real-user@example.com" }), /recipient_blocked/);
  assert.equal(called, false);
});

test("email service sends through Resend with a stable idempotency key and metadata-only logs", async () => {
  const logs = [];
  let request;
  const service = createEmailService({ env: base, logger: { info: (line) => logs.push(line) }, transport: async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ id: "msg-1" }) };
  } });
  assert.deepEqual(await service.sendEmail(message), { messageId: "msg-1" });
  assert.equal(request.url, "https://api.resend.com/emails");
  assert.equal(request.options.headers["Idempotency-Key"], "test-1");
  assert.match(request.options.body, /no-reply@auth.langsuanapp.com/);
  assert.equal(logs.length, 1);
  assert.equal(JSON.parse(logs[0]).messageId, "msg-1");
  assert.doesNotMatch(logs[0], /test-only|tester@example.com|Hello/);
});

test("production has no staging recipient restriction", async () => {
  let called = false;
  const service = createEmailService({ env: { ...base, EMAIL_ENV: "production", EMAIL_ALLOWED_RECIPIENTS: "" }, logger: { info() {} }, transport: async () => {
    called = true;
    return { ok: true, json: async () => ({ id: "msg-2" }) };
  } });
  await service.sendEmail({ ...message, to: "user@example.com" });
  assert.equal(called, true);
});

test("rate limits retry a bounded number of times; permanent errors do not retry", async () => {
  let calls = 0;
  const service = createEmailService({ env: base, logger: { info() {} }, wait: async () => {}, transport: async () => {
    calls++;
    return calls < 3 ? { ok: false, status: 429 } : { ok: true, json: async () => ({ id: "msg-3" }) };
  } });
  await service.sendEmail(message);
  assert.equal(calls, 3);
  calls = 0;
  const permanent = createEmailService({ env: base, logger: { info() {} }, transport: async () => { calls++; return { ok: false, status: 422 }; } });
  await assert.rejects(permanent.sendEmail(message), /invalid_recipient/);
  assert.equal(calls, 1);
});

test("API key stays out of public config and client sources", () => {
  for (const path of ["config/local-parameter.conf", "config/staging-parameter.conf", "config/production-parameter.conf", "app/register/page.tsx", "app/login/page.tsx"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /RESEND_API_KEY/);
  }
});

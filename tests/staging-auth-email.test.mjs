import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { handleStagingAuthEmail, parseStagingAllowlist } from "../supabase/functions/staging-send-email/handler.mjs";

const env = {
  APP_ENV: "staging",
  SUPABASE_URL: "https://orhdmqeojhesaldsuild.supabase.co",
  STAGING_EMAIL_ALLOWLIST: "tester@example.com,second@example.com",
  RESEND_API_KEY: "test-only",
  SEND_EMAIL_HOOK_SECRET: "test-hook-secret",
};
const payload = {
  user: { id: "00000000-0000-4000-8000-000000000001", email: "tester@example.com" },
  email_data: {
    site_url: "https://staging.langsuanapp.com",
    redirect_to: "https://staging.langsuanapp.com/auth/confirm",
    email_action_type: "signup",
    token_hash: "a".repeat(64),
  },
};

function request() { return new Request("https://staging.langsuanapp.com/hooks/email", { method: "POST", body: JSON.stringify(payload) }); }
function harness(overrides = {}, nextPayload = payload) {
  let sent = 0;
  const messages = [];
  return {
    options: {
      env: { ...env, ...overrides },
      verify: async () => nextPayload,
      send: async (message, key) => { sent++; messages.push({ message, key }); return "msg-test"; },
      logger: { info() {}, error() {} },
    },
    get sent() { return sent; },
    messages,
  };
}

test("allowed staging recipient receives a confirmation email with staging-only link", async () => {
  const h = harness();
  const response = await handleStagingAuthEmail(request(), h.options);
  assert.equal(response.status, 200);
  assert.equal(h.sent, 1);
  assert.equal(h.messages[0].message.subject, "ยืนยันการลงทะเบียนใช้งาน LangSuan");
  for (const phrase of [
    "เรียน ท่านผู้ใช้งาน",
    "ขอบพระคุณที่ลงทะเบียนใช้งาน LangSuan",
    "ยืนยันการลงทะเบียน",
    "หากท่านไม่ได้เป็นผู้ดำเนินการลงทะเบียน",
    "LangSuan จะไม่ขอให้ท่านแจ้งรหัสผ่าน รหัส OTP",
    "ขอแสดงความนับถือ\nทีมงาน LangSuan",
    "อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลฉบับนี้",
  ]) assert.ok(h.messages[0].message.text.includes(phrase), phrase);
  assert.match(h.messages[0].message.html, /<strong>LangSuan<\/strong>/);
  assert.match(h.messages[0].message.html, />ยืนยันการลงทะเบียน<\/a>/);
  assert.match(h.messages[0].message.text, /https:\/\/staging\.langsuanapp\.com\/auth\/confirm/);
  assert.doesNotMatch(h.messages[0].message.text, /localhost|app\.langsuanapp\.com/);
});

test("staging Site URL may have a trailing slash without changing the link origin", async () => {
  const h = harness({}, { ...payload, email_data: { ...payload.email_data, site_url: "https://staging.langsuanapp.com/" } });
  assert.equal((await handleStagingAuthEmail(request(), h.options)).status, 200);
  assert.equal(h.sent, 1);
});

test("non-allowlisted recipient is blocked without contacting Resend", async () => {
  const h = harness({}, { ...payload, user: { ...payload.user, email: "real-user@example.com" } });
  assert.equal((await handleStagingAuthEmail(request(), h.options)).status, 403);
  assert.equal(h.sent, 0);
  const recovery = harness({}, { ...payload, user: { ...payload.user, email: "real-user@example.com" }, email_data: { ...payload.email_data, email_action_type: "recovery" } });
  assert.equal((await handleStagingAuthEmail(request(), recovery.options)).status, 403);
  assert.equal(recovery.sent, 0);
});

test("denial logs include only a category, never recipient or token", async () => {
  const logs = [];
  const h = harness({}, { ...payload, user: { ...payload.user, email: "blocked@example.com" } });
  h.options.logger = { warn: (line) => logs.push(line) };
  const response = await handleStagingAuthEmail(request(), h.options);
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("X-Email-Result"), "recipient_blocked");
  assert.match(logs.join(""), /recipient_blocked/);
  assert.doesNotMatch(logs.join(""), /blocked@example.com|aaaaaaaaaa|test-only/);
});

test("signed Site URL is diagnostic-only and never changes the staging link", async () => {
  const logs = [];
  const h = harness({}, { ...payload, email_data: { ...payload.email_data, site_url: "http://localhost:3000/private?token=secret-value" } });
  h.options.logger = { info: (line) => logs.push(line) };
  assert.equal((await handleStagingAuthEmail(request(), h.options)).status, 200);
  assert.equal(h.sent, 1);
  assert.equal(JSON.parse(logs[0]).siteUrlCategory, "localhost");
  assert.doesNotMatch(logs[0], /3000|private|secret-value|tester@example.com/);
  assert.doesNotMatch(h.messages[0].message.text, /localhost|secret-value/);
});

test("missing or malformed allowlist fails closed", async () => {
  for (const value of [undefined, "", "none", "tester@example.com,not an address", "*", "tester@example.com;"]) {
    assert.throws(() => parseStagingAllowlist(value), /allowlist_configuration/);
    const h = harness({ STAGING_EMAIL_ALLOWLIST: value });
    assert.equal((await handleStagingAuthEmail(request(), h.options)).status, 503);
    assert.equal(h.sent, 0);
  }
});

test("staging-only guard denies production context, missing secrets, and forged signatures", async () => {
  for (const change of [{ APP_ENV: "production" }, { SUPABASE_URL: "https://carrbgyuqqnofczoavyg.supabase.co" }, { RESEND_API_KEY: undefined }, { SEND_EMAIL_HOOK_SECRET: undefined }]) {
    const h = harness(change);
    assert.equal((await handleStagingAuthEmail(request(), h.options)).status, 503);
    assert.equal(h.sent, 0);
  }
  const h = harness();
  h.options.verify = async () => { throw new Error("invalid signature"); };
  assert.equal((await handleStagingAuthEmail(request(), h.options)).status, 401);
  assert.equal(h.sent, 0);
});

test("unsafe callback URLs and unsupported Auth actions are denied", async () => {
  for (const [data, category] of [
    [{ ...payload.email_data, redirect_to: "https://app.langsuanapp.com/auth/confirm" }, "auth_redirect_origin_mismatch"],
    [{ ...payload.email_data, redirect_to: "invalid URL" }, "auth_redirect_url_invalid"],
    [{ ...payload.email_data, email_action_type: "email_change" }, "unsupported_auth_email"],
  ]) {
    const h = harness({}, { ...payload, email_data: data });
    const response = await handleStagingAuthEmail(request(), h.options);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("X-Email-Result"), category);
    assert.equal(h.sent, 0);
  }
});

test("recovery email links to staging reset route and never logs token or recipient", async () => {
  const logs = [];
  const h = harness({}, { ...payload, email_data: { ...payload.email_data, email_action_type: "recovery", redirect_to: "https://staging.langsuanapp.com/reset-password" } });
  h.options.logger = { info: (line) => logs.push(line), error: (line) => logs.push(line) };
  assert.equal((await handleStagingAuthEmail(request(), h.options)).status, 200);
  assert.equal(h.messages[0].message.subject, "ตั้งรหัสผ่านใหม่ LangsuanApp");
  assert.match(h.messages[0].message.text, /\/auth\/reset\?/);
  assert.doesNotMatch(logs.join(""), /tester@example.com|aaaaaaaaaa|test-only/);
});

test("PKCE recovery and signup hashes keep their prefix in staging links", async () => {
  for (const action of ["recovery", "signup"]) {
    const tokenHash = `pkce_${"b".repeat(64)}`;
    const h = harness({}, { ...payload, email_data: { ...payload.email_data, email_action_type: action, token_hash: tokenHash } });
    assert.equal((await handleStagingAuthEmail(request(), h.options)).status, 200);
    assert.equal(h.sent, 1);
    const link = new URL(h.messages[0].message.text.split(": ")[1]);
    assert.equal(link.origin, "https://staging.langsuanapp.com");
    assert.equal(link.searchParams.get("token_hash"), tokenHash);
  }
});

test("malformed PKCE hashes fail closed without sending", async () => {
  for (const tokenHash of ["pkce_", "pkce_" + "g".repeat(64), "PKCE_" + "a".repeat(64), "pkce_" + "a".repeat(39), "pkce_" + "a".repeat(129)]) {
    const h = harness({}, { ...payload, email_data: { ...payload.email_data, token_hash: tokenHash } });
    const response = await handleStagingAuthEmail(request(), h.options);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("X-Email-Result"), "invalid_auth_token");
    assert.equal(h.sent, 0);
  }
});

test("staging hook and secret names are absent from production delivery and client code", () => {
  for (const path of ["config/production-parameter.conf", ".github/workflows/deploy-production.yml", "app/login/page.tsx", "app/register/page.tsx", "app/forgot-password/page.tsx", "app/reset-password/page.tsx"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /STAGING_EMAIL_ALLOWLIST|SEND_EMAIL_HOOK_SECRET|staging-send-email/);
  }
});

test("password recovery request and verification routes remain publicly reachable", () => {
  const proxy = readFileSync("proxy.ts", "utf8");
  assert.match(proxy, /"\/forgot-password"/);
  assert.match(proxy, /"\/auth\/reset"/);
  const reset = readFileSync("app/auth/reset/route.ts", "utf8");
  assert.match(reset, /verifyOtp\(\{ token_hash: tokenHash, type: "recovery" \}\)/);
  const forgot = readFileSync("app/forgot-password/page.tsx", "utf8");
  assert.match(forgot, /resetPasswordForEmail/);
  const resetPage = readFileSync("app/reset-password/page.tsx", "utf8");
  assert.match(resetPage, /updateError\.code === "same_password"/);
  assert.match(resetPage, /รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม/);
});

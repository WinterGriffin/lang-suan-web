import test from "node:test";
import assert from "node:assert/strict";
import { ownedName, planRecords } from "../scripts/resend-dns.mjs";

test("Resend DNS planner is scoped and repeatable", () => {
  assert.equal(ownedName("send"), "send.auth.langsuanapp.com");
  assert.equal(ownedName("send.auth"), "send.auth.langsuanapp.com");
  assert.equal(ownedName("resend._domainkey.auth"), "resend._domainkey.auth.langsuanapp.com");
  assert.equal(ownedName("resend._domainkey.auth.langsuanapp.com"), "resend._domainkey.auth.langsuanapp.com");
  assert.throws(() => ownedName("unrelated.langsuanapp.com"), /outside the owned sending domain/);
  const records = [{ type: "TXT", record: "SPF", name: "send", value: "v=spf1 include:example.invalid ~all" }];
  const first = planRecords(records, {});
  assert.equal(first[0].action, "create");
  const second = planRecords(records, { "send.auth.langsuanapp.com": [{ type: "TXT", content: first[0].content }] });
  assert.equal(second[0].action, "unchanged");
});

test("Resend DNS planner refuses SPF and CNAME conflicts", () => {
  const spf = [{ type: "TXT", record: "SPF", name: "send", value: "v=spf1 include:new.invalid ~all" }];
  assert.throws(() => planRecords(spf, { "send.auth.langsuanapp.com": [{ type: "TXT", content: "v=spf1 include:old.invalid ~all" }] }), /manual review/);
  const cname = [{ type: "CNAME", record: "DKIM", name: "resend._domainkey", value: "example.invalid" }];
  assert.throws(() => planRecords(cname, { "resend._domainkey.auth.langsuanapp.com": [{ type: "TXT", content: "existing" }] }), /Conflicting CNAME/);
});

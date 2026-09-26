import assert from "node:assert/strict";
import test from "node:test";
import {
  administrationSecretFile,
  administrationSecretNames,
  assertAdministrationTarget,
  loadAdministrationSecrets,
  parseAdministrationSecrets,
} from "../scripts/load-admin-secrets.mjs";

test("administration secret file mapping and blank production template format are stable", () => {
  assert.equal(administrationSecretFile("staging"), "config/.env.dns.local");
  assert.equal(administrationSecretFile("production"), "config/.env.dns.production.local");
  const production = parseAdministrationSecrets(administrationSecretNames.map((name) => `${name}=`).join("\n"));
  assert.deepEqual(Object.keys(production).sort(), [...administrationSecretNames].sort());
  for (const name of administrationSecretNames) assert.equal(production[name], "");
  assert.throws(() => administrationSecretFile("local"), /staging or production/);
});

test("administration secret parser rejects unknown and duplicate names", () => {
  assert.throws(() => parseAdministrationSecrets("UNRELATED=value\n"), /Invalid administration secret entry/);
  assert.throws(() => parseAdministrationSecrets("RESEND_API_KEY=one\nRESEND_API_KEY=two\n"), /Invalid administration secret entry/);
});

test("administration target is checked before secret use and has no implicit fallback", () => {
  assert.equal(assertAdministrationTarget("staging").SUPABASE_PROJECT_REF, "orhdmqeojhesaldsuild");
  assert.equal(assertAdministrationTarget("production").SUPABASE_PROJECT_REF, "carrbgyuqqnofczoavyg");
  assert.throws(() => loadAdministrationSecrets("production", ["CLOUDFLARE_API_TOKEN"], { source: "ci", env: { CI: "true" } }), /CLOUDFLARE_API_TOKEN is missing for production/);
  const supplied = loadAdministrationSecrets("production", ["CLOUDFLARE_API_TOKEN"], { source: "ci", env: { CI: "true", CLOUDFLARE_API_TOKEN: "test-only" } });
  assert.equal(supplied.secrets.CLOUDFLARE_API_TOKEN, "test-only");
});

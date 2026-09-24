import test from "node:test";
import assert from "node:assert/strict";
import { loadParameters } from "../scripts/load-parameters.mjs";
import { validate } from "../scripts/validate-environment.mjs";
import redirectWorker from "../workers/root-redirect.mjs";

for (const environment of ["local", "staging", "production"]) {
  test(`${environment} parameter identity is valid`, () => {
    const parameters = loadParameters(environment);
    assert.doesNotThrow(() => validate(parameters));
  });
}

test("staging cannot use production origin or Worker", () => {
  const parameters = loadParameters("staging");
  assert.throws(() => validate({ ...parameters, APP_BASE_URL: "https://app.langsuanapp.com" }), /application origin/);
  assert.throws(() => validate({ ...parameters, CLOUDFLARE_WORKER_NAME: "lang-suan" }), /Worker name/);
});

test("root redirect preserves path and query on the production origin", () => {
  const response = redirectWorker.fetch(new Request("https://langsuanapp.com/sales?month=2026-09"));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://app.langsuanapp.com/sales?month=2026-09");
});

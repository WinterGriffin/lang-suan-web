import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadParameters } from "../scripts/load-parameters.mjs";
import { PRODUCTION_REF, STAGING_REF, allowlist, assertStagingTarget, lintSql, redact, reportRows, resolveAllowlisted, sha256 } from "../scripts/qa-staging-sql.mjs";

const file = "qa/sql/reports-revenue-share.sql";
const sql = readFileSync(file, "utf8");
const runner = readFileSync("scripts/qa-staging-sql.mjs", "utf8");
const wrap = (body) => `begin;\nset transaction read only;\n${body}\nselect 'x' as check_id;\nrollback;\n`;

test("reviewed Reports QA SQL is allowlisted, pinned and passes the read-only lint", () => {
  assert.deepEqual(Object.keys(allowlist), [file]);
  assert.equal(sha256(sql), allowlist[file]);
  assert.equal(lintSql(sql), 12);
  assert.match(sql, /^begin;\r?\nset transaction read only;/m);
  assert.match(sql, /\r?\nrollback;\s*$/);
});

test("lint rejects persistent writes and privilege changes", () => {
  for (const body of [
    "insert into public.sales select * from public.sales;",
    "with x as (update public.sales set weight_kg = 1 returning 1) select 1;",
    "select 1 into qa_copy;",
    "select public.save_sale(null, null, null, null, null, null, null);",
    "select query_to_xml('delete from public.sales', true, true, '');",
    "select set_config('role', 'postgres', true);",
    "select set_config(current_setting('qa.key'), 'x', true);",
    "set role postgres;",
    "set transaction read write;",
    "commit;",
    "select * from public.sales for update;",
    "select * from public.sales for share;",
    "select email from auth.users;",
    "select display_name from profiles;",
    "select * from public.audit_logs;",
    "select 1 from auth.sessions;",
    "select name from public.farms;",
    "select 'a'; delete from public.sales; select 'b';",
    "select $$x$$;",
    "/* hidden */ select 1;",
    "select \"delete\" from public.sales;",
    "select E'\\x';",
  ]) assert.throws(() => lintSql(wrap(body)), /QA SQL refused/, body);
});

test("lint requires the read-only transaction frame and one report", () => {
  assert.throws(() => lintSql(sql.replace("set transaction read only;", "select 1;")), /set transaction read only/);
  assert.throws(() => lintSql(sql.replace(/rollback;\s*$/, "")), /rollback/);
  assert.throws(() => lintSql(sql.replace(/^begin;/m, "select 1;")), /begin/);
  assert.throws(() => lintSql("begin;\nset transaction read only;\nselect 1;\nrollback;\n"), /report/);
  assert.throws(() => lintSql(`${sql}\nselect 1`), /semicolon/);
});

test("only the allowlisted file with its exact reviewed content may run", () => {
  for (const argument of ["qa/sql/other.sql", "qa/sql/../../package.json", "../qa/sql/reports-revenue-share.sql", "C:/Temp/x.sql", "/etc/passwd", "scripts/qa-staging-sql.mjs", ""]) {
    assert.throws(() => resolveAllowlisted(argument), /QA SQL refused/, argument);
  }
  assert.equal(resolveAllowlisted(file).key, file);
  assert.equal(resolveAllowlisted("qa\\sql\\reports-revenue-share.sql").key, file);
  const root = mkdtempSync(join(tmpdir(), "qa-sql-"));
  mkdirSync(join(root, "qa", "sql"), { recursive: true });
  writeFileSync(join(root, file), sql.replace("count(*) as n", "count(*) as n2"));
  assert.throws(() => resolveAllowlisted(file, root), /reviewed pin/);
});

test("target validation accepts only the linked Staging project and rejects Production", () => {
  const staging = loadParameters("staging");
  assert.equal(assertStagingTarget(staging, STAGING_REF), STAGING_REF);
  assert.throws(() => assertStagingTarget(loadParameters("production"), PRODUCTION_REF));
  assert.throws(() => assertStagingTarget(staging, PRODUCTION_REF), /linked Supabase project/);
  assert.throws(() => assertStagingTarget(staging, ""), /linked Supabase project/);
  assert.throws(() => assertStagingTarget({ ...staging, SUPABASE_PROJECT_REF: PRODUCTION_REF }, STAGING_REF));
  assert.throws(() => assertStagingTarget({ ...staging, SUPABASE_URL: `https://${PRODUCTION_REF}.supabase.co` }, STAGING_REF));
  assert.throws(() => assertStagingTarget({ ...staging, APP_BASE_URL: "https://app.langsuanapp.com" }, STAGING_REF));
});

test("credentials and connection strings are redacted and never logged", () => {
  // Synthetic token built at runtime so no token-shaped literal is committed.
  const token = ["sbp", "x".repeat(40)].join("_");
  const output = redact(`error ${token} postgresql://u:p@db.example:5432/postgres eyJa.eyJb.sig custom-secret`, ["custom-secret"]);
  for (const leaked of [token, "u:p@", "eyJa.eyJb.sig", "custom-secret"]) assert.ok(!output.includes(leaked), leaked);
  assert.doesNotMatch(runner, /console\.\w+\([^)]*secrets\b/);
  assert.match(runner, /\["supabase", "db", "query", "--linked", "--project-ref", ref, "--file", key, "--output-format", "json"\]/);
  assert.ok(runner.indexOf("assertStagingTarget(parameters") < runner.indexOf("loadAdministrationSecrets(\"staging\""), "target verified before secret load");
  assert.ok(runner.indexOf("lintSql(text)") < runner.indexOf("loadAdministrationSecrets(\"staging\""), "SQL linted before secret load");
});

test("only sanitized report columns with known statuses are printed", () => {
  const rows = reportRows(JSON.stringify([{ check_id: "QA-01", identity: "user_a", status: "PASS", detail: "ok", farm_id: "leak" }, { check_id: "QA-02", status: "MAYBE" }]));
  assert.deepEqual(rows, [{ check_id: "QA-01", identity: "user_a", status: "PASS", detail: "ok" }]);
});

test("CLI fails closed before loading secrets on unsafe arguments", () => {
  for (const args of [[], ["qa/sql/../../package.json"], ["--db-url", "x"], [file, "extra"]]) {
    const result = spawnSync(process.execPath, ["scripts/qa-staging-sql.mjs", ...args], { encoding: "utf8" });
    assert.equal(result.status, 2, args.join(" "));
    assert.match(result.stderr, /QA SQL refused/);
    assert.doesNotMatch(result.stdout, /Target verified/);
  }
});

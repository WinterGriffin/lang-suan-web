import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { administrationSecretNames, loadAdministrationSecrets } from "./load-admin-secrets.mjs";
import { loadParameters } from "./load-parameters.mjs";
import { validate } from "./validate-environment.mjs";

// Read-only Staging QA runner. Only reviewed files whose exact content is
// pinned here may reach the privileged Supabase Management API; each one is
// also linted before any secret is loaded. Changing a QA SQL file requires
// updating its pin in a reviewed commit.
export const STAGING_REF = "orhdmqeojhesaldsuild";
export const PRODUCTION_REF = "carrbgyuqqnofczoavyg";
export const allowlist = Object.freeze({
  "qa/sql/reports-revenue-share.sql": "c58e34d490bb7b4aa7b609308b33fa8e15447bde197c7ad622a19008a77508c5",
});
const statuses = new Set(["PASS", "FAIL", "BLOCKED"]);
const deniedWords = /\b(insert|update|delete|merge|upsert|truncate|drop|alter|create|grant|revoke|copy|call|do|execute|prepare|deallocate|lock|vacuum|analyze|cluster|reindex|refresh|comment|security|into|commit|abort|savepoint|release|listen|notify|unlisten|discard|load|import|checkpoint|reassign|owned|session|authorization|nextval|setval|lastval|dblink\w*|query_to_xml\w*|cursor_to_xml\w*|lo_\w+|pg_read_\w+|pg_ls_\w+|pg_stat_file|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_advisory\w*|pg_sleep\w*|pg_notify|txid_current\w*|profiles|identities|users|audit_logs)\b/;
const lockingRead = /\bfor\s+(no\s+key\s+update|update|key\s+share|share)\b/;
const allowedFunctions = new Set(["set_config", "current_setting", "make_date", "extract", "date_trunc", "count", "sum", "coalesce", "nullif", "json_agg", "array_agg", "array_to_json", "json_array_elements_text", "json_build_object", "json_to_recordset", "json_array_length", "generate_series", "string_agg", "format", "to_char", "bool_and", "cardinality", "now", "any", "public.sales_summary"]);
const parenKeywords = new Set(["in", "from", "values", "as", "filter", "using", "and", "or", "not", "select", "then", "else", "when", "on", "where", "join", "lateral", "with", "by", "over"]);
const allowedQualified = new Set(["public.sales", "public.user_farm_roles", "public.sales_summary"]);
const schemas = /^(public|auth|private|storage|extensions|pg_catalog|information_schema|vault|graphql|graphql_public|realtime|supabase_functions|supabase_migrations|net|cron|pgsodium|pgsodium_masks|pgbouncer)\./;
const allowedSetting = /^(request\.jwt\.claims|qa\.[a-z_]+)$/;

const fail = (message) => { throw new Error(`QA SQL refused: ${message}`); };

// Split into statements outside string literals, strip line comments and
// reject syntax that could hide code from the lint (dollar quotes, escapes,
// block comments, quoted identifiers).
export function splitStatements(text) {
  if (/[\\$"]/.test(text) || /\bu&'/i.test(text)) fail("backslashes, dollar quotes, quoted identifiers and Unicode escape strings are not allowed");
  const statements = []; let code = ""; let current = []; let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (char === "'") {
      let end = index + 1; let value = "";
      for (;;) {
        if (end >= text.length) fail("unterminated string literal");
        if (text[end] === "'" && text[end + 1] === "'") { value += "'"; end += 2; continue; }
        if (text[end] === "'") break;
        value += text[end]; end += 1;
      }
      code += "''"; current.push(value); index = end + 1; continue;
    }
    if (char === "-" && text[index + 1] === "-") { while (index < text.length && text[index] !== "\n") index += 1; code += " "; continue; }
    if (char === "/" && text[index + 1] === "*") fail("block comments are not allowed");
    if (char === "$" || char === "\\" || char === "\"") fail(`character ${JSON.stringify(char)} is not allowed outside string literals`);
    if (char === ";") { statements.push({ code: code.replace(/\s+/g, " ").trim().toLowerCase(), literals: current }); code = ""; current = []; index += 1; continue; }
    code += char; index += 1;
  }
  if (code.trim()) fail("every statement must end with a semicolon");
  return statements;
}

export function lintSql(text) {
  const statements = splitStatements(text);
  if (statements.length < 4) fail("too few statements");
  if (statements[0].code !== "begin") fail("first statement must be begin");
  if (statements[1].code !== "set transaction read only") fail("second statement must be set transaction read only");
  if (statements.at(-1).code !== "rollback") fail("last statement must be rollback");
  let reports = 0;
  for (const [position, statement] of statements.slice(2, -1).entries()) {
    const { code, literals } = statement;
    if (code === "set local role authenticated" || code === "reset role") continue;
    if (!/^(select|with) /.test(code)) fail(`statement ${position + 3} must be select, with, set local role authenticated or reset role`);
    if (deniedWords.test(code)) fail(`statement ${position + 3} contains denied keyword ${code.match(deniedWords)[0]}`);
    if (lockingRead.test(code)) fail(`statement ${position + 3} takes row locks`);
    for (const match of code.matchAll(/\b([a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)?)\s*\(/g)) {
      const name = match[1];
      if (parenKeywords.has(name) || allowedFunctions.has(name)) continue;
      if (/\bas$/.test(code.slice(0, match.index).trimEnd())) continue;
      fail(`statement ${position + 3} calls function ${name}, which is not allowlisted`);
    }
    for (const [name] of code.matchAll(/\b[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*/g)) if (schemas.test(name) && !allowedQualified.has(name)) fail(`statement ${position + 3} references ${name}`);
    const configCalls = code.match(/\bset_config\s*\(/g)?.length ?? 0;
    const configKeys = [...code.matchAll(/\bset_config\s*\(\s*''/g)].length;
    if (configCalls !== configKeys) fail(`statement ${position + 3} uses set_config without a literal setting name`);
    if (configCalls) {
      const names = settingNames(statement);
      if (names.length !== configCalls || names.some((name) => !allowedSetting.test(name))) fail(`statement ${position + 3} sets a setting outside request.jwt.claims and qa.*`);
    }
    if (/\bcheck_id\b/.test(code)) reports += 1;
  }
  if (reports !== 1) fail("exactly one sanitized report statement is required");
  return statements.length;
}

// The literal that immediately follows each set_config( is its setting name.
function settingNames({ code, literals }) {
  const names = []; let literalIndex = 0;
  for (let index = 0; index < code.length; index += 1) {
    if (code.startsWith("''", index)) {
      const preceding = code.slice(0, index).trimEnd();
      if (/\bset_config\s*\($/.test(preceding)) names.push(literals[literalIndex]);
      literalIndex += 1; index += 1;
    }
  }
  return names;
}

export const sha256 = (text) => createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");

export function resolveAllowlisted(argument, root = process.cwd()) {
  if (typeof argument !== "string" || !argument) fail("pass exactly one allowlisted QA SQL file");
  const key = argument.replace(/\\/g, "/").replace(/^\.\//, "");
  if (!Object.hasOwn(allowlist, key)) fail("file is not allowlisted");
  const path = resolve(root, key);
  if (!existsSync(path) || lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile()) fail("allowlisted file is missing or not a regular file");
  const inside = relative(realpathSync(resolve(root, "qa", "sql")), realpathSync(path));
  if (inside.startsWith("..") || inside.includes(`..${sep}`) || resolve(inside) === inside) fail("file is outside qa/sql");
  const text = readFileSync(path, "utf8");
  if (sha256(text) !== allowlist[key]) fail("file content does not match its reviewed pin");
  return { key, path, text };
}

export function assertStagingTarget(parameters, linkedRef) {
  validate(parameters);
  if (parameters.APP_ENV !== "staging" || parameters.CLOUDFLARE_ENV !== "staging") fail("target is not staging");
  if (parameters.SUPABASE_PROJECT_REF !== STAGING_REF || parameters.SUPABASE_PROJECT_REF === PRODUCTION_REF) fail("Supabase project is not the Staging project");
  if (new URL(parameters.SUPABASE_URL).hostname !== `${STAGING_REF}.supabase.co`) fail("Supabase URL is not the Staging project");
  if (linkedRef !== STAGING_REF) fail("the linked Supabase project is not Staging; run supabase link for Staging first");
  return STAGING_REF;
}

export function redact(text, secrets = []) {
  let output = String(text ?? "");
  for (const secret of secrets) if (secret) output = output.split(secret).join("[REDACTED]");
  return output.replace(/\bsbp_[A-Za-z0-9]+/g, "[REDACTED]").replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED]").replace(/postgres(ql)?:\/\/\S+/gi, "[REDACTED]");
}

// Keep only report rows; drop every other column the CLI may return.
export function reportRows(output) {
  const rows = [];
  const visit = (value) => {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (value && typeof value === "object") {
      if (typeof value.check_id === "string" && statuses.has(value.status)) rows.push({ check_id: value.check_id, identity: String(value.identity), status: value.status, detail: String(value.detail) });
      else Object.values(value).forEach(visit);
    }
  };
  visit(JSON.parse(output));
  return rows;
}

function main(args) {
  if (args.length !== 1 || args[0].startsWith("-")) fail("usage: npm run qa:staging:sql -- qa/sql/<allowlisted file>.sql");
  const { key, text } = resolveAllowlisted(args[0]);
  lintSql(text);
  const parameters = loadParameters("staging");
  const linkedPath = resolve("supabase", ".temp", "project-ref");
  const linkedRef = existsSync(linkedPath) ? readFileSync(linkedPath, "utf8").trim() : "";
  const ref = assertStagingTarget(parameters, linkedRef);
  console.log(`Target verified: staging (${ref}). Running ${key} read-only.`);
  const { secrets } = loadAdministrationSecrets("staging", ["SUPABASE_ACCESS_TOKEN"]);
  const env = { ...process.env };
  for (const name of administrationSecretNames) delete env[name];
  delete env.SUPABASE_DB_URL;
  env.SUPABASE_ACCESS_TOKEN = secrets.SUPABASE_ACCESS_TOKEN;
  const result = spawnSync("npx", ["supabase", "db", "query", "--linked", "--project-ref", ref, "--file", key, "--output-format", "json"], { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  const hide = (value) => redact(value, [secrets.SUPABASE_ACCESS_TOKEN]);
  if (result.error) fail(hide(result.error.message));
  if (result.status !== 0) { console.error(hide(result.stderr).trim()); process.exitCode = 2; return; }
  let rows;
  try { rows = reportRows(result.stdout); } catch { rows = []; }
  if (!rows.length) { console.error("BLOCKED: the CLI returned no sanitized report rows; output withheld."); process.exitCode = 3; return; }
  console.table(rows.map((row) => ({ ...row, detail: hide(row.detail) })));
  process.exitCode = rows.some((row) => row.status === "FAIL") ? 1 : rows.some((row) => row.status === "BLOCKED") ? 3 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(redact(error.message)); process.exitCode = 2; }
}

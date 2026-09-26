# LangSuan MVP 1.5 release status

Status updated: 26 September 2026 (Asia/Bangkok)
Decision: **NO-GO**

This is an operational release record. It does not amend frozen product or
database requirements.

## Release identity

- Candidate commit: `816fb795f0cf206aec2dcdaecafe8682fdff5dba`
- Staging manifest: same commit, environment `staging`, built
  `2026-09-25T08:45:08.645Z`.
- Matching commit identifiers do not establish byte-for-byte artifact
  equivalence.

## Staging acceptance

**PASS — owner-reported manual acceptance.** The repository owner reported
manual authenticated Staging coverage for Farm creation, Sale entry,
OWNER/WORKER share calculations, reporting, and role isolation. The owner did
not provide a separate execution date or supporting recordings/logs, and those
artifacts were not independently available. This record must not be read as an
independent re-execution of those journeys.

The Staging migration history was rechecked on 25 September 2026. Both
`20260921000000_lang_suan_mvp_1_0.sql` and
`20260923000000_mvp_1_5_dashboard_series.sql` are applied. Read-only Staging
Auth, deployment, and HTTPS smoke checks pass.

A metadata-only schema check found all five required core tables, four required
RPCs, five RLS policies, and three generated Sale-share columns in Staging. The
same check found zero of each in Production. A Production migration dry-run
lists exactly the two migrations below in order.

## Production gates

| Gate | Status | Evidence / required action |
|---|---|---|
| GitHub production Environment protection | PASS | Required reviewer is repository owner `WinterGriffin`; custom branch policy permits only `main`. `prevent_self_review=false` because the owner is the sole reviewer; a different initiator can be assessed for self-review prevention later. |
| GitHub environment isolation | PARTIAL / FAIL | Read-only GitHub audit on 26 September confirmed distinct `staging` and `production` Environments, each restricted to `main`. Both now contain the three expected secret names (`CLOUDFLARE_API_TOKEN`, `RESEND_API_KEY`, `SUPABASE_ACCESS_TOKEN`) and their own public publishable-key variable. GitHub intentionally does not disclose values, so replacement provenance, environment separation of values, provider-side scope, and functional validation remain unproven. |
| GitHub public build variable | PASS | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` was read from the intended Production Supabase project and stored as an Environment variable without recording its value. |
| Credential containment and environment separation | PASS — owner-attested | The owner attests that exposed credentials were rotated. Production local administration is isolated in ignored `config/.env.dns.production.local`; Staging remains `config/.env.dns.local`; the workflow rejects cross-environment targets; GitHub secret names/bindings are present. Codex independently verified only safe endpoint access and names, not secret values or provider-side revocation, because GitHub does not reveal them. |
| Production database recovery point | WAIVED BY OWNER | Roles, schema, and data dumps were exported to the restricted local owner-approved directory and checksummed. A complete restore is **not** verified and these files are not a proven recovery point. The owner explicitly accepts this risk for the initial MVP 1.5 release only. Preserve the existing files/checksums; never overwrite, delete, or publish them. |
| Production migrations | PASS | On 26 September, `20260921000000_lang_suan_mvp_1_0.sql` and `20260923000000_mvp_1_5_dashboard_series.sql` were applied once, in that order, to `carrbgyuqqnofczoavyg`. Remote history matches local. A schema-only dump verified the five application tables, approved RPCs including `sales_daily_summary`, RLS, generated share columns, and all four audit triggers; each temporary schema dump was removed after inspection. |
| Production LINE Custom OAuth | BLOCKED | Provider preflight now passes: the `custom:line` authorize endpoint returned a `302` to `access.line.me`, and the Production hosted-Auth policy passed. This proves provider initiation, not a completed user login. The authorized end-to-end LINE callback/session test remains a post-deployment smoke test after `app.langsuanapp.com` is attached. |
| Production Worker custom domain | BLOCKED | Read-only audit now passes: `app.langsuanapp.com` is absent and safe to attach to `lang-suan`; Production TLS settings and Resend DNS audit also pass. Do not attach it until the remaining pre-deployment gates, especially credential rotation evidence and migrations, pass. The apex and `www` remain untouched. |
| Production Auth email / SMTP baseline | PASS | Read-only configuration preflight passed Site URL, exact production redirect allowlist, confirmation policy, and Resend SMTP checks before failing at Custom OAuth. Delivery remains untested. |
| Production HTTPS, email, auth, authorization, and core journeys | BLOCKED | These are post-deployment controlled smoke tests. No Production deployment, test email, or test records are authorized until every preceding critical gate passes and Environment review completes. |

## Production migration plan

1. Preserve the existing roles, schema, and data logical dumps for
   `carrbgyuqqnofczoavyg` and their recorded checksums. The owner has waived
   complete restore verification for this initial release only; it is not a
   proven recovery point and must not be called PITR. Storage objects,
   Auth/provider settings, SMTP and LINE configuration, API keys, and other
   provider secrets are outside a database logical dump and require separate
   reconstruction.
2. The read-only remote-history preflight listed exactly the base migration
   followed by the MVP 1.5 dashboard-series migration.
3. Both migrations were applied once in that order on 26 September 2026 under
   the limited owner waiver.
4. Remote history and a schema-only dump verified the public schema, RLS,
   approved RPCs, generated sale-share columns, audit triggers, and
   `sales_daily_summary`.
5. Use a forward fix or documented recovery procedure if verification fails;
   never issue a destructive rollback that could discard Production data.

## Post-launch recovery follow-up

Before Production contains substantial user data or before the next schema
migration, establish a repeatable backup procedure and independently verify a
restore into an isolated Supabase-compatible environment. This is a
post-launch task, not a waiver of any other release gate.

## Credential rotation sequence

1. Establish protected destinations first: GitHub Environment secrets,
   Cloudflare Worker secrets where runtime mail uses them, and provider-managed
   Supabase/LINE configuration.
2. Create narrowly scoped replacement Cloudflare write and Worker-read tokens;
   update their intended GitHub Environment consumers; verify read/deploy
   capabilities; then revoke the exposed tokens.
3. Create a domain-scoped Resend sending key for each actual consumer. Update
   the relevant Supabase SMTP or function secret and GitHub Environment secret,
   verify a permitted low-volume path, then revoke the exposed key. Production
   SMTP rotation is separate from staging Hook rotation.
4. Create a scoped Supabase Management PAT with only the Production permissions
   required for Auth configuration and migrations; place it in the GitHub
   Environment secret, verify the read-only preflight, then revoke the exposed
   PAT.
5. Remove the local plaintext file only after all consumers use replacements.

The three secret GitHub Environment entries (`CLOUDFLARE_API_TOKEN`,
`RESEND_API_KEY`, and `SUPABASE_ACCESS_TOKEN`) are intentionally not claimed
as configured until that replacement-and-verification sequence is complete.

## Backup-operation safety note

The Supabase CLI dry-run used to inspect the logical-dump procedure unexpectedly
rendered a temporary `cli_login` database credential in local command output.
No dump file was created. Treat that temporary credential as exposed: confirm
it has expired or invalidate it as part of the Management-PAT rotation before
running the real dump. Future dump commands must not use `--dry-run` in a
logged terminal; they must write directly to the approved secure destination
and retain only redacted command status and checksum metadata in this record.

## Backup handling and restore-trial result

Roles, schema, and data dumps for the confirmed Production project were
exported on 26 September 2026 to the owner-approved restricted local backup
directory outside Git and automatic sync. Their names, byte sizes, SHA-256
checksums, UTC export time, and tool exit codes were recorded without copying
contents into this repository. Preserve those artifacts unchanged.

An isolated Docker PostgreSQL database named
`langsuan_restore_verify_20260925` was used for a restore attempt. Roles and
the application schema could be progressed only with test-only Supabase schema
bootstrapping; the unchanged data dump includes Auth data whose managed schema
is not reproducible in the ordinary Docker instance. A live-project restore
was assessed as unsafe and was not performed; no transaction committed. Thus a
complete restore is unproven and the recovery gate is **WAIVED BY OWNER**, not
PASS, for this initial release only.

The proposed `C:\\Users\\moonk\\Documents\\LangSuan-Backups\\production\\2026-09-25`
location was rejected before creation on 25 September 2026: its parent ACL
grants read/execute access to an additional sandbox-users group, OneDrive is
active on the workstation, and BitLocker status could not be verified without
administrator rights. No export was written there.

The proposed sibling path
`C:\\Temp\\Projects\\LangSuan-Backups\\production\\2026-09-25` was also
rejected before creation: it is outside OneDrive, but its parent grants
`Authenticated Users` modify access and C: encryption still cannot be verified.
No export was written there.

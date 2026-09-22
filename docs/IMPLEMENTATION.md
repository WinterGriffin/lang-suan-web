# Implementation handoff — Claude Code / Codex

## Start here

Read README.md → SPECIFICATION.md → DESIGN-SYSTEM.md → DATABASE.md → schema.sql. Open prototype.html, design-system.html and flows-and-erd.html locally. Review desktop/mobile screen references in screens.html. The frozen requirements FR-01–12 are binding; D-01–12 are explicit v1 implementation decisions. Screenshots of the legacy Google Form remain unavailable: rely on the recorded workflow mapping, and compare the originals when supplied.

This is a **design + database handoff**, not a deployed production system. The prototype has no actual authentication, server persistence or real user data. Its demo banner and state review toolbar must not enter production. Do not connect the prototype's simulated memory store directly to a live database.

## Suggested project structure

```text
apps/web/                  # responsive Thai web app
packages/domain/           # decimal math, date helpers, validation, metric definitions
packages/database/         # generated Supabase types and typed RPC client
supabase/migrations/       # reviewed schema.sql as first migration
supabase/tests/            # SQL and JWT/RLS integration tests
spec/                      # immutable copy of this handoff, versioned with changes
```

A TypeScript React web implementation with Supabase Auth and PostgreSQL fits the requested handoff. Preserve an existing repository's framework/package manager if supplied; avoid scaffolding a second stack. Native mobile is a later implementation using shared domain logic, not part of this prototype delivery. Choose dependency versions against official current documentation during implementation; this package does not freeze dependency versions or make free-tier pricing promises.

## Build sequence with acceptance gates

1. **Database and identity.** Apply schema.sql to a disposable Supabase project as migration owner. Provision Auth users through Auth APIs, initialize profiles, Farm and roles. Validate permission matrix with distinct JWTs. Keep private schema unexposed. Run verification.sql and additional concurrency tests below. Gate: unauthorized reads return no rows and forbidden writes never mutate data.
2. **Shared domain logic.** Implement decimal input parser, round-half-up calculation, Bangkok date utility and period boundaries. Gate: edge examples match SQL exactly. Decimal strings at API boundary; decimal library or scaled-integer math in UI.
3. **Sales vertical slice.** Auth → permitted Farm → Create → save_sale RPC → server-returned Detail → Edit with expected_version → Audit. Gate: all frozen Sale rules and no duplicate retry.
4. **Dashboard and Reports.** Call invoker sales_summary for full range, zero-fill month bins, aggregate all rows before deriving weighted average. Gate: 4 metrics, previous-month/year comparison, no bias from pagination; explicit incomplete-period label.
5. **Farm List/Detail.** Per-role read/edit controls, update_farm concurrency, inactive Create exclusion and historic snapshots. Gate: changing rule affects only new sales.
6. **Responsive/accessibility.** Compare 390px and 1440px references, validate 320/768/1024/1920, keyboard paths and screen reader labels. Gate: no page overflow; actual primary action remains reachable with mobile keyboard and safe-area inset.
7. **Deployment readiness.** Configure real Auth domain/redirects, HTTPS, environment secrets, migration pipeline, monitoring, backups and rollback. Gate: staging end-to-end test with real JWT; no service-role secret in client artifacts. Publication is separate from this design task.

## Acceptance test matrix

| ID | Scenario | Expected result |
|---|---|---|
| T01 | Open Create at 00:01 Bangkok while UTC is previous day | Correct Bangkok date, editable backwards |
| T02 | 2450 × 6.20, OWNER input 9000 | Total 15190; owner 9000; worker 6190 |
| T03 | Same total, WORKER input 6190 | Owner 9000; worker 6190 |
| T04 | 1.005 × 1.00 | Rounded total 1.01 |
| T05 | Share 0 / share equal total | Valid; other side equals total / zero |
| T06 | Share above total or negative | UI error; database rejects bypass |
| T07 | Weight=0, price=0, null, Infinity, NaN, excess precision | Reject with actionable field error |
| T08 | Change Farm in Create | Update produce and editable side; clear share |
| T09 | Change Farm mode/produce after sale exists | Existing Sale retains mode/produce snapshot |
| T10 | Edit historical sale | Total/shares rederive, version increments, Audit old/new retained |
| T11 | Two editors save same expected_version | One succeeds; other conflicts; no silent overwrite |
| T12 | Create timeout then identical retry with same UUID | One Sale; one create Audit; return same row |
| T13 | Same UUID but changed create body | Conflict; no duplicate or hidden overwrite |
| T14 | Viewer tries save_sale / direct SQL DML through API | Permission denied, unchanged data |
| T15 | User with no Farm A role reads Farm A Sale/Audit/summary | No Farm A information returned |
| T16 | Spoof created_by, share mode, generated amount or farm_id on edit | No accepted writable field / forbidden immutable change |
| T17 | Client writes Audit, membership or tables directly | Denied; audit update/delete/truncate trigger blocks mutations |
| T18 | Remove/demote final ADMIN; concurrently remove two ADMINs | Never zero ADMINs; farm lock serializes change |
| T19 | Empty period / prior zero | Total/weight/count 0, average —; no infinity or false growth % |
| T20 | 1kg×100 + 9kg×10 | Average = 19.00, not 55.00 |
| T21 | September vs August, January vs December, leap-year February | Exact calendar boundaries; no UTC date drift |
| T22 | New sale on inactive Farm / historic Sale edit | New rejected; historic edit allowed by role |
| T23 | Revocation concurrent with Save | Serialized permission check; no write after effective revocation |
| T24 | 1,001+ matching rows | Aggregates include every row, not just first API page |
| T25 | Network loss during Save | Draft and UUID preserved; no success shown without confirmation |
| T26 | 320px device, keyboard and long Thai Farm names | No horizontal page overflow or hidden Save; labelled controls |
| T27 | Snapshot produce renamed, mixed Farm produce comparison | History uses snapshot; cross-produce average caveat visible |
| T28 | Audit insert failure | Business write rolls back in same transaction |
| T29 | Authenticated user creates a Farm | One active Farm is created; creator is its first ADMIN; Audit records Farm and membership creation |
| T30 | Register and email confirmation | Signup has no session before confirmation; unconfirmed password login fails; confirmation creates `profiles.display_name`; confirmed email/password login succeeds |

`verification.sql` is a rollback-only database harness for a disposable project. It does not replace real Auth/JWT and concurrency integration tests. It inserts fixture identities as migration owner to test RLS policies, then switches role and request claims. Never run fixture SQL on production.

## Sample integration behavior

- Fetch permitted Farms sorted by name; app default selects active current context or first active Farm. If none, display the specified empty state.
- On create, allocate `crypto.randomUUID()` once; preserve through network retries. Call save_sale with null expected_version and decimal strings. Trust returned computed fields.
- On edit, keep original id, farm_id and version. Share input label comes from the Sale snapshot, **not** today's Farm default. Conflict keeps the user's draft.
- Query Sales with keyset pagination; aggregate separately using sales_summary, recombining sums and deriving weighted average once.
- Permission UI is convenience only. Test direct REST/RPC calls as hostile inputs. Never use service role for per-user report reads.
- Audit is append-only from triggers; render safe text and diff old_data/new_data. If profile names are inaccessible, show safe shortened actor IDs rather than weakening profiles RLS.

## Ready-to-use implementation prompt

> Implement หลังสวน (Lang Suan) MVP 1.0 from the attached source-of-truth package. Read SPECIFICATION.md, DESIGN-SYSTEM.md, DATABASE.md, schema.sql and IMPLEMENTATION.md before editing. Preserve FR-01–FR-12 and record any necessary amendment to D-01–D-12 explicitly. Build a Thai-first responsive web app with the screens demonstrated in prototype.html and screens.html. There must be no Customer, Product or sale_items model. Farms define produce_name and default_share_input. Create requires Farm, Bangkok-default sale_date, weight_kg, unit_price and one input share. Use exact decimal arithmetic; database-generated totals and shares are authoritative. Preserve historical produce/share snapshots on edit; enforce optimistic version checks and stable UUID create retries. Use Supabase Auth, per-Farm ADMIN/EDITOR/VIEWER roles, RLS read policies and checked RPC writes; Audit is server-generated. Implement weighted KPI comparisons and monthly/year/Farm Reports using complete database aggregates. Start with a disposable database and the Auth→Create→Detail→Edit vertical slice, then implement Dashboard/Reports/Farms. Run verification.sql plus the listed JWT, concurrency and accessibility tests. Remove prototype-only demo controls. Do not claim production readiness until database, auth and end-to-end tests pass. Report exact files changed, tests run and unresolved limitations. Do not deploy without the deployment step being authorized.

## Change control

A change to a frozen rule requires explicit product direction. Record date, reason, affected FR/D IDs, UI impact, database migration and new acceptance tests in CHANGELOG.md. Never treat an older assistant suggestion as overriding the latest user request. Screenshots are review references; the specification and SQL remain textually diffable sources of truth.

# Database ERD & dictionary v1.0

Target: Supabase PostgreSQL 15+; schema is a **fresh-project migration**, not an additive upgrade for an existing database. `schema.sql` is authoritative for DDL. `flows-and-erd.html` renders the diagram without network dependencies; `erd.mmd` is editable Mermaid source.

## Entity relationships

`auth.users 1—0..1 profiles`; `profiles N—M farms` through `user_farm_roles`; `farms 1—N sales`; `farms 1—N audit_logs`. The ledger deliberately has no Customer, Product, sale_items or fertilizer entities. Every Sale belongs to exactly one Farm. Each application-created Farm receives an ADMIN membership in the same transaction. Each business row references its creating/updating profile. Audit record_key is a polymorphic JSON key, not a foreign key to Sale; this preserves history independently of the entity type.

## Column definitions

Legend: NN = NOT NULL; PK = primary key; FK = foreign key. All foreign keys use ON DELETE RESTRICT so historical identity and records cannot disappear through cascades. Hard deletion is outside v1.0. UUIDs are internal IDs; shortened IDs may be displayed but are never unique business keys.

### auth.users — Supabase managed

Only `id uuid PK` is referenced. Passwords, tokens, provider data and email remain under Supabase Auth. Do not copy credentials into profiles or Audit. Application code must not alter Auth tables directly. Registration stores the validated display name in Auth user metadata; after email-token verification, the confirmation handler calls `ensure_profile` to provision the self-owned profile. Login may call the same idempotent RPC for a confirmed legacy account whose profile is still missing. User-editable metadata is never a permission source.

### public.profiles

| Field | Type / constraints | Default / owner | Meaning |
|---|---|---|---|
| id | uuid PK, FK auth.users.id, NN | auth.uid() via RPC | Application user identity |
| display_name | text NN; trimmed length 1–120 | Required for ensure_profile | Display name; not a permission source |
| created_at | timestamptz NN | now() | Actual profile creation |
| updated_at | timestamptz NN | now() | Reserved for future profile editing; immutable through v1 API |

Self read only in v1.0. Audit UI may display actor UUID/“ผู้ใช้ …” for another user; do not add a permissive profiles policy merely to resolve names. A later controlled shared-Farm name lookup can be introduced. `ensure_profile` is idempotent and does not overwrite an existing name.

### public.farms

| Field | Type / constraints | Default / source | Meaning |
|---|---|---|---|
| id | uuid PK NN | caller p_id in create_farm; DB default gen_random_uuid | Stable Farm identity |
| name | text NN; trimmed length 1–120 | user input | Farm display name; duplicate names allowed |
| produce_name | text NN; trimmed length 1–120 | user input | Produce described directly, no catalog |
| default_share_input | share_input enum NN | OWNER | OWNER or WORKER for future Sales |
| is_active | boolean NN | true | New Sale eligibility, not historical visibility |
| version | integer NN >0 | 1; server increments | Optimistic concurrency for setting edits |
| created_by | uuid FK profiles NN | auth.uid() | Original creator |
| updated_by | uuid FK profiles NN | auth.uid() | Last editor |
| created_at | timestamptz NN | now() | Creation instant |
| updated_at | timestamptz NN | now(); RPC refreshes | Last change instant |

No default_unit column: kg is the fixed v1 invariant. No currency column: THB is fixed. Add conversion rules with a migration before adding other units/currencies. No area/location/contact fields because they are not necessary to the frozen workflow.

### public.user_farm_roles

| Field | Type / constraints | Source | Meaning |
|---|---|---|---|
| farm_id | uuid PK part, FK farms NN | RPC argument | Permission scope |
| user_id | uuid PK part, FK profiles NN | RPC argument | Member user |
| role | farm_role enum NN | ADMIN / EDITOR / VIEWER | One effective role per Farm |
| created_by | uuid FK profiles NN | auth.uid() | Membership grant actor |
| updated_by | uuid FK profiles NN | auth.uid() | Last permission editor |
| created_at | timestamptz NN | now() | Membership creation |
| updated_at | timestamptz NN | now(); RPC refreshes | Last membership update |

Composite PK (farm_id,user_id) prevents duplicate roles. Removal is audited DELETE. An ADMIN can add an **already-provisioned** profile by UUID; email invitation discovery is not provided. Final ADMIN cannot be removed or downgraded. Never derive access from browser-submitted role, user-editable Auth metadata or display_name.

### public.sales

| Field | Type / constraints | Source | Meaning |
|---|---|---|---|
| id | uuid PK NN | Client generates once per create form | Identity and create retry key |
| farm_id | uuid FK farms NN | selected Farm | Immutable after create through API |
| sale_date | date NN | default Bangkok current date; editable input | Business date; reports use this |
| produce_name_snapshot | text NN; trimmed length 1–120 | Farm copied on insert | Historical produce label |
| share_input_type | share_input enum NN | Farm copied on insert | Historical editable side |
| weight_kg | numeric(10,3) NN; 0<x≤9,999,999.999 | input | Weight in kg |
| unit_price | numeric(8,2) NN; 0<x≤999,999.99 | input | THB/kg |
| input_share | numeric(16,2) NN; 0≤x≤total | sole editable share | Money for share_input_type |
| total_amount | numeric(16,2), generated stored | round(weight×price,2) | Authoritative sale amount |
| owner_share | numeric(16,2), generated stored | input or rounded total − input | Owner amount |
| worker_share | numeric(16,2), generated stored | input or rounded total − input | Worker amount |
| version | integer NN >0 | 1; server increments | Edit concurrency token |
| created_by | uuid FK profiles NN | auth.uid() | Creator, immutable |
| updated_by | uuid FK profiles NN | auth.uid() | Last editor |
| created_at | timestamptz NN | now() | Recording instant |
| updated_at | timestamptz NN | now(); RPC refreshes | Last correction instant |

Generated columns use the source expression independently because PostgreSQL generated expressions cannot reference another generated column. No caller can choose total/owner/worker values. Their effective non-nullness follows from all required source fields and exhaustive enum case expressions. Checks enforce positive rounded total, nonnegative shares and exact balance.

Snapshot is immutable under save_sale, including when Farm produce/mode changes. Farm name is current metadata; produce name is historical. Editing a Sale of an inactive Farm is allowed for authorized users. Future sale_date and excess numeric precision are rejected by RPC; direct client table writes are denied, so callers cannot skip validation. Privileged maintenance must use equivalent validation rather than assuming RLS restricts service-role/postgres.

### public.audit_logs

| Field | Type / constraints | Source | Meaning |
|---|---|---|---|
| id | bigint identity PK NN | database | Immutable event identity |
| farm_id | uuid FK farms NN | trigger | Permission scope for event |
| table_name | text NN; farms/sales/user_farm_roles | trigger | Changed business table |
| record_key | jsonb NN | {id} or {farm_id,user_id} | Original entity key |
| action | text NN; INSERT/UPDATE/DELETE | TG_OP | Mutation type |
| actor_id | uuid FK profiles, nullable | auth.uid() | Actor; null only for controlled system/migration action |
| old_data | jsonb nullable | OLD whole row | Before image; null on insert |
| new_data | jsonb nullable | NEW whole row | After image; null on delete |
| occurred_at | timestamptz NN | now() | Transaction timestamp |
| transaction_id | bigint NN | txid_current() | Correlates multiple writes in one transaction |

Triggers run AFTER write so generated values are included. Audit insert failure aborts the business transaction. APP roles have no insert/update/delete grants; a trigger blocks update/delete/truncate. Database owner/superuser can still alter triggers or schema; this is **application-immutable audit**, not external tamper-proof storage. Service-role key stays on trusted backend only. Retention: keep all v1 audit indefinitely until an approved archival policy exists; never silently purge. Backups and access logging are deployment work. Auth events are separate from this business Audit.

## Index plan

| Index | Query served |
|---|---|
| sales(farm_id,sale_date DESC,id) | Farm history and filtered list |
| sales(sale_date DESC,id) | Aggregate date ranges / permitted multi-Farm list |
| user_farm_roles(user_id,farm_id) | Membership lookup for each JWT user |
| audit_logs(farm_id,occurred_at DESC,id DESC) | Farm timeline with stable ordering |
| GIN audit_logs(record_key) | Entity history with JSON containment |

All PKs have implicit indexes. Use keyset pagination on Sales ordered sale_date DESC,id DESC (cursor includes both), page size 25. Audit ordered occurred_at DESC,id DESC. Aggregation uses bounded date ranges and never depends on the list page size. Optimize with EXPLAIN on realistic data only after measurements.

## Permission matrix (design decision D-07)

| Operation within Farm | ADMIN | EDITOR | VIEWER | Nonmember/anon |
|---|---|---|---|---|
| Read Farm/Sales/Reports | Yes | Yes | Yes | No |
| Read Sale audit | Yes | Yes | Yes | No |
| Create and edit Sale | Yes | Yes | No | No |
| Update Farm settings | Yes | No | No | No |
| Read Farm/member audit | Yes | No | No | No |
| Grant/revoke Farm members | Yes; preserve last ADMIN | No | No | No |
| Delete Sale/Farm; write Audit | No | No | No | No |
| Read own membership/profile | Yes | Yes | Yes | Authenticated self only |

Any authenticated user with a profile may create a new Farm and becomes its first ADMIN, but gains no existing Farm access. This self-service onboarding choice is explicit, not a hidden super-admin role. If deployment is invite-only, restrict sign-up in Auth and amend onboarding policy before launch.

RLS applies SELECT policies to all five public tables. All direct mutation grants are revoked from authenticated/anon. Mutations run only through narrowly scoped SECURITY DEFINER RPCs with fixed empty search_path and fully qualified names. The private membership helper queries membership without recursively invoking its own RLS. Keep `private` out of exposed API schemas. RLS queries do not depend on JWT custom metadata. Reporting function is SECURITY INVOKER and inherits sales RLS; do not convert it to an unrestricted definer function or a definer view.

## API/RPC contracts

Supabase RPC endpoint names match the SQL functions. All arguments use `p_` prefixes. Send numeric input as decimal strings. Results below are authoritative DB rows; validate runtime response shapes. An authenticated JWT is required; no service-role key in client code.

| RPC | Input | Result / guarantees |
|---|---|---|
| ensure_profile | p_display_name text | Own profile; idempotent, name unchanged if already exists |
| create_farm | p_id UUID, p_name, p_produce_name, p_share_input | Farm + initial ADMIN + Audit in one transaction; stable p_id, duplicate insert raises unique error (refetch by known ID) |
| update_farm | p_id, p_expected_version int, p_name, p_produce_name, p_share_input, p_is_active | ADMIN only; complete settings body; increments version |
| set_farm_member | p_farm_id, p_user_id, p_role enum or null | ADMIN only; null revokes; last ADMIN protected; no invite email |
| save_sale | p_id, p_farm_id, p_sale_date, p_weight_kg, p_unit_price, p_input_share, p_expected_version nullable | Null version=create; existing version=edit; generated fields and snapshots server-owned |
| sales_summary | p_start date, p_end date exclusive, p_farm_id nullable | Per-Farm/per-month rows: farm_id, month_start, total_amount, weight_kg, average_price, sale_count, owner_share, worker_share |

Create request example:

```json
{
  "p_id": "11111111-1111-4111-8111-111111111111",
  "p_farm_id": "22222222-2222-4222-8222-222222222222",
  "p_sale_date": "2026-09-19",
  "p_weight_kg": "2450.000",
  "p_unit_price": "6.20",
  "p_input_share": "9000.00",
  "p_expected_version": null
}
```

Those UUIDs are illustrative; use real permitted Farm IDs and cryptographic random Sale IDs. Do not send share_input_type, total_amount, owner_share, worker_share, created_by, updated_by or snapshots. New Sale mode is looked up under a Farm row lock; updates retain original snapshot. All writes/member revocations lock Farm first, so permission/config changes and writes within the Farm serialize safely. This simple MVP design can serialize simultaneous writes to a busy Farm; revisit lock granularity only with concurrency tests and measurements.

Retry create: same ID and identical input by same creator at version 1 returns existing row without second Audit. Changed body, edited existing row or stale edit returns conflict. Cross-Farm UUID collision returns forbidden. Updates require exact version and increment by 1. SQLSTATE 40001 identifies logical conflict here; do not blindly apply infrastructure serialization retries with a stale body.

| Error | SQLSTATE / behavior | UI mapping |
|---|---|---|
| AUTH_REQUIRED / PROFILE_REQUIRED | 42501 | Sign in / initialize profile |
| NOT_FOUND_OR_FORBIDDEN | 42501 | No accessible details; return to allowed list |
| VERSION_CONFLICT / DUPLICATE_REQUEST_CONFLICT | 40001 | Preserve draft, fetch latest, explicit reconciliation |
| INVALID_DATE_OR_ID / INVALID_NUMERIC_INPUT / FARM_INACTIVE / LAST_ADMIN_REQUIRED | 22023 | User correction / reload allowed Farm |
| sale_valid_share / sale_positive_total | 23514 | Correct share/weight/price |
| Duplicate ID on create_farm | 23505 | Refetch permitted Farm; confirm same original operation |
| Required value / foreign key | 23502 / 23503 | Validate input or selected membership target |

For metrics combine returned month/Farm sums, then calculate average from summed totals/weights; never average returned `average_price`. Zero-fill missing periods using an application calendar series. Read Sale history with `table_name='sales' AND record_key @> {"id": saleUUID}`; RLS still applies. No arbitrary SQL endpoint is required.

## Security and operations boundary

Database RLS is authorization, not complete application security. Production additionally needs Supabase Auth session handling, secure cookies where used, CSRF protection for cookie-authenticated custom mutations, input validation, bounded request sizes/date ranges, rate limits, dependency updates, output escaping and protected environment configuration. SQL strings are parameters through RPC, never concatenated. Do not expose private schema, service keys, raw database credentials or debug SQL errors in UI. Denied read may return no rows under RLS; application treats it like not-found safely.

## Primary technical references

Checked during preparation on 19 September 2026:

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): RLS, roles, policy helpers and invoker views.
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions): invoker/definer distinction and fixed search_path.
- [Private SECURITY DEFINER policy helpers](https://supabase.com/docs/guides/troubleshooting/do-i-need-to-expose-security-definer-functions-in-row-level-security-policies-iI0uOw): helper schema need not be exposed to Data API.
- [PostgreSQL generated columns](https://www.postgresql.org/docs/17/ddl-generated-columns.html): stored generated expressions and dependencies.
- [PostgreSQL numeric types](https://www.postgresql.org/docs/16/datatype-numeric.html): exact numeric storage and rounding semantics.

These links support technical implementation constraints. Business policy, roles, limits and workflow are project decisions recorded in SPECIFICATION.md.

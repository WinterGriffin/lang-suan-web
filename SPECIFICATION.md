# หลังสวน (Lang Suan) MVP 1.0 — Product specification

Version: 1.0 • Baseline date: 19 September 2026 • Locale: th-TH • Time zone: Asia/Bangkok • Currency: THB • Unit: kg

## 1. Authority and provenance

This package is the implementation baseline for the **requested sales MVP**. Latest user requirements take precedence over earlier assistant suggestions. The companion `schema.sql` defines executable storage and permissions; this document defines business intent; `DESIGN-SYSTEM.md` defines presentation; `prototype.html` demonstrates interaction, not production architecture. Resolve disagreements by correcting the artifacts together and recording a versioned decision, never by silently changing a frozen requirement.

Source conversation: วางแผนระบบขายสินค้าเกษตร, ID `6aadf462-18b4-83ec-a372-7ae9695e8400`. Retrieved its 9 available turns. Two Google Form screenshots were attached in that conversation, but the connector returned **no image content or downloadable attachments**. The mapping below relies on the recorded textual interpretation. No claim is made that the original images were visually inspected. Reconcile screenshots when supplied; do not delay implementation of explicitly frozen rules.

| Legacy form field (transcribed) | New behavior |
|---|---|
| ประเภทสวน: ปาล์มใหญ่ / ปาล์มเล็ก | Farm picker driven by permitted active farms |
| วันที่ขาย | Editable date, initially today in Bangkok |
| น้ำหนัก / ราคา | weight_kg / unit_price |
| ราคารวม | Read-only calculated total |
| ส่วนของเจ้าของ / ส่วนของลูกจ้าง | One editable share, one calculated remainder |

## 2. Frozen requirements

| ID | Requirement | UI / data enforcement |
|---|---|---|
| FR-01 | No Customer, Product, sale_items | No corresponding screens/tables/foreign keys |
| FR-02 | Farm describes its own produce | farms.produce_name; visible after Farm selection |
| FR-03 | Create Sale: Farm, sale_date, weight_kg, unit_price, one share | Five required controls, date prefilled |
| FR-04 | Date defaults to current Asia/Bangkok date; backdating allowed | Client default at form open; server date default; server validates date |
| FR-05 | total_amount = weight_kg × unit_price | Stored generated amount after currency rounding |
| FR-06 | Farm.default_share_input = OWNER or WORKER | New sale snapshots Farm rule; only corresponding share input shown |
| FR-07 | Other share = total − entered share; shares sum to total | Generated columns + database constraints |
| FR-08 | Four KPI comparisons from day one | Sales, weight, weighted price/kg, sale count |
| FR-09 | Monthly, yearly, Farm comparisons | Same aggregate source and filter rules |
| FR-10 | Thai first, mobile first, responsive, minimum entry | Desktop sidebar; Mobile bottom navigation and single-column form |
| FR-11 | Requested screen coverage | Dashboard, Sales List, Create/Edit, Sale Detail, Farm List/Detail, Reports |
| FR-12 | Supabase / PostgreSQL / RLS / Audit Log handoff | SQL migration, dictionary, permission matrix, test plan |

## 3. Implementation decisions added in v1.0

These decisions make the frozen scope implementable. They are **design decisions, not claims of earlier user approval**. They can be changed through a versioned amendment without changing FR-01–12.

| ID | Decision | Reason |
|---|---|---|
| D-01 | Money has 2 decimals; weight up to 3 decimals; price up to 2 decimals | Exact arithmetic, understandable entry |
| D-02 | Reject zero/negative weight and price; shares may be zero or whole total | Positive sale, flexible allocation |
| D-03 | Reject future sale dates | Historical sales ledger rather than forecast; backdating has no artificial cutoff |
| D-04 | Snapshot produce_name and share_input_type on creation | Historical transactions do not change when Farm settings change |
| D-05 | Farm is immutable when editing a Sale; date, weight, price and original input share remain editable | Avoid accidental movement across permission boundaries and changing snapshot meaning |
| D-06 | No Sale delete/void in v1.0 | Keep auditable ledger; mistaken entries are corrected by Edit. Cancellation is a future explicitly designed workflow |
| D-07 | ADMIN / EDITOR / VIEWER per Farm; no global super-admin in application | Simpler bounded permissions. Earlier role hierarchy was a suggestion, not a frozen requirement |
| D-08 | Full calendar month vs previous full month, calendar year vs prior full year | Matches earlier comparison examples. Incomplete current period is labelled clearly |
| D-09 | Month/year figures after edits are restated; Audit preserves prior values | Reports show current truth, Audit shows change history |
| D-10 | Inactive Farm excluded only from Create; historical rows and editing remain accessible | Preserve history and correction ability |
| D-11 | One persistent unit kg and one currency THB for MVP | No redundant unit/currency input or conversion |
| D-12 | Explicit UUID create retry key and integer versions | Prevent duplicate saves and stale overwrites |

No fertilizer, fields, inventory, costs/profit, adjustments, discounts, payments, Customer or Product catalog. Authentication is an implementation dependency; login/reset screens and user administration UI are outside the requested prototype screen set. Native iOS/Android and offline capture are future phases; responsive web is v1.

## 4. Numbers and dates: canonical rules

All business arithmetic is decimal, never binary float in production. RPC inputs are decimal strings. Reject excess input precision **before** storing into constrained numeric columns. PostgreSQL numeric rounds ties away from zero; with valid positive totals this is half-up.

```
T = round(weight_kg * unit_price, 2)
S = input_share                            // exactly 0–T inclusive
OWNER: owner_share=S; worker_share=T-S
WORKER: worker_share=S; owner_share=T-S
```

Round T once before splitting. Do not round each party separately or use percentage splits. No share field defaults to zero; an explicit 0 is valid. Changing weight/price recalculates T and the read-only remainder without changing entered S. If S>T, show a field-level error and prevent Save; never silently clamp.

| Input | Valid range | Precision |
|---|---|---|
| weight_kg | >0 to 9,999,999.999 | 3 decimals |
| unit_price | >0 to 999,999.99 | 2 decimals |
| input_share | 0 to rounded total | 2 decimals |
| total_amount | >0, within numeric(16,2) | 2 decimals |

Examples: 2,450 × 6.20 = 15,190.00; OWNER input 9,000.00 → WORKER 6,190.00. WORKER input 6,190.00 → OWNER 9,000.00. 1.005 kg × 1.00 = 1.01, not 1.00. A product rounding to 0.00 is rejected. Null, NaN, Infinity, negative, exponential notation and excess precision are invalid.

Date is stored as Gregorian `date` and API `YYYY-MM-DD`; timestamps use `timestamptz`. Human labels use Thai Buddhist year. The editable Sale date displays DD/MM/YYYY with Buddhist year (e.g. 19/09/2569). A custom calendar shows full Thai month names and Buddhist years, independent of device locale. Stored values remain Gregorian ISO. Default date is captured when Create opens using Asia/Bangkok, **not** UTC slicing. Reopen after midnight to refresh. An already open form keeps its selected day. `sale_date` drives all reports; `created_at` is only the record creation time. Future-date validation also runs on the server. There is no artificial earliest sale date.

## 5. Metrics, periods and comparison

Rows = permitted farms + selected Farm + `start <= sale_date < end`. Every aggregate reads the entire eligible dataset in the database, not a paginated list. Inactive farms stay in analytics.

- ยอดขาย: sum(total_amount), THB.
- น้ำหนักรวม: sum(weight_kg), kg.
- ราคาเฉลี่ย/kg: sum(total_amount) / sum(weight_kg), displayed 2 decimals. **Never mean(unit_price) or mean(monthly averages).**
- จำนวนครั้งที่ขาย: count(sales.id). One Sale = one sale event.
- Delta = (current − previous) / previous × 100, display 1 decimal, calculate from unrounded totals.
- previous=0 and current>0: “ไม่มีฐานเปรียบเทียบ”, never infinity or 100%.
- previous=0 and current=0: “ไม่เปลี่ยนแปลง”. Empty average is null/“—”, with “ไม่มีฐานเปรียบเทียบ”.
- Down/up is numeric direction, not an assertion about business quality. Use arrow + signed direction and color together.
- September 2026 compares September 1–October 1 to August 1–September 1. Year 2026 compares January 1 2026–January 1 2027 against 2025. Current period carries “ยอดสะสมถึงวันนี้ เทียบช่วงก่อนเต็มช่วง”. Do not describe incomplete periods as like-for-like growth.
- Monthly Reports: all 12 calendar months of selected year, alongside same months of prior year. Fill missing totals/weights/counts with 0, average with null. Future months of current year display “—” and “ยังไม่ถึงช่วง”; do not show −100% for a period that has not started.
- Year Reports: totals for selected year vs prior year with all four KPIs.
- Farm Reports: per-Farm totals for selected year vs prior year, same metric selector. Filter by produce in a later version if mixed produce becomes common; never treat differences in mix as pure price change.
- Shared filters persist while switching overview/list/reports. Date remains explicit. Create success opens Sale Detail; back to list selects saved month and Farm.

## 6. Screen contract

| Screen | Primary content / actions | Desktop | Mobile |
|---|---|---|---|
| Dashboard | Farm + month filters; 4 KPIs/deltas; Farm sales comparison; income split; latest 4 sales; Create | 4 KPI cards ≥1101px, two lower columns | 2×2 KPIs; stacked charts; persistent Create in bottom nav |
| Sales List | Farm + month; count and total; rows sorted date desc/id desc; Detail; Create | Table date/Farm/weight/price/total/action | Cards with date, Farm, weight×price, total, detail link |
| Create Sale | 5 controls; produce read-only; live total/remainder; validation; Save/Cancel | Form + sticky-capable summary column | Single column; large decimal keyboard inputs; reachable Save above bottom nav |
| Edit Sale | Prefill saved values; Farm read-only; original snapshot rule; same calculations | Same layout as Create | Same layout as Create |
| Sale Detail | Total, date, Farm, produce snapshot, kg, price, both shares; Edit; history | Main details and Audit side by side | Stacked; history below details |
| Farm List | Name, produce, active status, current-month total, share input side, Detail | 3 cards; 2 on tablet | One card per row |
| Farm Detail | Name, produce, input side, active status; Save for ADMIN; latest 5 sales | Settings and compact sale cards in two columns | Stacked; clear notice before rule changes |
| Reports | Monthly/year/Farm tabs; Farm/year/metric selectors; comparisons; table | Full year chart and data table | Reduced chart density with full 12-month table available |

All pages have Thai labels. Show farm produce directly under the picker, never a Product picker. The Prototype uses a simulated ADMIN so every requested editing path is reviewable. Production hides forbidden controls based on role **and** enforces permissions server-side.

## 7. Form and navigation behavior

Create defaults Farm to currently selected active Farm; otherwise first permitted active Farm. With no active permitted Farm, show a link back to Farms and no submittable form. Set date to Bangkok today. Do not prefill weight/price/share from history without a later requirement. When Farm changes, retain date/weight/price, clear share and update its label and produce. No direct share mode toggle on Sale.

Save: validate all fields → focus first invalid → compute preview → disable duplicate submission → RPC → render server-returned amounts/version → Sale Detail + “บันทึกการขายแล้ว”. Keep inputs on validation or network failure. Do not clear a form before confirmed success. Cancel/back with dirty inputs requires discard confirmation. The review prototype conservatively confirms whenever leaving Create/Edit; production uses an actual dirty check.

Editing: send expected_version read at open. On conflict, preserve draft; offer “โหลดข้อมูลล่าสุด” (with discard confirmation) or cancel. Do not automatically overwrite. If an update times out, refetch and compare version/values before deciding whether another submission is safe. Creating uses a stable request UUID; retry unchanged creation using the same UUID.

Farm settings: confirmation when share input side changes, explaining it affects only new sales. Inactivation keeps historical reports and edits, hides Farm from Create. Administration is per Farm. Farm creation/member setup occurs through secure onboarding/RPC; prototype scope covers List/Detail only.

## 8. Essential states and error copy

| State | Copy / recovery |
|---|---|
| Loading | Skeleton + “กำลังโหลดข้อมูล…”; no false zeros |
| Empty filtered result | “ยังไม่มีรายการขายในช่วงนี้”; change filter / Create |
| No accessible farms | “ยังไม่มีฟาร์มที่คุณมีสิทธิ์”; contact administrator/onboarding |
| Missing field | “กรุณากรอก…”; focus field; aria-describedby to inline error |
| Share exceeds total | “ส่วนแบ่งต้องไม่เกินยอดขายรวม”; preserve all values |
| Future date | “เลือกวันที่ขายไม่เกินวันนี้ตามเวลาไทย” |
| Network error on read | “โหลดข้อมูลไม่สำเร็จ”; Retry |
| Network error on save | “ยังยืนยันการบันทึกไม่ได้”; keep UUID + draft; check/retry |
| Forbidden / inaccessible ID | “คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้”; same 404/403-safe treatment without row details |
| Stale version | “รายการนี้มีการแก้ไขแล้ว”; reload latest / keep draft |
| Duplicate UUID changed body | “คำขอบันทึกนี้มีข้อมูลไม่ตรงกัน”; fetch result; do not create a second row automatically |
| Success | Toast; detail contains authoritative values and Audit history |

Review toolbar at the bottom of the prototype demonstrates loading, empty, read error and denied states. It is not production UI. The prototype's validations/save/edit use local memory; it does not simulate actual auth, network failures, concurrent sessions, or database enforcement.

## 9. Traceability and handoff gates

FR-01–03: inspect all screen controls and schema table names. FR-04: Bangkok midnight test. FR-05–07: arithmetic examples and SQL constraints. FR-08–09: independent aggregate fixtures and zero-baseline tests. FR-10–11: inspect every requested screen at 390 and 1440px, plus 320px overflow check. FR-12: run the SQL verification script and two-user/three-role isolation tests against a disposable Supabase project.

Before production: execute migration, RLS integration tests, JWT/auth smoke tests, version-conflict tests, accessibility checks, backup/restore rehearsal and deployment configuration review. Do not claim a working production app from the prototype alone.

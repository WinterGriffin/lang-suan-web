# Changelog

## 1.0.3 — 2026-09-22

- Dashboard and Sales List month filters now use the shared Thai month calendar instead of the device-native English month input.
- Month labels use full Thai month names and Buddhist years while query values remain Gregorian `YYYY-MM`; keyboard arrows, Escape, year navigation, and a Bangkok-current-month action are supported.

## 1.0.2 — 2026-09-22

- User explicitly approved expanding the MVP screen scope with authenticated Farm creation.
- Added FR-13 and D-13: `/farms/new` collects Farm name, `produce_name`, and `default_share_input`; `create_farm` creates the Farm and assigns its creator as the first ADMIN in one transaction.
- Member-management UI remains outside MVP scope. Existing per-Farm RLS/RPC authorization is unchanged.

## 1.0.1 — 2026-09-19

- Application renamed by user request to หลังสวน (Lang Suan); technical folder paths retained for link compatibility.
- Sale date input now explicitly DD/MM/YYYY (Buddhist year); custom calendar uses full Thai month names on Desktop and Mobile.
- Date can be typed or picked; Gregorian ISO storage, Bangkok default and historic dates preserved.

## 1.0 — 2026-09-19

- Created complete requested responsive screen set and 20 reference captures.
- Froze FR-01–12 from latest request and prior accepted workflow.
- Recorded D-01–12 as explicit implementation design decisions, not retroactive user approvals.
- Added design system, user flow, ERD, full dictionary, SQL migration, RLS/RPC/Audit contracts and implementation handoff.
- Verified prototype arithmetic, interactions and responsive layout; fixed mobile navigation direction, narrow-table overflow and KPI typography.
- Future months in current-year reports display unavailable period rather than misleading −100% comparison.
- Replaced external font import with local font fallbacks for offline portability.

### Open evidence / implementation gates

- Original two Google Form screenshots were unavailable through the conversation connector. Workflow uses transcript interpretation plus latest explicit requirements.
- SQL migration and verification harness await execution on disposable Supabase PostgreSQL; real JWT isolation, concurrent editing and auth flows are not validated by the local prototype.
- Production deployment, native apps, account administration UI and accessibility assistive-technology review are not delivered by this design package.

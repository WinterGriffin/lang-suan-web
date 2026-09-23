# Design System — หลังสวน (Lang Suan) v1.0

## Authentication form amendment 1.0.4

Registration uses the shared centered authentication card with labelled fields for ชื่อที่แสดง, อีเมล, and รหัสผ่าน, plus a clear email-confirmation notice and a link back to Login. Login contains only อีเมล and รหัสผ่าน. Success, validation, unconfirmed-email, expired-link, and busy states must be announced with `role="status"` or `role="alert"`; password fields use the appropriate browser autocomplete token.

## MVP 1.5 dashboard and LINE amendment

Login places a full-width green LINE action before a restrained Thai “or” divider;
email/password remains below it. Dashboard primary cards remain neutral surfaces
with small semantic accents: sales green, owner blue, worker amber, comparison
purple, and a negative comparison red. Mobile starts as a single flow with 2×2
KPI cards and stacked chart panels; desktop may use two chart columns. Charts need
direct value labels or an accessible text equivalent and must never create page
horizontal overflow.

## Direction

“สงบ ชัดเจน บันทึกง่าย” — a practical agricultural sales ledger with forest green, warm paper surfaces, generous touch targets and strongly aligned figures. No stock photography is needed; the transaction and its amounts are the primary content. Source implementation: `prototype.css`; interactive examples: `design-system.html`.

## Tokens

| Token | Value | Use |
|---|---|---|
| color.brand | #1D513B | Primary actions, selected navigation, first KPI |
| color.brand.hover | #143E2D | Hover, toast |
| color.accent | #D1E7A1 | Restrained brand accent |
| color.text | #1D3028 | Primary copy and values |
| color.muted | #607168 | Supporting labels on light backgrounds |
| color.canvas | #F5F6F2 | App background |
| color.surface | #FFFFFF | Cards, inputs, menus |
| color.border | #DCE3DB | Dividers and panel boundaries |
| color.input.border | #C6D1C7 | Input boundary |
| color.soft | #EAF2E8 | Selected soft states |
| color.error | #AA3131 | Error text on #FFF1EE |
| color.focus | #A37421 | 3px focus ring with 3px offset |
| color.chart.current | #1D513B | Current period bars |
| color.chart.previous | #C9D5B6 | Previous period bars; paired with text/position |

Typography: Noto Sans Thai, fallback Leelawadee UI, Tahoma and sans-serif. Deliver self-hosted WOFF2 files in production with font-display:swap and correct font licensing; the prototype uses available local fallback fonts without a network dependency. Body 14–16px; input 16px; display h1 32px desktop / 26px mobile; h2 21px; KPI 29px desktop / responsive 16–26px mobile; transaction total 38px; secondary text 12px. Numeric amounts use tabular figures. Weights 400, 500, 600, 700. Line-height body 1.8 for Thai, heading 1.45–1.5. Prototype annotation labels may be 10–11px; avoid that scale for essential production labels.

Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 42 / 60px. Card radius 18px desktop / 14px mobile; input radius 9px; button radius 10px. Panel padding 24px desktop / 20px mobile. Shadows limited to transient overlays and selected report tab.

## Responsive contract

| Width | Layout |
|---|---|
| 320–760px | Bottom navigation; 18px page gutter; one-column forms; KPI 2×2; Sales cards; Farm cards 1 column |
| 761–1100px | 190px sidebar; 24px gutter; KPI 2×2; overview chart panels stack; Farm cards 2 columns |
| ≥1101px | 230px sidebar; 42px gutter; KPI 4 columns; Form/Summary and Detail/Audit side by side; Farm cards 3 columns |
| ≥1500px | Content capped at 1500px; 60px gutter |

Bottom navigation has ภาพรวม / การขาย / บันทึก / ฟาร์ม / รายงาน. Active state uses fill plus text, not color alone. Respect safe-area bottom inset; content padding keeps final controls visible. Form Save remains reachable above bottom navigation. No horizontal scrolling of the page; dense Reports tables may scroll within a labelled region. All requested screens must work at 320px even if the canonical review snapshot is 390px.

## Component contracts

- **Button:** at least 46px high, one primary action per section. States default/hover/focus/disabled/busy. Busy Save shows “กำลังบันทึก…” and disables re-entry; it must not imply success early.
- **Farm picker:** searchable production combobox if list is long; native select sufficient for small MVP lists. Show produce helper. Only accessible active Farms for Create, accessible historical Farms for analytics.
- **Date:** labelled DD/MM/YYYY text input with explicit พ.ศ. helper; custom Thai calendar with full Thai month names, Buddhist year input, previous/next month, Today, and Close. Arrow keys move day focus; Escape closes. Impossible dates and future dates are rejected. Selected and current days are distinct. Gregorian ISO remains the storage value.
- **Month:** Dashboard and Sales List show a custom Thai month picker with full Thai month names and Buddhist year. Previous/next year, current Bangkok month, Arrow keys and Escape are available; application/query state remains Gregorian `YYYY-MM`.
- **Decimal input:** visible unit in label, inputmode=decimal, no spinner, no currency symbols inside editable value. Accept only documented precision. Do not allow silent rounding/coercion. Error adjacent to field and linked via aria-describedby.
- **Computed amount:** read-only text/output, not disabled editable-looking fields. Live total and opposite share use restrained aria-live updates (debounce for production screen readers).
- **KPI:** label → value + unit → delta → explicit period context above grid. Missing average uses em dash, not zero.
- **Sales table/card:** date, Farm, weight, price, total, labelled detail action. Right-align numeric columns on desktop; no clickable row with invisible semantics.
- **Income split:** two labelled amounts and proportional bars. Values remain meaningful without chart color.
- **Comparison bars:** current/previous mapping stable everywhere; shared zero baseline; axes/units or direct numeric labels. Table supplies exact values and accessible equivalent. Missing months cannot be mistaken for forecasts.
- **Audit timeline:** event, actor, timestamp, changed fields. No editing controls. Backend is authoritative. Show timestamp in Bangkok and use immutable audit ID for order tie-breaking.
- **Farm setting:** mode selector appears only here; changing it warns that existing sales keep the snapshot. Inactive state remains textually labelled.
- **Toast:** polite announcement, clear success wording, does not block next action. Errors stay persistent next to their inputs.
- **Empty/loading/error/denied:** intentional layouts, useful recovery. Do not display zero KPIs while loading.
- **Confirmation:** keyboard focus trapped in production dialog, initial safe focus, Escape cancels, restore focus to trigger. Prototype uses native confirm.

## Accessibility and localization

Use landmark navigation/main, one h1 per page, logical heading hierarchy, unique labels, keyboard-operable native controls, visible focus, and active navigation marked aria-current in production. Form validation focuses the first invalid field. Minimum touch target 44×44px and no hover-only action. Contrast target WCAG AA: normal text 4.5:1, large text 3:1; primary forest/white and body ink/white are intentional high-contrast pairings. Check muted text and chart legends against actual surfaces during implementation. Reduce motion when requested. Large number wrapping must not collide with units.

Use Thai display dates and Thai-language labels; Arabic numerals simplify entry. Amounts have thousands separators in presentation and two decimal currency places. Weight displays up to 3 decimals without meaningless trailing zeros. Editable inputs use plain decimal strings; the prototype explains that separators are not entered. Do not translate enum identifiers or database names.

## Production distinction

`prototype.html` contains a review status selector and a demo banner. Remove both in production. It is a behavioral design reference, not a bundle to connect directly to live financial data. Prototype authentication, membership setup, concurrency and network failure paths are represented in the handoff specification and SQL, not by fake security in the browser.

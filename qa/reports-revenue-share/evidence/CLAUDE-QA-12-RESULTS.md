# QA-12 and on-screen results — Reports revenue share

Collected on 23 October 2026 through Claude in Chrome by a separate local Claude Code session (`langsuan-bc`), at the request of session `langsuan-0c`. The owner had signed in to staging in the controlled Chrome profile and consented to the check.

The session used only its own tabs, `resize_window`, read-only JavaScript measurements, and clicks on the Reports tabs and year selector. It typed no credentials, read no cookies or storage, and wrote no data. No screenshots were committed. Staging manifest: `gitCommit 3f71b17506f5363c995082fa8afa6a9932a74b6d`.

**Summary: ≥1100 px PASS, 768 px PASS, 375 px NOT TESTED.** At 375 px, Chrome's minimum window width stopped at an innerWidth of 502. A substitute check at 502 px passed in the mobile layout.

## Identity and on-screen figures

The signed-in account is **user_b** in the Path A results (`CLAUDE-PATH-A-RESULTS.md`). The same values appeared at every width.

| Item | On screen | Path A SQL (user_b) | Result |
|---|---|---|---|
| ยอดขายรวม 2569 | 7,250.00 บาท | 7,250.00 | match |
| เจ้าของสวน / คนงาน 2569 | 7,000.00 / 250.00 | 7,000.00 / 250.00 | match |
| Stacked bar | renders: mostly owner segment, small worker segment | — | as specified |
| รายเดือน table | one month with sales: 7,250.00 / owner 7,000.00 / worker 250.00. Other past months show the share as "ไม่มีรายการขาย"; future months show "ยังไม่ถึงช่วง" | 1 farm-month row | match |
| เทียบฟาร์ม table | 2 farms: one with 7,250.00 / 7,000.00 / 250.00, one with 0.00 and shares "ไม่มีรายการขาย" | 2 permitted farms, 1 farm-year with sales | match |
| Year switch to 2568 (QA-04 on screen) | overview 0.00 บาท and "ไม่มีรายการขายในช่วงนี้"; table headers move to 2568/2567 | 2568: 0.00 | match |

The table headers include the new `เจ้าของสวน (2569)` and `คนงาน (2569)` columns in both tables.

## Responsive checks

| Width (innerWidth) | Layout | Table overflow | Page overflow | Result |
|---|---|---|---|---|
| 1536 (DPR 1.25) | sidebar; cards side by side | wrapper `overflow-x:auto`, no scrolling needed | scrollWidth 1521 = clientWidth 1521 | PASS |
| 768 | sidebar; cards side by side | wrapper clientWidth 513 < scrollWidth 560, scrolls inside the wrapper; the 520 px chart also scrolls inside it | 753 = 753 | PASS |
| 502 (substitute for 375) | mobile layout; selects and cards stacked in one column | wrapper 450 < 512, scrolls inside the wrapper | 487 = 487 | PASS |
| 375 | — | — | — | NOT TESTED |

- At 502 px, the fixed bottom nav (65 px) does not cover content: the last panel ends at y=634 and the nav starts at y=673.
- Cosmetic, not a defect: at 768 px "7,250.00 บาท" wraps onto two lines, and narrow value cells wrap ("0.00 / บาท"). Everything stays readable and nothing is clipped.
- An iframe used to try narrower widths was refused by staging's framing protection and removed immediately. It wrote no data.

## Remaining

- 375 px needs device emulation, either the DevTools device toolbar or a Playwright viewport, run by the owner or a session with emulation.

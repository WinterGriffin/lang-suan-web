# Prototype QA results

Executed: 2026-09-19T10:48:53.380Z

Environment: local headless Microsoft Edge via Playwright; file-based offline prototype.

- PASS: Dashboard loads
- PASS: Bangkok default date
- PASS: OWNER total exact
- PASS: OWNER remainder exact
- PASS: Share overflow rejected
- PASS: Create opens detail
- PASS: Edit Farm immutable
- PASS: Edit updates Audit timeline
- PASS: WORKER Farm selects WORKER input
- PASS: WORKER remainder exact
- PASS: Farm change clears share
- PASS: Rounding and share boundaries
- PASS: Weighted average and empty average
- PASS: Zero baseline comparison
- PASS: Invalid numeric values rejected
- PASS: Year comparison tab
- PASS: Farm comparison tab
- PASS: Mixed produce caveat
- PASS: Error recovery
- PASS: desktop: Dashboard has no page overflow
- PASS: desktop: Sales List has no page overflow
- PASS: desktop: Create Sale has no page overflow
- PASS: desktop: Sale Detail has no page overflow
- PASS: desktop: Edit Sale has no page overflow
- PASS: desktop: Farm List has no page overflow
- PASS: desktop: Farm Detail has no page overflow
- PASS: desktop: Reports Monthly has no page overflow
- PASS: desktop: Reports Yearly has no page overflow
- PASS: desktop: Reports by Farm has no page overflow
- PASS: mobile: Dashboard has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: mobile: Sales List has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: mobile: Create Sale has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: mobile: Sale Detail has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: mobile: Edit Sale has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: mobile: Farm List has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: mobile: Farm Detail has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: mobile: Reports Monthly has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: mobile: Reports Yearly has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: mobile: Reports by Farm has no page overflow
- PASS: Mobile navigation is a compact horizontal bar
- PASS: 320px: dashboard no page overflow
- PASS: 320px: sales no page overflow
- PASS: 320px: create no page overflow
- PASS: 320px: detail no page overflow
- PASS: 320px: edit no page overflow
- PASS: 320px: farms no page overflow
- PASS: 320px: farmDetail no page overflow
- PASS: 320px: reports-month no page overflow
- PASS: 320px: reports-year no page overflow
- PASS: 320px: reports-farm no page overflow
- PASS: 768px: dashboard no page overflow
- PASS: 768px: sales no page overflow
- PASS: 768px: create no page overflow
- PASS: 768px: detail no page overflow
- PASS: 768px: edit no page overflow
- PASS: 768px: farms no page overflow
- PASS: 768px: farmDetail no page overflow
- PASS: 768px: reports-month no page overflow
- PASS: 768px: reports-year no page overflow
- PASS: 768px: reports-farm no page overflow
- PASS: 1024px: dashboard no page overflow
- PASS: 1024px: sales no page overflow
- PASS: 1024px: create no page overflow
- PASS: 1024px: detail no page overflow
- PASS: 1024px: edit no page overflow
- PASS: 1024px: farms no page overflow
- PASS: 1024px: farmDetail no page overflow
- PASS: 1024px: reports-month no page overflow
- PASS: 1024px: reports-year no page overflow
- PASS: 1024px: reports-farm no page overflow
- PASS: 1920px: dashboard no page overflow
- PASS: 1920px: sales no page overflow
- PASS: 1920px: create no page overflow
- PASS: 1920px: detail no page overflow
- PASS: 1920px: edit no page overflow
- PASS: 1920px: farms no page overflow
- PASS: 1920px: farmDetail no page overflow
- PASS: 1920px: reports-month no page overflow
- PASS: 1920px: reports-year no page overflow
- PASS: 1920px: reports-farm no page overflow
- PASS: index.html mobile no overflow
- PASS: design-system.html mobile no overflow
- PASS: flows-and-erd.html mobile no overflow
- PASS: No browser JavaScript errors

## Limits
Browser checks validate the prototype only. schema.sql and verification.sql require execution against a disposable Supabase PostgreSQL project; no hosted database or JWT integration was available in this task. Native mobile, real network save failures, concurrency and assistive-technology review remain implementation acceptance gates.

## Date / application-name update

PASS 16 date/branding checks: Thai months, DD/MM/Buddhist year, ISO storage, leap date, invalid day, Save/Edit, keyboard, Today, disabled future dates and 320/390/1440px layout.

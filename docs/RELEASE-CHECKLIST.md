# Lang Suan MVP 1.0 — Release checklist

สถานะ: **ยังไม่พร้อม deploy** — เอกสารนี้เป็นผลตรวจ local/disposable environment ณ 22 กันยายน 2026

## ผ่านจริง

- Migration, RLS/RPC/Audit verification และ analytics fixture รันบน Supabase local แบบ rollback ผ่าน
- GoTrue JWT smoke test ครอบคลุม ADMIN/EDITOR/VIEWER/nonmember; direct table writes และ Audit mutation ถูกปฏิเสธ
- Create → Detail → Edit ใช้ `save_sale`, generated amount/snapshot/version และ Audit จริง
- Aggregate ครอบคลุม 1,001 rows, weighted average, empty period, leap day และ cross-year boundaries
- `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build` ผ่าน
- ตรวจ source ที่ tracked: ไม่มี service-role key หรือ `.env.local`; browser ใช้เฉพาะ public Supabase URL/publishable key ภายใต้ RLS
- ตรวจ browser local ที่ 320px และ 1440px: document/body scroll width ไม่เกิน viewport บน Dashboard และ Reports; reset viewport หลังตรวจแล้ว
- เพิ่ม global visible focus ring และ `prefers-reduced-motion` fallback
- ตรวจ browser local เพิ่มเติม: Dashboard ที่ 390/768/1024/1920px และ Farm/Sales/Create/Reports ที่ 390/1440px ไม่มี horizontal page overflow (วัด `documentElement.scrollWidth <= innerWidth`)
- เพิ่มยอดรวมเดือนปัจจุบันบน Farm card จาก `sales_summary` ที่อยู่ใต้ RLS และเพิ่มปฏิทินไทยที่มีปุ่มวันพร้อม label, Arrow keys และ Escape
- VIEWER ไม่เห็น Edit action และเปิด Edit URL ตรงแล้วไม่มีฟอร์ม; ADMIN/EDITOR ยังใช้งานผ่าน `save_sale` โดยสิทธิ์จริงบังคับซ้ำที่ RPC/RLS
- Create/Edit ตรวจผลหลัง network response ไม่ชัดเจนด้วยการ refetch และเทียบ UUID/ID, version และ decimal fields ก่อนแสดง success; draft ยังคงอยู่เมื่อยืนยันไม่ได้
- Sales List มี keyset หน้าแรก/ก่อนหน้า/ถัดไปและหมายเลขหน้า; aggregate ยังคงแยกจาก page rows
- `npm.cmd audit --omit=dev` และ `npm.cmd audit` รายงาน 0 vulnerabilities; ชุด contract testก่อน scope amendment ผ่าน 7/7
- Scope 1.0.2 เพิ่ม Create Farm ผ่าน `create_farm`; creator เป็น ADMIN คนแรกโดย transaction เดียว และ UI ไม่ใช้ direct table insert
- Create Farm browser flow ผ่านบน Supabase local รวม redirect, success state และเลือก Farm ใหม่; fixture ถูกลบหลังทดสอบ
- Create Farm ตรวจ responsive ที่ 390px ไม่มี page overflow; contract tests หลัง scope amendment ผ่าน 8/8 และ production build รวม `/farms/new` สำเร็จ
- Dashboard/Sales ใช้ปฏิทินเดือนไทยร่วมกัน: browser 390px แสดง 12 เดือน/ปี พ.ศ., เลือกเดือนได้, Arrow keys/Escape/focus recovery ผ่าน และไม่มี native English month input; contract tests ล่าสุดผ่าน 9/9

## ยังไม่ได้ทดสอบ

- Responsive visual screenshot และ keyboard flow แบบผู้ใช้จริงทุก breakpoint; การตรวจรอบนี้วัด page overflow แล้ว แต่ยังไม่ใช่ assistive-technology review
- Screen-reader review และ focus recovery ทุก error path
- True concurrent two-session revocation/save race และ browser network-loss simulation (โค้ด refetch/retry และ database row locking ตรวจแล้ว แต่ยังไม่ถือเป็นการจำลองเครือข่ายจริง)
- Reports UI สำหรับผู้ใช้ที่เข้าถึงหลาย Farm และ Sales List visual pagination มากกว่าหนึ่งหน้า

## ต้องแก้ก่อนใช้งานจริง

- ตั้งค่า production Auth domain, redirect URLs, HTTPS, rate limiting, monitoring, backup/restore และ migration pipeline
- ใช้ production Supabase project ที่แยกจาก local; ห้ามใช้ fixtures, local test users หรือ `.env.local`
- ทำ accessibility/responsive acceptance และ security/dependency review รอบสุดท้าย

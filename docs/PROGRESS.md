# Lang Suan — progress

## ขั้นที่ 1: โครงสร้างแอปและ navigation — 21 กันยายน 2026

### Frozen requirements ที่ยืนยันแล้ว

- ไม่มี Customer, Product หรือ `sale_items`; Farm ระบุ `produce_name` เอง.
- Sale ใช้ Farm, วันที่ขายแบบ Gregorian ISO (แสดง พ.ศ.), น้ำหนัก, ราคาต่อ kg และส่วนแบ่งที่กรอกได้เพียงด้านเดียว.
- จำนวนเงินใช้ decimal ที่แน่นอน: `total_amount` ปัดเป็น 2 ตำแหน่งก่อนแบ่ง; Farm snapshot ด้านที่กรอกและผลผลิต ณ วันที่สร้าง Sale.
- ใช้ภาษาไทยเป็นหลัก, Asia/Bangkok, THB, kg, mobile-first; desktop sidebar และ mobile bottom navigation.
- สิทธิ์ต่อ Farm คือ ADMIN/EDITOR/VIEWER และต้องบังคับใช้ที่ database/RLS; UI ไม่ใช่ authorization.
- รายงานใช้ aggregate ทั้งชุดข้อมูล, ราคาเฉลี่ยต้องเป็น `sum(total_amount) / sum(weight_kg)` และไม่แสดง infinity/ความเปลี่ยนแปลงที่ชวนเข้าใจผิดเมื่อฐานเป็นศูนย์.

### Design decisions ที่เอกสารกำหนด

- เงิน 2 ตำแหน่ง, น้ำหนักสูงสุด 3, ราคา 2; ปฏิเสธศูนย์/ลบ, วันที่อนาคต และ precision เกินกำหนด.
- การแก้ Sale ห้ามเปลี่ยน Farm; ใช้ integer version ป้องกัน stale write และ UUID เดิมสำหรับ retry create.
- Farm ที่ปิดใช้สร้าง Sale ใหม่ไม่ได้ แต่ประวัติ/การแก้ Sale เดิมยังเข้าถึงได้ตามสิทธิ์.
- ไม่มี delete/void Sale ใน MVP; Audit เป็น append-only และ server เป็น authoritative.

### เสร็จแล้ว

- ตรวจ Git status ก่อนแก้: เอกสารต้นทางใน `docs/` เป็น untracked ขณะสำเนาเดิมที่ root ถูกลบอยู่; ไม่ได้เขียนทับงานดังกล่าว.
- อ่าน `docs/START-HERE.md` ที่ผู้ใช้เพิ่มระหว่างทำงาน และเก็บเนื้อหาเดิมไว้โดยไม่แก้ไข.
- ตั้ง Next.js App Router + TypeScript ที่ root ด้วย navigation ภาษาไทย, desktop sidebar และ mobile bottom navigation ครบ ภาพรวม/การขาย/บันทึก/ฟาร์ม/รายงาน.
- วางโครงหน้าหลักและ empty-state placeholders โดยไม่ใส่ mock business data หรือเชื่อมฐานข้อมูล.
- เพิ่ม scripts: `dev`, `build`, `start`, `typecheck`, `test`; เพิ่ม `.env.example` และ ignore สำหรับ dependency/build/local env.

### ผลตรวจจริง

- ใช้ Node.js v24.21.0 และ npm v11.19.0; ติดตั้ง dependency สำเร็จ (`package-lock.json`).
- `npm run typecheck` ผ่าน, `npm test` ผ่าน 1/1 และ `npm run build` ผ่าน: static routes คือ `/`, `/sales`, `/sales/new`, `/farms`, `/reports`.
- เปิด `npm run dev` สำเร็จและตรวจ HTTP 200 ที่ `/`, `/sales`, `/farms` และ `/reports`; ปิด dev server หลังตรวจแล้ว.
- `git diff --check` ผ่าน (ไม่มี whitespace error).
- Next.js 16.3.5 และ Node.js ขั้นต่ำ 20.9 ถูกเลือกจากเอกสาร Next.js App Router ทางการที่ตรวจเมื่อ 21 กันยายน 2026.
- ยังไม่เชื่อม Supabase, ยังไม่มี migration, Auth, RLS integration หรือ deployment.

### งานคงเหลือ

- ขั้นที่ 2: ย้าย/ตรวจ migration, seed และทดสอบ database กับ disposable Supabase project.
- ขั้นที่ 3 เป็นต้นไป: Auth และข้อมูลจริงราย Farm, Farm/Sale workflows, Dashboard/Reports และ system acceptance checks.
- ขั้นที่ 1 ปิดงานแล้ว; ขั้นถัดไปคือฐานข้อมูลตามเอกสารและยังไม่เริ่มทำ.

## ขั้นที่ 2: ฐานข้อมูล — 21 กันยายน 2026

### เสร็จแล้ว

- ตรวจ `docs/DATABASE.md`, `docs/schema.sql` และ `docs/verification.sql` เทียบ contract แบบ static: generated amounts/shares, Farm snapshots, version conflict, UUID create retry, RLS, RPC authorization และ immutable Audit ถูกวางใน migration.
- เพิ่ม fresh-project migration ที่ [supabase/migrations/20260921000000_lang_suan_mvp_1_0.sql](../supabase/migrations/20260921000000_lang_suan_mvp_1_0.sql) โดยคง DDL/RPC/RLS contract เดียวกับ `docs/schema.sql`; เอกสารต้นทางไม่ถูกแก้.
- แยก development-only seed ที่ [supabase/seed.sql](../supabase/seed.sql) และ rollback-only fixture/RLS test ที่ [supabase/tests/verification.sql](../supabase/tests/verification.sql); ทั้งสองไฟล์มีคำเตือนห้ามใช้ production.
- เพิ่ม static contract tests สำหรับ migration/fixture isolation; `npm test` ผ่าน 3/3 และ `npm run typecheck` ผ่าน.

### ผลตรวจจริง / ยังไม่ได้ทดสอบ

- ไม่พบ Supabase CLI, Docker, `psql`, `supabase/` เดิม หรือ environment/configuration ของ Supabase local/disposable development project ใน workspace หรือ process environment.
- ด้วยเหตุนี้ **ยังไม่ได้ apply migration, ไม่ได้รัน seed/verification SQL, ไม่ได้ทดสอบ JWT/RLS ด้วยผู้ใช้จริง, concurrency, rounding ใน PostgreSQL หรือ Audit rollback จริง**.
- ยังไม่ได้สร้าง database types: ต้อง generate ด้วย Supabase CLI จาก schema ที่ apply และทดสอบผ่านแล้วเท่านั้น เพื่อไม่ให้เรียกว่า generated types ทั้งที่ยังไม่ได้ยืนยันฐานข้อมูล.

### ต้องมีเพื่อปิดขั้นที่ 2

- Supabase local ที่ Docker ใช้งานได้ หรือ disposable development project ที่ไม่ใช่ production พร้อมวิธีเชื่อมต่อแบบปลอดภัย (ไม่ต้องส่ง secret ในแชต).
- เมื่อพร้อม: apply migration ไปยัง environment ดังกล่าว, รัน `supabase/tests/verification.sql` ใน transaction ที่ rollback, ทำ JWT/concurrency tests เพิ่ม และ generate database types จาก project ที่ผ่านการทดสอบ.

### การรันจริงบน Supabase local — 22 กันยายน 2026

- Docker Desktop/WSL 2 พร้อมใช้งาน; ติดตั้ง Supabase CLI v2.117.0 เป็น project dev dependency และสร้าง `supabase/config.toml`.
- `supabase start` apply migration และ development-only `supabase/seed.sql` สำเร็จบน local Docker stack. จากนั้นใช้ `supabase db reset --no-seed` เพื่อทำให้ฐานว่างก่อนรัน fixture; ไม่มี production project ถูก link หรือแตะต้อง.
- รัน `supabase/tests/verification.sql` ผ่านจริงสองรอบด้วย `psql -v ON_ERROR_STOP=1` ใน local database; transaction ลงท้ายด้วย `ROLLBACK` จึงไม่มี fixture คงอยู่. ครอบคลุม ADMIN/EDITOR/VIEWER/nonmember, generated total/share, OWNER/WORKER rounding, share เกินยอด, snapshots, version conflict, unchanged UUID retry, RLS report reads, direct DML ที่ sales/farms/memberships/profiles, และ Audit update/delete denial.
- `supabase db lint --local` ไม่พบ schema errors; `npm test` ผ่าน 3/3, `npm run typecheck` และ `npm run build` ผ่าน.
- สร้าง [packages/database/src/database.types.ts](../packages/database/src/database.types.ts) จาก `supabase gen types typescript --local --schema public` หลัง migration/verification ผ่าน. Type ของ generated numeric เป็น `number` ตาม generator; contract ฝั่ง application ยังคงส่ง decimal strings เข้า RPC ตาม `DATABASE.md`.

### ขอบเขตที่ยังไม่ได้ทดสอบ

- RLS suite ใช้ role `authenticated` และ `request.jwt.claims` ใน database session ตาม verification harness; ยังไม่ได้ทดสอบ browser/Auth-issued JWT ผ่าน GoTrue end-to-end. งานนี้อยู่ในขั้นที่ 3.
- ยังไม่ได้ทำ true concurrent two-session test สำหรับ final-admin revocation หรือ save race; จะต้องรันเพิ่มก่อน production ตาม acceptance matrix.

## ขั้นที่ 3: Authentication และสิทธิ์รายฟาร์ม — เสร็จใน local MVP

### เสร็จแล้ว

- เพิ่ม Supabase browser/server clients, cookie-based session refresh ใน `proxy.ts`, หน้าเข้าสู่ระบบ และออกจากระบบ โดยเรียก `ensure_profile` หลัง sign-in สำเร็จ.
- Protected routes redirect ไป `/login` เมื่อไม่มี session; หน้าเข้าสู่ระบบจะแสดง error โดยไม่เผยรายละเอียดภายในของ Auth.
- การแสดงฟาร์มและ Sale ใช้ public client ที่อยู่ภายใต้ JWT/RLS เท่านั้น ไม่มี service-role key ใน browser bundle หรือ source.

### ผลตรวจจริง / ข้อจำกัด

- `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd test` ผ่านเมื่อ 22 กันยายน 2026.
- ตรวจ HTTP จริง: `/login` ตอบ 200 และ `/` ที่ไม่มี cookie ถูก proxy redirect (307) ไปยัง login.
- เปิด `/farms` ผ่าน browser โดยไม่มี session แล้วถูก redirect ไปหน้า login จริง; หน้าล็อกอินแสดง field ภาษาไทยและปุ่มเข้าสู่ระบบครบ.
- ทดสอบ GoTrue/JWT จริงบน Supabase local ด้วยบัญชี development ที่สร้างเฉพาะการทดสอบ: sign-up + `ensure_profile`, ADMIN สร้าง/แก้ Farm, EDITOR สร้าง Sale, VIEWER อ่าน Farm/Sale/Audit แต่ write ถูกปฏิเสธ และ nonmember ไม่พบ Farm ที่ไม่ได้เป็นสมาชิก.
- ทดสอบ browser จริง: login ไป Dashboard, ADMIN เห็น Farm editor, Create Sale `1.005 × 1.00 = 1.01`, Detail แสดง Audit, Edit เป็น `2.00` แล้ว version เพิ่มจาก 1 เป็น 2. VIEWER เห็น Farm แบบอ่านอย่างเดียวและปุ่มบันทึก Sale ถูก disable.
- รัน `supabase/tests/verification.sql` แบบ rollback บน local database อีกครั้งหลังการทดสอบ UI ผ่าน และ `supabase db lint --local` ไม่พบ schema error.

## ขั้นที่ 4: Farm List และ Farm Detail — เสร็จใน local MVP

### เสร็จแล้ว

- `/farms` อ่าน Farm และ membership ของผู้ใช้ผ่าน RLS, แสดงชื่อ ผลผลิต สถานะ ด้านที่กรอกส่วนแบ่ง และรายการขายล่าสุดห้ารายการ.
- ADMIN เท่านั้นเห็นฟอร์มแก้ไขและเรียก `update_farm`; EDITOR/VIEWER เห็นรายละเอียดแบบอ่านอย่างเดียว. Database RPC/RLS ยังเป็นจุดบังคับสิทธิ์จริง.
- การแก้ Farm ส่ง `expected_version`; เมื่อได้ `40001` จะเก็บ draft ไว้และเสนอให้โหลดข้อมูลล่าสุดโดยยืนยันก่อนทิ้ง draft.
- การเปลี่ยนด้านส่วนแบ่งมีคำเตือนชัดเจนว่ามีผลกับ Sale ใหม่เท่านั้น; Farm ที่ปิดใช้ยังคงแสดงรายละเอียดและประวัติได้.

### ยังไม่ได้ทดสอบ

- ยังต้องทดสอบ visual responsive ที่ 320, 390 และ 1440px ก่อนปิดขั้นที่ 4 อย่างเป็นทางการ.

## ขั้นที่ 5: Sale workflow — เสร็จใน local MVP

### เสร็จแล้ว

- เพิ่ม Create Sale, Sale Detail พร้อม Audit history และ Edit Sale ที่ใช้ `save_sale` RPC; Farm ของ Sale แก้ไม่ได้และ snapshot ยังคงเป็นของเดิม.
- Create ใช้วันที่วันนี้ใน Asia/Bangkok, แสดงวันที่ภาษาไทยประกอบ ISO, คำนวณ decimal ด้วย `BigInt`, ตรวจ precision/range/share ก่อนส่ง และใช้ UUID เดิมตลอด retry เดียวกัน.
- UI ซ่อนการบันทึกสำหรับ VIEWER, ป้องกันกดซ้ำ, เก็บ draft ใน browser เมื่อ server/network ยังยืนยันไม่ได้ และแสดงค่าที่ฐานข้อมูลตอบกลับผ่าน Detail.

### ยังไม่ได้ทดสอบ / ยังไม่ครบ

- ยังไม่ได้ทดสอบ Create/Edit ผ่าน browser กับ ADMIN/EDITOR/VIEWER และ network timeout จริง.
- เพิ่ม input DD/MM/YYYY (พ.ศ.) และ custom Thai calendar ที่มีชื่อเดือนเต็ม/พ.ศ., ปุ่มเดือนก่อน-ถัดไป, วันนี้ และปิด; วันอนาคตถูก disable. ตรวจผ่าน browser สำหรับเดือนกันยายน 2569 แล้ว.
- Keyboard arrow-key navigation ระหว่างวันใน calendar ยังไม่ได้ทำ; ปัจจุบันใช้ native text entry, Enter, ปุ่ม และ pointer/touch.

## ขั้นที่ 6: Sales List และ Dashboard — เสร็จใน local MVP

### เสร็จแล้ว

- `/sales` ใช้ Farm/เดือน filter, เรียง `sale_date DESC, id DESC`, ดึงครั้งละ 25+1 แบบ keyset และแสดง total/count จาก `sales_summary` แยกจากหน้า list.
- Dashboard ใช้ `sales_summary` สำหรับช่วงเดือนและเดือนก่อน, แสดงยอดขาย น้ำหนัก ราคาเฉลี่ยแบบ weighted และจำนวนครั้ง; prior=0 แสดง “ไม่มีฐานเปรียบเทียบ” หรือ “ไม่เปลี่ยนแปลง” แทน infinity.
- Dashboard แสดงส่วนแบ่งรายได้, ยอดแต่ละ Farm และ Sale ล่าสุดจากข้อมูล RLS จริง; เดือนปัจจุบันติดป้ายยอดสะสมถึงวันนี้เทียบเดือนก่อนเต็มเดือน.

### ผลตรวจจริง / ยังไม่ได้ทดสอบ

- `npm.cmd run typecheck`, `npm.cmd run build` และ `npm.cmd test` ผ่านหลังเพิ่มหน้าดังกล่าว.
- ใช้ JWT ของ VIEWER จริงเรียก `sales_summary` และ list ในเดือนเดียวกัน: summary มี 1 Farm, list เห็น 1 Sale และ count จาก aggregate ตรงกับแถวที่ RLS อนุญาต.
- เพิ่ม `supabase/tests/analytics.sql` (rollback-only) และรันจริงบน local: aggregate ครบ 1,001 แถว, keyset continuation หลัง 25 แถวเหลือ 976 แถว, empty period ไม่คืน row และ weighted average `1kg×100 + 9kg×10 = 19.00`.
- เพิ่ม analytics contract test สำหรับ weighted-average/zero-baseline/negative delta; `npm.cmd test` ผ่าน 4/4. ยังไม่ได้ตรวจ visual state ผ่าน browser ของข้อมูลมากกว่าหนึ่งหน้า จึงยังไม่ปิดขั้นที่ 6 อย่างเป็นทางการ.

## ขั้นที่ 7: Reports — เสร็จใน local MVP

### เสร็จแล้ว

- เพิ่ม Reports แบบรายเดือน รายปี และเทียบฟาร์ม โดยอ่าน `sales_summary` เดียวกันและเลือก metric ยอดขาย/น้ำหนัก/ราคาเฉลี่ย/kg/จำนวนครั้ง.
- ราคาเฉลี่ยใน Report คำนวณจากยอดและน้ำหนักรวมของ period/Farm ไม่เฉลี่ยค่าเฉลี่ยย่อย; เดือนอนาคตในปีปัจจุบันแสดง “ยังไม่ถึงช่วง”.
- ตาราง responsive อยู่ภายในพื้นที่ scroll ของตนเองบนมือถือและจำกัด Farm ด้วย RLS ของ `sales_summary`.

### ยังไม่ได้ทดสอบ

- เพิ่มกราฟแท่งรายเดือนสี/legend ชัดเจน โดยใช้ `perMonth` data series เดียวกับตาราง และตารางยังเป็น accessible exact-value equivalent.
- รัน `supabase/tests/analytics.sql` แบบ rollback จริง ครอบคลุม leap day 2024-02-29, ช่วงข้ามปี 2023-12/2024-01, empty period, 1,001 แถว และ weighted average. `npm.cmd test` ผ่าน 4/4, typecheck/build ผ่าน.
- ยังไม่ทดสอบ Report UI ด้วย JWT ผู้ใช้ที่เข้าถึงหลาย Farm และยังไม่ตรวจ screenshot/responsive ที่ breakpoint เป้าหมายทั้งหมด.

## ขั้นที่ 8: System review — เสร็จใน local/disposable environment

### เสร็จแล้ว

- ตรวจ source ตาม acceptance matrix และแก้ Sale Detail Audit ให้แสดง actor, เวลา และฟิลด์ธุรกิจที่เปลี่ยนจาก old/new data โดยไม่ลด RLS.
- สร้าง [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md) แยกผลผ่านจริง, สิ่งที่ยังไม่ได้ทดสอบ และเงื่อนไขต้องแก้ก่อน production.
- ตรวจ tracked files: `.env.local` ไม่ถูก track; ไม่พบ service-role/secret key ใน application source. `npm.cmd test` 4/4, typecheck, build และ `git diff --check` ผ่าน.
- ตรวจ browser local ที่ 320px และ 1440px: Dashboard/Reports ไม่มี horizontal page overflow; เพิ่ม focus-visible และ reduced-motion fallback.

### ยังไม่ได้ทดสอบ

- รายการ responsive/accessibility, network/concurrency และ production readiness ที่ระบุใน release checklist ยังไม่ถือว่าผ่านจริง; ไม่มี deployment หรือการเปลี่ยน production database.
- Sales List/Dashboard/Reports ยังเป็นงานขั้นต่อไป และไม่มีการ deploy หรือเปลี่ยน production database.

### การปิดรอบตรวจ local — 22 กันยายน 2026

- เติม Farm List ให้แสดงยอดขายเดือนปัจจุบันต่อ Farm ผ่าน `sales_summary` (RLS เป็นตัวจำกัดแถว) โดยไม่รวมยอดจากรายการที่ถูกแบ่งหน้า
- ปฏิทินภาษาไทยใช้ปุ่มวันพร้อมชื่อวันที่, Arrow Left/Right/Up/Down เพื่อเลื่อนวัน และ Escape เพื่อปิด/คืน focus ไปยัง input; ยังคงเก็บ Gregorian ISO และแสดง พ.ศ.
- รัน `supabase/tests/verification.sql` และ `supabase/tests/analytics.sql` บน Supabase local อีกครั้งแบบ `ROLLBACK` สำเร็จ และ `supabase db lint --local` รายงาน `No schema errors found`.
- รัน `npm.cmd test` (4/4), `npm.cmd run typecheck`, `npm.cmd run build` และ `git diff --check` สำเร็จหลังแก้ไขครั้งสุดท้าย.
- ตรวจผ่าน browser local: Dashboard ไม่มี page overflow ที่ 390/768/1024/1920px; Farm, Sales, Create Sale และ Reports ไม่มี page overflow ที่ 390/1440px. การตรวจนี้เป็นการวัด scroll width ไม่ใช่การรับรอง screen reader หรือ visual-review ทุก state.
- ไม่มี deployment และไม่มีการเปลี่ยน production database; เงื่อนไขก่อนใช้งานจริงคงอยู่ใน `docs/RELEASE-CHECKLIST.md`.
- Audit รอบสุดท้ายแก้การเปิด Edit UI ให้ ADMIN/EDITOR เท่านั้น; VIEWER ที่พิมพ์ URL Edit โดยตรงจะเห็นข้อความอ่านอย่างเดียวและไม่มีฟอร์ม โดย RPC/RLS ยังคงเป็นตัวบังคับสิทธิ์จริง.
- Create/Edit refetch แถวด้วย UUID/ID หลังเกิด network error ที่ไม่ทราบผล แล้วเปรียบเทียบ date/decimal/version ก่อนแสดง success; หากยืนยันไม่ได้จะเก็บ draft และไม่แสดง success.
- Sales List รองรับ หน้าแรก/ก่อนหน้า/ถัดไป พร้อมหมายเลขหน้าโดยคง keyset cursor; validation ของ Create/Edit ย้าย focus ไปช่องแรกที่ผิด และแก้ปฏิทินวันแรกของเดือนให้ไม่เลื่อนไปเดือนก่อนจาก timezone offset.
- ผลตรวจสุดท้าย: database verification และ analytics rollback ผ่าน, DB lint ผ่าน, `npm.cmd audit` ทั้ง production/all dependencies พบ 0 vulnerabilities, `npm.cmd test` ผ่าน 7/7, typecheck/build/diff-check ผ่าน.

## Scope amendment 1.0.2: Create Farm — 22 กันยายน 2026

- ผู้ใช้อนุมัติขยายขอบเขตให้มีหน้าสร้างฟาร์ม จึงเพิ่ม `/farms/new` และปุ่มสร้างจาก Farm List/empty state.
- ฟอร์มรับเฉพาะชื่อฟาร์ม, `produce_name` และด้านส่วนแบ่ง OWNER/WORKER; เรียก `create_farm` RPC ด้วย UUID คงที่ และตรวจแถวจาก server เมื่อผลเครือข่ายไม่ชัดเจนก่อนแสดง success.
- ผู้สร้างเป็น ADMIN คนแรกโดย transaction ของฐานข้อมูล; ไม่เพิ่มหน้าจัดการสมาชิก, Customer, Product หรือ `sale_items`.
- ทดสอบผ่าน browser local จริง: กรอกชื่อ/ผลผลิต, บันทึก, redirect กลับ `/farms?created=...`, แสดงข้อความสำเร็จ และเลือก Farm ที่เพิ่งสร้าง; ลบ fixture ทดสอบสองรายการและ Audit ที่เกี่ยวข้องออกจาก local database หลังตรวจเสร็จ.
- ตรวจ `/farms/new` ที่ viewport 390px ไม่มี horizontal page overflow และปุ่มสร้างยังอยู่ในหน้า; contract tests ผ่าน 8/8, typecheck และ production build ผ่าน โดย build มี route `/farms/new`.

## UI amendment 1.0.3: Thai month calendar — 22 กันยายน 2026

- เปลี่ยนตัวกรองเดือนบน Dashboard และ Sales List จาก native `type="month"` เป็น component ร่วมที่แสดงชื่อเดือนภาษาไทยเต็มและปี พ.ศ.; ค่า query ภายในยังเป็น Gregorian `YYYY-MM`.
- รองรับเลือก 12 เดือน, เปลี่ยนปี, กลับเดือนปัจจุบันตาม Asia/Bangkok, Arrow keys, Escape และคืน focus ไปปุ่มเปิดปฏิทิน.
- ทดสอบ browser local ที่ 390px: Dashboard แสดงเดือนทั้ง 12 เป็นภาษาไทย, เลือกสิงหาคม 2569 แล้ว query state เปลี่ยนและ dialog ปิด; Sales List ไม่มี native month input และแสดงกันยายน 2569. ArrowLeft เลื่อน focus/ค่าไปสิงหาคม, Escape ปิด dialog และคืน focus; ทั้งสองหน้าไม่มี horizontal overflow.
- ผลตรวจหลัง amendment: contract tests ผ่าน 9/9, typecheck และ production build ผ่าน.

## Scope amendment 1.0.4: Registration and email confirmation — 22 กันยายน 2026

- ผู้ใช้อนุมัติหน้า `/register` ที่รับชื่อที่แสดง อีเมล และรหัสผ่าน; หน้า `/login` เหลือเฉพาะอีเมลและรหัสผ่าน.
- เปิด Supabase Auth email confirmation ใน local config และเพิ่ม SSR `/auth/confirm`; ชื่อที่แสดงถูกเก็บใน Auth metadata แล้วส่งเข้า `ensure_profile` หลังยืนยัน token สำเร็จ.
- Confirmation ออกจาก session ชั่วคราวและกลับ Login พร้อมสถานะสำเร็จ ผู้ใช้ที่ยังไม่ยืนยันถูกปฏิเสธทั้งโดย GoTrue และ guard ใน UI.
- Local confirmation email อยู่ใน Inbucket ที่ `http://localhost:54324`; production ต้องตั้ง Auth site URL, redirect allow-list, confirmation template และ SMTP แยกต่างหาก.
- รีสตาร์ต Supabase local โดยคงข้อมูลเดิม แล้วทดสอบจริงครบ: signup คืน user โดยไม่มี session/ยังไม่ confirmed, password login ก่อนยืนยันถูกปฏิเสธด้วย `email_not_confirmed`, อีเมลเข้า Inbucket, confirmation token สร้าง profile จาก metadata, และ password login หลังยืนยันสำเร็จ.
- ลบ Auth user/profile fixture ออกจาก local database หลังทดสอบ; อีเมลจำลองอาจยังอยู่ใน local Inbucket ซึ่งไม่ส่งออกภายนอก. `npm.cmd test` ผ่าน 10/10, typecheck, production build และ route smoke test ผ่าน; build มี `/register` และ `/auth/confirm`.
- แก้ runtime error หลัง signup สำเร็จ: เก็บ form element ก่อน `await` แล้วจึง reset ผ่าน reference ที่คงอยู่ พร้อม regression contract ป้องกันการกลับไปใช้ `event.currentTarget.reset()` หลัง async.

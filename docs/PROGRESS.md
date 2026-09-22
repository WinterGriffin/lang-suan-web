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

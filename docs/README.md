# หลังสวน (Lang Suan) MVP 1.0 — Source of truth

ชุดต้นแบบและเอกสารส่งต่อพัฒนา • 19 กันยายน 2569

## เริ่มใช้งาน

เปิด `index.html` เป็นหน้ารวม หรือเปิด `prototype.html` ในเบราว์เซอร์เพื่อทดลองใช้งานทันที ไม่ต้องติดตั้งแพ็กเกจและไม่ต้องเชื่อมอินเทอร์เน็ต วางไฟล์ทั้งหมดในโฟลเดอร์เดียวกันตามโครงสร้างเดิม

ต้นแบบใช้ข้อมูลจำลองในหน่วยความจำ: บันทึก/แก้ไขได้ภายในรอบการเปิดหน้า รีเฟรชแล้วกลับสู่ข้อมูลเริ่มต้น ไม่ใช่ฐานข้อมูลจริงและไม่มีการส่งข้อมูลไปภายนอก วันที่เริ่มต้นของ Create ใช้เวลาปัจจุบัน Asia/Bangkok จากเครื่องผู้เปิด

## สิ่งที่ส่งมอบ

| ไฟล์ | หน้าที่ |
|---|---|
| index.html | หน้ารวมของชุดงาน |
| prototype.html + prototype.css + prototype.js | High-fidelity interactive prototype; Desktop/Mobile ทุกหน้าที่ขอ |
| screens.html + screens/ | ภาพอ้างอิง 22 ภาพ: 10 มุมมอง × Desktop 1440px / Mobile 390px และปฏิทินภาษาไทยอีก 2 ภาพ |
| design-system.html | ตัวอย่างสี ตัวอักษร ช่องกรอก ปุ่ม และสถานะ |
| DESIGN-SYSTEM.md | Design tokens, component contract, responsive และ accessibility |
| flows-and-erd.html | User flow และ ERD ที่เปิดดูได้โดยไม่ต้องใช้เครื่องมือเพิ่ม |
| user-flow.mmd / erd.mmd | ต้นฉบับ Mermaid ที่แก้ไขและเก็บ version ได้ |
| SPECIFICATION.md | Frozen requirements, กฎธุรกิจ, metrics, screen behavior และ design decisions |
| DATABASE.md | นิยามทุกตาราง/ฟิลด์, permissions, RPC contracts, error mapping, แหล่งอ้างอิง |
| schema.sql | Migration สำหรับ Supabase PostgreSQL 15+: tables, generated amounts, RLS, RPC, Audit |
| verification.sql | ชุดทดสอบฐานข้อมูลแบบ rollback สำหรับ disposable project |
| IMPLEMENTATION.md | ลำดับพัฒนา, acceptance matrix 28 กรณี, prompt ส่งต่อ Claude Code/Codex |
| QA-RESULTS.md | ผลการตรวจต้นแบบที่รันจริงและข้อจำกัด |
| CHANGELOG.md | ประวัติ baseline และข้อจำกัดที่ยังต้องติดตาม |

10 มุมมองในภาพอ้างอิง: Dashboard, Sales List, Create Sale, Edit Sale, Sale Detail, Farm List, Farm Detail, Reports Monthly, Reports Yearly และ Reports by Farm. ภาพมือถือเป็นภาพเต็มหน้า: เมนูและแถบบันทึกถูกจัดเป็น static เฉพาะตอนส่งออกภาพเพื่อไม่บังเนื้อหา ต้นแบบจริงใช้เมนูตรึงขอบจอและแถบบันทึก sticky ตามที่ออกแบบ

## ลำดับความสำคัญของข้อมูล

1. Requirement ล่าสุดของผู้ใช้ และ FR-01–12 ใน SPECIFICATION.md
2. Business rules / decisions D-01–12 และ screen contracts
3. schema.sql + DATABASE.md สำหรับโครงสร้าง การคำนวณ และสิทธิ์
4. DESIGN-SYSTEM.md และต้นแบบ สำหรับหน้าตาและพฤติกรรม
5. Screenshots เป็นภาพตรวจเทียบ ไม่ใช้แทนกติกาข้อความ

หากพบความไม่ตรงกัน ให้แก้และเพิ่ม changelog ทั้งชุด ห้ามเปลี่ยน requirement เงียบ ๆ เอกสารนี้แยกข้อกำหนดที่ freeze แล้วออกจากข้อเสนอออกแบบเพิ่มใน v1.0 เช่น role model, rounding, snapshots, การไม่รับวันที่อนาคต และการไม่ย้าย Farm ตอนแก้ Sale

## Workflow สำคัญที่ทดลองได้

- ภาพรวม → บันทึกการขาย → กรอกน้ำหนัก/ราคา/ส่วนแบ่ง → ดูยอดรวมและอีกฝ่าย → บันทึก → รายละเอียด
- เลือกปาล์มใหญ่ = กรอกส่วนเจ้าของ; เลือกปาล์มเล็ก = กรอกส่วนลูกจ้าง
- รายละเอียด → แก้ไข → บันทึก → ดูประวัติ
- ฟาร์ม → รายละเอียด → เปลี่ยน produce / ด้านที่กรอก / สถานะ
- รายงาน → รายเดือน / เทียบรายปี / เทียบฟาร์ม → เปลี่ยน metric
- ตัวเลือก “สำหรับตรวจแบบ” ที่ท้ายหน้า ใช้ดู loading/empty/error/denied; ไม่ใช่ UI production

## สถานะการตรวจ

ตรวจต้นแบบด้วย Microsoft Edge: 93 assertions ผ่าน รวมคำนวณ OWNER/WORKER, rounding, validation, Save/Edit, weighted average, comparisons, error recovery และ layout ที่ 320, 390, 768, 1024, 1440 และ 1920px; ไม่มี JavaScript runtime error ในชุดตรวจนี้ ได้ตรวจภาพ Desktop/Mobile และแก้ layout ที่พบแล้ว

**ยังไม่ได้รัน schema.sql/verification.sql บน Supabase จริง** ไม่มีการเชื่อมโปรเจกต์ฐานข้อมูลหรือระบบ Auth ในงานนี้ จึงยังไม่ใช่การรับรอง RLS/JWT/concurrency ใน production ให้รันตาม implementation acceptance gates ก่อนใช้งานจริง

## ข้อจำกัดของภาพอ้างอิงเดิม

บทสนทนาที่อ้างถึงระบุว่ามี Google Form screenshots 2 ภาพ แต่เครื่องมือส่งต่อมาเฉพาะข้อความ ไม่ได้ส่งไฟล์ภาพ งานนี้ใช้ข้อมูล workflow ที่บันทึกเป็นข้อความและ requirement ล่าสุด ไม่ได้อ้างว่าเห็นหรือเทียบภาพต้นฉบับแล้ว สามารถแนบภาพเดิมภายหลังเพื่อปิดการตรวจอ้างอิง โดยไม่เปลี่ยนกฎที่ freeze แล้วเอง

## ขอบเขต

ไม่มี Customer, Product, sale_items, ส่วนลด, payment, inventory, fertilizer หรือ profit calculation. UI ภาษาไทยเป็นหลัก เอกสารเทคนิคใช้ภาษาอังกฤษร่วมกับคำ UI ไทยเพื่อส่งต่อ Coding Agent ได้ตรงกัน Authentication/secure onboarding เป็นงาน implementation ที่มี contract แต่ไม่ได้เพิ่มหน้าจอ login/users นอกคำขอปัจจุบัน

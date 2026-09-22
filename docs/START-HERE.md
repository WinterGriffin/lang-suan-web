# จุดเริ่มต้นสำหรับ AI — หลังสวน (Lang Suan)

เอกสารใน docs เป็น source of truth ของ Lang Suan MVP 1.0 ไม่ต้องอาศัยบริบทจากแชตเดิม

## อ่านก่อนเริ่ม implementation

1. SPECIFICATION.md — frozen requirements, business rules และ design decisions
2. DESIGN-SYSTEM.md — UI components และ responsive behavior
3. DATABASE.md และ schema.sql — field definitions, RLS, RPC, Audit Log
4. IMPLEMENTATION.md — implementation sequence และ acceptance tests
5. CHANGELOG.md — การเปลี่ยนชื่อเป็น หลังสวน (Lang Suan) และปฏิทินภาษาไทย

เปิด prototype.html เพื่อทดลอง workflow และ screens.html เพื่อดูภาพอ้างอิง การเปิดไฟล์ HTML ต้องเก็บ CSS, JavaScript และ screens/ ไว้ด้วยกันตามโครงสร้างนี้

## ข้อกำหนดสำคัญ

- ไม่มี Customer, Product หรือ sale_items; Farm ระบุ produce_name เอง
- sale_date เริ่มต้นที่วันนี้ Asia/Bangkok; UI วัน/เดือน/ปี พ.ศ. และชื่อเดือนภาษาไทย; จัดเก็บ Gregorian ISO
- total_amount = round(weight_kg × unit_price, 2); กรอกส่วนแบ่งเพียงด้าน OWNER หรือ WORKER ตาม Farm
- owner_share + worker_share = total_amount; เก็บ snapshot ของผลผลิตและรูปแบบส่วนแบ่ง
- ใช้ค่าทศนิยมที่แน่นอนและตรวจสิทธิ์ราย Farm ที่ฐานข้อมูล
- Dashboard และ Reports ต้องใช้ weighted average และ aggregate ครบทุกแถว

## สถานะและวิธีแก้ข้อขัดแย้ง

FR ใน SPECIFICATION.md คือข้อกำหนดที่ freeze; D คือรายละเอียดออกแบบที่เพิ่มเพื่อให้พัฒนาได้ หากต้องเปลี่ยนให้บันทึกเหตุผลและแก้เอกสารที่เกี่ยวข้องพร้อม CHANGELOG.md

ต้นแบบใช้ข้อมูลจำลอง ไม่ใช่ production app. schema.sql และ verification.sql ยังไม่ได้รันกับ Supabase จริง ต้องทดสอบใน disposable project ก่อนใช้งานจริง ภาพ Google Form เดิมยังไม่ได้ส่งต่อมา จึงอ้างอิง workflow จากข้อความและ requirement ล่าสุด

อย่าใช้ mock data store ของ prototype เป็นฐานข้อมูลจริง อย่าแก้เอกสารให้ตรงกับโค้ดที่ผิด requirement และอย่า deploy โดยถือว่าการส่งมอบเอกสารนี้เป็นการอนุญาต deployment

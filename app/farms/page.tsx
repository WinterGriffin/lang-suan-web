import { AppShell } from "../components/app-shell";
import { Placeholder } from "../components/ui";

export default function FarmsPage() {
  return <AppShell active="farms" title="ฟาร์ม">
    <p className="page-description">ดูชื่อฟาร์ม ผลผลิต สถานะ และด้านที่กรอกส่วนแบ่ง</p>
    <Placeholder title="ยังไม่มีฟาร์มที่คุณมีสิทธิ์" detail="เมื่อเชื่อมระบบสิทธิ์แล้ว ฟาร์มที่เข้าถึงได้จะแสดงในหน้านี้" />
  </AppShell>;
}

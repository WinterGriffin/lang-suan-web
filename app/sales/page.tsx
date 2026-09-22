import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { Placeholder } from "../components/ui";
export default function SalesPage() { return <AppShell active="sales" title="รายการขาย"><section className="page-intro"><p>ค้นหาและดูรายการขายตามฟาร์มและเดือน</p><Link className="button primary" href="/sales/new">+ บันทึกการขาย</Link></section><section className="filter-row" aria-label="ตัวกรองรายการขาย"><label>ฟาร์ม<select disabled defaultValue=""><option value="">รอข้อมูลฟาร์ม</option></select></label><label>เดือน<input type="month" disabled aria-label="เดือน" /></label></section><Placeholder title="ยังไม่มีรายการขายในช่วงนี้" detail="ระบบจะแสดงรายการจากข้อมูล Supabase ในขั้นถัดไป" /></AppShell>; }

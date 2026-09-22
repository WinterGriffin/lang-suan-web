import Link from "next/link";
import { AppShell } from "./components/app-shell";
import { Panel } from "./components/ui";

const kpis = ["ยอดขาย", "น้ำหนักรวม", "ราคาเฉลี่ย/kg", "จำนวนครั้งที่ขาย"];
export default function DashboardPage() { return <AppShell active="overview" title="ภาพรวม"><section className="page-intro"><div><p>ติดตามยอดขายของฟาร์มในช่วงเวลาที่เลือก</p><span className="period-chip">กำลังรอเชื่อมข้อมูลฟาร์ม</span></div><Link className="button primary" href="/sales/new">+ บันทึกการขาย</Link></section><section className="kpi-grid" aria-label="ตัวชี้วัดหลัก">{kpis.map((label) => <article className="kpi-card" key={label}><p>{label}</p><strong>—</strong><span>จะแสดงเมื่อเชื่อมข้อมูลแล้ว</span></article>)}</section><section className="two-column"><Panel title="ยอดขายแต่ละฟาร์ม"><div className="chart-placeholder">ข้อมูลเปรียบเทียบฟาร์มจะแสดงที่นี่</div></Panel><Panel title="ส่วนแบ่งรายได้"><div className="chart-placeholder">สรุปส่วนเจ้าของและลูกจ้างจะแสดงที่นี่</div></Panel></section><Panel title="รายการล่าสุด"><p className="muted">ยังไม่มีข้อมูลสำหรับแสดง</p></Panel></AppShell>; }

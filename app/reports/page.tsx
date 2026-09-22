import { AppShell } from "../components/app-shell";
import { Panel, Placeholder } from "../components/ui";

export default function ReportsPage() {
  return <AppShell active="reports" title="รายงาน">
    <div className="report-tabs" role="tablist" aria-label="ประเภทรายงาน"><button type="button" role="tab" aria-selected="true">รายเดือน</button><button type="button" role="tab" disabled>รายปี</button><button type="button" role="tab" disabled>เทียบฟาร์ม</button></div>
    <Panel title="รายงานรายเดือน"><Placeholder title="กำลังเตรียมข้อมูลรายงาน" detail="กราฟและตารางจะใช้ข้อมูลชุดเดียวกันหลังเชื่อมฐานข้อมูล" /></Panel>
  </AppShell>;
}

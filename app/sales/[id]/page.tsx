"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/packages/database/src/database.types";
import { thaiDate } from "@/lib/sales";
import "./sale-detail.css";

type Sale = Tables<"sales">;
type Audit = Tables<"audit_logs">;
const money = (value: number | null) => Number(value ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auditLabels: Record<string, string> = { sale_date: "วันที่ขาย", weight_kg: "น้ำหนัก", unit_price: "ราคาต่อกิโลกรัม", input_share: "ส่วนแบ่ง", total_amount: "ยอดขายรวม", owner_share: "ส่วนเจ้าของ", worker_share: "ส่วนลูกจ้าง", version: "เวอร์ชัน" };
function changedFields(audit: Audit) { if (!audit.old_data || !audit.new_data || typeof audit.old_data !== "object" || typeof audit.new_data !== "object" || Array.isArray(audit.old_data) || Array.isArray(audit.new_data)) return audit.action === "INSERT" ? "ข้อมูลเริ่มต้น" : "รายละเอียดการเปลี่ยนแปลง"; const oldData = audit.old_data as Record<string, unknown>; const newData = audit.new_data as Record<string, unknown>; const fields = Object.keys(auditLabels).filter((key) => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])); return fields.length ? fields.map((key) => auditLabels[key]).join(", ") : "ไม่มีฟิลด์ธุรกิจเปลี่ยน"; }

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [state, setState] = useState("กำลังโหลดข้อมูล…");

  useEffect(() => { void (async () => {
    const client = createClient();
    const { data, error } = await client.from("sales").select("*").eq("id", id).maybeSingle();
    if (error || !data) { setState("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"); return; }
    setSale(data);
    setState("");
    const { data: auth } = await client.auth.getUser();
    if (auth.user) {
      const { data: membership } = await client.from("user_farm_roles").select("role").eq("farm_id", data.farm_id).eq("user_id", auth.user.id).maybeSingle();
      setCanEdit(membership?.role === "ADMIN" || membership?.role === "EDITOR");
    }
    const { data: history } = await client.from("audit_logs").select("*").eq("table_name", "sales").contains("record_key", { id }).order("occurred_at", { ascending: false }).order("id", { ascending: false });
    setAudits(history ?? []);
  })(); }, [id]);
  const remove = async () => {
    if (!sale || deleting) return;
    setDeleting(true);
    const { error } = await createClient().rpc("soft_delete_sale", { p_id: sale.id, p_expected_version: sale.version });
    if (error) { setDeleting(false); setConfirmDelete(false); setState(error.code === "40001" ? "รายการนี้ถูกแก้ไขแล้ว กรุณากลับไปโหลดข้อมูลล่าสุด" : "ไม่สามารถลบรายการขายนี้ได้"); return; }
    window.location.assign("/sales?deleted=1");
  };

  return <AppShell active="sales" title="รายละเอียดการขาย">
    {search.get("saved") === "1" && <p className="form-success" role="status">บันทึกการขายแล้ว</p>}
    {state ? <section className="empty-state"><p>{state}</p><Link className="button primary" href="/sales">กลับหน้าการขาย</Link></section> : sale && <div className="detail-layout">
      <section className="panel"><div className="page-intro"><div><p className="eyebrow">{thaiDate(sale.sale_date)}</p><h2>{sale.produce_name_snapshot}</h2></div><div className="sale-actions"><Link className="button primary" href="/sales/new">+ บันทึกการขาย</Link>{canEdit && <Link className="profile-button" href={`/sales/${sale.id}/edit`}>แก้ไขรายการ</Link>}{canEdit && <button className="button destructive" type="button" onClick={() => setConfirmDelete(true)}>ลบรายการขาย</button>}</div></div>
        <div className="sale-total">{money(sale.total_amount)} <small>บาท</small></div>
        <dl className="detail-grid"><dt>น้ำหนัก</dt><dd>{sale.weight_kg} kg</dd><dt>ราคาต่อกิโลกรัม</dt><dd>{money(sale.unit_price)} บาท</dd><dt>ส่วนเจ้าของ</dt><dd>{money(sale.owner_share)} บาท</dd><dt>ส่วนลูกจ้าง</dt><dd>{money(sale.worker_share)} บาท</dd><dt>ด้านที่กรอกตอนสร้าง</dt><dd>{sale.share_input_type}</dd><dt>เวอร์ชัน</dt><dd>{sale.version}</dd></dl>
      </section>{confirmDelete && <div className="confirm-backdrop" role="presentation"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">ลบรายการขาย?</h2><p>รายการขายนี้จะถูกนำออกจากยอดขาย รายงาน และการคำนวณทั้งหมด</p><dl><dt>ฟาร์ม</dt><dd>{sale.produce_name_snapshot}</dd><dt>วันที่</dt><dd>{thaiDate(sale.sale_date)}</dd><dt>ยอดขายรวม</dt><dd>{money(sale.total_amount)} บาท</dd></dl><div className="sale-actions"><button className="profile-button" type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>ยกเลิก</button><button className="button destructive" type="button" onClick={() => void remove()} disabled={deleting}>{deleting ? "กำลังลบ…" : "ลบรายการขาย"}</button></div></section></div>}
      <section className="panel"><h2>ประวัติการเปลี่ยนแปลง</h2>{audits.length === 0 ? <p className="muted">ยังไม่มีประวัติที่คุณมีสิทธิ์อ่าน</p> : <ol className="audit-list">{audits.map((audit) => <li key={audit.id}><b>{audit.action === "INSERT" ? "สร้างรายการ" : "แก้ไขรายการ"}</b><span>{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(audit.occurred_at))}</span><small>เปลี่ยน: {changedFields(audit)} · ผู้ใช้ {audit.actor_id ?? "ระบบ"}</small></li>)}</ol>}</section>
    </div>}
  </AppShell>;
}

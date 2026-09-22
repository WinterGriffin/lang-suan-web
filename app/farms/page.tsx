"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/app-shell";
import { createClient } from "@/lib/supabase/client";
import { bangkokMonth, money, monthRange, totalRows } from "@/lib/analytics";
import type { Database, Tables } from "@/packages/database/src/database.types";
import "./farms.css";

type Farm = Tables<"farms">;
type Sale = Tables<"sales">;
type Role = Database["public"]["Enums"]["farm_role"];
type Draft = { name: string; produceName: string; shareInput: "OWNER" | "WORKER"; isActive: boolean };

const toDraft = (farm: Farm): Draft => ({
  name: farm.name,
  produceName: farm.produce_name,
  shareInput: farm.default_share_input,
  isActive: farm.is_active,
});

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [selected, setSelected] = useState<Farm | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [monthTotals, setMonthTotals] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("กำลังโหลดข้อมูล…");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);

  const loadSales = useCallback(async (farmId: string) => {
    const { data, error } = await createClient()
      .from("sales")
      .select("*")
      .eq("farm_id", farmId)
      .order("sale_date", { ascending: false })
      .order("id", { ascending: false })
      .limit(5);
    setSales(error ? [] : data ?? []);
  }, []);

  const chooseFarm = useCallback((farm: Farm) => {
    setSelected(farm);
    setDraft(toDraft(farm));
    setConflict(false);
    setStatus("");
    void loadSales(farm.id);
  }, [loadSales]);

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setStatus("กำลังโหลดข้อมูล…");
    const client = createClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setStatus("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      setLoading(false);
      return;
    }
    const range = monthRange(bangkokMonth());
    const [{ data: farmRows, error: farmError }, { data: membershipRows, error: roleError }, { data: summaryRows, error: summaryError }] = await Promise.all([
      client.from("farms").select("*").order("name"),
      client.from("user_farm_roles").select("farm_id, role").eq("user_id", auth.user.id),
      client.rpc("sales_summary", { p_start: range.start, p_end: range.end }),
    ]);
    if (farmError || roleError || summaryError) {
      setStatus("โหลดข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
      setLoading(false);
      return;
    }
    const nextFarms = farmRows ?? [];
    setFarms(nextFarms);
    setRoles(Object.fromEntries((membershipRows ?? []).map((row) => [row.farm_id, row.role])));
    setMonthTotals(Object.fromEntries((summaryRows ?? []).map((row) => [row.farm_id, money(totalRows([row]).total)])));
    if (nextFarms.length === 0) {
      setSelected(null);
      setDraft(null);
      setSales([]);
      setStatus("ยังไม่มีฟาร์มที่คุณมีสิทธิ์");
    } else {
      const createdId = new URLSearchParams(window.location.search).get("created");
      chooseFarm(nextFarms.find((farm) => farm.id === createdId) ?? nextFarms[0]);
      if (createdId) {
        setStatus("สร้างฟาร์มใหม่แล้ว คุณเป็น ADMIN ของฟาร์มนี้");
      }
    }
    setLoading(false);
  }, [chooseFarm]);

  useEffect(() => { void loadFarms(); }, [loadFarms]);

  const reloadSelected = async () => {
    if (!selected) return;
    if (draft && !window.confirm("การโหลดข้อมูลล่าสุดจะละทิ้งค่าที่ยังไม่ได้บันทึก ต้องการทำต่อหรือไม่")) return;
    const { data, error } = await createClient().from("farms").select("*").eq("id", selected.id).maybeSingle();
    if (error || !data) {
      setStatus("โหลดข้อมูลล่าสุดไม่สำเร็จ");
      return;
    }
    setFarms((items) => items.map((item) => item.id === data.id ? data : item));
    chooseFarm(data);
    setStatus("โหลดข้อมูลล่าสุดแล้ว");
  };

  const save = async () => {
    if (!selected || !draft || roles[selected.id] !== "ADMIN") return;
    if (!draft.name.trim() || !draft.produceName.trim()) {
      setStatus("กรุณากรอกชื่อฟาร์มและผลผลิต");
      return;
    }
    if (draft.shareInput !== selected.default_share_input && !window.confirm("การเปลี่ยนด้านที่กรอกส่วนแบ่งมีผลกับรายการขายใหม่เท่านั้น ต้องการบันทึกหรือไม่")) return;
    setSaving(true);
    setStatus("");
    const { data, error } = await createClient().rpc("update_farm", {
      p_id: selected.id,
      p_expected_version: selected.version,
      p_name: draft.name.trim(),
      p_produce_name: draft.produceName.trim(),
      p_share_input: draft.shareInput,
      p_is_active: draft.isActive,
    });
    setSaving(false);
    if (error) {
      if (error.code === "40001") {
        setConflict(true);
        setStatus("รายการนี้มีการแก้ไขแล้ว ค่าที่คุณกรอกยังอยู่ กรุณาโหลดข้อมูลล่าสุดเพื่อเปรียบเทียบ");
      } else if (error.code === "42501") {
        setStatus("คุณไม่มีสิทธิ์แก้ไขฟาร์มนี้");
      } else {
        setStatus("ยังยืนยันการบันทึกไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง");
      }
      return;
    }
    setConflict(false);
    setSelected(data);
    setDraft(toDraft(data));
    setFarms((items) => items.map((item) => item.id === data.id ? data : item));
    setStatus("บันทึกการตั้งค่าฟาร์มแล้ว");
  };

  const role = selected ? roles[selected.id] : undefined;
  const canEdit = role === "ADMIN";

  return <AppShell active="farms" title="ฟาร์ม">
    <div className="page-intro"><p>ชื่อฟาร์ม ผลผลิต สถานะ และด้านที่กรอกส่วนแบ่ง</p><div className="farm-page-actions"><button className="profile-button" type="button" onClick={() => void loadFarms()} disabled={loading}>โหลดใหม่</button><Link className="button primary" href="/farms/new">+ สร้างฟาร์ม</Link></div></div>
    {status && <p className={status.includes("สำเร็จ") || status.includes("แล้ว") ? "form-success" : "form-message"} role="status">{status}</p>}
    {loading ? <section className="empty-state"><p>กำลังโหลดข้อมูล…</p></section> : farms.length === 0 ? <section className="empty-state"><h2>ยังไม่มีฟาร์มที่คุณมีสิทธิ์</h2><p>สร้างฟาร์มแรกเพื่อเริ่มบันทึกการขาย หรือให้ผู้ดูแลเพิ่มสิทธิ์คุณในฟาร์มเดิม</p><Link className="button primary" href="/farms/new">สร้างฟาร์มแรก</Link></section> : <div className="farm-layout">
      <section className="farm-list" aria-label="รายการฟาร์ม">
        {farms.map((farm) => <button type="button" key={farm.id} className={farm.id === selected?.id ? "farm-card selected" : "farm-card"} onClick={() => chooseFarm(farm)}>
          <strong>{farm.name}</strong><span>{farm.produce_name}</span><small>{farm.is_active ? "ใช้งานอยู่" : "ปิดใช้งาน"} · {farm.default_share_input} · {roles[farm.id]}</small><small>ยอดเดือนนี้ {monthTotals[farm.id] ?? "0.00"} บาท</small>
        </button>)}
      </section>
      {selected && draft && <section className="farm-detail panel">
        <div className="farm-detail-heading"><div><h2>{selected.name}</h2><p className="muted">สิทธิ์ของคุณ: {role ?? "ไม่พบสิทธิ์"}</p></div>{conflict && <button className="profile-button" type="button" onClick={() => void reloadSelected()}>โหลดข้อมูลล่าสุด</button>}</div>
        {canEdit ? <div className="entry-form">
          <label>ชื่อฟาร์ม<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} maxLength={120} /></label>
          <label>ผลผลิต<input value={draft.produceName} onChange={(event) => setDraft({ ...draft, produceName: event.target.value })} maxLength={120} /></label>
          <label>ด้านที่กรอกส่วนแบ่ง<select value={draft.shareInput} onChange={(event) => setDraft({ ...draft, shareInput: event.target.value as Draft["shareInput"] })}><option value="OWNER">OWNER (เจ้าของ)</option><option value="WORKER">WORKER (ลูกจ้าง)</option></select></label>
          <label className="checkbox-label"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> เปิดใช้สำหรับการสร้างรายการขายใหม่</label>
          <p className="notice">การเปลี่ยนส่วนแบ่งมีผลกับรายการใหม่เท่านั้น รายการย้อนหลังใช้ snapshot เดิม</p>
          <button className="button primary" type="button" onClick={() => void save()} disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}</button>
        </div> : <div className="farm-readonly"><p><b>ผลผลิต:</b> {selected.produce_name}</p><p><b>ด้านที่กรอกส่วนแบ่ง:</b> {selected.default_share_input}</p><p><b>สถานะ:</b> {selected.is_active ? "ใช้งานอยู่" : "ปิดใช้งาน — ยังดูและแก้ประวัติขายได้ตามสิทธิ์"}</p><p className="notice">เฉพาะ ADMIN เท่านั้นที่เปลี่ยนการตั้งค่าฟาร์มได้</p></div>}
        <section className="farm-sales"><h3>รายการขายล่าสุด</h3>{sales.length === 0 ? <p className="muted">ยังไม่มีรายการขายที่คุณเข้าถึงได้</p> : sales.map((sale) => <div className="sale-compact" key={sale.id}><span>{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(`${sale.sale_date}T00:00:00`))}</span><b>{Number(sale.total_amount ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</b><small>{sale.weight_kg} kg · {sale.produce_name_snapshot}</small></div>)}</section>
      </section>}
    </div>}
  </AppShell>;
}

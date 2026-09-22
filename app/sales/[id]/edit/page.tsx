"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/packages/database/src/database.types";
import { bangkokDate, decimalToUnits, formatMoney, salePreview, thaiDate } from "@/lib/sales";
import { ThaiDateInput } from "../../../components/thai-date-input";
import "../../new/sale-form.css";
import "../../../components/thai-date-input.css";

type Sale = Tables<"sales">;
type Draft = { date: string; weight: string; price: string; share: string };
const amount = (value: number) => value.toFixed(2);

export default function EditSalePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("กำลังโหลดข้อมูล…");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const preview = useMemo(() => draft ? salePreview(draft.weight, draft.price, draft.share) : salePreview("", "", ""), [draft]);

  const load = async (discard = false) => {
    if (draft && !discard && !window.confirm("การโหลดข้อมูลล่าสุดจะละทิ้งค่าที่ยังไม่ได้บันทึก ต้องการทำต่อหรือไม่")) return;
    const client = createClient();
    const { data, error } = await client.from("sales").select("*").eq("id", id).maybeSingle();
    if (error || !data) { setMessage("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"); return; }
    const { data: auth } = await client.auth.getUser();
    const { data: membership } = auth.user ? await client.from("user_farm_roles").select("role").eq("farm_id", data.farm_id).eq("user_id", auth.user.id).maybeSingle() : { data: null };
    if (membership?.role !== "ADMIN" && membership?.role !== "EDITOR") { setSale(null); setDraft(null); setMessage("คุณมีสิทธิ์อ่านรายการนี้ แต่ไม่มีสิทธิ์แก้ไข"); return; }
    setSale(data); setDraft({ date: data.sale_date, weight: String(data.weight_kg), price: amount(data.unit_price), share: amount(data.input_share) }); setConflict(false); setMessage("");
  };

  useEffect(() => { void load(true); }, [id]);

  const validate = () => {
    if (!draft) return false;
    const next: Record<string, string> = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || draft.date > bangkokDate()) next.date = "เลือกวันที่ขายไม่เกินวันนี้ตามเวลาไทย";
    if (salePreview(draft.weight, "1", "").total === null) next.weight = "กรอกน้ำหนักมากกว่า 0 และไม่เกิน 3 ตำแหน่งทศนิยม";
    if (salePreview("1", draft.price, "").total === null) next.price = "กรอกราคามากกว่า 0 และไม่เกิน 2 ตำแหน่งทศนิยม";
    if (preview.share === null) next.share = "กรอกส่วนแบ่ง 0–2 ตำแหน่งทศนิยม";
    if (preview.invalidShare) next.share = "ส่วนแบ่งต้องไม่เกินยอดขายรวม";
    setIssues(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) window.requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus());
    return Object.keys(next).length === 0;
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!sale || !draft || !validate() || saving) return;
    setSaving(true); setMessage("");
    const client = createClient();
    const { data, error } = await client.rpc("save_sale", {
      p_id: sale.id, p_farm_id: sale.farm_id, p_sale_date: draft.date, p_weight_kg: draft.weight,
      p_unit_price: draft.price, p_input_share: draft.share, p_expected_version: sale.version,
    } as never);
    setSaving(false);
    if (error || !data) {
      if (error?.code === "40001") { setConflict(true); setMessage("รายการนี้มีการแก้ไขแล้ว ค่าที่คุณกรอกยังอยู่ กรุณาโหลดข้อมูลล่าสุดเพื่อเปรียบเทียบ"); }
      else if (error?.code === "42501") setMessage("คุณไม่มีสิทธิ์แก้ไขรายการนี้");
      else {
        const { data: confirmed } = await client.from("sales").select("*").eq("id", sale.id).maybeSingle();
        const isConfirmed = confirmed && confirmed.version > sale.version && confirmed.sale_date === draft.date
          && decimalToUnits(String(confirmed.weight_kg), 3) === decimalToUnits(draft.weight, 3)
          && decimalToUnits(String(confirmed.unit_price), 2) === decimalToUnits(draft.price, 2)
          && decimalToUnits(String(confirmed.input_share), 2) === decimalToUnits(draft.share, 2);
        if (isConfirmed) { router.replace(`/sales/${confirmed.id}?saved=1`); router.refresh(); return; }
        if (confirmed && confirmed.version > sale.version) { setConflict(true); setMessage("รายการนี้เปลี่ยนแปลงระหว่างตรวจสอบผลบันทึก ค่าที่คุณกรอกยังอยู่ กรุณาโหลดข้อมูลล่าสุดเพื่อเปรียบเทียบ"); }
        else setMessage("ยังยืนยันการบันทึกไม่ได้ ข้อมูลที่กรอกยังคงอยู่ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง");
      }
      return;
    }
    router.replace(`/sales/${data.id}?saved=1`); router.refresh();
  };

  const inputLabel = sale?.share_input_type === "OWNER" ? "ส่วนเจ้าของ (บาท)" : "ส่วนลูกจ้าง (บาท)";
  const otherLabel = sale?.share_input_type === "OWNER" ? "ส่วนลูกจ้าง" : "ส่วนเจ้าของ";
  return <AppShell active="sales" title="แก้ไขรายการขาย">
    {message && <p className="form-message" role="status">{message}</p>}
    {!sale || !draft ? null : <div className="form-layout"><form className="entry-form" onSubmit={save} noValidate>
      <label>ฟาร์ม<input value={`ฟาร์มเดิม · ${sale.produce_name_snapshot}`} disabled /></label><p className="notice">ไม่สามารถเปลี่ยนฟาร์มและ snapshot ของรายการเดิมได้</p>
      <label>วันที่ขาย (วัน/เดือน/ปี พ.ศ.)<ThaiDateInput id="date" value={draft.date} max={bangkokDate()} onChange={(date) => setDraft({ ...draft, date })} /><small>{thaiDate(draft.date)}</small>{issues.date && <small className="form-error">{issues.date}</small>}</label>
      <label>น้ำหนัก (kg)<input id="weight" value={draft.weight} inputMode="decimal" onChange={(event) => setDraft({ ...draft, weight: event.target.value })} />{issues.weight && <small className="form-error">{issues.weight}</small>}</label>
      <label>ราคาต่อกิโลกรัม (บาท)<input id="price" value={draft.price} inputMode="decimal" onChange={(event) => setDraft({ ...draft, price: event.target.value })} />{issues.price && <small className="form-error">{issues.price}</small>}</label>
      <label>{inputLabel}<input id="share" value={draft.share} inputMode="decimal" onChange={(event) => setDraft({ ...draft, share: event.target.value })} />{issues.share && <small className="form-error">{issues.share}</small>}</label>
      <div className="form-actions"><Link className="profile-button" href={`/sales/${sale.id}`}>ยกเลิก</Link>{conflict && <button className="profile-button" type="button" onClick={() => void load(false)}>โหลดข้อมูลล่าสุด</button>}<button className="button primary" disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}</button></div>
    </form><aside className="summary-card sale-summary"><p>ยอดขายรวม</p><strong>{formatMoney(preview.total)} บาท</strong><hr /><p><span>{inputLabel?.replace(" (บาท)", "")}</span><b>{formatMoney(preview.share)} บาท</b></p><p><span>{otherLabel}</span><b>{formatMoney(preview.remaining)} บาท</b></p></aside></div>}
  </AppShell>;
}

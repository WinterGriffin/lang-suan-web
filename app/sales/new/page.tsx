"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/packages/database/src/database.types";
import { bangkokDate, decimalToUnits, formatMoney, salePreview, thaiDate } from "@/lib/sales";
import { ThaiDateInput } from "../../components/thai-date-input";
import "./sale-form.css";
import "../../components/thai-date-input.css";

type Farm = Tables<"farms">;
type Draft = { farmId: string; date: string; weight: string; price: string; share: string };
const draftKey = "lang-suan:create-sale-draft";

export default function CreateSalePage() {
  const router = useRouter();
  const requestId = useRef(crypto.randomUUID());
  const [farms, setFarms] = useState<Farm[]>([]);
  const [roles, setRoles] = useState<Record<string, "ADMIN" | "EDITOR" | "VIEWER">>({});
  const [draft, setDraft] = useState<Draft>({ farmId: "", date: bangkokDate(), weight: "", price: "", share: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    if (saved) {
      try { setDraft(JSON.parse(saved) as Draft); setMessage("กู้คืนข้อมูลร่างที่ยังไม่ได้ยืนยันแล้ว"); } catch { window.localStorage.removeItem(draftKey); }
    }
    const client = createClient();
    void (async () => {
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) { setLoading(false); setMessage("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"); return; }
      const [{ data, error: readError }, { data: memberships }] = await Promise.all([
        client.from("farms").select("*").eq("is_active", true).order("name"),
        client.from("user_farm_roles").select("farm_id, role").eq("user_id", auth.user.id),
      ]);
      const available = data ?? [];
      setFarms(available);
      setRoles(Object.fromEntries((memberships ?? []).map((row) => [row.farm_id, row.role])));
      setDraft((current) => ({ ...current, farmId: available.some((farm) => farm.id === current.farmId) ? current.farmId : available[0]?.id ?? "" }));
      setLoading(false);
      if (readError) setMessage("โหลดฟาร์มไม่สำเร็จ กรุณาลองใหม่");
    })();
  }, []);

  const farm = farms.find((item) => item.id === draft.farmId);
  const preview = useMemo(() => salePreview(draft.weight, draft.price, draft.share), [draft.weight, draft.price, draft.share]);
  const inputLabel = farm?.default_share_input === "OWNER" ? "ส่วนเจ้าของ (บาท)" : "ส่วนลูกจ้าง (บาท)";
  const otherLabel = farm?.default_share_input === "OWNER" ? "ส่วนลูกจ้าง" : "ส่วนเจ้าของ";
  const canSave = roles[draft.farmId] === "ADMIN" || roles[draft.farmId] === "EDITOR";

  const changeFarm = (farmId: string) => {
    setDraft((current) => ({ ...current, farmId, share: "" }));
    setError((current) => ({ ...current, share: "" }));
  };

  const validate = () => {
    const issues: Record<string, string> = {};
    if (!farm) issues.farm = "กรุณาเลือกฟาร์มที่ใช้งานได้";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || draft.date > bangkokDate()) issues.date = "เลือกวันที่ขายไม่เกินวันนี้ตามเวลาไทย";
    if (salePreview(draft.weight, "1", "").total === null) issues.weight = "กรอกน้ำหนักมากกว่า 0 และไม่เกิน 3 ตำแหน่งทศนิยม";
    if (salePreview("1", draft.price, "").total === null) issues.price = "กรอกราคามากกว่า 0 และไม่เกิน 2 ตำแหน่งทศนิยม";
    if (preview.share === null) issues.share = "กรอกส่วนแบ่ง 0–2 ตำแหน่งทศนิยม";
    if (preview.invalidShare) issues.share = "ส่วนแบ่งต้องไม่เกินยอดขายรวม";
    setError(issues);
    const firstInvalid = Object.keys(issues)[0];
    if (firstInvalid) window.requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus());
    return Object.keys(issues).length === 0;
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (!validate() || !farm || saving || !canSave) { if (farm && !canSave) setMessage("คุณมีสิทธิ์ดูข้อมูลฟาร์มนี้ แต่ไม่มีสิทธิ์บันทึกรายการขาย"); return; }
    setSaving(true);
    // The generated TypeScript numeric type is a PostgREST limitation; the RPC contract deliberately receives decimal strings.
    const args = {
      p_id: requestId.current, p_farm_id: farm.id, p_sale_date: draft.date,
      p_weight_kg: draft.weight, p_unit_price: draft.price, p_input_share: draft.share, p_expected_version: null,
    };
    const client = createClient();
    const { data, error: saveError } = await client.rpc("save_sale", args as never);
    setSaving(false);
    if (saveError || !data) {
      if (saveError?.code !== "40001" && saveError?.code !== "42501") {
        const { data: confirmed } = await client.from("sales").select("*").eq("id", requestId.current).maybeSingle();
        const isConfirmed = confirmed?.farm_id === farm.id && confirmed.sale_date === draft.date
          && decimalToUnits(String(confirmed.weight_kg), 3) === decimalToUnits(draft.weight, 3)
          && decimalToUnits(String(confirmed.unit_price), 2) === decimalToUnits(draft.price, 2)
          && decimalToUnits(String(confirmed.input_share), 2) === decimalToUnits(draft.share, 2);
        if (confirmed && isConfirmed) {
          window.localStorage.removeItem(draftKey);
          router.replace(`/sales/${confirmed.id}?saved=1`);
          router.refresh();
          return;
        }
      }
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
      if (saveError?.code === "42501") setMessage("คุณไม่มีสิทธิ์บันทึกรายการขายของฟาร์มนี้");
      else if (saveError?.code === "40001") setMessage("คำขอบันทึกนี้มีข้อมูลไม่ตรงกัน กรุณาตรวจสอบรายการเดิม");
      else setMessage("ยังยืนยันการบันทึกไม่ได้ ข้อมูลร่างและ UUID เดิมถูกเก็บไว้เพื่อให้ลองอีกครั้ง");
      return;
    }
    window.localStorage.removeItem(draftKey);
    router.replace(`/sales/${data.id}?saved=1`);
    router.refresh();
  };

  return <AppShell active="create" title="บันทึกการขาย">
    <p className="page-description">กรอกข้อมูลเท่าที่จำเป็น ยอดรวมและส่วนที่เหลือคำนวณจากทศนิยมแบบแน่นอน ก่อนยืนยันอีกครั้งโดยฐานข้อมูล</p>
    {message && <p className="form-message" role="status">{message}</p>}
    {loading ? <section className="empty-state"><p>กำลังโหลดฟาร์มที่คุณมีสิทธิ์…</p></section> : farms.length === 0 ? <section className="empty-state"><h2>ยังไม่มีฟาร์มที่ใช้งานได้</h2><p>ฟาร์มที่ปิดใช้สร้างรายการใหม่ไม่ได้ กรุณาตรวจสอบหน้าฟาร์ม</p></section> : <div className="form-layout">
      <form className="entry-form" onSubmit={save} noValidate>
        <label>ฟาร์ม<select id="farm" value={draft.farmId} onChange={(event) => changeFarm(event.target.value)} aria-describedby={error.farm ? "farm-error" : undefined}>{farms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>{error.farm && <small className="form-error" id="farm-error">{error.farm}</small>}<small>{farm?.produce_name} · กรอกส่วน {farm?.default_share_input}</small></label>
        <label>วันที่ขาย (วัน/เดือน/ปี พ.ศ.)<ThaiDateInput id="date" value={draft.date} max={bangkokDate()} onChange={(date) => setDraft({ ...draft, date })} describedBy={error.date ? "date-error" : "date-help"} /><small id="date-help">{thaiDate(draft.date)} · ระบบบันทึกเป็น Gregorian ISO</small>{error.date && <small className="form-error" id="date-error">{error.date}</small>}</label>
        <label>น้ำหนัก (kg)<input id="weight" value={draft.weight} inputMode="decimal" placeholder="0.000" onChange={(event) => setDraft({ ...draft, weight: event.target.value })} aria-describedby={error.weight ? "weight-error" : undefined} />{error.weight && <small className="form-error" id="weight-error">{error.weight}</small>}</label>
        <label>ราคาต่อกิโลกรัม (บาท)<input id="price" value={draft.price} inputMode="decimal" placeholder="0.00" onChange={(event) => setDraft({ ...draft, price: event.target.value })} aria-describedby={error.price ? "price-error" : undefined} />{error.price && <small className="form-error" id="price-error">{error.price}</small>}</label>
        <label>{inputLabel}<input id="share" value={draft.share} inputMode="decimal" placeholder="0.00" onChange={(event) => setDraft({ ...draft, share: event.target.value })} aria-describedby={error.share ? "share-error" : undefined} />{error.share && <small className="form-error" id="share-error">{error.share}</small>}</label>
        {!canSave && farm && <p className="notice">คุณมีสิทธิ์ {roles[farm.id] ?? "อ่าน"} จึงไม่สามารถบันทึกรายการขายได้</p>}<button className="button primary" disabled={saving || !canSave}>{saving ? "กำลังบันทึก…" : "บันทึกการขาย"}</button>
      </form>
      <aside className="summary-card sale-summary" aria-live="polite"><p>ยอดขายรวม</p><strong>{formatMoney(preview.total)} บาท</strong><hr /><p><span>{farm?.default_share_input === "OWNER" ? "ส่วนเจ้าของ" : "ส่วนลูกจ้าง"}</span><b>{formatMoney(preview.share)} บาท</b></p><p><span>{otherLabel}</span><b>{formatMoney(preview.remaining)} บาท</b></p><small>ค่าจริงจะใช้ข้อมูลที่ฐานข้อมูลตอบกลับ</small></aside>
    </div>}
  </AppShell>;
}

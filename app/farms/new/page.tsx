"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { createClient } from "@/lib/supabase/client";
import "./farm-create.css";

type Draft = { name: string; produceName: string; shareInput: "OWNER" | "WORKER" };

export default function CreateFarmPage() {
  const router = useRouter();
  const farmId = useRef(crypto.randomUUID());
  const [draft, setDraft] = useState<Draft>({ name: "", produceName: "", shareInput: "OWNER" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "กรุณากรอกชื่อฟาร์ม";
    if (!draft.produceName.trim()) next.produceName = "กรุณากรอกชื่อผลผลิต";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(first)?.focus());
    return first === undefined;
  };

  const finish = (id: string) => {
    router.replace(`/farms?created=${encodeURIComponent(id)}`);
    router.refresh();
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || saving) return;
    setSaving(true);
    setMessage("");
    const client = createClient();
    const { data, error } = await client.rpc("create_farm", {
      p_id: farmId.current,
      p_name: draft.name.trim(),
      p_produce_name: draft.produceName.trim(),
      p_share_input: draft.shareInput,
    });
    setSaving(false);
    if (data && !error) { finish(data.id); return; }

    const { data: confirmed } = await client.from("farms").select("*").eq("id", farmId.current).maybeSingle();
    if (confirmed && confirmed.name === draft.name.trim() && confirmed.produce_name === draft.produceName.trim() && confirmed.default_share_input === draft.shareInput) {
      finish(confirmed.id);
      return;
    }
    if (error?.code === "42501") setMessage("เซสชันหมดอายุหรือยังไม่มีโปรไฟล์ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่");
    else if (confirmed) setMessage("คำขอสร้างฟาร์มนี้มีข้อมูลไม่ตรงกัน กรุณากลับหน้าฟาร์มแล้วตรวจสอบรายการเดิม");
    else setMessage("ยังยืนยันการสร้างฟาร์มไม่ได้ ข้อมูลที่กรอกยังอยู่ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง");
  };

  return <AppShell active="farms" title="สร้างฟาร์ม">
    <p className="page-description">ผู้สร้างจะเป็น ADMIN ของฟาร์มใหม่โดยอัตโนมัติ และแก้การตั้งค่าฟาร์มได้ภายหลัง</p>
    {message && <p className="form-message" role="status">{message}</p>}
    <div className="farm-create-layout">
      <form className="entry-form" onSubmit={save} noValidate>
        <label>ชื่อฟาร์ม<input id="name" value={draft.name} maxLength={120} autoComplete="off" onChange={(event) => setDraft({ ...draft, name: event.target.value })} aria-describedby={errors.name ? "name-error" : undefined} />{errors.name && <small id="name-error" className="form-error">{errors.name}</small>}</label>
        <label>ผลผลิต<input id="produceName" value={draft.produceName} maxLength={120} autoComplete="off" onChange={(event) => setDraft({ ...draft, produceName: event.target.value })} aria-describedby={errors.produceName ? "produce-error" : "produce-help"} />{errors.produceName && <small id="produce-error" className="form-error">{errors.produceName}</small>}<small id="produce-help">ระบุชื่อผลผลิตในฟาร์มโดยตรง ระบบไม่มี Product model</small></label>
        <label>ด้านที่กรอกส่วนแบ่ง<select value={draft.shareInput} onChange={(event) => setDraft({ ...draft, shareInput: event.target.value as Draft["shareInput"] })}><option value="OWNER">OWNER (เจ้าของ)</option><option value="WORKER">WORKER (ลูกจ้าง)</option></select></label>
        <p className="notice">ค่านี้ใช้กับรายการขายใหม่และถูกเก็บเป็น snapshot ในแต่ละรายการ คุณเปลี่ยนภายหลังได้โดยไม่กระทบประวัติเดิม</p>
        <div className="farm-create-actions"><Link className="profile-button" href="/farms">ยกเลิก</Link><button className="button primary" disabled={saving}>{saving ? "กำลังสร้างฟาร์ม…" : "สร้างฟาร์ม"}</button></div>
      </form>
      <aside className="panel"><h2>ข้อมูลที่จะสร้าง</h2><dl className="farm-create-summary"><dt>ชื่อฟาร์ม</dt><dd>{draft.name.trim() || "—"}</dd><dt>ผลผลิต</dt><dd>{draft.produceName.trim() || "—"}</dd><dt>กรอกส่วนแบ่ง</dt><dd>{draft.shareInput}</dd><dt>สิทธิ์ของคุณ</dt><dd>ADMIN</dd></dl></aside>
    </div>
  </AppShell>;
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import "../login/login.css";

export default function ResetPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 6 || password !== confirm) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษรและตรงกันทั้งสองช่อง");
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createClient();
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("ไม่พบเซสชันตั้งรหัสผ่าน กรุณาเปิดลิงก์ล่าสุดจากอีเมลอีกครั้ง");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.code === "same_password"
          ? "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม กรุณาใช้รหัสอื่น"
          : "ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }
      await supabase.auth.signOut();
      window.location.assign("/login?status=password-reset");
    } catch {
      setError("ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-page"><section className="login-card">
    <p>LANG SUAN / ACCOUNT</p>
    <h1>ตั้งรหัสผ่านใหม่</h1>
    <form onSubmit={submit}>
      <label>รหัสผ่านใหม่<input name="password" type="password" autoComplete="new-password" minLength={6} required /></label>
      <label>ยืนยันรหัสผ่านใหม่<input name="confirm" type="password" autoComplete="new-password" minLength={6} required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary" disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}</button>
    </form>
  </section></main>;
}

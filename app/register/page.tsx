"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import "../login/login.css";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");

    const form = new FormData(formElement);
    const displayName = String(form.get("displayName")).trim();
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    if (!displayName || displayName.length > 120) {
      setError("ชื่อที่แสดงต้องมีความยาว 1–120 ตัวอักษร");
      setBusy(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (signUpError) {
      setError(signUpError.code === "weak_password"
        ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
        : "ลงทะเบียนไม่สำเร็จ กรุณาตรวจข้อมูลหรือลองใหม่ภายหลัง");
      setBusy(false);
      return;
    }
    if (data.session) {
      await supabase.auth.signOut();
      setError("ระบบยืนยันอีเมลยังไม่ได้เปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
      setBusy(false);
      return;
    }

    formElement.reset();
    setMessage("ลงทะเบียนแล้ว กรุณาเปิดอีเมลและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ");
    setBusy(false);
  }

  return <main className="login-page">
    <section className="login-card">
      <p>LANG SUAN / MVP 1.5</p>
      <h1>ลงทะเบียนใช้งาน</h1>
      <p className="auth-description">หลังลงทะเบียน คุณต้องยืนยันอีเมลก่อนจึงจะเข้าสู่ระบบได้</p>
      <form onSubmit={register}>
        <label>ชื่อที่แสดง<input name="displayName" autoComplete="name" maxLength={120} required /></label>
        <label>อีเมล<input name="email" type="email" autoComplete="email" required /></label>
        <label>รหัสผ่าน<input name="password" type="password" autoComplete="new-password" minLength={6} required /><small>อย่างน้อย 6 ตัวอักษร</small></label>
        {message && <p className="form-success" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy}>{busy ? "กำลังลงทะเบียน…" : "ลงทะเบียน"}</button>
      </form>
      <p className="auth-switch">มีบัญชีแล้ว? <Link href="/login">เข้าสู่ระบบ</Link></p>
    </section>
  </main>;
}

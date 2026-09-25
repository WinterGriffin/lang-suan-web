"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config/env";
import "../login/login.css";

export default function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    try {
      const { error: authError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: new URL("/auth/reset", config.app.baseUrl).toString(),
      });
      if (authError) throw authError;
      setMessage("หากมีบัญชีนี้ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมล");
    } catch {
      setError("ส่งคำขอตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองอีกครั้งภายหลัง");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-page"><section className="login-card">
    <p>LANG SUAN / ACCOUNT</p>
    <h1>ลืมรหัสผ่าน</h1>
    <p className="auth-description">กรอกอีเมลบัญชีของคุณเพื่อรับลิงก์ตั้งรหัสผ่านใหม่</p>
    <form onSubmit={submit}>
      <label>อีเมล<input name="email" type="email" autoComplete="email" required /></label>
      {message && <p className="form-success" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary" disabled={busy}>{busy ? "กำลังส่ง…" : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}</button>
    </form>
    <p className="auth-switch"><Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link></p>
  </section></main>;
}

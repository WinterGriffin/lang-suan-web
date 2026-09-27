"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { config } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/client";
import "../login/login.css";

export default function RegisterPage() {
  const isStaging = config.app.environment === "staging";
  const [mode, setMode] = useState<"checking" | "register" | "link" | "existing">("checking");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) return setMode("register");
      setMode(data.user.identities?.some((identity) => identity.provider === "email") ? "existing" : "link");
    }).catch(() => setMode("register"));
  }, []);

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
    if (mode === "register" && (!displayName || displayName.length > 120)) {
      setError("ชื่อที่แสดงต้องมีความยาว 1–120 ตัวอักษร");
      setBusy(false);
      return;
    }

    const supabase = createClient();
    let result;
    try {
      result = mode === "link"
        ? await supabase.auth.updateUser({ email, password }, {
          emailRedirectTo: new URL("/auth/confirm", config.app.baseUrl).toString(),
        })
        : await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: new URL("/auth/confirm", config.app.baseUrl).toString(),
          },
        });
    } catch {
      setError("เชื่อมต่อระบบลงทะเบียนไม่สำเร็จ กรุณาลองอีกครั้งภายหลัง");
      setBusy(false);
      return;
    }
    const { data, error: signUpError } = result;
    if (signUpError) {
      setError(signUpError.code === "weak_password"
        ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
        : signUpError.code === "over_email_send_rate_limit"
          ? "ส่งอีเมลยืนยันบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่"
          : isStaging && signUpError.code === "unexpected_failure"
            ? "ลงทะเบียนบน Staging ไม่สำเร็จ อีเมลทดสอบอาจยังไม่ได้รับอนุญาต หรือระบบส่งอีเมลขัดข้อง กรุณาติดต่อผู้ดูแลระบบ"
            : mode === "link"
              ? "เพิ่มอีเมลสำหรับเข้าสู่ระบบไม่สำเร็จ กรุณาตรวจข้อมูลหรือลองใหม่ภายหลัง"
              : "ลงทะเบียนไม่สำเร็จ กรุณาตรวจข้อมูลหรือลองใหม่ภายหลัง");
      setBusy(false);
      return;
    }
    if (mode === "register" && "session" in data && data.session) {
      await supabase.auth.signOut();
      setError("ระบบยืนยันอีเมลยังไม่ได้เปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
      setBusy(false);
      return;
    }

    formElement.reset();
    setMessage(mode === "link"
      ? "ส่งอีเมลยืนยันแล้ว กรุณาเปิดลิงก์เพื่อเพิ่มวิธีเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน"
      : "ลงทะเบียนแล้ว กรุณาเปิดอีเมลและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ");
    setBusy(false);
  }

  return <main className="login-page">
    <section className="login-card">
      <p>LANG SUAN / MVP 1.5</p>
      <h1>{mode === "link" ? "เพิ่มอีเมลสำหรับเข้าสู่ระบบ" : "ลงทะเบียนใช้งาน"}</h1>
      <p className="auth-description">{mode === "link" ? "บัญชี LINE ของคุณจะคงเดิม และจะเพิ่มอีเมลพร้อมรหัสผ่านเข้าในบัญชีเดียวกัน" : "หลังลงทะเบียน คุณต้องยืนยันอีเมลก่อนจึงจะเข้าสู่ระบบได้"}</p>
      {isStaging && <p className="auth-description">ระบบทดสอบส่งอีเมลยืนยันเฉพาะที่อยู่ที่ได้รับอนุญาต</p>}
      {mode === "existing" ? <p className="form-success" role="status">บัญชีนี้มีวิธีเข้าสู่ระบบด้วยอีเมลอยู่แล้ว</p> : <form onSubmit={register}>
        {mode === "register" && <label>ชื่อที่แสดง<input name="displayName" autoComplete="name" maxLength={120} required /></label>}
        <label>อีเมล<input name="email" type="email" autoComplete="email" required /></label>
        <label>รหัสผ่าน<input name="password" type="password" autoComplete="new-password" minLength={6} required /><small>อย่างน้อย 6 ตัวอักษร</small></label>
        {message && <p className="form-success" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy || mode === "checking"}>{busy ? "กำลังบันทึก…" : mode === "link" ? "เพิ่มอีเมลและรหัสผ่าน" : "ลงทะเบียน"}</button>
      </form>}
      <p className="auth-switch">มีบัญชีแล้ว? <Link href="/login">เข้าสู่ระบบ</Link></p>
    </section>
  </main>;
}

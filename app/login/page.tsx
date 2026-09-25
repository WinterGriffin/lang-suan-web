"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { authProviders } from "@/lib/auth/providers";
import "./login.css";

function lineAuthCallbackUrl() {
  const url = new URL(window.location.href);
  // `0.0.0.0` is a server bind address, not a browser redirect host.
  if (url.hostname === "0.0.0.0") url.hostname = "localhost";
  url.pathname = "/auth/callback";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "confirmed") setMessage("ยืนยันอีเมลสำเร็จแล้ว กรุณาเข้าสู่ระบบ");
    if (status === "password-reset") setMessage("ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบ");
    if (status === "confirmation-error") setError("ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุ กรุณาลงทะเบียนใหม่หรือตรวจอีเมลฉบับล่าสุด");
    if (status === "oauth-error") setError("เข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาลองใหม่");
    if (status === "profile-error") setError("ตั้งค่าโปรไฟล์จาก LINE ไม่สำเร็จ กรุณาลองใหม่");
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });

    if (authError || !data.user) {
      setError(authError?.code === "email_not_confirmed"
        ? "ยังไม่ได้ยืนยันอีเมล กรุณาเปิดลิงก์ยืนยันในอีเมลก่อนเข้าสู่ระบบ"
        : "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจอีเมลและรหัสผ่าน");
      setBusy(false);
      return;
    }
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setError("ยังไม่ได้ยืนยันอีเมล กรุณาเปิดลิงก์ยืนยันในอีเมลก่อนเข้าสู่ระบบ");
      setBusy(false);
      return;
    }

    const { data: profile, error: profileReadError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile && !profileReadError) {
      const displayName = typeof data.user.user_metadata.display_name === "string"
        ? data.user.user_metadata.display_name.trim()
        : "";
      const { error: profileError } = displayName
        ? await supabase.rpc("ensure_profile", { p_display_name: displayName })
        : { error: new Error("missing display name") };
      if (profileError) {
        await supabase.auth.signOut();
        setError("ตั้งค่าโปรไฟล์ไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ");
        setBusy(false);
        return;
      }
    }

    window.location.assign("/");
    } catch {
      setError("ไม่สามารถติดต่อระบบยืนยันตัวตนได้ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  async function loginWithLine() {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { error: oauthError } = await createClient().auth.signInWithOAuth({
      provider: authProviders.LINE,
      options: { redirectTo: lineAuthCallbackUrl() },
    });
    if (oauthError) {
      setError("ยังไม่สามารถเริ่มเข้าสู่ระบบด้วย LINE ได้ กรุณาตรวจสอบการตั้งค่าระบบ");
      setBusy(false);
    }
  }

  return <main className="login-page">
    <section className="login-card">
      <p>LANG SUAN / MVP 1.5</p>
      <h1>เข้าสู่ระบบหลังสวน</h1>
      <button type="button" className="line-login" disabled={busy} onClick={() => void loginWithLine()}>ดำเนินการต่อด้วย LINE</button>
      <div className="auth-divider" aria-hidden="true"><span>หรือ</span></div>
      <form onSubmit={login}>
        <label>อีเมล<input name="email" type="email" autoComplete="email" required /></label>
        <label>รหัสผ่าน<input name="password" type="password" autoComplete="current-password" required /></label>
        {message && <p className="form-success" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy}>{busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</button>
      </form>
      <p className="auth-switch"><Link href="/forgot-password">ลืมรหัสผ่าน?</Link></p>
      <p className="auth-switch">ยังไม่มีบัญชี? <Link href="/register">ลงทะเบียน</Link></p>
    </section>
  </main>;
}

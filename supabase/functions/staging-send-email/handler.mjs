const stagingOrigin = "https://staging.langsuanapp.com";
const stagingSupabase = "https://orhdmqeojhesaldsuild.supabase.co";
const addressPattern = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

function siteUrlCategory(value) {
  if (value == null || value === "") return "missing";
  if (typeof value !== "string") return "invalid";
  try {
    const url = new URL(value);
    if (url.origin === stagingOrigin) return "staging_noncanonical";
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return "localhost";
    if (url.hostname === "app.langsuanapp.com") return "production";
    return "other_origin";
  } catch { return "invalid"; }
}

export function parseStagingAllowlist(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("allowlist_configuration");
  const entries = value.split(",").map((entry) => entry.trim().toLowerCase());
  if (!entries.length || entries.length > 100 || entries.some((entry) => !addressPattern.test(entry))) throw new Error("allowlist_configuration");
  return new Set(entries);
}

export function prepareAuthEmail(payload, allowlist) {
  const user = payload?.user;
  const data = payload?.email_data;
  const originalRecipient = user?.email?.trim();
  const recipient = originalRecipient?.toLowerCase();
  if (typeof user?.id !== "string" || !/^[a-f0-9-]{36}$/i.test(user.id)) throw new Error("invalid_auth_user");
  if (!recipient || !addressPattern.test(recipient) || !allowlist.has(recipient)) throw new Error("recipient_blocked");
  if (data.redirect_to) {
    let redirect;
    try { redirect = new URL(data.redirect_to); } catch { throw new Error("auth_redirect_url_invalid"); }
    if (redirect.origin !== stagingOrigin) throw new Error("auth_redirect_origin_mismatch");
  }
  const action = data.email_action_type;
  if (!["signup", "recovery"].includes(action)) throw new Error("unsupported_auth_email");
  if (typeof data.token_hash !== "string" || !/^(?:pkce_)?[a-fA-F0-9]{40,128}$/.test(data.token_hash)) throw new Error("invalid_auth_token");
  const url = new URL(action === "signup" ? "/auth/confirm" : "/auth/reset", stagingOrigin);
  url.searchParams.set("token_hash", data.token_hash);
  url.searchParams.set("type", action === "signup" ? "email" : "recovery");
  const confirmationUrl = url.toString();
  const htmlUrl = confirmationUrl.replaceAll("&", "&amp;");
  const isSignup = action === "signup";
  const subject = isSignup ? "ยืนยันการลงทะเบียนใช้งาน LangSuan" : "ตั้งรหัสผ่านใหม่ LangsuanApp";
  const text = isSignup
    ? `เรียน ท่านผู้ใช้งาน\n\nขอบพระคุณที่ลงทะเบียนใช้งาน LangSuan\n\nเพื่อยืนยันอีเมลและเปิดใช้งานบัญชีของท่าน กรุณาคลิกปุ่ม “ยืนยันการลงทะเบียน” ด้านล่าง\n\nยืนยันการลงทะเบียน: ${confirmationUrl}\n\nหากท่านไม่ได้เป็นผู้ดำเนินการลงทะเบียน สามารถละเว้นอีเมลฉบับนี้ได้ โดยไม่จำเป็นต้องดำเนินการใด ๆ เพิ่มเติม\n\nเพื่อความปลอดภัย LangSuan จะไม่ขอให้ท่านแจ้งรหัสผ่าน รหัส OTP หรือข้อมูลสำคัญของบัญชีผ่านทางอีเมล\n\nขอแสดงความนับถือ\nทีมงาน LangSuan\n\nอีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลฉบับนี้`
    : `ตั้งรหัสผ่านใหม่: ${confirmationUrl}`;
  const html = isSignup
    ? `<!doctype html><html lang="th"><body style="font-family:Arial,sans-serif;color:#1d3028;line-height:1.8"><h1 style="font-size:24px">${subject}</h1><p>เรียน ท่านผู้ใช้งาน</p><p>ขอบพระคุณที่ลงทะเบียนใช้งาน <strong>LangSuan</strong></p><p>เพื่อยืนยันอีเมลและเปิดใช้งานบัญชีของท่าน กรุณาคลิกปุ่ม <strong>“ยืนยันการลงทะเบียน”</strong> ด้านล่าง</p><p><a href="${htmlUrl}" style="display:inline-block;background:#1d513b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">ยืนยันการลงทะเบียน</a></p><p>หากท่านไม่ได้เป็นผู้ดำเนินการลงทะเบียน สามารถละเว้นอีเมลฉบับนี้ได้ โดยไม่จำเป็นต้องดำเนินการใด ๆ เพิ่มเติม</p><p>เพื่อความปลอดภัย LangSuan จะไม่ขอให้ท่านแจ้งรหัสผ่าน รหัส OTP หรือข้อมูลสำคัญของบัญชีผ่านทางอีเมล</p><p>ขอแสดงความนับถือ<br>ทีมงาน LangSuan</p><p style="font-size:12px;color:#607168"><em>อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลฉบับนี้</em></p></body></html>`
    : `<!doctype html><html lang="th"><body style="font-family:Arial,sans-serif;color:#1d3028"><h1>${subject}</h1><p><a href="${htmlUrl}">ตั้งรหัสผ่านใหม่</a></p><p>หากไม่ได้ร้องขออีเมลนี้ ไม่ต้องดำเนินการใด ๆ</p></body></html>`;
  return {
    from: "LangsuanApp <no-reply@auth.langsuanapp.com>",
    to: [originalRecipient],
    subject,
    text,
    html,
    action,
    tokenHash: data.token_hash,
  };
}

function denied(status, code) {
  return new Response(JSON.stringify({ error: { http_code: status, message: "Authentication email unavailable." } }), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Email-Result": code } });
}

export async function handleStagingAuthEmail(request, { env, verify, send, logger = console } = {}) {
  const reject = (status, code) => {
    logger.warn?.(JSON.stringify({ provider: "resend", environment: "staging", status: "denied", category: code, timestamp: new Date().toISOString() }));
    return denied(status, code);
  };
  if (request.method !== "POST") return reject(405, "method");
  if (env?.APP_ENV !== "staging" || env?.SUPABASE_URL !== stagingSupabase || !env?.RESEND_API_KEY || !env?.SEND_EMAIL_HOOK_SECRET) return reject(503, "configuration");
  let allowlist;
  try { allowlist = parseStagingAllowlist(env.STAGING_EMAIL_ALLOWLIST); } catch { return reject(503, "allowlist_configuration"); }
  if (Number(request.headers.get("content-length")) > 32768) return reject(413, "size");
  const raw = await request.text();
  if (raw.length > 32768) return reject(413, "size");
  let payload;
  try { payload = await verify(raw, Object.fromEntries(request.headers)); } catch { return reject(401, "signature"); }
  let message;
  try { message = prepareAuthEmail(payload, allowlist); } catch (error) {
    const code = ["invalid_auth_user", "recipient_blocked", "auth_redirect_url_invalid", "auth_redirect_origin_mismatch", "unsupported_auth_email", "invalid_auth_token"].includes(error?.message) ? error.message : "policy";
    return reject(403, code);
  }
  try {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${payload.user.id}:${message.action}:${message.tokenHash}`));
    const idempotencyKey = `staging-auth-${Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    const { action, tokenHash, ...email } = message;
    const messageId = await send(email, idempotencyKey);
    logger.info?.(JSON.stringify({ provider: "resend", environment: "staging", type: action, status: "sent", messageId, siteUrlCategory: siteUrlCategory(payload?.email_data?.site_url), timestamp: new Date().toISOString() }));
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    logger.error?.(JSON.stringify({ provider: "resend", environment: "staging", type: message.action, status: "failed", timestamp: new Date().toISOString() }));
    return denied(502, "delivery");
  }
}

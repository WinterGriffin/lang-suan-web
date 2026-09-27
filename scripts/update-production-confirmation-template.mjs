import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadAdministrationSecrets } from "./load-admin-secrets.mjs";
import { verifyHostedAuth } from "./verify-hosted-auth.mjs";

export const productionConfirmationSubject = "ยืนยันการลงทะเบียนใช้งาน LangSuan";

export const productionConfirmationTemplate = `<!doctype html><html lang="th"><body style="font-family:Arial,sans-serif;color:#1d3028;line-height:1.8"><h1 style="font-size:24px">${productionConfirmationSubject}</h1><p>เรียน ท่านผู้ใช้งาน</p><p>ขอบพระคุณที่ลงทะเบียนใช้งาน <strong>LangSuan</strong></p><p>เพื่อยืนยันอีเมลและเปิดใช้งานบัญชีของท่าน กรุณาคลิกปุ่ม <strong>“ยืนยันการลงทะเบียน”</strong> ด้านล่าง</p><p><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1d513b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">ยืนยันการลงทะเบียน</a></p><p>หากท่านไม่ได้เป็นผู้ดำเนินการลงทะเบียน สามารถละเว้นอีเมลฉบับนี้ได้ โดยไม่จำเป็นต้องดำเนินการใด ๆ เพิ่มเติม</p><p>เพื่อความปลอดภัย LangSuan จะไม่ขอให้ท่านแจ้งรหัสผ่าน รหัส OTP หรือข้อมูลสำคัญของบัญชีผ่านทางอีเมล</p><p>ขอแสดงความนับถือ<br>ทีมงาน LangSuan</p><p style="font-size:12px;color:#607168"><em>อีเมลฉบับนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลฉบับนี้</em></p></body></html>`;

export function confirmationTemplatePatch() {
  return {
    mailer_subjects_confirmation: productionConfirmationSubject,
    mailer_templates_confirmation_content: productionConfirmationTemplate,
  };
}

export async function updateProductionConfirmationTemplate(fetchImpl = fetch) {
  const { parameters, secrets } = loadAdministrationSecrets("production", ["SUPABASE_ACCESS_TOKEN"]);
  const endpoint = `https://api.supabase.com/v1/projects/${parameters.SUPABASE_PROJECT_REF}/config/auth`;
  const response = await fetchImpl(endpoint, {
    method: "PATCH",
    headers: { authorization: `Bearer ${secrets.SUPABASE_ACCESS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(confirmationTemplatePatch()),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Production confirmation-template update failed (${response.status}).`);
  const auth = await response.json();
  verifyHostedAuth("production", parameters, auth);
  if (auth.mailer_subjects_confirmation !== productionConfirmationSubject || auth.mailer_templates_confirmation_content !== productionConfirmationTemplate) {
    throw new Error("Production confirmation-template update was not retained.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await updateProductionConfirmationTemplate();
  console.log("Production signup confirmation template updated and Auth delivery policy verified.");
}

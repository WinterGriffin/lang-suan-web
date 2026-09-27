import test from "node:test";
import assert from "node:assert/strict";
import { confirmationTemplatePatch, productionConfirmationSubject, productionConfirmationTemplate } from "../scripts/update-production-confirmation-template.mjs";

test("production signup confirmation template is Thai registration copy with a Supabase confirmation link", () => {
  const patch = confirmationTemplatePatch();
  assert.deepEqual(Object.keys(patch).sort(), ["mailer_subjects_confirmation", "mailer_templates_confirmation_content"]);
  assert.equal(patch.mailer_subjects_confirmation, productionConfirmationSubject);
  assert.equal(patch.mailer_templates_confirmation_content, productionConfirmationTemplate);
  for (const phrase of ["ยืนยันการลงทะเบียนใช้งาน LangSuan", "ขอบพระคุณที่ลงทะเบียนใช้งาน", "ยืนยันการลงทะเบียน", "หากท่านไม่ได้เป็นผู้ดำเนินการลงทะเบียน", "จะไม่ขอให้ท่านแจ้งรหัสผ่าน รหัส OTP"]) assert.ok(productionConfirmationTemplate.includes(phrase), phrase);
  assert.match(productionConfirmationTemplate, /href="\{\{ \.ConfirmationURL \}\}"/);
  assert.doesNotMatch(productionConfirmationTemplate, /localhost|staging\.langsuanapp\.com/);
});

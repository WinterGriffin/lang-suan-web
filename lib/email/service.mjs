// Server-side application mail only. Supabase Auth mail uses its own SMTP setting.
const addressPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export class EmailError extends Error {
  constructor(category) {
    super(`Email delivery failed (${category}).`);
    this.name = "EmailError";
    this.category = category;
  }
}

export function validateEmailConfig(env) {
  if (!["local", "staging", "production"].includes(env.EMAIL_ENV) || env.EMAIL_PROVIDER !== "resend") throw new EmailError("configuration");
  if (!env.EMAIL_FROM_NAME?.trim() || !addressPattern.test(env.EMAIL_FROM_ADDRESS ?? "")) throw new EmailError("configuration");
  if (env.EMAIL_ENV === "production" && env.EMAIL_ALLOWED_RECIPIENTS) throw new EmailError("configuration");
  if (env.EMAIL_ENV === "staging" && !env.EMAIL_ALLOWED_RECIPIENTS) throw new EmailError("configuration");
  if (!env.RESEND_API_KEY) throw new EmailError("configuration");
  return {
    from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`,
    allowed: (env.EMAIL_ALLOWED_RECIPIENTS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter((s) => s && s !== "none"),
  };
}

function categoryForStatus(status) {
  if (status === 429) return "rate_limit";
  if (status >= 500) return "temporary_delivery";
  if (status === 401 || status === 403) return "configuration";
  if (status === 422) return "invalid_recipient";
  return "provider";
}

export function createEmailService({ env = process.env, transport = fetch, logger = console, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {}) {
  async function sendEmail({ to, subject, html, text, type, idempotencyKey = crypto.randomUUID() }) {
    const timestamp = new Date().toISOString();
    const log = (status, details = {}) => logger.info?.(JSON.stringify({ provider: "resend", type, environment: env.EMAIL_ENV, status, timestamp, ...details }));
    try {
      const { from, allowed } = validateEmailConfig(env);
      const recipients = (Array.isArray(to) ? to : [to]).map((value) => String(value).trim());
      if (!recipients.length || recipients.some((value) => !addressPattern.test(value))) throw new EmailError("invalid_recipient");
      if (env.EMAIL_ENV !== "production" && recipients.some((value) => !allowed.includes(value.toLowerCase()))) throw new EmailError("recipient_blocked");
      if (!type || !subject?.trim() || (!html && !text) || !idempotencyKey || idempotencyKey.length > 256) throw new EmailError("configuration");
      const body = { from, to: recipients, subject, ...(html ? { html } : {}), ...(text ? { text } : {}) };
      for (let attempt = 0; attempt < 3; attempt++) {
        let response;
        try {
          response = await transport("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10000),
          });
        } catch {
          if (attempt < 2) { await wait(200 * (attempt + 1)); continue; }
          throw new EmailError("temporary_delivery");
        }
        if (response.ok) {
          const result = await response.json();
          if (typeof result.id !== "string") throw new EmailError("provider");
          log("sent", { messageId: result.id });
          return { messageId: result.id };
        }
        const category = categoryForStatus(response.status);
        if (["rate_limit", "temporary_delivery"].includes(category) && attempt < 2) { await wait(200 * (attempt + 1)); continue; }
        throw new EmailError(category);
      }
      throw new EmailError("temporary_delivery");
    } catch (error) {
      const category = error instanceof EmailError ? error.category : "provider";
      log("failed", { category });
      throw error instanceof EmailError ? error : new EmailError(category);
    }
  }
  return { sendEmail };
}

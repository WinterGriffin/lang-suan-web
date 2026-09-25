// @ts-nocheck -- Supabase Edge Functions run in Deno, outside the Next.js tsconfig.
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { handleStagingAuthEmail } from "./handler.mjs";

Deno.serve((request) => handleStagingAuthEmail(request, {
  env: {
    APP_ENV: Deno.env.get("APP_ENV"),
    SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
    STAGING_EMAIL_ALLOWLIST: Deno.env.get("STAGING_EMAIL_ALLOWLIST"),
    RESEND_API_KEY: Deno.env.get("RESEND_API_KEY"),
    SEND_EMAIL_HOOK_SECRET: Deno.env.get("SEND_EMAIL_HOOK_SECRET"),
  },
  verify: (raw, headers) => {
    const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    if (!secret?.startsWith("v1,whsec_")) throw new Error("Invalid hook secret");
    return new Webhook(secret.slice("v1,whsec_".length)).verify(raw, headers);
  },
  send: async (message, idempotencyKey) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) throw new Error("Resend delivery failed");
    const result = await response.json();
    if (typeof result.id !== "string") throw new Error("Resend did not return a message ID");
    return result.id;
  },
}));

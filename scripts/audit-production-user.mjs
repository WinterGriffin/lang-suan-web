import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadAdministrationSecrets } from "./load-admin-secrets.mjs";

export function auditQuery(userId) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) throw new Error("User ID must be a UUID.");
  return `with target as (select id,email,email_confirmed_at from auth.users where id = '${userId}') select json_build_object('auth_user_exists', exists(select 1 from target), 'email_confirmed', coalesce((select email_confirmed_at is not null from target),false), 'same_verified_email_user_count', (select count(*) from auth.users u join target t on lower(u.email)=lower(t.email) where u.email_confirmed_at is not null), 'identity_providers', coalesce((select json_agg(i.provider order by i.provider) from auth.identities i where i.user_id='${userId}'),'[]'::json), 'profile_exists', exists(select 1 from public.profiles where id='${userId}'), 'farm_references', (select count(*) from public.farms where created_by='${userId}' or updated_by='${userId}'), 'membership_references', (select count(*) from public.user_farm_roles where user_id='${userId}' or created_by='${userId}' or updated_by='${userId}'), 'sale_references', (select count(*) from public.sales where created_by='${userId}' or updated_by='${userId}'), 'audit_references', (select count(*) from public.audit_logs where actor_id='${userId}'), 'storage_references', (select count(*) from storage.objects where owner_id='${userId}') ) as result`;
}

export async function auditProductionUser(userId, fetchImpl = fetch) {
  const { parameters, secrets } = loadAdministrationSecrets("production", ["SUPABASE_ACCESS_TOKEN"]);
  const response = await fetchImpl(`https://api.supabase.com/v1/projects/${parameters.SUPABASE_PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${secrets.SUPABASE_ACCESS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ query: auditQuery(userId), read_only: true }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Production read-only identity audit failed (${response.status}).`);
  const body = await response.json();
  const row = Array.isArray(body) ? body[0] : body;
  if (!row?.result || typeof row.result !== "object") throw new Error("Production identity audit returned an invalid response.");
  return row.result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await auditProductionUser(process.argv[2] ?? "");
  console.log(JSON.stringify(result));
}

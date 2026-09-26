// Reconcile only the exact records returned by Resend for auth.langsuanapp.com.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadAdministrationSecrets } from "./load-admin-secrets.mjs";

const domain = "auth.langsuanapp.com";
const zone = JSON.parse(readFileSync(new URL("../config/cloudflare-domains.json", import.meta.url), "utf8"));

export function ownedName(name) {
  const value = name.toLowerCase().replace(/\.$/, "");
  const parent = domain.slice(domain.indexOf(".") + 1);
  // Resend returns names relative to the DNS zone (e.g. send.auth), but
  // older responses and fixtures may be relative to the sending domain.
  const full = value === "@" ? domain
    : value === parent || value.endsWith(`.${parent}`) ? value
    : value === domain.slice(0, domain.indexOf(".")) || value.endsWith(`.${domain.slice(0, domain.indexOf("."))}`) ? `${value}.${parent}`
    : `${value}.${domain}`;
  if (full !== domain && !full.endsWith(`.${domain}`)) throw new Error("Resend record is outside the owned sending domain.");
  return full;
}

export function planRecords(resendRecords, existingByName) {
  const actions = [];
  for (const item of resendRecords) {
    if (!item || !["TXT", "MX", "CNAME"].includes(item.type) || !item.name || !item.value || (item.type === "MX" && !Number.isInteger(item.priority))) throw new Error("Unexpected Resend DNS record; manual review required.");
    const name = ownedName(item.name);
    const current = existingByName[name] ?? [];
    const content = item.value.replace(/\.$/, "");
    if (current.some((record) => record.type === item.type && record.content.replace(/\.$/, "") === content && (item.type !== "MX" || record.priority === item.priority))) {
      actions.push({ action: "unchanged", type: item.type, name, content });
      continue;
    }
    if (current.some((record) => record.type === "CNAME" || item.type === "CNAME")) throw new Error(`Conflicting CNAME at ${name}; no DNS changes made.`);
    if (item.type === "TXT" && current.some((record) => record.type === "TXT" && (record.content.startsWith("v=spf1") || item.value.startsWith("v=spf1") || item.record === "DKIM"))) throw new Error(`Existing SPF/DKIM TXT at ${name} requires manual review; no DNS changes made.`);
    if (item.type === "MX" && current.some((record) => record.type === "MX")) throw new Error(`Existing MX at ${name} requires manual review; no DNS changes made.`);
    actions.push({ action: "create", type: item.type, name, content, ...(item.type === "MX" ? { priority: item.priority } : {}) });
  }
  return actions;
}

async function json(url, token, options = {}) {
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}) } });
  if (!response.ok) throw new Error(`DNS provider request failed (${response.status}); no further changes made.`);
  const data = await response.json();
  if (data.success === false) throw new Error("Cloudflare DNS request was rejected; no further changes made.");
  return data;
}

async function main() {
  const [environment, mode, ...options] = process.argv.slice(2);
  const ci = options.includes("--ci");
  if (!["staging", "production"].includes(environment)) throw new Error("Choose staging or production explicitly.");
  if (!["audit", "apply"].includes(mode)) throw new Error("Choose audit or apply.");
  const { secrets } = loadAdministrationSecrets(environment, ["RESEND_API_KEY", "CLOUDFLARE_API_TOKEN"], { source: ci ? "ci" : "local" });
  const resendHeaders = { Authorization: `Bearer ${secrets.RESEND_API_KEY}` };
  const listResponse = await fetch("https://api.resend.com/domains", { headers: resendHeaders });
  if (!listResponse.ok) throw new Error(`Resend domain lookup failed (${listResponse.status}).`);
  const listed = await listResponse.json();
  const selected = listed.data?.find((item) => item.name === domain);
  if (!selected) throw new Error(`Add ${domain} as a sending domain in Resend first; no DNS changes made.`);
  const detailResponse = await fetch(`https://api.resend.com/domains/${encodeURIComponent(selected.id)}`, { headers: resendHeaders });
  if (!detailResponse.ok) throw new Error(`Resend domain record lookup failed (${detailResponse.status}).`);
  const detail = await detailResponse.json();
  if (detail.name !== domain || !Array.isArray(detail.records) || !detail.records.length) throw new Error("Resend did not return verified-domain record requirements.");
  const names = [...new Set(detail.records.map((record) => ownedName(record.name)))];
  const existingByName = {};
  for (const name of names) {
    const url = new URL(`https://api.cloudflare.com/client/v4/zones/${zone.zoneId}/dns_records`);
    url.searchParams.set("name", name);
    url.searchParams.set("per_page", "100");
    const data = await json(url, secrets.CLOUDFLARE_API_TOKEN);
    if (data.result_info?.total_pages > 1) throw new Error(`Too many DNS records at ${name}; manual review required.`);
    existingByName[name] = data.result ?? [];
  }
  const actions = planRecords(detail.records, existingByName);
  for (const item of actions) console.log(`${item.action}: ${item.type} ${item.name} ${item.content}`);
  if (mode === "audit") return;
  for (const item of actions.filter((item) => item.action === "create")) {
    const body = { type: item.type, name: item.name, content: item.content, ttl: 1, proxied: false, comment: "LangSuan Resend auth sending domain", ...(item.type === "MX" ? { priority: item.priority } : {}) };
    await json(`https://api.cloudflare.com/client/v4/zones/${zone.zoneId}/dns_records`, secrets.CLOUDFLARE_API_TOKEN, { method: "POST", body: JSON.stringify(body) });
    console.log(`created: ${item.type} ${item.name}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

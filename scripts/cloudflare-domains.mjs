import { readFileSync } from "node:fs";
import { resolve4, resolve6, resolveCname } from "node:dns/promises";
import { loadParameters } from "./load-parameters.mjs";

const [environment, action, confirmation] = process.argv.slice(2);
if (!["staging", "production", "root"].includes(environment) || !["audit", "apply"].includes(action)) {
  throw new Error("Usage: cloudflare-domains.mjs staging|production audit|apply, or root audit [--confirm-production]");
}
if (environment === "root" && action === "apply") {
  throw new Error("Root domain is reserved for independent Marketing; legacy redirect Worker attachment is disabled.");
}
if (environment !== "staging" && action === "apply" && confirmation !== "--confirm-production") {
  throw new Error("Production domain changes require --confirm-production after staging acceptance.");
}

const desired = JSON.parse(readFileSync(new URL("../config/cloudflare-domains.json", import.meta.url), "utf8"));
const target = desired[environment];
if (environment !== "root") {
  const parameters = loadParameters(environment);
  if (new URL(parameters.APP_BASE_URL).hostname !== target.hostname || parameters.CLOUDFLARE_WORKER_NAME !== target.worker) {
    throw new Error("Worker domain does not match the selected environment parameters.");
  }
}
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) throw new Error("CLOUDFLARE_API_TOKEN is required (never store it in this file).");

async function cloudflare(method, path, body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(`Cloudflare ${method} ${path} failed (${response.status}; codes: ${(data.errors ?? []).map((error) => error.code).join(",")}).`);
  }
  return data.result;
}

async function publicAddressRecords(hostname) {
  const queries = [resolve4, resolve6, resolveCname];
  const results = await Promise.all(queries.map(async (query) => {
    try { return await query(hostname); }
    catch (error) {
      if (["ENODATA", "ENOTFOUND", "ENOTIMP"].includes(error.code)) return [];
      throw error;
    }
  }));
  return results.flat();
}

const path = `/accounts/${desired.accountId}/workers/domains?hostname=${encodeURIComponent(target.hostname)}`;
const domains = await cloudflare("GET", path);
const existing = domains.find((domain) => domain.hostname === target.hostname);
if (existing) {
  if (existing.service !== target.worker || existing.zone_id !== desired.zoneId) {
    throw new Error(`${target.hostname} belongs to another Worker or zone; refusing to reassign it.`);
  }
  console.log(`${target.hostname}: already attached to ${target.worker}; unchanged.`);
} else {
  const addresses = await publicAddressRecords(target.hostname);
  if (addresses.length) throw new Error(`${target.hostname} already resolves; inspect DNS ownership before attaching a Worker.`);
  if (action === "audit") console.log(`${target.hostname}: absent; safe to attach after confirming Cloudflare DNS has no private/conflicting record.`);
  else {
    const result = await cloudflare("PUT", `/accounts/${desired.accountId}/workers/domains`, {
      hostname: target.hostname,
      service: target.worker,
      zone_id: desired.zoneId,
      zone_name: desired.zoneName,
    });
    if (result.hostname !== target.hostname || result.service !== target.worker) throw new Error("Cloudflare returned an unexpected domain mapping.");
    console.log(`${target.hostname}: attached to ${target.worker}. DNS and TLS provisioning may take time.`);
  }
}

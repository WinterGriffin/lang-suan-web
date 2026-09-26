import { readFileSync } from "node:fs";
import { loadAdministrationSecrets } from "./load-admin-secrets.mjs";

const environment = process.argv[2];
const ci = process.argv.includes("--ci");
if (!["staging", "production"].includes(environment)) throw new Error("Usage: audit-cloudflare-tls.mjs staging|production [--ci]");
const { secrets } = loadAdministrationSecrets(environment, ["CLOUDFLARE_API_TOKEN"], { source: ci ? "ci" : "local" });
const { zoneId } = JSON.parse(readFileSync("config/cloudflare-domains.json", "utf8"));

for (const setting of ["ssl", "always_use_https", "min_tls_version", "tls_1_3", "security_header"]) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/${setting}`, {
    headers: { authorization: `Bearer ${secrets.CLOUDFLARE_API_TOKEN}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    console.log(`${setting}: unavailable (${response.status})`);
    continue;
  }
  const body = await response.json();
  if (!body.success) {
    console.log(`${setting}: unavailable`);
    continue;
  }
  const value = setting === "security_header" ? body.result.value?.strict_transport_security : body.result.value;
  console.log(`${setting}: ${JSON.stringify(value)}`);
}

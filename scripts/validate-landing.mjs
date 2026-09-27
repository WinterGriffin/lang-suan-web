import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const siteRoot = resolve("landing-page/public");
const requiredFiles = [
  "index.html",
  "styles.css",
  "overrides.css",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
];

function fail(message) {
  throw new Error(`Landing validation failed: ${message}`);
}

for (const file of requiredFiles) {
  if (!existsSync(resolve(siteRoot, file))) fail(`missing ${file}`);
}

const read = (file) => readFileSync(resolve(siteRoot, file), "utf8");
const html = read("index.html");
const styles = read("styles.css");
const robots = read("robots.txt");
const sitemap = read("sitemap.xml");
const manifest = JSON.parse(read("site.webmanifest"));

for (const asset of ["styles.css", "overrides.css", "/site.webmanifest"]) {
  if (!html.includes(`href="${asset}"`)) fail(`index.html does not reference ${asset}`);
}
if (!html.includes('<link rel="canonical" href="https://www.langsuanapp.com/"')) {
  fail("canonical URL is not https://www.langsuanapp.com/");
}
const appCtas = [...html.matchAll(/href="https:\/\/app\.langsuanapp\.com"/g)];
if (appCtas.length !== 4) fail(`expected 4 app CTAs, found ${appCtas.length}`);
if (!robots.includes("Sitemap: https://www.langsuanapp.com/sitemap.xml")) {
  fail("robots.txt sitemap URL is incorrect");
}
if (!sitemap.includes("<loc>https://www.langsuanapp.com/</loc>")) {
  fail("sitemap.xml canonical URL is incorrect");
}
if (manifest.start_url !== "/" || manifest.display !== "browser") {
  fail("site.webmanifest does not preserve the root browser entry point");
}
if (!styles.includes("@media(max-width:760px)") || !styles.includes("@media(max-width:380px)")) {
  fail("required mobile breakpoints are missing");
}
if (!styles.includes(".three-grid,.feature-grid{grid-template-columns:1fr")) {
  fail("mobile feature-card layout is missing");
}

console.log(`Landing static validation passed (${requiredFiles.length} required files).`);

import { loadParameters } from "./load-parameters.mjs";
const flags=["THAI_BUDDHIST_ERA","ENABLE_LINE_LOGIN","ENABLE_GOOGLE_LOGIN","ENABLE_FACEBOOK_LOGIN","ENABLE_APPLE_LOGIN","ENABLE_DEBUG_TOOLS"];
const bad=/(localhost|127\.0\.0\.1|0\.0\.0\.0|REPLACE_WITH|<[^>]+>)/i;
const fail=(m)=>{throw new Error(`Unsafe environment configuration: ${m}`)};
export function validate(p,{forDeploy=false}={}) {
  for(const key of flags) if(!/^(true|false)$/.test(p[key])) fail(`${key} is not Boolean`);
  const base=new URL(p.APP_BASE_URL), callback=new URL(p.APP_AUTH_CALLBACK_URL), supabase=new URL(p.SUPABASE_URL);
  if(callback.origin!==base.origin||callback.pathname!=="/auth/callback") fail("callback must be APP_BASE_URL/auth/callback");
  if(p.APP_ENV!=="local"&&!supabase.hostname.startsWith(`${p.SUPABASE_PROJECT_REF}.`)) fail("Supabase ref mismatch");
  if(p.APP_ENV!=="local") for(const value of [p.APP_BASE_URL,p.APP_AUTH_CALLBACK_URL,p.SUPABASE_URL]) if(bad.test(value)||new URL(value).protocol!=="https:") fail("non-local URL is unsafe");
  if(p.APP_ENV==="production" && (/staging/i.test(p.APP_BASE_URL)||p.SUPABASE_PROJECT_REF==="orhdmqeojhesaldsuild"||p.LOG_LEVEL==="debug"||p.ENABLE_DEBUG_TOOLS!=="false")) fail("production points to staging or debug configuration");
  if(forDeploy && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) fail("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");
  if(forDeploy && p.APP_ENV==="production" && !process.env.CLOUDFLARE_API_TOKEN) fail("CLOUDFLARE_API_TOKEN is required");
}
if(import.meta.url===`file:///${process.argv[1].replace(/\\/g,"/")}`){try{const p=loadParameters(process.argv[2]);validate(p,{forDeploy:process.argv.includes("--for-deploy")});console.log(`Validated ${p.APP_ENV}.`)}catch(e){console.error(e.message);process.exitCode=1}}

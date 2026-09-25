import { loadParameters } from "./load-parameters.mjs";
const flags=["THAI_BUDDHIST_ERA","ENABLE_LINE_LOGIN","ENABLE_GOOGLE_LOGIN","ENABLE_FACEBOOK_LOGIN","ENABLE_APPLE_LOGIN","ENABLE_DEBUG_TOOLS"];
const bad=/(localhost|127\.0\.0\.1|0\.0\.0\.0|REPLACE_WITH|<[^>]+>)/i;
const fail=(m)=>{throw new Error(`Unsafe environment configuration: ${m}`)};
export function validate(p,{forDeploy=false,secretEnv=process.env}={}) {
  const expectedWorkers={local:"lang-suan-local",staging:"lang-suan-staging",production:"lang-suan"};
  if(p.CLOUDFLARE_WORKER_NAME!==expectedWorkers[p.APP_ENV]) fail("Cloudflare Worker name does not match environment");
  const expectedOrigins={local:"https://localhost",staging:"https://staging.langsuanapp.com",production:"https://app.langsuanapp.com"};
  if(p.APP_BASE_URL!==expectedOrigins[p.APP_ENV]) fail("application origin does not match environment");
  for(const key of flags) if(!/^(true|false)$/.test(p[key])) fail(`${key} is not Boolean`);
  const expectedLineName=p.APP_ENV==="production"?"LangSuanAppPrd":"LangSuanAppDev";
  if(p.LINE_DEVELOPERS_PROVIDER_NAME!==expectedLineName||p.LINE_LOGIN_CHANNEL_NAME!==expectedLineName) fail("LINE Developers provider/channel does not match environment");
  const base=new URL(p.APP_BASE_URL), callback=new URL(p.APP_AUTH_CALLBACK_URL), supabase=new URL(p.SUPABASE_URL);
  if(base.protocol!=="https:") fail("application origin must use HTTPS");
  if(p.APP_ENV==="local" && (supabase.origin!==base.origin || p.SUPABASE_URL_INTERNAL!=="http://127.0.0.1:54321")) fail("local Supabase must use the HTTPS proxy in the browser and loopback internally");
  const expectedSupabaseCallback=p.APP_ENV==="local"?"https://localhost/auth/v1/callback":`${p.SUPABASE_URL}/auth/v1/callback`;
  if(p.SUPABASE_AUTH_CALLBACK_URL!==expectedSupabaseCallback) fail("Supabase OAuth callback does not match environment");
  if(callback.origin!==base.origin||callback.pathname!=="/auth/callback") fail("callback must be APP_BASE_URL/auth/callback");
  if(p.APP_ENV!=="local"&&!supabase.hostname.startsWith(`${p.SUPABASE_PROJECT_REF}.`)) fail("Supabase ref mismatch");
  if(p.APP_ENV!=="local") for(const value of [p.APP_BASE_URL,p.APP_AUTH_CALLBACK_URL,p.SUPABASE_URL]) if(bad.test(value)||new URL(value).protocol!=="https:") fail("non-local URL is unsafe");
  if(p.APP_ENV==="production" && (/staging/i.test(p.APP_BASE_URL)||p.SUPABASE_PROJECT_REF==="orhdmqeojhesaldsuild"||p.LOG_LEVEL==="debug"||p.ENABLE_DEBUG_TOOLS!=="false")) fail("production points to staging or debug configuration");
  if(p.EMAIL_PROVIDER!=="resend"||p.EMAIL_ENV!==p.APP_ENV) fail("email provider or environment mismatch");
  if(!p.EMAIL_FROM_NAME?.trim() || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(p.EMAIL_FROM_ADDRESS??"")) fail("invalid email sender");
  if(p.EMAIL_FROM_ADDRESS!=="no-reply@auth.langsuanapp.com") fail("email sender domain mismatch");
  if(p.APP_ENV==="staging" && !p.EMAIL_ALLOWED_RECIPIENTS) fail("staging recipient guard is missing");
  if(p.APP_ENV==="production" && p.EMAIL_ALLOWED_RECIPIENTS) fail("production must not use staging recipient restrictions");
  if(p.APP_ENV==="production" && (bad.test(p.APP_AUTH_CALLBACK_URL)||/staging\.langsuanapp\.com/i.test(p.APP_AUTH_CALLBACK_URL))) fail("production email callback URL is unsafe");
  if(forDeploy && p.APP_ENV==="production" && !secretEnv.RESEND_API_KEY) fail("RESEND_API_KEY is required for production deployment");
  if(forDeploy && !secretEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) fail("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");
  if(forDeploy && p.APP_ENV==="production" && !secretEnv.CLOUDFLARE_API_TOKEN) fail("CLOUDFLARE_API_TOKEN is required");
}
if(import.meta.url===`file:///${process.argv[1].replace(/\\/g,"/")}`){try{const p=loadParameters(process.argv[2]);validate(p,{forDeploy:process.argv.includes("--for-deploy")});console.log(`Validated ${p.APP_ENV}.`)}catch(e){console.error(e.message);process.exitCode=1}}

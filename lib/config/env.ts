const boolean=(value:string|undefined,fallback:boolean)=>value===undefined?fallback:value==="true";
const environment=process.env.NEXT_PUBLIC_APP_ENV??"local";
const base=process.env.NEXT_PUBLIC_APP_BASE_URL??process.env.APP_URL;
if(!base) throw new Error("APP_URL is required outside local development");
if(new URL(base).protocol!=="https:") throw new Error("APP_URL must use HTTPS");
export const config={
  app:{environment,baseUrl:base,callbackUrl:process.env.NEXT_PUBLIC_APP_AUTH_CALLBACK_URL??`${base}/auth/callback`},
  supabase:{url:process.env.NEXT_PUBLIC_SUPABASE_URL!,publishableKey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,serverUrl:process.env.SUPABASE_URL_INTERNAL||process.env.NEXT_PUBLIC_SUPABASE_URL!},
  features:{lineLogin:boolean(process.env.NEXT_PUBLIC_ENABLE_LINE_LOGIN,true),googleLogin:boolean(process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN,false),facebookLogin:boolean(process.env.NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN,false),appleLogin:boolean(process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN,false)},
};

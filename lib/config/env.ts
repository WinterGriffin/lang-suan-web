const boolean=(value:string|undefined,fallback:boolean)=>value===undefined?fallback:value==="true";
const base=process.env.NEXT_PUBLIC_APP_BASE_URL??process.env.APP_URL??"http://localhost:3000";
export const config={
  app:{environment:process.env.NEXT_PUBLIC_APP_ENV??"local",baseUrl:base,callbackUrl:process.env.NEXT_PUBLIC_APP_AUTH_CALLBACK_URL??`${base}/auth/callback`},
  supabase:{url:process.env.NEXT_PUBLIC_SUPABASE_URL!,publishableKey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,serverUrl:process.env.SUPABASE_URL_INTERNAL||process.env.NEXT_PUBLIC_SUPABASE_URL!},
  features:{lineLogin:boolean(process.env.NEXT_PUBLIC_ENABLE_LINE_LOGIN,true),googleLogin:boolean(process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN,false),facebookLogin:boolean(process.env.NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN,false),appleLogin:boolean(process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN,false)},
};

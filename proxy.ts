import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/auth/app-url";
import { config as appConfig } from "@/lib/config/env";

const publicPaths = new Set(["/login", "/register", "/auth/confirm", "/auth/callback"]);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    appConfig.supabase.serverUrl,
    appConfig.supabase.publishableKey,
    {
      cookieOptions: { name: "sb-langsuan-auth-token" },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: claims } = await supabase.auth.getClaims();
  const isPublic = publicPaths.has(request.nextUrl.pathname);
  if (!claims && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (claims && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    return NextResponse.redirect(appUrl("/"));
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };

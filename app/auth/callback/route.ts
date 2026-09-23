import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function displayNameFromMetadata(metadata: Record<string, unknown>) {
  for (const key of ["full_name", "name", "preferred_username", "display_name"]) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 120);
  }
  return "ผู้ใช้ LangSuan";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const redirectTo = new URL("/", request.url);

  if (!code) {
    return NextResponse.redirect(new URL("/login?status=oauth-error", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?status=oauth-error", request.url));
  }

  const { error: profileError } = await supabase.rpc("ensure_profile", {
    p_display_name: displayNameFromMetadata(data.user.user_metadata),
  });
  if (profileError) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?status=profile-error", request.url));
  }

  return NextResponse.redirect(redirectTo);
}

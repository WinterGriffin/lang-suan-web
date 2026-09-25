import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/auth/app-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (request.nextUrl.searchParams.get("type") !== "recovery" || !tokenHash) {
    return NextResponse.redirect(appUrl("/forgot-password?status=invalid"));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
  if (error || !data.user) return NextResponse.redirect(appUrl("/forgot-password?status=invalid"));
  return NextResponse.redirect(appUrl("/reset-password"));
}

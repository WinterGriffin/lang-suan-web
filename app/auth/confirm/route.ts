import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "");
  const redirectTo = new URL("/login", `${protocol}://${host}`);

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && data.user) {
      const displayName = typeof data.user.user_metadata.display_name === "string"
        ? data.user.user_metadata.display_name.trim()
        : "";
      const { error: profileError } = displayName
        ? await supabase.rpc("ensure_profile", { p_display_name: displayName })
        : { error: new Error("missing display name") };
      await supabase.auth.signOut();
      if (!profileError) {
        redirectTo.searchParams.set("status", "confirmed");
        return NextResponse.redirect(redirectTo);
      }
    }
  }

  redirectTo.searchParams.set("status", "confirmation-error");
  return NextResponse.redirect(redirectTo);
}

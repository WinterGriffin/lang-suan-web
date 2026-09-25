import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/packages/database/src/database.types";
import { config } from "@/lib/config/env";
export const createClient = () => createBrowserClient<Database>(
  config.supabase.url,
  config.supabase.publishableKey,
  { cookieOptions: { name: "sb-langsuan-auth-token", secure: true, sameSite: "lax" } },
);

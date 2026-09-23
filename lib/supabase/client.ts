import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/packages/database/src/database.types";
export const createClient = () => createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { cookieOptions: { name: "sb-langsuan-auth-token" } },
);

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/packages/database/src/database.types";
import { config } from "@/lib/config/env";

export async function createClient() {
  const store = await cookies();
  return createServerClient<Database>(
    config.supabase.serverUrl,
    config.supabase.publishableKey,
    {
      cookieOptions: { name: "sb-langsuan-auth-token", secure: true, sameSite: "lax" },
      cookies: {
        getAll: () => store.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Server Components cannot write cookies; Proxy refreshes those sessions.
          }
        },
      },
    },
  );
}

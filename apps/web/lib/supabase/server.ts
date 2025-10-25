import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";


export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_PUBLIC_URL,
    process.env.SUPABASE_PUBLIC_KEY,
    {
      auth: { storageKey: "train360-dms" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  ) as unknown as SupabaseClient;
}

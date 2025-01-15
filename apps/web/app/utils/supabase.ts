import { env } from "@/lib/env";
import { createBrowserClient } from "@supabase/ssr";

let supabase: ReturnType<typeof createBrowserClient>;

export function getSupabaseClient() {
  if (!supabase) {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials are not provided");
    }

    supabase = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return supabase;
}

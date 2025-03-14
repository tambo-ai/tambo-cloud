import { getSupabaseClient } from "@/app/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

enum SessionState {
  Uninitialized,
  Loading,
  Authenticated,
  Unauthenticated,
  Error,
}

export function useSession(
  queryOptions: Partial<UseQueryOptions<Session | null>> = {},
) {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      console.log("Checking auth status");
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
    ...queryOptions,
  });
}

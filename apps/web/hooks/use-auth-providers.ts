import { api } from "@/trpc/react";

export function useAuthProviders(): ReturnType<
  typeof api.auth.getProviders.useQuery
> {
  return api.auth.getProviders.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

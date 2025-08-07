import { getAvailableProviderConfigs } from "@/lib/auth-providers";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getProviders } from "next-auth/react";

export const authRouter = createTRPCRouter({
  getProviders: publicProcedure.query(async () => {
    try {
      const providers = await getProviders();

      if (!providers) {
        return [];
      }

      // Get provider IDs from NextAuth
      const providerIds = Object.keys(providers);

      // Get provider configurations with metadata
      const providerConfigs = getAvailableProviderConfigs(providerIds);

      return providerConfigs;
    } catch (error) {
      console.error("Error fetching providers:", error);
      throw new Error("Failed to fetch providers");
    }
  }),
});

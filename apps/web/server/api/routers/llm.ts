import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { type LlmConfig, llmConfig } from "@tambo-ai-cloud/backend";

export const llmRouter = createTRPCRouter({
  getLlmConfig: publicProcedure.query((): LlmConfig => {
    return llmConfig;
  }),
});

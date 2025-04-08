import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { OpenAIToolSet } from "composio-core";
const toolset = new OpenAIToolSet();

export const toolsRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    const tools = await toolset.getTools({
      apps: ["github", "gmail"],
    });

    return tools;
  }),
});

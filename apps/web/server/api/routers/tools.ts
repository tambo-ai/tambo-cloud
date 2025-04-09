import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { Composio, OpenAIToolSet } from "composio-core";
const toolset = new OpenAIToolSet({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

export const toolsRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    const apps = await composio.apps.list();
    return apps;
  }),
});

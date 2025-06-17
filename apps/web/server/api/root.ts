import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { appRouter as applicationRouter } from "./routers/app";
import { demoRouter } from "./routers/demo";
import { llmRouter } from "./routers/llm";
import { projectRouter } from "./routers/project";
import { threadRouter } from "./routers/thread";
import { toolsRouter } from "./routers/tools";
import { userRouter } from "./routers/user";
import { validateRouter } from "./routers/validate";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
// @ts-expect-error: inferred type references internal db schema and is too complex to name
export const appRouter = createTRPCRouter({
  user: userRouter,
  project: projectRouter,
  thread: threadRouter,
  app: applicationRouter,
  tools: toolsRouter,
  demo: demoRouter,
  llm: llmRouter,
  validate: validateRouter,
});

// export type definition of API for the client
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
// @ts-expect-error: complex generic inferred from oversized type, not important for outside callers
export const createCaller = createCallerFactory(appRouter);

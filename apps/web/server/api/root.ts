import "server-only";

import {
  createCallerFactory,
  createTRPCContext,
  createTRPCRouter,
} from "@/server/api/trpc";
import { createQueryClient } from "@/trpc/query-client";
import { getQueryKey } from "@trpc/react-query";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { appRouter as applicationRouter } from "./routers/app";
import { demoRouter } from "./routers/demo";
import { llmRouter } from "./routers/llm";
import { projectRouter } from "./routers/project";
import { threadRouter } from "./routers/thread";
import { toolsRouter } from "./routers/tools";
import { userRouter } from "./routers/user";
import { validateRouter } from "./routers/validate";

// We need to define and export these so that the trpc export can be resolved correctly.
export type UserRouter = typeof userRouter;
export type ProjectRouter = typeof projectRouter;
export type ThreadRouter = typeof threadRouter;
export type ApplicationRouter = typeof applicationRouter;
export type ToolsRouter = typeof toolsRouter;
export type DemoRouter = typeof demoRouter;
export type LlmRouter = typeof llmRouter;
export type ValidateRouter = typeof validateRouter;

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter<{
  user: UserRouter;
  project: ProjectRouter;
  thread: ThreadRouter;
  app: ApplicationRouter;
  tools: ToolsRouter;
  demo: DemoRouter;
  llm: LlmRouter;
  validate: ValidateRouter;
}>({
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

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(createQueryClient);
/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
export type GQK = typeof getQueryKey;

const caller = createCaller(createTRPCContext);
export const helpers = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
export const trpc = helpers.trpc;
export const HydrateClient = helpers.HydrateClient;

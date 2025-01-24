import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { operations } from "@use-hydra-ai/db";
import { z } from "zod";

export const threadRouter = createTRPCRouter({
  getThreads: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        contextKey: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Ensure user has access to the project
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const threads = await operations.getThreadsByProject(
        ctx.db,
        input.projectId,
        {
          contextKey: input.contextKey,
        },
      );

      return threads;
    }),

  getThread: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Ensure user has access to the project
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      return operations.getThread(ctx.db, input.threadId);
    }),

  deleteThread: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user has access to the project
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      return operations.deleteThread(ctx.db, input.threadId);
    }),
});

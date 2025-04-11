import { getComposio } from "@/lib/composio";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { operations } from "@tambo-ai-cloud/db";
import { z } from "zod";

export const toolsRouter = createTRPCRouter({
  listApps: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      const composio = getComposio();
      const enabledApps = await operations.getComposioApps(
        ctx.db,
        input.projectId,
      );
      const enabledAppIds = enabledApps.map((app) => app.composioAppId);
      const apps = await composio.apps.list();

      return apps
        .map((app) => ({
          appId: app.appId,
          name: app.name,
          no_auth: app.no_auth,
          // mistyped in the SDK
          tags: app.tags as unknown as string[],
          logo: app.logo,
          description: app.description,
          enabled: enabledAppIds.includes(app.appId),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }),
  enableApp: protectedProcedure
    .input(z.object({ projectId: z.string(), appId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      console.log("Enabling app:", input.appId, " / ");
      await operations.enableComposioApp(ctx.db, input.projectId, input.appId);
    }),
  disableApp: protectedProcedure
    .input(z.object({ projectId: z.string(), appId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      await operations.disableComposioApp(ctx.db, input.projectId, input.appId);
    }),
  listMcpServers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const servers = await operations.getProjectMcpServers(
        ctx.db,
        input.projectId,
      );
      return servers;
    }),
  addMcpServer: protectedProcedure
    .input(z.object({ projectId: z.string(), url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      const { projectId, url } = input;
      const server = await operations.createMcpServer(ctx.db, projectId, url);
      return server;
    }),
  deleteMcpServer: protectedProcedure
    .input(z.object({ projectId: z.string(), serverId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const { projectId, serverId } = input;
      await operations.deleteMcpServer(ctx.db, projectId, serverId);
      return true;
    }),
  updateMcpServer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        serverId: z.string(),
        url: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const { projectId, serverId, url } = input;
      const server = await operations.updateMcpServer(
        ctx.db,
        projectId,
        serverId,
        url,
      );
      return server;
    }),
});

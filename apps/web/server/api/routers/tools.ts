import { getBaseUrl } from "@/lib/base-url";
import { customHeadersSchema } from "@/lib/headerValidation";
import { validateSafeURL, validateServerUrl } from "@/lib/urlSecurity";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import {
  MCPClient,
  MCPTransport,
  ToolProviderType,
  validateMcpServer,
} from "@tambo-ai-cloud/core";
import {
  HydraDb,
  OAuthLocalProvider,
  operations,
  schema,
} from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";

type McpServer = Awaited<
  ReturnType<typeof operations.getProjectMcpServers>
>[number];

type OAuthClientProvider = OAuthLocalProvider;

export const toolsRouter = createTRPCRouter({
  listMcpServers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      const servers = await operations.getProjectMcpServers(
        ctx.db,
        input.projectId,
        null,
      );
      return servers.map((server) => ({
        id: server.id,
        url: server.url,
        customHeaders: server.customHeaders,
        mcpRequiresAuth: server.mcpRequiresAuth,
        mcpIsAuthed:
          !!server.contexts.length &&
          !!server.contexts[0].mcpOauthTokens?.access_token,

        mcpTransport: server.mcpTransport,
      }));
    }),
  addMcpServer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        url: z
          .string()
          .url()
          .refine(
            validateServerUrl,
            "URL appears to be unsafe: must not point to internal, local, or private networks",
          ),
        customHeaders: customHeadersSchema,
        mcpTransport: z.nativeEnum(MCPTransport),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      const { projectId, url, customHeaders, mcpTransport } = input;
      const parsedUrl = new URL(url);

      // Perform additional safety checks
      const safetyCheck = await validateSafeURL(parsedUrl.hostname);
      if (!safetyCheck.safe) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `URL validation failed: ${safetyCheck.reason}`,
        });
      }
      const validity = await validateMcpServer({
        url,
        customHeaders,
        mcpTransport,
        // Cannot pass in oauthProvider, because we don't have the client information yet
      });
      if (!validity.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `MCP server validation failed: ${validity.error}`,
        });
      }

      const server = await operations.createMcpServer(
        ctx.db,
        projectId,
        url,
        customHeaders,
        mcpTransport,
        validity.requiresAuth,
      );

      return {
        id: server.id,
        url: server.url,
        customHeaders: server.customHeaders,
        mcpTransport: server.mcpTransport,
        mcpRequiresAuth: server.mcpRequiresAuth,
        mcpCapabilities: validity.capabilities,
        mcpVersion: validity.version,
        mcpInstructions: validity.instructions,
      };
    }),
  authorizeMcpServer: protectedProcedure
    .input(
      z.object({
        toolProviderId: z.string(),
        contextKey: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { contextKey, toolProviderId } = input;
      const saveAuthUrl = `${getBaseUrl()}/oauth/callback`;

      const db = ctx.db;
      const toolProvider = await db.query.toolProviders.findFirst({
        where: and(
          eq(schema.toolProviders.id, toolProviderId),
          eq(schema.toolProviders.type, ToolProviderType.MCP),
          isNotNull(schema.toolProviders.url),
        ),
      });
      if (!toolProvider) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tool provider not found",
        });
      }
      const { url, projectId } = toolProvider;
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      if (!url) {
        // cannot happen due to validation in the query
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tool provider missing MCP URL",
        });
      }
      const toolProviderUserContextId = await upsertToolProviderUserContext(
        db,
        toolProviderId,
        contextKey,
      );

      const localProvider = new OAuthLocalProvider(
        db,
        toolProviderUserContextId,
        {
          baseUrl: saveAuthUrl,
          serverUrl: url,
        },
      );
      const result = await auth(localProvider, { serverUrl: url });
      if (result === "AUTHORIZED") {
        return {
          success: true,
        };
      }
      if (result === "REDIRECT") {
        return {
          success: true,
          redirectUrl: localProvider.redirectStartAuthUrl?.toString(),
        };
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected auth result",
      });
    }),
  deleteMcpServer: protectedProcedure
    .input(z.object({ projectId: z.string(), serverId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
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
        url: z
          .string()
          .url()
          .refine(
            validateServerUrl,
            "URL appears to be unsafe: must not point to internal, local, or private networks",
          ),
        customHeaders: customHeadersSchema,
        mcpTransport: z.nativeEnum(MCPTransport),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      const { projectId, serverId, url, customHeaders, mcpTransport } = input;
      const validity = await getServerValidity(
        ctx.db,
        projectId,
        serverId,
        url,
        customHeaders,
        mcpTransport,
      );

      if (!validity.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `MCP server validation failed: ${validity.error}`,
        });
      }

      const server = await operations.updateMcpServer(
        ctx.db,
        projectId,
        serverId,
        url,
        customHeaders,
        mcpTransport,
        validity.requiresAuth,
      );
      return {
        id: server.id,
        url: server.url,
        customHeaders: server.customHeaders,
        mcpTransport: server.mcpTransport,
        mcpRequiresAuth: server.mcpRequiresAuth,
        mcpCapabilities: validity.capabilities,
        mcpVersion: validity.version,
        mcpInstructions: validity.instructions,
      };
    }),

  inspectMcpServer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        serverId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      const server = await operations.getMcpServer(
        ctx.db,
        input.projectId,
        input.serverId,
        null,
      );

      if (!server || !server.url) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "MCP server not found",
        });
      }

      if (server.mcpRequiresAuth && !server.contexts.length) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Server requires authentication",
        });
      }

      const authProvider = await getOAuthProvider(ctx.db, {
        mcpServer: server,
        url: server.url,
      });
      const mcpClient = await MCPClient.create(
        server.url,
        server.mcpTransport,
        server.customHeaders,
        authProvider,
      );

      const tools = await mcpClient.listTools();
      const validity = await validateMcpServer({
        url: server.url,
        customHeaders: server.customHeaders,
        mcpTransport: server.mcpTransport,
        oauthProvider: authProvider,
      });

      return {
        tools,
        serverInfo: {
          version: validity.version,
          instructions: validity.instructions,
          capabilities: validity.capabilities,
        },
      };
    }),
});

/** Get the auth provider for an MCP server or user context */
async function getOAuthProvider(
  db: HydraDb,
  input: {
    mcpServer?: McpServer;
    userContext?: typeof schema.toolProviderUserContexts.$inferSelect;
    url: string;
  },
): Promise<OAuthClientProvider | undefined> {
  const { mcpServer, userContext, url } = input;

  // If we have a user context with client info, use that directly
  if (userContext?.mcpOauthClientInfo) {
    return new OAuthLocalProvider(db, userContext.id, {
      baseUrl: getBaseUrl(),
      serverUrl: url,
      clientInformation: userContext.mcpOauthClientInfo,
    });
  }

  // Otherwise try to get client info from the MCP server context
  if (!mcpServer?.contexts.length) {
    return undefined;
  }

  if (mcpServer.contexts.length > 1) {
    console.warn(
      `MCP server ${mcpServer.id} has multiple contexts, using the first one`,
    );
  }

  if (!mcpServer.mcpRequiresAuth) {
    // this is fine, just means this server is not using OAuth
    return undefined;
  }

  const context = mcpServer.contexts[0];
  const client = await db.query.mcpOauthClients.findFirst({
    where: eq(schema.mcpOauthClients.toolProviderUserContextId, context.id),
  });

  if (!client) {
    return undefined;
  }

  return new OAuthLocalProvider(db, context.id, {
    baseUrl: getBaseUrl(),
    serverUrl: url,
    clientInformation: client.sessionInfo.clientInformation,
    sessionId: client.sessionId,
  });
}

/** Validate the MCP server, leveraging the oauth info in the db if available */
async function getServerValidity(
  db: HydraDb,
  projectId: string,
  serverId: string,
  url: string,
  customHeaders: Record<string, string> | undefined,
  mcpTransport: MCPTransport,
) {
  const currentServer = await operations.getMcpServer(
    db,
    projectId,
    serverId,
    null,
  );
  if (!currentServer) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "MCP server not found",
    });
  }
  const oauthProvider = await getOAuthProvider(db, {
    userContext: currentServer.contexts[0],
    url,
  });
  const validity = await validateMcpServer({
    url,
    customHeaders,
    mcpTransport,
    oauthProvider,
  });
  return {
    ...validity,
    // fake out that the server requires auth if we have an oauth provider
    requiresAuth: validity.requiresAuth || !!oauthProvider,
  };
}

/** Create a tool provider user context for the given tool provider id,
 * returning the id of the created or existing tool provider user context */
async function upsertToolProviderUserContext(
  db: HydraDb,
  toolProviderId: string,
  contextKey: string | null,
) {
  return await db.transaction(async (tx) => {
    const toolProviderUserContext =
      await tx.query.toolProviderUserContexts.findFirst({
        where: eq(
          schema.toolProviderUserContexts.toolProviderId,
          toolProviderId,
        ),
      });
    if (toolProviderUserContext) {
      return toolProviderUserContext.id;
    }

    const [newToolProviderUserContext] = await tx
      .insert(schema.toolProviderUserContexts)
      .values({
        toolProviderId,
        contextKey,
      })
      .returning();

    return newToolProviderUserContext.id;
  });
}

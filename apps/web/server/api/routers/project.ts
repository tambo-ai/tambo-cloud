import { env } from "@/lib/env";
import { validateSafeURL } from "@/lib/urlSecurity";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { llmProviderConfig } from "@tambo-ai-cloud/backend";
import { hashKey, MCPTransport, validateMcpServer } from "@tambo-ai-cloud/core";
import { operations, schema } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import {
  and,
  count,
  countDistinct,
  eq,
  gte,
  inArray,
  isNotNull,
} from "drizzle-orm";
import { z } from "zod";

// Helper function to get date filter based on period
function getDateFilter(period: string): Date | null {
  const now = new Date();

  switch (period) {
    case "per week":
      return new Date(now.setDate(now.getDate() - 7));
    case "per month":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "all time":
    default:
      return null;
  }
}

export const projectRouter = createTRPCRouter({
  getUserProjects: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const projects = await operations.getProjectsForUser(ctx.db, userId);

    // ---------------------------------------------------------------------
    // Batched aggregation for message & user counts (single query)
    // ---------------------------------------------------------------------
    const projectIds = projects.map((p) => p.id);

    let aggregatedCounts = new Map<
      string,
      { messages: number; users: number }
    >();

    if (projectIds.length) {
      const counts = await ctx.db
        .select({
          projectId: schema.threads.projectId,
          messages: count(schema.messages.id),
          users: countDistinct(schema.threads.contextKey),
        })
        .from(schema.threads)
        .innerJoin(
          schema.messages,
          eq(schema.messages.threadId, schema.threads.id),
        )
        .where(inArray(schema.threads.projectId, projectIds))
        .groupBy(schema.threads.projectId);

      aggregatedCounts = new Map(
        counts.map((c) => [
          c.projectId,
          {
            messages: Number(c.messages ?? 0),
            users: Number(c.users ?? 0),
          },
        ]),
      );
    }

    // Shape final payload using O(1) look-ups
    return projects.map((project) => {
      const stats = aggregatedCounts.get(project.id) ?? {
        messages: 0,
        users: 0,
      };
      return {
        id: project.id,
        name: project.name,
        userId,
        createdAt: project.createdAt,
        customInstructions: project.customInstructions,
        defaultLlmProviderName: project.defaultLlmProviderName,
        defaultLlmModelName: project.defaultLlmModelName,
        customLlmModelName: project.customLlmModelName,
        customLlmBaseURL: project.customLlmBaseURL,
        messages: stats.messages,
        users: stats.users,
      };
    });
  }),

  createProject: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return await operations.createProject(ctx.db, {
        name: input,
        userId: ctx.session.user.id,
      });
    }),
  createProject2: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        customInstructions: z.string().nullable().optional(),
        mcpServers: z
          .array(
            z.object({
              url: z.string(),
              customHeaders: z.record(z.string(), z.string()),
              mcpTransport: z.nativeEnum(MCPTransport),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, mcpServers, customInstructions } = input;

      // Wrap the entire operation in a single DB transaction so that
      // we either commit *all* related inserts/updates or none.
      const project = await ctx.db.transaction(async (tx) => {
        const createdProject = await operations.createProject(tx, {
          name,
          userId: ctx.session.user.id,
          customInstructions: customInstructions ?? undefined,
          defaultLlmProviderName: undefined,
          defaultLlmModelName: undefined,
          customLlmModelName: undefined,
          customLlmBaseURL: undefined,
        });

        if (!createdProject) {
          throw new Error("Failed to create project");
        }

        if (mcpServers?.length) {
          for (const mcpServer of mcpServers) {
            const validity = await validateMcpServer({
              url: mcpServer.url,
              customHeaders: mcpServer.customHeaders,
              mcpTransport: mcpServer.mcpTransport,
            });

            if (!validity.valid) {
              // Throwing inside the transaction callback causes the transaction
              // to roll back automatically.
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `MCP server validation failed: ${validity.error}`,
              });
            }

            await operations.createMcpServer(
              tx,
              createdProject.id,
              mcpServer.url,
              mcpServer.customHeaders,
              mcpServer.mcpTransport,
              validity.requiresAuth,
            );
          }
        }

        // Returning a value from the transaction callback makes it the
        // resolved value of `ctx.db.transaction(...)`.
        return createdProject;
      });

      return project;
    }),

  getProjectLlmSettings: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      const project = await ctx.db.query.projects.findFirst({
        where: eq(schema.projects.id, projectId),
        columns: {
          defaultLlmProviderName: true,
          defaultLlmModelName: true,
          customLlmModelName: true,
          customLlmBaseURL: true,
          maxInputTokens: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found.",
        });
      }
      return {
        defaultLlmProviderName: project.defaultLlmProviderName ?? null,
        defaultLlmModelName: project.defaultLlmModelName ?? null,
        customLlmModelName: project.customLlmModelName ?? null,
        customLlmBaseURL: project.customLlmBaseURL ?? null,
        maxInputTokens: project.maxInputTokens ?? null,
      };
    }),

  updateProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().optional(),
        customInstructions: z.string().nullable().optional(),
        defaultLlmProviderName: z.string().nullable().optional(),
        defaultLlmModelName: z.string().nullable().optional(),
        customLlmModelName: z.string().nullable().optional(),
        customLlmBaseURL: z.string().nullable().optional(),
        maxInputTokens: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        projectId,
        name,
        customInstructions,
        defaultLlmProviderName,
        defaultLlmModelName,
        customLlmModelName,
        customLlmBaseURL,
        maxInputTokens,
      } = input;
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      const updatedProject = await operations.updateProject(ctx.db, projectId, {
        name,
        customInstructions:
          customInstructions === null ? "" : customInstructions,
        defaultLlmProviderName:
          defaultLlmProviderName === null
            ? undefined
            : (defaultLlmProviderName ?? undefined),
        defaultLlmModelName:
          defaultLlmModelName === null
            ? undefined
            : (defaultLlmModelName ?? undefined),
        customLlmModelName:
          customLlmModelName === null
            ? undefined
            : (customLlmModelName ?? undefined),
        customLlmBaseURL:
          customLlmBaseURL === null
            ? undefined
            : (customLlmBaseURL ?? undefined),
        maxInputTokens:
          maxInputTokens === null ? undefined : (maxInputTokens ?? undefined),
      });

      if (!updatedProject) {
        throw new Error("Failed to update project");
      }

      return {
        id: updatedProject.id,
        name: updatedProject.name,
        userId: ctx.session.user.id,
        customInstructions: updatedProject.customInstructions,
        defaultLlmProviderName: updatedProject.defaultLlmProviderName,
        defaultLlmModelName: updatedProject.defaultLlmModelName,
        customLlmModelName: updatedProject.customLlmModelName,
        customLlmBaseURL: updatedProject.customLlmBaseURL,
        maxInputTokens: updatedProject.maxInputTokens,
      };
    }),

  updateProjectLlmSettings: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        defaultLlmProviderName: z.string().nullable().optional(),
        defaultLlmModelName: z.string().nullable().optional(),
        customLlmModelName: z.string().nullable().optional(),
        customLlmBaseURL: z.string().nullable().optional(),
        maxInputTokens: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        projectId,
        defaultLlmProviderName,
        defaultLlmModelName,
        customLlmModelName,
        customLlmBaseURL,
        maxInputTokens,
      } = input;

      // Ensure the user has access to the project before performing any further
      // (potentially expensive) validation logic.
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      // Always work with one trimmed instance so we don't repeat `trim()` calls
      const sanitizedBaseURL =
        typeof customLlmBaseURL === "string"
          ? customLlmBaseURL.trim()
          : customLlmBaseURL;

      // --- Validate custom base-URL for OpenAI-compatible providers ------------
      if (typeof sanitizedBaseURL === "string" && sanitizedBaseURL !== "") {
        // Basic URL syntax check
        let asURL: URL;
        try {
          asURL = new URL(sanitizedBaseURL);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid URL provided for custom LLM base URL.",
          });
        }

        // Safety & SSRF checks (local / private networks, etc.)
        const { safe, reason } = await validateSafeURL(asURL.href);
        if (!safe) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `URL validation failed${reason ? `: ${reason}` : ""}`,
          });
        }
      }

      const updateData: Partial<{
        defaultLlmProviderName: string | null;
        defaultLlmModelName: string | null;
        customLlmModelName: string | null;
        customLlmBaseURL: string | null;
        maxInputTokens: number | null;
      }> = {};

      if ("defaultLlmProviderName" in input) {
        updateData.defaultLlmProviderName = defaultLlmProviderName ?? null;
      }
      if ("defaultLlmModelName" in input) {
        updateData.defaultLlmModelName = defaultLlmModelName ?? null;
      }
      if ("customLlmModelName" in input) {
        updateData.customLlmModelName = customLlmModelName ?? null;
      }
      if ("customLlmBaseURL" in input) {
        // Store the trimmed value (or null if blank/undefined)
        updateData.customLlmBaseURL =
          sanitizedBaseURL && sanitizedBaseURL !== "" ? sanitizedBaseURL : null;
      }
      if ("maxInputTokens" in input) {
        if (defaultLlmProviderName && defaultLlmModelName) {
          const modelConfig =
            llmProviderConfig[defaultLlmProviderName]?.models?.[
              defaultLlmModelName
            ];
          if (modelConfig) {
            if (
              !input.maxInputTokens ||
              input.maxInputTokens < 1 ||
              input.maxInputTokens > modelConfig.properties.inputTokenLimit
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Max input tokens must be greater than 0 and less than the model's max.",
              });
            }
          }
        }
        updateData.maxInputTokens = input.maxInputTokens;
      }

      if (
        updateData.defaultLlmProviderName !== "openai-compatible" &&
        "defaultLlmProviderName" in input
      ) {
        updateData.customLlmBaseURL = null;
      }

      if (Object.keys(updateData).length === 0) {
        const currentProject = await ctx.db.query.projects.findFirst({
          where: eq(schema.projects.id, projectId),
        });
        if (!currentProject)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found.",
          });
        return {
          defaultLlmProviderName: currentProject.defaultLlmProviderName ?? null,
          defaultLlmModelName: currentProject.defaultLlmModelName ?? null,
          customLlmModelName: currentProject.customLlmModelName ?? null,
          customLlmBaseURL: currentProject.customLlmBaseURL ?? null,
          maxInputTokens: currentProject.maxInputTokens ?? null,
        };
      }

      const updatedProject = await ctx.db
        .update(schema.projects)
        .set(updateData)
        .where(eq(schema.projects.id, projectId))
        .returning();

      if (!updatedProject || updatedProject.length === 0) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project LLM settings.",
        });
      }
      return {
        defaultLlmProviderName:
          updatedProject[0].defaultLlmProviderName ?? null,
        defaultLlmModelName: updatedProject[0].defaultLlmModelName ?? null,
        customLlmModelName: updatedProject[0].customLlmModelName ?? null,
        customLlmBaseURL: updatedProject[0].customLlmBaseURL ?? null,
        maxInputTokens: updatedProject[0].maxInputTokens ?? null,
      };
    }),

  removeProject: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );
      await operations.deleteProject(ctx.db, projectId);
    }),

  removeMultipleProjects: protectedProcedure
    .input(z.array(z.string()).min(1, "At least one project ID is required"))
    .mutation(async ({ ctx, input: projectIds }) => {
      const userId = ctx.session.user.id;

      // 1. Ensure the user can access every project (in parallel for speed)
      await Promise.all(
        projectIds.map(async (id) => {
          await operations.ensureProjectAccess(ctx.db, id, userId);
        }),
      );

      // 2. Delete each project properly using the existing deleteProject operation
      // This ensures foreign key constraints and RLS policies are handled correctly
      await Promise.all(
        projectIds.map(async (id) => {
          await operations.deleteProject(ctx.db, id);
        }),
      );

      return { deletedCount: projectIds.length };
    }),

  addProviderKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        provider: z.string(),
        providerKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, provider: providerName, providerKey } = input;
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      // First delete any existing key for this provider
      await ctx.db
        .delete(schema.providerKeys)
        .where(
          and(
            eq(schema.providerKeys.projectId, projectId),
            eq(schema.providerKeys.providerName, providerName),
          ),
        );

      // Then add the new key if one was provided
      if (providerKey) {
        return await operations.addProviderKey(
          ctx.db,
          env.PROVIDER_KEY_SECRET,
          {
            projectId,
            providerName,
            providerKey,
            userId: ctx.session.user.id,
          },
        );
      }

      return await operations.getProjectWithKeys(ctx.db, projectId);
    }),

  getProviderKeys: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );
      return await operations.getProviderKeys(ctx.db, projectId);
    }),

  generateApiKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, name } = input;
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      const encryptedKey = await operations.createApiKey(
        ctx.db,
        env.API_KEY_SECRET,
        {
          projectId,
          userId: ctx.session.user.id,
          name,
        },
      );

      const apiKeys = await operations.getApiKeys(ctx.db, projectId);
      const newKey = apiKeys.find((k) => k.hashedKey === hashKey(encryptedKey));

      if (!newKey) {
        throw new Error("Failed to create API key");
      }

      return {
        ...newKey,
        apiKey: encryptedKey,
      };
    }),

  getApiKeys: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );
      return await operations.getApiKeys(ctx.db, projectId);
    }),

  removeApiKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        apiKeyId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      await operations.deleteApiKey(ctx.db, input.projectId, input.apiKeyId);
    }),

  getProjectMessageUsage: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      const usage = await operations.getProjectMessageUsage(ctx.db, projectId);
      if (!usage) {
        return {
          messageCount: 0,
          hasApiKey: false,
        };
      }

      return {
        messageCount: usage.messageCount,
        hasApiKey: usage.hasApiKey,
      };
    }),

  getTotalMessageUsage: protectedProcedure
    .input(z.object({ period: z.string().optional().default("all time") }))
    .query(async ({ ctx, input }) => {
      const { period } = input;
      const userId = ctx.session.user.id;
      const projects = await operations.getProjectsForUser(ctx.db, userId);
      const projectIds = projects.map((p) => p.id);

      if (projectIds.length === 0) {
        return { totalMessages: 0 };
      }

      const dateFilter = getDateFilter(period);

      // count from messages table
      const whereConditions = [inArray(schema.threads.projectId, projectIds)];

      if (dateFilter) {
        whereConditions.push(gte(schema.messages.createdAt, dateFilter));
      }

      const result = await ctx.db
        .select({ count: count() })
        .from(schema.messages)
        .innerJoin(
          schema.threads,
          eq(schema.messages.threadId, schema.threads.id),
        )
        .where(and(...whereConditions));

      return { totalMessages: result[0]?.count || 0 };
    }),

  getTotalUsers: protectedProcedure
    .input(z.object({ period: z.string().optional().default("all time") }))
    .query(async ({ ctx, input }) => {
      const { period } = input;
      const userId = ctx.session.user.id;
      const projects = await operations.getProjectsForUser(ctx.db, userId);
      const projectIds = projects.map((p) => p.id);

      if (projectIds.length === 0) {
        return { totalUsers: 0 };
      }

      const dateFilter = getDateFilter(period);

      const whereConditions = [
        inArray(schema.threads.projectId, projectIds),
        isNotNull(schema.threads.contextKey),
      ];

      if (dateFilter) {
        whereConditions.push(gte(schema.threads.createdAt, dateFilter));
      }

      // Get unique context keys (users) across all user's projects within period
      const uniqueUsers = await ctx.db
        .selectDistinct({ contextKey: schema.threads.contextKey })
        .from(schema.threads)
        .where(and(...whereConditions));

      return { totalUsers: uniqueUsers.length };
    }),

  // -------------------------------------------------------------------------
  //  Project Logs
  // -------------------------------------------------------------------------

  getProjectLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId, limit = 20 } = input;

      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      return await operations.getRecentProjectLogEntries(
        ctx.db,
        projectId,
        limit,
      );
    }),
});

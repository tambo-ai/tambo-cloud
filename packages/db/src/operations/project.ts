import {
  encryptApiKey,
  encryptProviderKey,
  hashKey,
  hideApiKey,
  MCPTransport,
  ToolProviderType,
} from "@tambo-ai-cloud/core";
import { createHash, randomBytes } from "crypto";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export async function createProject(
  db: HydraDb,
  {
    name,
    userId,
    customInstructions,
    role = "admin",
  }: {
    name: string;
    userId: string;
    customInstructions?: string;
    role?: string;
  },
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(schema.projects)
      .values({
        name: name || "New Project",
        customInstructions,
      })
      .returning();

    await tx.insert(schema.projectMembers).values({
      projectId: project.id,
      userId: userId,
      role,
    });

    return {
      id: project.id,
      name: project.name,
      userId,
    };
  });
}

export async function getProjectsForUser(db: HydraDb, userId: string) {
  return await db.query.projects.findMany({
    where: (projects, { inArray }) =>
      inArray(
        projects.id,
        db
          .select({ id: schema.projectMembers.projectId })
          .from(schema.projectMembers)
          .where(eq(schema.projectMembers.userId, userId)),
      ),
    orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
  });
}

export async function getProject(db: HydraDb, id: string) {
  return await db.query.projects.findFirst({
    where: (projects, { eq, or, and, isNotNull }) =>
      or(
        eq(projects.id, id),
        and(isNotNull(projects.legacyId), eq(projects.legacyId, id)),
      ),
    with: {
      members: true,
    },
  });
}

export async function getProjectWithKeys(db: HydraDb, id: string) {
  return await db.query.projects.findFirst({
    where: (projects, { eq, or, and, isNotNull }) =>
      or(
        eq(projects.id, id),
        and(isNotNull(projects.legacyId), eq(projects.legacyId, id)),
      ),
    with: {
      members: true,
      apiKeys: true,
      providerKeys: true,
    },
  });
}

export async function updateProject(
  db: HydraDb,
  id: string,
  { name, customInstructions }: { name?: string; customInstructions?: string },
) {
  // Create update object with only provided fields
  const updateData: Partial<typeof schema.projects.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (customInstructions !== undefined)
    updateData.customInstructions = customInstructions;

  // Only perform update if there are fields to update
  if (Object.keys(updateData).length === 0) {
    const project = await getProject(db, id);
    return project;
  }

  const updated = await db
    .update(schema.projects)
    .set(updateData)
    .where(eq(schema.projects.id, id))
    .returning();
  return updated.length > 0 ? updated[0] : undefined;
}

export async function hasProjectAccess(
  db: HydraDb,
  id: string,
  userId: string,
) {
  const firstProjectMembership = await db.query.projectMembers.findFirst({
    where: (projectMembers, { eq, and }) =>
      and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId)),
  });

  return !!firstProjectMembership;
}

export async function ensureProjectAccess(
  db: HydraDb,
  id: string,
  userId: string,
) {
  const access = await hasProjectAccess(db, id, userId);
  if (!access) {
    throw new Error("User does not have access to this project");
  }
}

export async function deleteProject(db: HydraDb, id: string): Promise<boolean> {
  return await db.transaction(async (tx) => {
    // Delete provider keys
    await tx
      .delete(schema.providerKeys)
      .where(eq(schema.providerKeys.projectId, id));

    // Delete API keys
    await tx.delete(schema.apiKeys).where(eq(schema.apiKeys.projectId, id));

    // Delete project members
    await tx
      .delete(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, id));

    // Finally delete the project itself
    const deleted = await tx
      .delete(schema.projects)
      .where(eq(schema.projects.id, id))
      .returning();

    return deleted.length > 0;
  });
}

export async function createApiKey(
  db: HydraDb,
  apiKeySecret: string,
  {
    projectId,
    userId,
    name,
  }: { projectId: string; userId: string; name: string },
): Promise<string> {
  const apiKey = randomBytes(16).toString("hex");
  const encryptedKey = encryptApiKey(projectId, apiKey, apiKeySecret);
  const hashedKey = hashKey(encryptedKey);

  await db.insert(schema.apiKeys).values({
    projectId,
    name,
    hashedKey,
    createdByUserId: userId,
    partiallyHiddenKey: hideApiKey(encryptedKey, 10),
  });

  return encryptedKey;
}

export async function getApiKeys(db: HydraDb, projectId: string) {
  return await db.query.apiKeys.findMany({
    where: eq(schema.apiKeys.projectId, projectId),
  });
}

export async function updateApiKeyLastUsed(
  db: HydraDb,
  {
    projectId,
    hashedKey,
    lastUsed,
  }: {
    projectId: string;
    hashedKey: string;
    lastUsed: Date;
  },
) {
  const updated = await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: lastUsed })
    .where(
      and(
        eq(schema.apiKeys.hashedKey, hashedKey),
        eq(schema.apiKeys.projectId, projectId),
      ),
    )
    .returning();

  if (!updated.length) {
    throw new Error("API Key not found");
  }
  return updated[0];
}

export async function deleteApiKey(
  db: HydraDb,
  projectId: string,
  apiKeyId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.id, apiKeyId),
        eq(schema.apiKeys.projectId, projectId),
      ),
    )
    .returning();
  return deleted.length > 0;
}

export async function validateApiKey(
  db: HydraDb,
  projectId: string,
  apiKey: string,
): Promise<boolean> {
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");

  const keys = await db
    .select()
    .from(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.hashedKey, hashedKey),
        eq(schema.apiKeys.projectId, projectId),
      ),
    );

  return keys.length > 0;
}

export async function addProviderKey(
  db: HydraDb,
  providerKeySecret: string,
  {
    projectId,
    providerName,
    providerKey,
  }: {
    projectId: string;
    providerName: string;
    providerKey: string;
    userId: string;
  },
) {
  return await db.transaction(async (tx) => {
    const providerKeyEncrypted = encryptProviderKey(
      providerName,
      providerKey,
      providerKeySecret,
    );

    await tx.insert(schema.providerKeys).values({
      projectId,
      providerKeyEncrypted,
      providerName,
      partiallyHiddenKey: hideApiKey(providerKey),
    });

    await updateApiKeyStatus(tx, projectId, true);
    return await getProjectWithKeys(tx, projectId);
  });
}

export async function getProviderKeys(db: HydraDb, projectId: string) {
  return await db.query.providerKeys.findMany({
    where: eq(schema.providerKeys.projectId, projectId),
  });
}

export async function deleteProviderKey(
  db: HydraDb,
  projectId: string,
  providerKeyId: string,
) {
  return await db.transaction(async (tx) => {
    await tx
      .delete(schema.providerKeys)
      .where(
        and(
          eq(schema.providerKeys.id, providerKeyId),
          eq(schema.providerKeys.projectId, projectId),
        ),
      );

    return await getProjectWithKeys(tx, projectId);
  });
}

export async function updateApiKeyStatus(
  db: HydraDb,
  projectId: string,
  hasApiKey: boolean,
): Promise<void> {
  const usage = await db.query.projectMessageUsage.findFirst({
    where: eq(schema.projectMessageUsage.projectId, projectId),
  });

  if (usage) {
    await db
      .update(schema.projectMessageUsage)
      .set({
        hasApiKey,
        updatedAt: new Date(),
      })
      .where(eq(schema.projectMessageUsage.projectId, projectId));
  } else {
    await db.insert(schema.projectMessageUsage).values({
      projectId,
      hasApiKey,
    });
  }
}

export async function getProjectMcpServers(
  db: HydraDb,
  projectId: string,
  contextKey: string | null,
) {
  const providers = await db.query.toolProviders.findMany({
    where: and(
      eq(schema.toolProviders.projectId, projectId),
      eq(schema.toolProviders.type, ToolProviderType.MCP),
      isNotNull(schema.toolProviders.url),
    ),
    orderBy: (toolProviders, { asc }) => [asc(toolProviders.createdAt)],
    with: {
      contexts: {
        where:
          contextKey === null
            ? isNull(schema.toolProviderUserContexts.contextKey)
            : eq(schema.toolProviderUserContexts.contextKey, contextKey),
      },
    },
  });
  return providers;
}

export async function createMcpServer(
  db: HydraDb,
  projectId: string,
  url: string,
  customHeaders: Record<string, string> | undefined,
  mcpTransport: MCPTransport,
  mcpRequiresAuth: boolean,
) {
  const [server] = await db
    .insert(schema.toolProviders)
    .values({
      projectId,
      type: ToolProviderType.MCP,
      url,
      customHeaders: customHeaders || {},
      mcpTransport,
      mcpRequiresAuth,
    })
    .returning();

  return {
    id: server.id,
    url: server.url!,
    customHeaders: server.customHeaders,
    mcpTransport: server.mcpTransport,
    mcpRequiresAuth: server.mcpRequiresAuth,
  };
}

export async function deleteMcpServer(
  db: HydraDb,
  projectId: string,
  serverId: string,
) {
  return await db
    .delete(schema.toolProviders)
    .where(
      and(
        eq(schema.toolProviders.id, serverId),
        eq(schema.toolProviders.projectId, projectId),
      ),
    );
}

export async function updateMcpServer(
  db: HydraDb,
  projectId: string,
  serverId: string,
  url: string,
  customHeaders: Record<string, string> | undefined,
  mcpTransport: MCPTransport,
  mcpRequiresAuth: boolean,
) {
  const [server] = await db
    .update(schema.toolProviders)
    .set({
      url,
      customHeaders: customHeaders || {},
      mcpTransport,
      mcpRequiresAuth,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.toolProviders.id, serverId),
        eq(schema.toolProviders.projectId, projectId),
      ),
    )
    .returning();

  return {
    id: server.id,
    url: server.url!,
    customHeaders: server.customHeaders,
    mcpTransport: server.mcpTransport,
    mcpRequiresAuth: server.mcpRequiresAuth,
  };
}

export async function getMcpServer(
  db: HydraDb,
  projectId: string,
  serverId: string,
  contextKey: string | null,
) {
  return await db.query.toolProviders.findFirst({
    where: and(
      eq(schema.toolProviders.id, serverId),
      eq(schema.toolProviders.projectId, projectId),
    ),
    with: {
      contexts: {
        where:
          contextKey === null
            ? isNull(schema.toolProviderUserContexts.contextKey)
            : eq(schema.toolProviderUserContexts.contextKey, contextKey),
      },
    },
  });
}

/**
 * Get Composio apps for a project, optionally filtered by context key. If no context key is provided, all apps are returned.
 * @param db - The database instance
 * @param projectId - The project ID
 * @param contextKey - The context key to filter by
 * @returns The Composio apps for the project
 */
export async function getComposioApps(
  db: HydraDb,
  projectId: string,
  contextKey?: string | null,
) {
  const toolProviders = await db.query.toolProviders.findMany({
    where: and(
      eq(schema.toolProviders.projectId, projectId),
      eq(schema.toolProviders.type, ToolProviderType.COMPOSIO),
    ),
    with: {
      contexts: {
        where:
          contextKey === undefined
            ? undefined
            : contextKey === null
              ? isNull(schema.toolProviderUserContexts.contextKey)
              : eq(schema.toolProviderUserContexts.contextKey, contextKey),
      },
    },
  });

  // Only return providers that have matching contexts when contextKey is provided
  return contextKey !== undefined
    ? toolProviders.filter((provider) => provider.contexts.length > 0)
    : toolProviders;
}

export async function enableComposioApp(
  db: HydraDb,
  projectId: string,
  appId: string,
) {
  try {
    return await db.insert(schema.toolProviders).values({
      projectId,
      type: ToolProviderType.COMPOSIO,
      composioAppId: appId,
    });
  } catch (error) {
    console.log("Error enabling Composio app:", error);
    throw error;
  }
}

export async function disableComposioApp(
  db: HydraDb,
  projectId: string,
  appId: string,
) {
  return await db
    .delete(schema.toolProviders)
    .where(
      and(
        eq(schema.toolProviders.projectId, projectId),
        eq(schema.toolProviders.type, ToolProviderType.COMPOSIO),
        eq(schema.toolProviders.composioAppId, appId),
      ),
    );
}

export async function getComposioAppProvider(
  db: HydraDb,
  projectId: string,
  appId: string,
) {
  const [provider] = await db.query.toolProviders.findMany({
    where: and(
      eq(schema.toolProviders.projectId, projectId),
      eq(schema.toolProviders.type, ToolProviderType.COMPOSIO),
      eq(schema.toolProviders.composioAppId, appId),
    ),
  });
  return provider;
}

export async function upsertComposioAuth(
  db: HydraDb,
  toolProviderId: string,
  contextKey: string | null,
  fields: Omit<
    typeof schema.toolProviderUserContexts.$inferInsert,
    "toolProviderId" | "contextKey"
  >,
): Promise<void> {
  await db.transaction(async (tx) => {
    // First try to find an existing context
    const existingContext = await tx.query.toolProviderUserContexts.findFirst({
      where: and(
        eq(schema.toolProviderUserContexts.toolProviderId, toolProviderId),
        contextKey
          ? eq(schema.toolProviderUserContexts.contextKey, contextKey)
          : isNull(schema.toolProviderUserContexts.contextKey),
      ),
    });

    if (existingContext) {
      // Update existing context
      await tx
        .update(schema.toolProviderUserContexts)
        .set(fields)
        .where(eq(schema.toolProviderUserContexts.id, existingContext.id));
    } else {
      // Create new context
      await tx.insert(schema.toolProviderUserContexts).values({
        toolProviderId,
        contextKey,
        ...fields,
      });
    }
  });
}

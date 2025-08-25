import { ActionType, GenerationStage } from "@tambo-ai-cloud/core";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { mergeSuperJson } from "../drizzleUtil";
import * as schema from "../schema";
import type { HydraDb } from "../types";
import { fixLegacyRole } from "../util/legacyMessages";

export type ThreadMetadata = Record<string, unknown>;
export type MessageContent = string | Record<string, unknown>;
export type MessageMetadata = Record<string, unknown>;
export async function createThread(
  db: HydraDb,
  {
    projectId,
    contextKey,
    metadata,
    name,
  }: {
    projectId: string;
    contextKey?: string;
    metadata?: ThreadMetadata;
    name?: string;
  },
) {
  const [thread] = await db
    .insert(schema.threads)
    .values({
      projectId,
      contextKey,
      metadata,
      name,
    })
    .returning();

  return thread;
}

export async function getThreadGenerationStage(
  db: HydraDb,
  threadId: string,
  projectId: string,
  contextKey?: string,
) {
  const thread = await db.query.threads.findFirst({
    where: contextKey
      ? and(
          eq(schema.threads.id, threadId),
          eq(schema.threads.projectId, projectId),
          eq(schema.threads.contextKey, contextKey),
        )
      : and(
          eq(schema.threads.id, threadId),
          eq(schema.threads.projectId, projectId),
        ),
    columns: {
      generationStage: true,
    },
  });

  return thread?.generationStage;
}

export async function getThreadForProjectId(
  db: HydraDb,
  threadId: string,
  projectId: string,
  includeInternal: boolean = false,
  contextKey?: string,
): Promise<schema.DBThreadWithMessages | undefined> {
  return await db.query.threads.findFirst({
    where: contextKey
      ? and(
          eq(schema.threads.id, threadId),
          eq(schema.threads.projectId, projectId),
          eq(schema.threads.contextKey, contextKey),
        )
      : and(
          eq(schema.threads.id, threadId),
          eq(schema.threads.projectId, projectId),
        ),
    with: {
      messages: {
        where: includeInternal
          ? undefined
          : or(
              isNull(schema.messages.actionType),
              eq(schema.messages.actionType, ActionType.ToolCall),
            ),
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        with: {
          suggestions: true,
        },
      },
    },
  });
}

export async function getThreadsByProject(
  db: HydraDb,
  projectId: string,
  {
    contextKey,
    offset = 0,
    limit = 10,
    includeMessages = true,
  }: {
    contextKey?: string;
    offset?: number;
    limit?: number;
    includeMessages?: boolean;
  } = {},
) {
  return await db.query.threads.findMany({
    where: contextKey
      ? and(
          eq(schema.threads.projectId, projectId),
          eq(schema.threads.contextKey, contextKey),
        )
      : eq(schema.threads.projectId, projectId),
    with: includeMessages
      ? {
          messages: true,
        }
      : undefined,
    orderBy: (threads, { desc }) => [desc(threads.createdAt)],
    offset,
    limit,
  });
}
export async function countThreadsByProject(
  db: HydraDb,
  projectId: string,
  { contextKey }: { contextKey?: string } = {},
) {
  return await db.$count(
    schema.threads,
    contextKey
      ? eq(schema.threads.contextKey, contextKey)
      : eq(schema.threads.projectId, projectId),
  );
}

export async function updateThread(
  db: HydraDb,
  threadId: string,
  {
    contextKey,
    metadata,
    generationStage,
    statusMessage,
    name,
  }: {
    contextKey?: string | null;
    metadata?: ThreadMetadata;
    generationStage?: GenerationStage;
    statusMessage?: string;
    name?: string;
  },
): Promise<schema.DBThreadWithMessages> {
  const [updated] = await db
    .update(schema.threads)
    .set({
      contextKey,
      metadata,
      updatedAt: new Date(),
      generationStage,
      statusMessage,
      name,
    })
    .where(eq(schema.threads.id, threadId))
    .returning();

  const messages = await db.query.messages.findMany({
    where: eq(schema.messages.threadId, threadId),
  });
  const messagesWithCorrectedRole = fixLegacyRole(messages);
  return {
    ...updated,
    messages: messagesWithCorrectedRole.map((msg) => ({
      ...msg,
      suggestions: [],
    })),
  };
}

export async function deleteThread(db: HydraDb, threadId: string) {
  return await db.transaction(async (tx) => {
    // First, get all message IDs for this thread
    const threadMessages = await tx.query.messages.findMany({
      where: eq(schema.messages.threadId, threadId),
      columns: { id: true },
    });

    const messageIds = threadMessages.map((msg) => msg.id);

    // Delete all suggestions for messages in this thread
    if (messageIds.length > 0) {
      await tx
        .delete(schema.suggestions)
        .where(inArray(schema.suggestions.messageId, messageIds));
    }

    // Delete all messages in the thread
    await tx
      .delete(schema.messages)
      .where(eq(schema.messages.threadId, threadId));

    // Delete the thread
    const [deleted] = await tx
      .delete(schema.threads)
      .where(eq(schema.threads.id, threadId))
      .returning();

    return deleted;
  });
}

export async function addMessage(
  db: HydraDb,
  messageInput: typeof schema.messages.$inferInsert,
): Promise<typeof schema.messages.$inferSelect> {
  const [message] = await db
    .insert(schema.messages)
    .values(messageInput)
    .returning();

  // Update the thread's updatedAt timestamp
  await db
    .update(schema.threads)
    .set({ updatedAt: new Date() })
    .where(eq(schema.threads.id, message.threadId));

  return message;
}

export async function getMessages(
  db: HydraDb,
  threadId: string,
  includeInternal: boolean = false,
): Promise<(typeof schema.messages.$inferSelect)[]> {
  const messages = await db.query.messages.findMany({
    where: includeInternal
      ? eq(schema.messages.threadId, threadId)
      : and(
          eq(schema.messages.threadId, threadId),
          or(
            isNull(schema.messages.actionType),
            eq(schema.messages.actionType, ActionType.ToolCall),
          ),
        ),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
  });
  return fixLegacyRole(messages);
}

export async function getLatestMessage(
  db: HydraDb,
  threadId: string,
): Promise<typeof schema.messages.$inferSelect> {
  const [latestMessage] = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.threadId, threadId))
    .orderBy(desc(schema.messages.createdAt))
    .limit(1);
  return latestMessage;
}

export async function updateMessage(
  db: HydraDb,
  messageId: string,
  messageInput: Partial<
    Omit<typeof schema.messages.$inferInsert, "id" | "createdAt" | "threadId">
  >,
): Promise<typeof schema.messages.$inferSelect> {
  const [updatedMessage] = await db
    .update(schema.messages)
    .set(messageInput)
    .where(eq(schema.messages.id, messageId))
    .returning();

  // Update the thread's updatedAt timestamp
  await db
    .update(schema.threads)
    .set({ updatedAt: new Date() })
    .where(eq(schema.threads.id, updatedMessage.threadId));

  return updatedMessage;
}

export async function deleteMessage(
  db: HydraDb,
  messageId: string,
): Promise<typeof schema.messages.$inferSelect> {
  const [deleted] = await db
    .delete(schema.messages)
    .where(eq(schema.messages.id, messageId))
    .returning();
  return deleted;
}
export async function updateMessageComponentState(
  db: HydraDb,
  messageId: string,
  newPartialState: Record<string, unknown>,
): Promise<typeof schema.messages.$inferSelect> {
  const componentStateColumn = schema.messages.componentState;
  const [updatedMessage] = await db
    .update(schema.messages)
    .set({
      componentState: mergeSuperJson(componentStateColumn, newPartialState),
    })
    .where(eq(schema.messages.id, messageId))
    .returning();

  return updatedMessage;
}

/**
 * Ensures that the thread exists and belongs to the project
 */
export async function ensureThreadByProjectId(
  db: HydraDb,
  threadId: string,
  projectId: string,
  contextKey: string | undefined,
) {
  const thread = await getThreadForProjectId(
    db,
    threadId,
    projectId,
    false,
    contextKey,
  );
  if (!thread) {
    throw new Error("Thread not found");
  }
}

export async function updateThreadGenerationStatus(
  db: HydraDb,
  threadId: string,
  generationStage: GenerationStage,
  statusMessage?: string,
) {
  const [updated] = await db
    .update(schema.threads)
    .set({
      generationStage,
      statusMessage,
      updatedAt: new Date(),
    })
    .where(eq(schema.threads.id, threadId))
    .returning();

  return updated;
}

export async function getThreadsByProjectWithCounts(
  db: HydraDb,
  projectId: string,
  contextKey?: string,
  {
    offset = 0,
    limit = 5,
  }: {
    offset?: number;
    limit?: number;
  } = {},
  {
    searchQuery,
    sortField = "created",
    sortDirection = "desc",
  }: {
    searchQuery?: string;
    sortField?:
      | "created"
      | "updated"
      | "threadId"
      | "threadName"
      | "contextKey"
      | "messages"
      | "errors";
    sortDirection?: "asc" | "desc";
  } = {},
) {
  // Build where conditions
  const whereConditions = [eq(schema.threads.projectId, projectId)];

  if (contextKey) {
    whereConditions.push(eq(schema.threads.contextKey, contextKey));
  }

  // Add search conditions
  if (searchQuery && searchQuery.trim()) {
    const trimmedQuery = searchQuery.trim();

    const searchConditions = [
      eq(schema.threads.id, trimmedQuery),
      eq(schema.threads.contextKey, trimmedQuery),
      ilike(schema.threads.name, `%${trimmedQuery}%`),
    ].filter(Boolean);

    if (searchConditions.length > 0) {
      const orCondition = or(...searchConditions);
      if (orCondition) {
        whereConditions.push(orCondition);
      }
    }
  }

  // sorting by counts
  if (sortField === "messages" || sortField === "errors") {
    // Create a subquery for counts
    const countsSubquery = db
      .select({
        threadId: schema.messages.threadId,
        messageCount: count(schema.messages.id).as("messageCount"),
        errorCount: count(
          sql`CASE WHEN ${schema.messages.error} IS NOT NULL THEN 1 END`,
        ).as("errorCount"),
      })
      .from(schema.messages)
      .groupBy(schema.messages.threadId)
      .as("counts");

    // Build the main query with join
    const orderBy =
      sortField === "messages"
        ? sortDirection === "asc"
          ? countsSubquery.messageCount
          : desc(countsSubquery.messageCount)
        : sortDirection === "asc"
          ? countsSubquery.errorCount
          : desc(countsSubquery.errorCount);

    const threadsWithCounts = await db
      .select({
        id: schema.threads.id,
        projectId: schema.threads.projectId,
        contextKey: schema.threads.contextKey,
        metadata: schema.threads.metadata,
        createdAt: schema.threads.createdAt,
        updatedAt: schema.threads.updatedAt,
        generationStage: schema.threads.generationStage,
        statusMessage: schema.threads.statusMessage,
        name: schema.threads.name,
        messageCount: sql`COALESCE(${countsSubquery.messageCount}, 0)`.as(
          "messageCount",
        ),
        errorCount: sql`COALESCE(${countsSubquery.errorCount}, 0)`.as(
          "errorCount",
        ),
      })
      .from(schema.threads)
      .leftJoin(countsSubquery, eq(schema.threads.id, countsSubquery.threadId))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .offset(offset)
      .limit(limit);

    return threadsWithCounts.map((thread) => ({
      ...thread,
      messageCount: Number(thread.messageCount),
      errorCount: Number(thread.errorCount),
    }));
  }

  // non-count sorting
  const getOrderBy = () => {
    let field;
    switch (sortField) {
      case "created":
        field = schema.threads.createdAt;
        break;
      case "updated":
        field = schema.threads.updatedAt;
        break;
      case "threadId":
        field = schema.threads.id;
        break;
      case "threadName":
        field = schema.threads.name;
        break;
      case "contextKey":
        field = schema.threads.contextKey;
        break;
      default:
        field = schema.threads.createdAt;
    }
    return sortDirection === "asc" ? field : desc(field);
  };

  // Get threads without messages
  const threads = await db.query.threads.findMany({
    where: and(...whereConditions),
    orderBy: [getOrderBy()],
    offset,
    limit,
  });

  if (threads.length === 0) {
    return [];
  }

  // Get all counts in a single query using SQL aggregation
  const threadIds = threads.map((t) => t.id);
  const counts = await db
    .select({
      threadId: schema.messages.threadId,
      messageCount: count(schema.messages.id).as("messageCount"),
      errorCount: count(
        sql`CASE WHEN ${schema.messages.error} IS NOT NULL THEN 1 END`,
      ).as("errorCount"),
    })
    .from(schema.messages)
    .where(inArray(schema.messages.threadId, threadIds))
    .groupBy(schema.messages.threadId);

  // Create a map for quick lookup
  const countsMap = new Map(
    counts.map((c) => [
      c.threadId,
      {
        messageCount: Number(c.messageCount),
        errorCount: Number(c.errorCount),
      },
    ]),
  );

  // Combine threads with their counts
  return threads.map((thread) => ({
    ...thread,
    messageCount: countsMap.get(thread.id)?.messageCount || 0,
    errorCount: countsMap.get(thread.id)?.errorCount || 0,
  }));
}

export async function countThreadsByProjectWithSearch(
  db: HydraDb,
  projectId: string,
  {
    contextKey,
    searchQuery,
  }: {
    contextKey?: string;
    searchQuery?: string;
  } = {},
) {
  // Build where conditions
  const whereConditions = [eq(schema.threads.projectId, projectId)];

  if (contextKey) {
    whereConditions.push(eq(schema.threads.contextKey, contextKey));
  }

  // Add search conditions
  if (searchQuery && searchQuery.trim()) {
    const trimmedQuery = searchQuery.trim();

    const searchConditions = [
      eq(schema.threads.id, trimmedQuery),
      eq(schema.threads.contextKey, trimmedQuery),
      ilike(schema.threads.name, `%${trimmedQuery}%`),
    ].filter(Boolean);

    if (searchConditions.length > 0) {
      const orCondition = or(...searchConditions);
      if (orCondition) {
        whereConditions.push(orCondition);
      }
    }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.threads)
    .where(and(...whereConditions));
  return count;
}

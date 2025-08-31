import { eq, sql } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export async function getProjectMessageUsage(db: HydraDb, projectId: string) {
  return await db.query.projectMessageUsage.findFirst({
    where: eq(schema.projectMessageUsage.projectId, projectId),
  });
}

export async function incrementProjectMessageCount(
  db: HydraDb,
  projectId: string,
) {
  const usage = await getProjectMessageUsage(db, projectId);

  if (usage) {
    const [updated] = await db
      .update(schema.projectMessageUsage)
      .set({
        messageCount: usage.messageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.projectMessageUsage.projectId, projectId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.projectMessageUsage)
    .values({
      projectId,
      messageCount: 1,
    })
    .returning();
  return created;
}

export async function updateProjectMessageUsage(
  db: HydraDb,
  projectId: string,
  data: {
    messageCount?: number;
    hasApiKey?: boolean;
    notificationSentAt?: Date;
    firstMessageSentAt?: Date;
  },
) {
  const usage = await getProjectMessageUsage(db, projectId);

  if (usage) {
    const [updated] = await db
      .update(schema.projectMessageUsage)
      .set({
        ...data,
        updatedAt: new Date(),
        firstMessageSentAt: data.firstMessageSentAt ?? usage.firstMessageSentAt,
      })
      .where(eq(schema.projectMessageUsage.projectId, projectId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.projectMessageUsage)
    .values({
      projectId,
      ...data,
    })
    .returning();
  return created;
}

export async function hasUserReceivedFirstMessageEmail(
  db: HydraDb,
  userId: string,
): Promise<boolean> {
  // Get all projects for the user
  const userProjects = await db.query.projectMembers.findMany({
    where: eq(schema.projectMembers.userId, userId),
    with: {
      project: true,
    },
  });

  // Check if any of their projects have firstMessageSentAt set
  for (const membership of userProjects) {
    const usage = await getProjectMessageUsage(db, membership.project.id);

    if (usage && usage.firstMessageSentAt) {
      return true;
    }
  }

  return false;
}

export async function getUserMessageUsage(db: HydraDb, userId: string) {
  return await db.query.userMessageUsage.findFirst({
    where: eq(schema.userMessageUsage.userId, userId),
  });
}

export async function incrementUserMessageCount(db: HydraDb, userId: string) {
  const [result] = await db
    .insert(schema.userMessageUsage)
    .values({
      userId,
      messageCount: 1,
    })
    .onConflictDoUpdate({
      target: schema.userMessageUsage.userId,
      set: {
        messageCount: sql`${schema.userMessageUsage.messageCount} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result;
}

export async function getUserIdFromThread(
  db: HydraDb,
  threadId: string,
): Promise<string | null> {
  const thread = await db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
    with: {
      project: {
        with: {
          creator: true,
        },
      },
    },
  });

  return thread?.project.creator?.id ?? null;
}

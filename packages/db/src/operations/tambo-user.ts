import { eq, inArray, lt, sql } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export async function getTamboUser(
  db: HydraDb,
  userId: string,
): Promise<typeof schema.tamboUsers.$inferSelect | undefined> {
  return await db.query.tamboUsers.findFirst({
    where: eq(schema.tamboUsers.userId, userId),
  });
}

export async function updateTamboUser(
  db: HydraDb,
  userId: string,
  data: Partial<typeof schema.tamboUsers.$inferInsert>,
): Promise<typeof schema.tamboUsers.$inferSelect> {
  const existing = await getTamboUser(db, userId);

  if (existing) {
    const [updated] = await db
      .update(schema.tamboUsers)
      .set(data)
      .where(eq(schema.tamboUsers.userId, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.tamboUsers)
    .values({
      userId,
      ...data,
    })
    .returning();
  return created;
}

/**
 * Track a welcome email sent to a user.
 */
export async function trackWelcomeEmail(
  db: HydraDb,
  userId: string,
  emailSent: boolean,
  error?: string,
) {
  return await updateTamboUser(db, userId, {
    welcomeEmailSent: emailSent,
    welcomeEmailError: error,
    welcomeEmailSentAt: new Date(),
  });
}

/**
 * Get statistics about welcome emails sent to users.
 */
export async function getWelcomeEmailStats(
  db: HydraDb,
  period: "daily" | "weekly" | "monthly" = "daily",
) {
  const intervalMap = {
    daily: "1 day",
    weekly: "7 days",
    monthly: "30 days",
  };

  const result = await db
    .select({
      total: sql<number>`count(*)`,
      successful: sql<number>`count(*) filter (where welcome_email_sent = true)`,
      failed: sql<number>`count(*) filter (where welcome_email_sent = false)`,
    })
    .from(schema.tamboUsers)
    .where(
      sql`welcome_email_sent_at >= now() - interval '${sql.raw(intervalMap[period])}'`,
    );

  return result[0];
}

export async function getInactiveTamboUsers(
  db: HydraDb,
  inactiveDays: number = 14,
): Promise<
  Array<{
    user: typeof schema.authUsers.$inferSelect;
    tracking: typeof schema.tamboUsers.$inferSelect | undefined;
  }>
> {
  const inactiveDate = new Date();
  inactiveDate.setDate(inactiveDate.getDate() - inactiveDays);

  const users = await db.query.authUsers.findMany({
    where: lt(schema.authUsers.createdAt, inactiveDate),
  });

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u.id);
  const trackings = await db
    .select()
    .from(schema.tamboUsers)
    .where(inArray(schema.tamboUsers.userId, userIds));

  const trackingByUserId = new Map(trackings.map((t) => [t.userId, t]));

  const results: Array<{
    user: typeof schema.authUsers.$inferSelect;
    tracking: typeof schema.tamboUsers.$inferSelect | undefined;
  }> = [];

  for (const user of users) {
    const tracking = trackingByUserId.get(user.id);
    if (
      !tracking ||
      tracking.lastActivityAt < inactiveDate ||
      !tracking.hasSetupProject
    ) {
      results.push({ user, tracking });
    }
  }

  return results;
}

export async function getInactiveUsersWithProjects(
  db: HydraDb,
  inactiveDays: number = 14,
): Promise<
  Array<
    typeof schema.authUsers.$inferSelect & {
      projects: Array<
        typeof schema.projectMembers.$inferSelect & {
          project: typeof schema.projects.$inferSelect;
        }
      >;
    }
  >
> {
  const inactiveDate = new Date();
  inactiveDate.setDate(inactiveDate.getDate() - inactiveDays);

  return await db.query.authUsers.findMany({
    where: lt(schema.authUsers.createdAt, inactiveDate),
    with: {
      projects: {
        with: {
          project: true,
        },
      },
    },
  });
}

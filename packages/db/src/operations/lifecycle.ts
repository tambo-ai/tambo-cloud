import { eq, inArray, lt } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export async function getUserLifecycleTracking(
  db: HydraDb,
  userId: string,
): Promise<typeof schema.userLifecycleTracking.$inferSelect | undefined> {
  return await db.query.userLifecycleTracking.findFirst({
    where: eq(schema.userLifecycleTracking.userId, userId),
  });
}

export async function updateUserLifecycleTracking(
  db: HydraDb,
  userId: string,
  data: Partial<typeof schema.userLifecycleTracking.$inferInsert>,
): Promise<typeof schema.userLifecycleTracking.$inferSelect> {
  const existing = await getUserLifecycleTracking(db, userId);

  if (existing) {
    const [updated] = await db
      .update(schema.userLifecycleTracking)
      .set(data)
      .where(eq(schema.userLifecycleTracking.userId, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.userLifecycleTracking)
    .values({
      userId,
      ...data,
    })
    .returning();
  return created;
}

export async function getInactiveUsers(
  db: HydraDb,
  inactiveDays: number = 14,
): Promise<
  Array<{
    user: typeof schema.authUsers.$inferSelect;
    tracking: typeof schema.userLifecycleTracking.$inferSelect | undefined;
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
    .from(schema.userLifecycleTracking)
    .where(inArray(schema.userLifecycleTracking.userId, userIds));

  const trackingByUserId = new Map(trackings.map((t) => [t.userId, t]));

  const results: Array<{
    user: typeof schema.authUsers.$inferSelect;
    tracking: typeof schema.userLifecycleTracking.$inferSelect | undefined;
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

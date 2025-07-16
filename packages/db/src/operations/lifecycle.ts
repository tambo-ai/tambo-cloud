import { eq, lt } from "drizzle-orm";
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

  const results: Array<{
    user: typeof schema.authUsers.$inferSelect;
    tracking: typeof schema.userLifecycleTracking.$inferSelect | undefined;
  }> = [];

  for (const user of users) {
    const tracking = await getUserLifecycleTracking(db, user.id);
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

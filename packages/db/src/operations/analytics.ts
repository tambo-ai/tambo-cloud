import { sql } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

/**
 * The welcome email tracking table.
 */
export type WelcomeEmailTracking =
  typeof schema.welcomeEmailTracking.$inferSelect;

/**
 * Track a welcome email sent to a user.
 * @param db - The database connection
 * @param userId - The user ID
 * @param emailSent - Whether the email was sent successfully
 * @param error - The error message if the email was not sent successfully
 */
export async function trackWelcomeEmail(
  db: HydraDb,
  userId: string,
  emailSent: boolean,
  error?: string,
) {
  await db.insert(schema.welcomeEmailTracking).values({
    userId,
    emailSent,
    error,
    sentAt: new Date(),
  });
}

/**
 * Get statistics about welcome emails sent to users.
 * @param db - The database connection
 * @param period - The period to get statistics for (daily, weekly, monthly)
 * @returns The statistics
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
      successful: sql<number>`count(*) filter (where email_sent = true)`,
      failed: sql<number>`count(*) filter (where email_sent = false)`,
    })
    .from(schema.welcomeEmailTracking)
    .where(sql`sent_at >= now() - interval '${sql.raw(intervalMap[period])}'`);

  return result[0];
}

import { eq, sql } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

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
  // Try to update existing record first
  const existing = await db.query.tamboUsers.findFirst({
    where: eq(schema.tamboUsers.userId, userId),
  });

  if (existing) {
    await db
      .update(schema.tamboUsers)
      .set({
        welcomeEmailSent: emailSent,
        welcomeEmailError: error,
        welcomeEmailSentAt: new Date(),
      })
      .where(eq(schema.tamboUsers.userId, userId));
  } else {
    // Create new record
    await db.insert(schema.tamboUsers).values({
      userId,
      welcomeEmailSent: emailSent,
      welcomeEmailError: error,
      welcomeEmailSentAt: new Date(),
    });
  }
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
      successful: sql<number>`count(*) filter (where welcome_email_sent = true)`,
      failed: sql<number>`count(*) filter (where welcome_email_sent = false)`,
    })
    .from(schema.tamboUsers)
    .where(
      sql`welcome_email_sent_at >= now() - interval '${sql.raw(intervalMap[period])}'`,
    );

  return result[0];
}

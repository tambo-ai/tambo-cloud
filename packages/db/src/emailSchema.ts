import { pgTable } from "drizzle-orm/pg-core";
import { customJsonb } from "./drizzleUtil";

export const emailEvents = pgTable(
  "email_events",
  ({ uuid, text, timestamp }) => ({
    id: uuid("id").primaryKey().defaultRandom(),
    toAddress: text("to_address").notNull(),
    componentName: text("component_name").notNull(),
    props: customJsonb<Record<string, unknown>>("props").notNull(),
    status: text("status").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
);

export const scheduledEmails = pgTable(
  "scheduled_emails",
  ({ uuid, text, timestamp }) => ({
    id: uuid("id").primaryKey().defaultRandom(),
    toAddress: text("to_address").notNull(),
    componentName: text("component_name").notNull(),
    props: customJsonb<Record<string, unknown>>("props").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }),
);

export type DBEmailEvent = typeof emailEvents.$inferSelect;
export type DBScheduledEmail = typeof scheduledEmails.$inferSelect;

DROP INDEX "idx_tambo_users_reactivation_sent";--> statement-breakpoint
ALTER TABLE "tambo_users" DROP COLUMN "reactivation_email_sent_at";--> statement-breakpoint
ALTER TABLE "tambo_users" DROP COLUMN "reactivation_email_count";
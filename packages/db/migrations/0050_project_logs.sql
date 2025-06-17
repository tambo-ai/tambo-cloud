-- Create enum for log levels
CREATE TYPE project_log_level AS ENUM ('warning', 'error', 'alert');--> statement-breakpoint

-- Table for per-project logs
CREATE TABLE "project_logs" (
  "id" text PRIMARY KEY NOT NULL DEFAULT generate_custom_id('pl_'),
  "project_id" text NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "timestamp" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "level" project_log_level NOT NULL,
  "message" text NOT NULL,
  "metadata" jsonb
);--> statement-breakpoint

-- Helpful indexes
CREATE INDEX "project_logs_project_idx" ON "project_logs" ("project_id");--> statement-breakpoint
CREATE INDEX "project_logs_timestamp_idx" ON "project_logs" ("timestamp");--> statement-breakpoint

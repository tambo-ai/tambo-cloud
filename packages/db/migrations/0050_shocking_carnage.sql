CREATE TABLE "project_logs" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('pl_') NOT NULL,
	"project_id" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "project_logs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "project_logs" ADD CONSTRAINT "project_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_logs_project_idx" ON "project_logs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_logs_timestamp_idx" ON "project_logs" USING btree ("timestamp");
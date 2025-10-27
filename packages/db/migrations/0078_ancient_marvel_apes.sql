ALTER TABLE "projects" ADD COLUMN "freestyle_repo_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "freestyle_repo_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "template_git_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "playground_enabled" boolean DEFAULT false NOT NULL;
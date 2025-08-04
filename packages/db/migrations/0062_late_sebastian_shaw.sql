CREATE SCHEMA "user";
--> statement-breakpoint
CREATE TABLE "user"."identities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_id" text NOT NULL,
	"identity_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"not_after" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_user_meta_data" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "user"."identities" ADD CONSTRAINT "identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "identity_provider_provider_id_idx" ON "user"."identities" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX "identity_user_id_idx" ON "user"."identities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "user"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_not_after_idx" ON "user"."sessions" USING btree ("not_after");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user"."users" USING btree ("email");
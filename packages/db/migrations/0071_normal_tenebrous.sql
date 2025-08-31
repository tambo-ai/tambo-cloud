CREATE TABLE "user_message_usage" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_message_usage" ADD CONSTRAINT "user_message_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_message_usage_user_id_idx" ON "user_message_usage" USING btree ("user_id");
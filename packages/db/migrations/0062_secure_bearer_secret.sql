-- Add per-project bearer token secret with strong default
ALTER TABLE "projects"
  ADD COLUMN "bearer_token_secret" text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex');

-- Backfill safeguard (should be no-ops given NOT NULL DEFAULT on add)
UPDATE "projects"
  SET "bearer_token_secret" = encode(gen_random_bytes(32), 'hex')
  WHERE "bearer_token_secret" IS NULL;

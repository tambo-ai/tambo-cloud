import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as baseSchema from "./schema";
import * as emailSchema from "./emailSchema";
import * as operations from "./operations";
import type { HydraDatabase } from "./types";

let globalPool: Pool | null = null;
const MAX_POOL_SIZE = 50;

// Merge core + email tables for Drizzle runtime usage
export const combinedSchema = { ...baseSchema, ...emailSchema } as const;

function getDb(databaseUrl: string): HydraDatabase {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: databaseUrl,
      max: MAX_POOL_SIZE,
      connectionTimeoutMillis: 10000,
    });
  }
  const db = drizzle(globalPool, { schema: combinedSchema });
  return db as unknown as HydraDatabase;
}

async function closeDb() {
  if (globalPool) {
    await globalPool.end();
    globalPool = null;
  }
}

// Re-export the original schema namespace so existing imports (`import { schema }`) keep working
export * as schema from "./schema";

export * from "./schema";
export * from "./emailSchema";
export * from "./oauth/OAuthLocalProvider";
export * from "./types";
export { closeDb, getDb, operations };

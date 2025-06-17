import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as operations from "./operations";
import * as schema from "./schema";
import * as emailSchema from "./emailSchema";
import type { HydraDatabase } from "./types";

let globalPool: Pool | null = null;

const MAX_POOL_SIZE = 50;

const combinedSchema = { ...schema, ...emailSchema } as const;

function getDb(databaseUrl: string): HydraDatabase {
  if (!globalPool) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: MAX_POOL_SIZE,
      connectionTimeoutMillis: 10000,
    });
    globalPool = pool;
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

export * from "./schema";
export * from "./emailSchema";
export * from "./oauth/OAuthLocalProvider";
export * from "./types";
export { closeDb, getDb, operations, combinedSchema as schema };

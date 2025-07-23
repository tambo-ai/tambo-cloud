import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolClient } from "pg";
import * as operations from "./operations";
import * as schema from "./schema";
import type { HydraDatabase } from "./types";

let globalPool: Pool | null = null;

const MAX_POOL_SIZE = 50;

function getPool(databaseUrl: string): Pool {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: databaseUrl,
      max: MAX_POOL_SIZE,
      connectionTimeoutMillis: 10000,
    });
    // Uncomment to debug connection pool issues
    // globalPool.on("acquire", () => {
    //   console.log(
    //     `Connection acquired: now → ${globalPool.totalCount}/${globalPool.idleCount} (total/idle)`,
    //   );
    // });
    // globalPool.on("release", () => {
    //   console.log(
    //     `Connection released: now → ${globalPool.totalCount}/${globalPool.idleCount} (total/idle) (released connection takes a few ms to be marked as idle)`,
    //   );
    // });
  }
  return globalPool;
}
async function getDbClient(databaseUrl: string): Promise<PoolClient> {
  const pool = getPool(databaseUrl);
  const client = await pool.connect();
  return client;
}

function getDb(databaseUrl: string): HydraDatabase {
  const pool = getPool(databaseUrl);
  // console.log(
  //   `Database status: ${pool.totalCount} connections (${pool.idleCount} idle)`,
  // );
  const db = drizzle(pool, { schema });
  return db;
}

async function closeDb() {
  if (globalPool) {
    await globalPool.end();
    globalPool = null;
  }
}

export * from "./oauth/OAuthLocalProvider";
export * from "./types";
export { closeDb, getDb, getDbClient, operations, schema };

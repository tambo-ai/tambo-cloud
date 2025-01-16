import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// quick hack to get the db connection
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

const db = drizzle(client);

export { db };

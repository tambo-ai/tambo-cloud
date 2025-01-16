import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// quick hack to get the db connection
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

const db = drizzle(client, { casing: "snake_case", schema });

export { db, schema };

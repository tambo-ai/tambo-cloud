import type { Config } from "drizzle-kit";

export default {
  schema: ["./src/schema.ts", "./src/emailSchema.ts"],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;

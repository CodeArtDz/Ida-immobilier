import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// On serverless hosts (e.g. Vercel) each function instance gets its own pool, so
// keep the per-instance pool tiny to avoid exhausting Postgres connections.
const isServerless = Boolean(process.env.VERCEL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isServerless ? 1 : 10,
});
export const db = drizzle(pool, { schema });

export * from "./schema";

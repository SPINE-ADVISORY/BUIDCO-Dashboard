import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/buidco";

export const pool = new Pool({
  connectionString,
  max: 20,
});

export const db = drizzle(pool, { schema });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

// Parse DATABASE_URL or use individual env vars
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  database: process.env.DB_NAME || "buidco",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "shriyam",
  max: 20,
};

export const pool = new Pool(dbConfig);

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err.message);
});

pool.on("connect", () => {
  console.log("✅ Database connected successfully!");
});

export const db = drizzle(pool, { schema });

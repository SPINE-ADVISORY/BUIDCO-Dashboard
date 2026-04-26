/**
 * Master migration runner.
 * 1. Runs Drizzle ORM migrations (tables, indexes, FKs)
 * 2. Re-applies all manual SQL files (functions → triggers → views → rls)
 *
 * Safe to run multiple times — everything is CREATE OR REPLACE or DROP IF EXISTS + CREATE.
 */
import * as dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set in .env");

async function main() {
  console.log("── Connecting to database…");
  const migrationClient = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(migrationClient);

  // 1. Drizzle managed migrations (tables, indexes, constraints)
  console.log("── Running Drizzle migrations…");
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
  console.log("   ✓ Drizzle migrations applied");

  // 2. Manual SQL files in order
  const manualDir = path.join(process.cwd(), "drizzle", "manual");
  const ORDER = ["functions.sql", "triggers.sql", "views.sql", "rls_policies.sql"];

  for (const filename of ORDER) {
    const filePath = path.join(manualDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠ Skipping ${filename} (not found)`);
      continue;
    }
    console.log(`── Applying ${filename}…`);
    const sqlText = fs.readFileSync(filePath, "utf-8");
    // Split on semicolons outside of $$ blocks and execute each statement
    await migrationClient.unsafe(sqlText);
    console.log(`   ✓ ${filename} applied`);
  }

  await migrationClient.end();
  console.log("\n✅ Migration complete");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});

import pg from "pg";
import fs from "fs";
import path from "path";

const { Client } = pg;

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "shriyam",
  database: "buidco"
});

(async () => {
  try {
    await client.connect();
    console.log("Connected to buidco database");

    // Read the migration SQL file
    const sqlFile = path.join(process.cwd(), 'drizzle', '0001_create_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing:", statement.trim().substring(0, 50) + "...");
        await client.query(statement);
      }
    }

    console.log("✅ All migrations applied successfully!");
    await client.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();

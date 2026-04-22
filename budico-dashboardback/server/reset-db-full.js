import pg from "pg";
import fs from "fs";
import path from "path";

const { Client } = pg;

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "shriyam",
  database: "postgres",
});

(async () => {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
    
    // Terminate existing connections
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'buidco'
      AND pid <> pg_backend_pid()
    `);
    
    // Drop and recreate database
    await client.query("DROP DATABASE IF EXISTS buidco");
    await client.query("CREATE DATABASE buidco");
    console.log("✅ Database 'buidco' reset successfully!");
    
    await client.end();
    
    // Reset Drizzle migration journal
    const journalPath = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');
    if (fs.existsSync(journalPath)) {
      const journalData = {
        "version": "7",
        "dialect": "postgresql",
        "entries": []
      };
      fs.writeFileSync(journalPath, JSON.stringify(journalData, null, 2));
      console.log("✅ Drizzle migration journal cleared!");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();

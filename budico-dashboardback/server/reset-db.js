import pg from "pg";

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
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();

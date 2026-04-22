import pg from "pg";

const { Client } = pg;

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "shriyam",
  database: "postgres", // connect to default postgres db first
});

(async () => {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
    
    await client.query("CREATE DATABASE buidco");
    console.log("✅ Database 'buidco' created successfully!");
    
    await client.end();
  } catch (error) {
    if (error.code === "42P04") {
      console.log("ℹ️  Database 'buidco' already exists");
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
})();

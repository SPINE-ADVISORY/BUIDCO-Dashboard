import pg from "pg";

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

    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );

    console.log("Tables in database:", result.rows.map(r => r.table_name));

    await client.end();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();

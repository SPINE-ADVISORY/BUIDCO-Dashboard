import pg from "pg";

const { Client } = pg;

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "shriyam",
  database: "postgres"
});

(async () => {
  try {
    await client.connect();
    console.log("Connected to postgres database");

    const result = await client.query("SELECT datname FROM pg_database WHERE datname = 'buidco'");
    console.log("buidco database exists:", result.rows.length > 0);

    await client.end();
  } catch (error) {
    console.error("Error:", error.message);
  }
})();

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
    console.log("✅ Connected to buidco database successfully!");

    // Check if tables exist
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (result.rows.length === 0) {
      console.log("❌ No tables found in database");
    } else {
      console.log(`✅ Found ${result.rows.length} tables:`);
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }

    await client.end();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
})();

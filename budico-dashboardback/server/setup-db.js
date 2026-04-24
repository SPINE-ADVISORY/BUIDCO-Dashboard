/**
 * Setup Script: Execute 0000_buidco_schema_fixed.sql to create all 22 tables
 * Usage: node setup-db.js
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  try {
    console.log('📦 Connecting to buidco database...');
    await client.connect();
    console.log('✅ Connected!');

    // Read the schema SQL file
    const schemaPath = path.join(process.cwd(), 'drizzle', '0000_buidco_schema_fixed.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('\n🔨 Executing schema (22 tables)...');
    await client.query(schemaSql);
    console.log('✅ Schema executed successfully!');

    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`\n📋 Created tables (${result.rows.length}):`);
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n✨ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();

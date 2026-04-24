/**
 * Clear Drizzle migration history to prevent conflicts
 * Run this after setup-db.js to mark all migrations as applied
 */

import fs from 'fs';
import path from 'path';

function clearDrizzleMigrations() {
  try {
    console.log('🧹 Clearing Drizzle migration history...');
    
    // Clear the migration journal
    const journalPath = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');
    
    if (fs.existsSync(journalPath)) {
      const emptyJournal = {
        version: '5',
        dialect: 'pg',
        entries: []
      };
      
      fs.writeFileSync(journalPath, JSON.stringify(emptyJournal, null, 2));
      console.log('✅ Migration journal cleared');
    } else {
      console.log('ℹ️  Journal file not found, creating new one');
      const metaDir = path.join(process.cwd(), 'drizzle', 'meta');
      if (!fs.existsSync(metaDir)) {
        fs.mkdirSync(metaDir, { recursive: true });
      }
      
      const newJournal = {
        version: '5',
        dialect: 'pg',
        entries: []
      };
      
      fs.writeFileSync(journalPath, JSON.stringify(newJournal, null, 2));
      console.log('✅ New migration journal created');
    }
    
    console.log('\n📝 Migration setup instructions:');
    console.log('   • npm run db:migrate will now skip (no migrations to apply)');
    console.log('   • Future migrations: Use npm run db:generate');
    console.log('   • Manual SQL: Keep in drizzle/ folder for reference');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearDrizzleMigrations();

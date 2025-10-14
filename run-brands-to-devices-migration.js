const db = require('./backend/src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Starting brands to devices migration...');
    await db.connect();
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'complete-brands-to-devices-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration script...');
    
    // Execute the migration
    const result = await db.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Check the output above for detailed migration results.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('🔄 The transaction has been rolled back automatically.');
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

// Run the migration
runMigration();
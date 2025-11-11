/**
 * Run the device brand to manufacturer migration
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'facility_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting device brand to manufacturer migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'rename-device-brand-to-manufacturer.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('🔄 Executing migration...\n');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify the change
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'device' 
      AND column_name IN ('brand', 'manufacturer')
    `);
    
    console.log('🔍 Verification:');
    result.rows.forEach(row => {
      console.log(`  - Column found: ${row.column_name}`);
    });
    
    const hasManufacturer = result.rows.some(r => r.column_name === 'manufacturer');
    const hasBrand = result.rows.some(r => r.column_name === 'brand');
    
    if (hasManufacturer && !hasBrand) {
      console.log('\n✅ SUCCESS: Column successfully renamed to "manufacturer"');
    } else if (hasBrand) {
      console.log('\n⚠️  WARNING: "brand" column still exists');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

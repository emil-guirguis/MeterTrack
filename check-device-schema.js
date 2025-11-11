/**
 * Check the current device table schema
 */
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'facility_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkSchema() {
  try {
    console.log('🔍 Checking device table schema...\n');
    
    // Check if device table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'device'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Device table does not exist');
      return;
    }
    
    console.log('✅ Device table exists\n');
    
    // Get column information
    const columns = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'device'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Device table columns:');
    console.log('─'.repeat(80));
    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type}${length.padEnd(10)} ${nullable}`);
    });
    console.log('─'.repeat(80));
    
    // Check for brand column
    const hasBrand = columns.rows.some(col => col.column_name === 'brand');
    const hasManufacturer = columns.rows.some(col => col.column_name === 'manufacturer');
    
    console.log('\n🔍 Column Check:');
    console.log(`  brand column: ${hasBrand ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`  manufacturer column: ${hasManufacturer ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    if (hasBrand && !hasManufacturer) {
      console.log('\n⚠️  WARNING: Database still uses "brand" column');
      console.log('   You need to run the migration: migrations/rename-device-brand-to-manufacturer.sql');
    } else if (!hasBrand && hasManufacturer) {
      console.log('\n✅ Database has been migrated to use "manufacturer" column');
    } else if (hasBrand && hasManufacturer) {
      console.log('\n⚠️  WARNING: Both "brand" and "manufacturer" columns exist');
    } else {
      console.log('\n❌ ERROR: Neither "brand" nor "manufacturer" column found');
    }
    
    // Sample data
    const sampleData = await pool.query('SELECT * FROM device LIMIT 3');
    if (sampleData.rows.length > 0) {
      console.log('\n📊 Sample data (first 3 rows):');
      console.log(JSON.stringify(sampleData.rows, null, 2));
    } else {
      console.log('\n📊 No data in device table');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();

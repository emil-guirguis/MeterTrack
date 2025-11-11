/**
 * Quick check of device table columns
 */
const db = require('./backend/src/config/database');

async function checkColumns() {
  try {
    console.log('🔍 Checking device table columns...\n');
    
    // Connect to database
    await db.connect();
    console.log('✅ Connected to database\n');
    
    // Try to query with manufacturer
    console.log('Attempting query with manufacturer column...');
    try {
      const result = await db.query('SELECT * FROM device LIMIT 1');
      console.log('✅ Query successful!');
      console.log('Columns in result:', Object.keys(result.rows[0] || {}));
      if (result.rows[0]) {
        console.log('Sample row:', result.rows[0]);
      }
    } catch (error) {
      console.log('❌ Query failed:', error.message);
    }
    
    // Check actual columns
    console.log('\n📋 Checking information_schema...');
    const columns = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'device'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in device table:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
    
    const hasBrand = columns.rows.some(r => r.column_name === 'brand');
    const hasManufacturer = columns.rows.some(r => r.column_name === 'manufacturer');
    
    console.log('\n🔍 Status:');
    console.log(`  brand column: ${hasBrand ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`  manufacturer column: ${hasManufacturer ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    if (hasBrand && !hasManufacturer) {
      console.log('\n⚠️  DATABASE STILL HAS "brand" COLUMN!');
      console.log('   The migration has NOT been applied to the database.');
      console.log('   You need to run: ALTER TABLE device RENAME COLUMN brand TO manufacturer;');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.disconnect();
  }
}

checkColumns();

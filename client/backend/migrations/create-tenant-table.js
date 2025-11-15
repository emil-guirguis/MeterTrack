/**
 * Create Tenant Table
 * Runs only the tenant table migration
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/database');

async function createTenantTable() {
  try {
    console.log('🔄 Creating tenant table...');
    
    // Connect to database
    await db.connect();
    
    // Read the tenant migration file
    const migrationFile = path.join(__dirname, '004_create_tenant_table.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('📄 Running tenant table migration...');
    await db.query(sql);
    console.log('✅ Tenant table created successfully');
    
    // Verify the table was created
    const result = await db.query('SELECT * FROM tenant LIMIT 1');
    console.log(`✅ Tenant table verified. Records found: ${result.rows.length}`);
    if (result.rows.length > 0) {
      console.log('Tenant data:', result.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Failed to create tenant table:', error.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  createTenantTable();
}

module.exports = { createTenantTable };

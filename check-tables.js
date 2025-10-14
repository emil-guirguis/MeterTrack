const db = require('./backend/src/config/database');

async function checkTables() {
  try {
    await db.connect();
    
    // Check if brands table exists
    const brandsResult = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'brands'
      );
    `);
    
    // Check if devices table exists
    const devicesResult = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'devices'
      );
    `);
    
    console.log('Brands table exists:', brandsResult.rows[0].exists);
    console.log('Devices table exists:', devicesResult.rows[0].exists);
    
    // List all tables
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('All tables:', tablesResult.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await db.disconnect();
  }
}

checkTables();
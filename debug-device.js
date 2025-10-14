const db = require('./backend/src/config/database');

async function checkDevice() {
  try {
    await db.connect();
    
    // Get the most recent device
    const result = await db.query('SELECT * FROM devices ORDER BY createdat DESC LIMIT 1');
    console.log('Most recent device:', result.rows[0]);
    
    // Try to get it by ID
    if (result.rows[0]) {
      const deviceId = result.rows[0].id;
      const getResult = await db.query('SELECT * FROM devices WHERE id = $1', [deviceId]);
      console.log('Get by ID result:', getResult.rows[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.disconnect();
  }
}

checkDevice();
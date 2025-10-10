require('dotenv').config();
const db = require('../src/config/database');

(async () => {
  try {
    await db.connect();
    const res = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='meterreadings' ORDER BY ordinal_position`);
    console.log('meterreadings columns:', res.rows);
  } catch (e) {
    console.error('inspect-columns FAILED:', e.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
})();

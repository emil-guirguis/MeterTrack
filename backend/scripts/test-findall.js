require('dotenv').config();
const MeterReading = require('../src/models/MeterReadingPG');
const db = require('../src/config/database');

(async () => {
  try {
    process.env.NODE_ENV = 'development';
    await db.connect();
    const rows = await MeterReading.findAll({});
    console.log('findAll count:', rows.length);
    console.log('first row keys:', rows[0] ? Object.keys(rows[0]) : []);
  } catch (e) {
    console.error('test-findall FAILED:', e.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
})();

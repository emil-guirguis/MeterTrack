// Quick diagnostic for meterreadings stats SQL
require('dotenv').config();
const db = require('../src/config/database');

async function run() {
  const sql = `
    SELECT 
      COUNT(*)::int AS total_readings,
      COUNT(DISTINCT meterid)::int AS unique_meters,
      COALESCE(SUM(kwh), 0)::float AS total_kwh,
      COALESCE(SUM(kvah), 0)::float AS total_kvah,
      COALESCE(SUM(kvarh), 0)::float AS total_kvarh
    FROM meterreadings
    WHERE (status IS NULL OR status = 'active')
  `;
  try {
    await db.connect();
    const result = await db.query(sql);
    console.log('Stats SQL OK:', result.rows[0]);
  } catch (e) {
    console.error('Stats SQL FAILED:', e.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

run();

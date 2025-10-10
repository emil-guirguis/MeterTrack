// Apply ALTER statements to extend meterreadings table with rich telemetry fields
// Uses backend Postgres config from backend/.env via database module

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('../src/config/database');

async function run() {
  const sqlPath = path.resolve(__dirname, '../../alter-postgres-meterreadings-extended.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await db.connect();
    console.log('Connected to PostgreSQL');
    await db.query(sql);
    console.log('Extended meterreadings table successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    try { await db.disconnect(); } catch {}
  }
}

run();

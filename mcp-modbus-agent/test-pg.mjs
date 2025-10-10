#!/usr/bin/env node

// Test MCP agent's PostgreSQL connectivity
import { config as dotenvConfig } from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const { Pool } = pg;

// Load backend/.env first, then local .env (override)
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const agentDir = __dirname;
  const rootDir = path.resolve(agentDir, '..');
  const backendEnv = path.join(rootDir, 'backend', '.env');
  const agentEnv = path.join(agentDir, '.env');

  dotenvConfig({ path: backendEnv });
  dotenvConfig({ path: agentEnv, override: true });
} catch {
  dotenvConfig();
}

async function main() {
  const config = {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '6543'),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_SSL !== 'false' ? { rejectUnauthorized: false } : false
  };

  if (!config.host || !config.database || !config.user || !config.password) {
    console.error('❌ PostgreSQL configuration incomplete. Check POSTGRES_HOST, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD in .env');
    process.exit(1);
  }

  console.log('🔌 Testing PostgreSQL connection...');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);

  const pool = new Pool(config);

  try {
    const start = Date.now();
    const client = await pool.connect();
    await client.query('SELECT 1');
    const elapsed = Date.now() - start;

    // Check if meter_readings_realtime table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'meter_readings_realtime'
      ) as exists
    `);

    const tableExists = tableCheck.rows[0].exists;

    console.log(`✅ Connected and ping successful in ${elapsed} ms`);
    console.log(`📄 Table 'meter_readings_realtime' exists: ${tableExists}`);

    if (tableExists) {
      // Get count of records
      const countResult = await client.query('SELECT COUNT(*) as count FROM meter_readings_realtime');
      console.log(`📊 Record count: ${countResult.rows[0].count}`);
    } else {
      console.log(`ℹ️  Table will be created automatically on first connection by the MCP agent`);
    }

    client.release();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);

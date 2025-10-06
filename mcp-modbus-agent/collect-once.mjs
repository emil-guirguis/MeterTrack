#!/usr/bin/env node

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

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

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import compiled JS modules
import { DataCollector } from './dist/data-collector.js';
import { createLogger } from './dist/logger.js';

const logger = createLogger();

function buildConfig() {
  return {
    modbus: {
      ip: process.env.MODBUS_IP || '10.10.10.11',
      port: parseInt(process.env.MODBUS_PORT || '502'),
      slaveId: parseInt(process.env.MODBUS_SLAVE_ID || '1'),
      timeout: parseInt(process.env.MODBUS_TIMEOUT || '5000')
    },
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meterdb',
      databaseName: 'meterdb',
      collectionName: process.env.MONGODB_COLLECTION || 'meterreadings'
    },
    collectionInterval: parseInt(process.env.COLLECTION_INTERVAL || '900000'),
    autoStart: false
  };
}

async function main() {
  console.log('🔧 One-off collection starting...');
  const config = buildConfig();
  const collector = new DataCollector(config, logger);

  const initOk = await collector.initialize();
  if (!initOk) {
    console.error('❌ Failed to initialize collector. Check Modbus and MongoDB connectivity.');
    process.exit(1);
  }

  try {
    const reading = await collector.collectData();
    if (!reading) {
      console.error('❌ No reading returned from Modbus device.');
    } else {
      console.log('✅ Reading collected:', reading);
      // Persist explicitly (collectData does not insert by itself)
      await collector.databaseManager.insertMeterReading(reading);
      console.log('💾 Reading inserted into MongoDB');

      const meterId = `${config.modbus.ip}_${config.modbus.slaveId}`;
      const latest = await collector.databaseManager.getLatestReading(meterId);
      console.log('📥 Latest reading in DB:', latest);
    }
  } catch (err) {
    console.error('❌ Error during collection:', err?.message || err);
  } finally {
    await collector.shutdown();
    console.log('🏁 Done.');
  }
}

main().catch((e) => {
  console.error('❌ Fatal error:', e?.message || e);
  process.exit(1);
});
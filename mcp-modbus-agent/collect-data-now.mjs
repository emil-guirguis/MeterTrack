#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { DataCollector } from './dist/data-collector.js';
import { createLogger } from './dist/logger.js';

// Load environment variables
(() => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const thisDir = path.dirname(thisFile);
    const agentEnv = path.join(thisDir, '.env');
    dotenvConfig({ path: agentEnv });
  } catch {
    dotenvConfig();
  }
})();

// Configuration
const config = {
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
  collectionInterval: parseInt(process.env.COLLECTION_INTERVAL || '30000'),
  autoStart: false // We'll manually trigger collection
};

async function collectDataOnce() {
  const logger = createLogger();
  const collector = new DataCollector(config, logger);

  try {
    console.log('🔌 Initializing connections...');
    const initialized = await collector.initialize();
    
    if (!initialized) {
      console.error('❌ Failed to initialize data collector');
      process.exit(1);
    }

    console.log('📊 Collecting meter data...');
    const reading = await collector.collectData();
    
    if (reading) {
      console.log('✅ Data collected successfully:');
      console.log(JSON.stringify(reading, null, 2));
    } else {
      console.log('⚠️  No data collected');
    }

    console.log('🔍 Testing connections...');
    const status = await collector.getStatus();
    console.log('Status:', JSON.stringify(status, null, 2));

  } catch (error) {
    console.error('❌ Error during data collection:', error);
  } finally {
    console.log('🛑 Shutting down...');
    await collector.shutdown();
  }
}

collectDataOnce().catch(console.error);
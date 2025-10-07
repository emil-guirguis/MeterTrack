#!/usr/bin/env node

// Simple continuous data collector that works like the test but runs in a loop
import { fileURLToPath } from 'url';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
(() => {
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const thisDir = path.dirname(thisFile);
    const agentDir = thisDir;
    const rootDir = path.resolve(agentDir, '..');
    const backendEnv = path.join(rootDir, 'backend', '.env');
    const agentEnv = path.join(agentDir, '.env');

    dotenvConfig({ path: backendEnv });
    dotenvConfig({ path: agentEnv, override: true });
  } catch {
    dotenvConfig();
  }
})();

import { createLogger } from './dist/logger.js';
import { DataCollector } from './dist/data-collector.js';

const logger = createLogger();

const config = {
  modbus: {
    ip: process.env.MODBUS_IP || '10.10.10.11',
    port: parseInt(process.env.MODBUS_PORT || '502', 10),
    slaveId: parseInt(process.env.MODBUS_SLAVE_ID || '1', 10),
    timeout: parseInt(process.env.MODBUS_TIMEOUT || '5000', 10)
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meterdb',
    databaseName: 'meterdb',
    collectionName: process.env.MONGODB_COLLECTION || 'meterreadings'
  },
  collectionInterval: parseInt(process.env.COLLECTION_INTERVAL || '30000', 10),
  autoStart: false // We'll handle the timing manually
};

console.log('🚀 Starting Simple Meter Data Collector');
console.log(`📊 Meter: ${config.modbus.ip}:${config.modbus.port}`);
console.log(`💾 Database: ${config.database.uri}`);
console.log(`⏱️  Collection Interval: ${config.collectionInterval}ms (${config.collectionInterval/1000} seconds)`);
console.log(`🔄 Starting continuous data collection...\n`);

const dataCollector = new DataCollector(config, logger);
let isRunning = false;
let collectionCount = 0;

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  isRunning = false;
  await dataCollector.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  isRunning = false;
  await dataCollector.shutdown();
  process.exit(0);
});

// Simple collection function that mimics the test
async function collectData() {
  try {
    console.log(`📊 Collection #${collectionCount + 1} - ${new Date().toLocaleTimeString()}`);
    
    // Test connections first
    const dbConnected = await dataCollector.databaseManager.testConnection();
    const modbusConnected = await dataCollector.modbusClient.testConnection();
    
    if (!dbConnected) {
      console.log('❌ Database connection failed');
      return false;
    }
    
    if (!modbusConnected) {
      console.log('❌ Modbus connection failed');
      return false;
    }
    
    // Collect and store data
    const reading = await dataCollector.collectData();
    
    if (reading) {
      collectionCount++;
      console.log(`✅ Data collected and stored - Energy: ${reading.energy}, Power: ${reading.power}W`);
      return true;
    } else {
      console.log('❌ Failed to collect data');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Collection error:', error.message);
    return false;
  }
}

// Start the collection loop
async function startCollectionLoop() {
  console.log('🔌 Testing initial connections...');
  
  // Test connections first
  const dbConnected = await dataCollector.databaseManager.testConnection();
  const modbusConnected = await dataCollector.modbusClient.testConnection();
  
  console.log(`   MongoDB: ${dbConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   Modbus: ${modbusConnected ? '✅ Connected' : '❌ Failed'}`);
  
  if (!dbConnected || !modbusConnected) {
    console.log('\n❌ Initial connection tests failed, exiting');
    process.exit(1);
  }
  
  console.log('\n✅ All connections successful');
  console.log('🔄 Starting collection loop...');
  console.log('💡 Press Ctrl+C to stop\n');
  
  isRunning = true;
  
  // Initial collection
  await collectData();
  
  // Set up interval for continuous collection
  const intervalId = setInterval(async () => {
    if (!isRunning) {
      clearInterval(intervalId);
      return;
    }
    
    await collectData();
    
    // Show status every 10 collections
    if (collectionCount % 10 === 0) {
      console.log(`📈 Status: ${collectionCount} collections completed`);
    }
    
  }, config.collectionInterval);
  
  // Keep process alive
  while (isRunning) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

startCollectionLoop().catch(error => {
  console.error('❌ Startup failed:', error.message);
  process.exit(1);
});
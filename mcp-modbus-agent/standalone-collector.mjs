#!/usr/bin/env node

// Standalone data collector that runs continuously without MCP client
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
  autoStart: true // Force auto-start for standalone mode
};

console.log('🚀 Starting Standalone Meter Data Collector');
console.log(`📊 Meter: ${config.modbus.ip}:${config.modbus.port}`);
console.log(`💾 Database: ${config.database.uri}`);
console.log(`⏱️  Collection Interval: ${config.collectionInterval}ms (${config.collectionInterval/1000} seconds)`);
console.log(`🔄 Starting continuous data collection...\n`);

const dataCollector = new DataCollector(config, logger);

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await dataCollector.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await dataCollector.shutdown();
  process.exit(0);
});

// Start data collection
async function startCollector() {
  try {
    console.log('🔌 Testing connections...');
    
    // Test connections first
    const dbConnected = await dataCollector.databaseManager.testConnection();
    const modbusConnected = await dataCollector.modbusClient.testConnection();
    
    console.log(`   MongoDB: ${dbConnected ? '✅ Connected' : '❌ Failed'}`);
    console.log(`   Modbus: ${modbusConnected ? '✅ Connected' : '❌ Failed'}`);
    
    if (!dbConnected || !modbusConnected) {
      console.log('\n❌ Connection tests failed, exiting');
      process.exit(1);
    }
    
    console.log('\n✅ All connections successful');
    console.log('🔄 Starting automatic data collection...');
    console.log('💡 Press Ctrl+C to stop\n');
    
    // Start the data collector
    const started = await dataCollector.start();
    
    if (started) {
      console.log('🎉 Data collector started successfully!');
      console.log(`📈 Collecting real meter data every ${config.collectionInterval/1000} seconds`);
      
      // Keep the process alive and show periodic status
      setInterval(async () => {
        try {
          const status = await dataCollector.getStatus();
          const latest = await dataCollector.getLatestReading();
          
          console.log(`💓 Status: ${status.isRunning ? 'Running' : 'Stopped'} | ` +
                     `Collections: ${status.totalCollections} | ` +
                     `Errors: ${status.errorCount} | ` +
                     `Latest Energy: ${latest?.energy || 'N/A'}`);
        } catch (error) {
          console.log(`⚠️  Status check failed: ${error.message}`);
        }
      }, 60000); // Status update every minute
      
    } else {
      console.log('❌ Failed to start data collector');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

startCollector();
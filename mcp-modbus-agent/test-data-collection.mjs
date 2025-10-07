#!/usr/bin/env node

// Test script to manually trigger data collection and verify database storage
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
  autoStart: process.env.AUTO_START_COLLECTION === 'true'
};

console.log('🧪 Testing Data Collection and Database Storage');
console.log(`📊 Config: ${config.modbus.ip}:${config.modbus.port} -> ${config.database.uri}`);
console.log(`⏱️  Collection Interval: ${config.collectionInterval}ms`);
console.log(`🔄 Auto Start: ${config.autoStart}\n`);

const dataCollector = new DataCollector(config, logger);

async function testDataCollection() {
  try {
    console.log('1️⃣ Testing connections...');
    
    // Test MongoDB connection
    const dbConnected = await dataCollector.databaseManager.testConnection();
    console.log(`   MongoDB: ${dbConnected ? '✅ Connected' : '❌ Failed'}`);
    
    // Test Modbus connection
    const modbusConnected = await dataCollector.modbusClient.testConnection();
    console.log(`   Modbus: ${modbusConnected ? '✅ Connected' : '❌ Failed'}`);
    
    if (!dbConnected || !modbusConnected) {
      console.log('\n❌ Connection tests failed, cannot proceed');
      return;
    }
    
    console.log('\n2️⃣ Collecting and storing data...');
    
    // Manually collect data (this should read from Modbus and store in MongoDB)
    const reading = await dataCollector.collectData();
    
    if (reading) {
      console.log('✅ Data collected successfully:');
      console.log(JSON.stringify(reading, null, 2));
      
      console.log('\n3️⃣ Verifying data was stored in database...');
      
      // Wait a moment for database write to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get latest reading from database
      const latestReading = await dataCollector.getLatestReading();
      
      if (latestReading) {
        console.log('✅ Latest reading from database:');
        console.log(JSON.stringify(latestReading, null, 2));
        
        // Check if timestamps match (within 5 seconds)
        const timeDiff = Math.abs(new Date(reading.timestamp).getTime() - new Date(latestReading.timestamp).getTime());
        if (timeDiff < 5000) {
          console.log('\n🎉 SUCCESS: Data collection and storage working correctly!');
        } else {
          console.log('\n⚠️  WARNING: Timestamps don\'t match, data might not be storing correctly');
        }
      } else {
        console.log('\n❌ No data found in database - storage may have failed');
      }
    } else {
      console.log('❌ Failed to collect data from Modbus device');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await dataCollector.shutdown();
  }
}

testDataCollection();
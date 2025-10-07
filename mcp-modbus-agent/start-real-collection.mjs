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

// Configuration for REAL Modbus meter
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
  collectionInterval: parseInt(process.env.COLLECTION_INTERVAL || '60000'), // 1 minute
  autoStart: true
};

async function startRealDataCollection() {
  const logger = createLogger();
  const collector = new DataCollector(config, logger);

  console.log('🔌 Starting REAL Modbus Data Collection...');
  console.log('⚠️  This will connect to the actual meter device');
  console.log(`📊 Configuration:`);
  console.log(`   Modbus Device: ${config.modbus.ip}:${config.modbus.port} (Slave ID: ${config.modbus.slaveId})`);
  console.log(`   MongoDB: ${config.database.uri}`);
  console.log(`   Collection Interval: ${config.collectionInterval}ms (${config.collectionInterval/1000}s = ${config.collectionInterval/60000} minute(s))`);
  console.log('');

  try {
    console.log('🔍 Testing connections first...');
    
    // Test database connection
    const dbConnected = await collector.databaseManager.connect();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    console.log('✅ Database connection successful');

    // Test Modbus connection
    const modbusConnected = await collector.modbusClient.connect();
    if (!modbusConnected) {
      throw new Error('Failed to connect to Modbus device');
    }
    console.log('✅ Modbus device connection successful');

    // Try to read one sample
    console.log('📊 Testing data reading...');
    const testReading = await collector.modbusClient.readMeterData();
    if (testReading) {
      console.log('✅ Sample reading successful:');
      console.log(`   Voltage: ${testReading.voltage}V`);
      console.log(`   Current: ${testReading.current}A`);
      console.log(`   Power: ${testReading.power}W`);
      console.log(`   Energy: ${testReading.energy}Wh`);
      console.log('');
    }

    // Start continuous collection
    const started = await collector.start();
    
    if (started) {
      console.log('✅ Real data collection started successfully!');
      console.log(`📈 Collecting REAL meter data every ${config.collectionInterval/60000} minute(s)`);
      console.log('🛑 Press Ctrl+C to stop');
      console.log('');
      
      // Keep the process running
      process.on('SIGINT', async () => {
        console.log('\n🛑 Stopping real data collection...');
        await collector.shutdown();
        console.log('✅ Real data collection stopped');
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n🛑 Stopping real data collection...');
        await collector.shutdown();
        console.log('✅ Real data collection stopped');
        process.exit(0);
      });

      // Log status every 5 minutes
      setInterval(async () => {
        const status = await collector.getStatus();
        const uptime = Math.floor(status.uptime / 60);
        console.log(`💓 Status: Running=${status.isRunning}, Errors=${status.errorCount}, Uptime=${uptime}min`);
      }, 300000); // 5 minutes

    } else {
      console.error('❌ Failed to start real data collection');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error starting real data collector:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('');
      console.log('💡 Troubleshooting tips:');
      console.log('   • Check if the Modbus device is powered on');
      console.log('   • Verify the IP address is correct: ' + config.modbus.ip);
      console.log('   • Ensure the device is on the same network');
      console.log('   • Check if port 502 is open on the device');
      console.log('   • Verify the slave ID is correct: ' + config.modbus.slaveId);
    }
    
    process.exit(1);
  }
}

startRealDataCollection();
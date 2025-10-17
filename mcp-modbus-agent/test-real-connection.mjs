#!/usr/bin/env node
import { createLogger } from './dist/logger.js';
import { EnhancedModbusClient } from './dist/enhanced-modbus-client.js';

console.log('🔍 Testing REAL Modbus connection to 10.10.10.11:502 with enhanced client...');

const logger = createLogger();
const clientConfig = {
  host: '10.10.10.11',
  port: 502,
  unitId: 1, // Will be changed in loop
  timeout: 5000,
  maxRetries: 3,
  reconnectDelay: 5000
};

const client = new EnhancedModbusClient(clientConfig, logger);

try {
  // Test different slave IDs
  const slaveIds = [1, 2, 3, 247, 255];
  
  for (const slaveId of slaveIds) {
    try {
      console.log(`\n🔧 Testing Slave ID: ${slaveId}`);
      
      // Update client configuration for this slave ID
      client.updateConfig({ unitId: slaveId });
      
      // Connect to the real meter
      const connected = await client.connect();
      if (!connected) {
        console.log(`❌ Failed to connect with Slave ID ${slaveId}`);
        continue;
      }
      console.log(`✅ Connected to real meter with Slave ID ${slaveId}!`);
      
      // Try reading some common registers
      console.log('📊 Reading registers...');
      
      // Try different register ranges
      const registerRanges = [
        { start: 0, count: 10, name: 'Holding 0-9' },
        { start: 1000, count: 10, name: 'Holding 1000-1009' },
        { start: 3000, count: 10, name: 'Holding 3000-3009' },
        { start: 30000, count: 10, name: 'Holding 30000-30009' }
      ];
      
      for (const range of registerRanges) {
        try {
          const result = await client.client.readHoldingRegisters(range.start, range.count);
          const data = result.response.body.values;
          console.log(`✅ ${range.name}: [${data.join(', ')}]`);
          
          // If we got data, try to interpret voltage-like values
          data.forEach((value, index) => {
            const addr = range.start + index;
            if (value > 1000 && value < 2500) { // Typical voltage range * 10
              console.log(`   📈 Register ${addr}: ${value} (could be ${value/10}V)`);
            }
            if (value > 100 && value < 150) { // Direct voltage
              console.log(`   📈 Register ${addr}: ${value} (could be ${value}V)`);
            }
          });
          break; // Found working registers for this slave
        } catch (e) {
          console.log(`❌ ${range.name}: ${e.message}`);
        }
      }
      
      // Try input registers too
      try {
        const inputResult = await client.client.readInputRegisters(0, 10);
        const inputData = inputResult.response.body.values;
        console.log(`✅ Input 0-9: [${inputData.join(', ')}]`);
      } catch (e) {
        console.log(`❌ Input registers: ${e.message}`);
      }
      
      // Disconnect after testing this slave ID
      client.disconnect();
      
    } catch (slaveError) {
      console.log(`❌ Slave ID ${slaveId} failed: ${slaveError.message}`);
    }
  }
  
} catch (error) {
  console.log('❌ Connection failed:', error.message);
} finally {
  client.disconnect();
  client.destroy();
  console.log('\n🔌 Enhanced client disconnected and cleaned up');
}
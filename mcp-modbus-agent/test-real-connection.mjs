#!/usr/bin/env node
import ModbusRTU from 'modbus-serial';

console.log('🔍 Testing REAL Modbus connection to 10.10.10.11:502...');

const client = new ModbusRTU();

try {
  // Connect to the real meter
  await client.connectTCP('10.10.10.11', { port: 502 });
  console.log('✅ Connected to real meter!');
  
  // Set slave ID (try common IDs)
  const slaveIds = [1, 2, 3, 247, 255];
  
  for (const slaveId of slaveIds) {
    try {
      console.log(`\n🔧 Testing Slave ID: ${slaveId}`);
      client.setID(slaveId);
      
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
          const result = await client.readHoldingRegisters(range.start, range.count);
          console.log(`✅ ${range.name}: [${result.data.join(', ')}]`);
          
          // If we got data, try to interpret voltage-like values
          result.data.forEach((value, index) => {
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
        const inputResult = await client.readInputRegisters(0, 10);
        console.log(`✅ Input 0-9: [${inputResult.data.join(', ')}]`);
      } catch (e) {
        console.log(`❌ Input registers: ${e.message}`);
      }
      
    } catch (slaveError) {
      console.log(`❌ Slave ID ${slaveId} failed: ${slaveError.message}`);
    }
  }
  
} catch (error) {
  console.log('❌ Connection failed:', error.message);
} finally {
  client.close();
  console.log('\n🔌 Connection closed');
}
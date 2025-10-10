#!/usr/bin/env node
import ModbusRTU from 'modbus-serial';

console.log('🔍 Reading REAL meter data from 10.10.10.11:502...');

const client = new ModbusRTU();

try {
  await client.connectTCP('10.10.10.11', { port: 502 });
  console.log('✅ Connected to real meter!');
  
  client.setID(1); // Slave ID 1 had data
  
  // Read the registers that had data
  const result = await client.readHoldingRegisters(0, 20);
  console.log('📊 Raw register data:', result.data);
  
  // Interpret the data - common scaling factors
  console.log('\n🔍 Analyzing data for voltage/current/power patterns:');
  
  result.data.forEach((value, index) => {
    if (value > 0) {
      console.log(`Register ${index}: ${value}`);
      
      // Check for voltage patterns (120V nominal)
      if (value > 1100 && value < 1300) {
        console.log(`  💡 Could be voltage: ${value/10}V (scaled by 10)`);
      }
      if (value > 11000 && value < 13000) {
        console.log(`  💡 Could be voltage: ${value/100}V (scaled by 100)`);
      }
      if (value > 110 && value < 130) {
        console.log(`  💡 Could be voltage: ${value}V (direct)`);
      }
      
      // Check for frequency (60Hz nominal)
      if (value > 590 && value < 610) {
        console.log(`  🌊 Could be frequency: ${value/10}Hz (scaled by 10)`);
      }
      if (value > 5900 && value < 6100) {
        console.log(`  🌊 Could be frequency: ${value/100}Hz (scaled by 100)`);
      }
      
      // Check for power factor
      if (value > 800 && value < 1000) {
        console.log(`  ⚡ Could be power factor: ${value/1000} (scaled by 1000)`);
      }
    }
  });
  
  // Try a few more register ranges to find more data
  console.log('\n🔍 Scanning more registers for additional data...');
  
  const ranges = [100, 200, 300, 1000, 3000];
  for (const start of ranges) {
    try {
      const data = await client.readHoldingRegisters(start, 10);
      const nonZero = data.data.filter(v => v > 0);
      if (nonZero.length > 0) {
        console.log(`📊 Registers ${start}-${start+9}:`, data.data);
      }
    } catch (e) {
      // Skip ranges that don't work
    }
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
} finally {
  client.close();
}
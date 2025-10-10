#!/usr/bin/env node
import ModbusRTU from 'modbus-serial';

console.log('⚡ Reading REAL meter data - interpreting voltage patterns...');

const client = new ModbusRTU();

try {
  await client.connectTCP('10.10.10.11', { port: 502 });
  client.setID(1);
  
  const result = await client.readHoldingRegisters(0, 20);
  
  console.log('📊 REAL METER DATA INTERPRETATION:');
  console.log('=====================================');
  
  // Based on the patterns observed:
  const voltage1 = result.data[5] / 200;   // 23191 / 200 = 115.96V
  const voltage2 = result.data[12] / 200;  // 23191 / 200 = 115.96V (duplicate)
  const current1 = result.data[6] / 100;   // 3791 / 100 = 37.91A
  const current2 = result.data[15] / 100;  // 3791 / 100 = 37.91A (duplicate)
  const power1 = result.data[7];           // 7582W
  const power2 = result.data[18];          // 7582W (duplicate)
  
  console.log(`🔋 Voltage (Reg 5):  ${voltage1.toFixed(2)}V`);
  console.log(`🔋 Voltage (Reg 12): ${voltage2.toFixed(2)}V`);
  console.log(`⚡ Current (Reg 6):  ${current1.toFixed(2)}A`);
  console.log(`⚡ Current (Reg 15): ${current2.toFixed(2)}A`);
  console.log(`🔌 Power (Reg 7):    ${power1}W`);
  console.log(`🔌 Power (Reg 18):   ${power2}W`);
  
  // Calculate additional values
  const apparentPower = voltage1 * current1;
  const powerFactor = power1 / apparentPower;
  
  console.log('');
  console.log('📈 CALCULATED VALUES:');
  console.log(`💫 Apparent Power: ${apparentPower.toFixed(2)}VA`);
  console.log(`📊 Power Factor: ${powerFactor.toFixed(3)}`);
  console.log(`⚡ Energy Rate: ${(power1/1000).toFixed(2)}kW`);
  
  // Check more registers for frequency and other data
  console.log('');
  console.log('🔍 Additional registers:');
  result.data.forEach((value, index) => {
    if (value > 0 && ![5,6,7,12,15,18].includes(index)) {
      // Check for frequency
      if (value > 590 && value < 610) {
        console.log(`🌊 Frequency (Reg ${index}): ${(value/10).toFixed(1)}Hz`);
      }
      // Check for other scaled values
      if (value > 50 && value < 70) {
        console.log(`❓ Unknown (Reg ${index}): ${value} (could be ${(value/10).toFixed(1)} or frequency)`);
      }
    }
  });
  
} catch (error) {
  console.log('❌ Error:', error.message);
} finally {
  client.close();
  console.log('\n✅ Real meter connection closed');
}
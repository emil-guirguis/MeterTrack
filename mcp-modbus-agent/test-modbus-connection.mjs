#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

const MODBUS_IP = process.env.MODBUS_IP || '10.10.10.11';
const MODBUS_PORT = process.env.MODBUS_PORT || '502';

async function testConnection() {
  console.log('🔍 Testing Modbus Device Connection...');
  console.log(`📊 Target: ${MODBUS_IP}:${MODBUS_PORT}`);
  console.log('');

  // Test 1: Ping the device
  console.log('1️⃣ Testing network connectivity (ping)...');
  try {
    const { stdout } = await execAsync(`ping -n 4 ${MODBUS_IP}`);
    console.log('✅ Ping successful - device is reachable on network');
    
    // Extract ping statistics
    const lines = stdout.split('\n');
    const statsLine = lines.find(line => line.includes('Lost'));
    if (statsLine) {
      console.log(`   ${statsLine.trim()}`);
    }
  } catch (error) {
    console.log('❌ Ping failed - device is not reachable on network');
    console.log('   Check if device is powered on and connected to network');
    return;
  }

  console.log('');

  // Test 2: Test port connectivity
  console.log('2️⃣ Testing Modbus port connectivity...');
  try {
    const { stdout } = await execAsync(`powershell "Test-NetConnection -ComputerName ${MODBUS_IP} -Port ${MODBUS_PORT} -InformationLevel Detailed"`);
    
    if (stdout.includes('TcpTestSucceeded : True')) {
      console.log('✅ Port 502 is open and accepting connections');
    } else {
      console.log('❌ Port 502 is not accessible');
      console.log('   The device may not be running Modbus TCP service');
    }
    
    // Show relevant output
    const lines = stdout.split('\n');
    const relevantLines = lines.filter(line => 
      line.includes('TcpTestSucceeded') || 
      line.includes('RemoteAddress') ||
      line.includes('RemotePort')
    );
    relevantLines.forEach(line => console.log(`   ${line.trim()}`));
    
  } catch (error) {
    console.log('❌ Port test failed');
    console.log('   Unable to test port connectivity');
  }

  console.log('');

  // Test 3: Try Modbus connection
  console.log('3️⃣ Testing Modbus protocol connection...');
  try {
    const { createLogger } = await import('./dist/logger.js');
    const { ModbusClient } = await import('./dist/modbus-client.js');
    
    const logger = createLogger();
    const modbusConfig = {
      ip: MODBUS_IP,
      port: parseInt(MODBUS_PORT),
      slaveId: 1,
      timeout: 5000
    };
    
    const client = new ModbusClient(modbusConfig, logger);
    const connected = await client.connect();
    
    if (connected) {
      console.log('✅ Modbus connection successful');
      
      // Try to read a register
      try {
        const reading = await client.readMeterData();
        console.log('✅ Modbus data read successful');
        console.log(`   Sample data: V=${reading.voltage}V, A=${reading.current}A, W=${reading.power}W`);
      } catch (readError) {
        console.log('⚠️  Modbus connected but data read failed');
        console.log(`   Error: ${readError.message}`);
      }
      
      client.disconnect();
    } else {
      console.log('❌ Modbus connection failed');
    }
    
  } catch (error) {
    console.log('❌ Modbus test failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');
  console.log('💡 Troubleshooting Tips:');
  console.log('   • Verify device IP address is correct');
  console.log('   • Check if device is powered on');
  console.log('   • Ensure device is configured for Modbus TCP');
  console.log('   • Verify slave ID (currently set to 1)');
  console.log('   • Check network firewall settings');
  console.log('   • Try connecting from the device\'s local network');
}

testConnection().catch(console.error);
#!/usr/bin/env node

/**
 * Simple Real-time Modbus Meter Reader
 * Connects directly to meter at 10.10.10.11:502 using jsmodbus
 */

const jsmodbus = require('jsmodbus');
const net = require('net');

class SimpleMeterReader {
  constructor(ip = '10.10.10.11', port = 502, slaveId = 1) {
    this.meterIP = ip;
    this.meterPort = port;
    this.slaveId = slaveId;
    this.isRunning = false;
    this.intervalId = null;
    this.readCount = 0;
    this.client = null;
    this.socket = null;

    // Handle process termination
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      this.client = new jsmodbus.client.TCP(this.socket, this.slaveId, 5000);

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket.connect(this.meterPort, this.meterIP);

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        console.log(`✅ Connected to ${this.meterIP}:${this.meterPort}`);
        resolve();
      });

      this.socket.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket.on('close', () => {
        console.log('🔌 Connection closed');
      });
    });
  }

  async start(intervalMs = 5000) {
    console.log('🚀 Starting Simple Meter Reader...');
    console.log(`📡 Connecting to meter: ${this.meterIP}:${this.meterPort} (slave ${this.slaveId})`);
    console.log(`⏱️  Reading interval: ${intervalMs}ms`);
    console.log('');

    try {
      await this.connect();
      console.log('');
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('   Please check:');
      console.error('   - Meter IP address and port');
      console.error('   - Network connectivity');
      console.error('   - Meter is powered on and responding');
      return;
    }

    this.isRunning = true;

    // Start reading loop
    this.intervalId = setInterval(async () => {
      await this.readMeterValues();
    }, intervalMs);

    // Initial read
    await this.readMeterValues();

    console.log('📊 Real-time readings (Press Ctrl+C to stop):');
    console.log('═'.repeat(80));
  }

  async readMeterValues() {
    if (!this.isRunning || !this.client) return;

    const startTime = Date.now();
    this.readCount++;

    try {
      // Read comprehensive registers including energy and demand measurements
      const registers = [
        // Basic measurements
        { name: 'voltage', address: 5, scale: 200 },      // 22725 ÷ 200 = 113.6V
        { name: 'current', address: 9, scale: 100 },      // 2 ÷ 100 = 0.02A  
        { name: 'power', address: 7, scale: 10 },         // 7599 ÷ 10 = 759.9W (kW)
        { name: 'frequency', address: 0, scale: 1 },      // 85 Hz
        { name: 'powerFactor', address: 8, scale: 100 },  // 5 ÷ 100 = 0.05

        // Energy measurements (typically 32-bit values, need 2 registers)
        { name: 'kWh_low', address: 20, scale: 1 },       // kWh low word
        { name: 'kWh_high', address: 21, scale: 1 },      // kWh high word
        { name: 'kVAh_low', address: 22, scale: 1 },      // kVAh low word  
        { name: 'kVAh_high', address: 23, scale: 1 },     // kVAh high word
        { name: 'kVARh_low', address: 24, scale: 1 },     // kVARh low word
        { name: 'kVARh_high', address: 25, scale: 1 },    // kVARh high word

        // Demand measurements
        { name: 'kW_demand', address: 26, scale: 10 },    // kW peak demand
        { name: 'kVA_demand', address: 27, scale: 10 },   // kVA peak demand
        { name: 'kVAR_demand', address: 28, scale: 10 },  // kVAR peak demand

        // Displacement Power Factor (dPF)
        { name: 'dPF', address: 29, scale: 1000 },        // Displacement power factor

        // Alternative/backup readings
        { name: 'voltageBackup', address: 12, scale: 200 }, // Backup voltage
        { name: 'currentAlt', address: 6, scale: 100 },   // Alternative current
        { name: 'powerAlt', address: 18, scale: 10 },     // Alternative power

        // Additional registers to scan for energy values
        { name: 'reg_30', address: 30, scale: 1 },        // Scan for more energy registers
        { name: 'reg_31', address: 31, scale: 1 },
        { name: 'reg_32', address: 32, scale: 1 },
        { name: 'reg_33', address: 33, scale: 1 },
        { name: 'reg_34', address: 34, scale: 1 },
        { name: 'reg_35', address: 35, scale: 1 },
        { name: 'reg_40', address: 40, scale: 1 },        // Common energy register location
        { name: 'reg_41', address: 41, scale: 1 },
        { name: 'reg_42', address: 42, scale: 1 },
        { name: 'reg_43', address: 43, scale: 1 },
        
        // High-numbered registers (1149-1152)
        { name: 'reg_1149', address: 1149, scale: 1 },    // Register 1149
        { name: 'reg_1150', address: 1150, scale: 1 },    // Register 1150
        { name: 'reg_1151', address: 1151, scale: 1 },    // Register 1151
        { name: 'reg_1152', address: 1152, scale: 1 }
      ];

      const readings = {};

      // Read each register
      for (const reg of registers) {
        try {
          const result = await this.client.readHoldingRegisters(reg.address, 1);
          const rawUnsigned = result.response.body.values[0];
          let rawValue = rawUnsigned;

          // Convert unsigned 16-bit to signed 16-bit if value > 32767
          // This handles negative values in two's complement format
          if (rawValue > 32767) {
            rawValue = rawValue - 65536;
          }

          readings[reg.name] = rawValue / reg.scale;

          // Store raw values for debugging
          readings[reg.name + '_raw_unsigned'] = rawUnsigned;
          readings[reg.name + '_raw_signed'] = rawValue;
          readings[reg.name + '_address'] = reg.address;
        } catch (regError) {
          console.warn(`⚠️  Failed to read ${reg.name} (address ${reg.address}): ${regError.message}`);
          readings[reg.name] = null;
        }
      }

      const responseTime = Date.now() - startTime;
      this.displayMeterValues(readings, responseTime);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ Read #${this.readCount} failed: ${error.message} (${responseTime}ms)`);

      // Try to reconnect on error
      if (error.message.includes('ECONNRESET') || error.message.includes('ENOTCONN')) {
        console.log('   🔄 Attempting to reconnect...');
        try {
          await this.connect();
        } catch (reconnectError) {
          console.log(`   ❌ Reconnection failed: ${reconnectError.message}`);
        }
      }
    }
  }

  displayMeterValues(data, responseTime) {
    const timestamp = new Date().toLocaleTimeString();

    // Show EXACTLY what the meter is sending (scaled values as per register definitions)
    const voltage = data.voltage?.toFixed(1) || 'N/A';
    const current = data.current?.toFixed(3) || 'N/A';
    const power = data.power?.toFixed(3) || 'N/A'; // Show as-is from meter (already scaled)
    const frequency = data.frequency?.toFixed(0) || 'N/A';
    const powerFactor = data.powerFactor?.toFixed(3) || 'N/A';
    const dPF = data.dPF?.toFixed(3) || 'N/A';

    // Show energy values as-is from meter (no additional calculations)
    const kWh_raw = data.kWh_low !== null ? data.kWh_low.toFixed(0) : 'N/A';
    const kVAh_raw = data.kVAh_low !== null ? data.kVAh_low.toFixed(0) : 'N/A';
    const kVARh_raw = data.kVARh_low !== null ? data.kVARh_low.toFixed(0) : 'N/A';

    // Show demand values as-is from meter
    const kW_demand = data.kW_demand?.toFixed(3) || 'N/A';
    const kVA_demand = data.kVA_demand?.toFixed(3) || 'N/A';
    const kVAR_demand = data.kVAR_demand?.toFixed(3) || 'N/A';

    // Calculate apparent power from displayed values
    const apparentPower = (parseFloat(voltage) * parseFloat(current)).toFixed(3);

    console.log(`[${timestamp}] Read #${this.readCount} (${responseTime}ms)`);
    console.log(`┌─ 🔌 LIVE METER DATA (Real-time from 10.10.10.11) ─────────────────────┐`);
    console.log(`│                                                                        │`);
    console.log(`│  ⚡ Voltage:     ${voltage.padStart(8)} V    │  ⚡ Current:    ${current.padStart(8)} A   │`);
    console.log(`│  🔥 Power:       ${power.padStart(8)} kW   │  📊 Frequency:  ${frequency.padStart(6)} Hz   │`);
    console.log(`│  📈 Apparent:    ${apparentPower.padStart(8)} VA   │  🎯 PF:         ${powerFactor.padStart(6)}   │`);
    console.log(`│  🔀 dPF:         ${dPF.padStart(8)}     │  ⏱️  Response:   ${responseTime.toString().padStart(6)} ms  │`);
    console.log(`│                                                                        │`);
    console.log(`├─ 📊 ENERGY MEASUREMENTS (RAW from meter) ──────────────────────────────┤`);
    console.log(`│  ⚡ kWh (raw):   ${kWh_raw.padStart(8)}     │  📈 kVAh (raw): ${kVAh_raw.padStart(8)}     │`);
    console.log(`│  🔄 kVARh (raw): ${kVARh_raw.padStart(8)}     │                              │`);
    console.log(`│                                                                        │`);
    console.log(`├─ 📈 DEMAND MEASUREMENTS ────────────────────────────────────────────────┤`);
    console.log(`│  🔥 kW Peak:     ${kW_demand.padStart(8)}     │  📊 kVA Peak:   ${kVA_demand.padStart(8)}     │`);
    console.log(`│  🔄 kVAR Peak:   ${kVAR_demand.padStart(8)}     │                              │`);
    console.log(`└────────────────────────────────────────────────────────────────────────┘`);

    // Show raw register values for debugging in 2 columns
    console.log(`┌─ 🔍 RAW REGISTER VALUES (scaled final values) ─────────────────────────┐`);

    const validEntries = Object.entries(data).filter(([key, value]) =>
      value !== null && !key.includes('Alt') && !key.includes('Backup') && !key.includes('_raw_') && !key.includes('_address')
    );

    for (let i = 0; i < validEntries.length; i += 2) {
      const formatEntry = (entry) => {
        if (!entry) return ''.padEnd(30);
        const [key, value] = entry;
        const address = data[key + '_address'];
        const regNum = address !== undefined ? `[${address}]` : '';
        return `${regNum.padStart(4)} ${key.padEnd(12)}: ${value.toString().padStart(8)}`;
      };

      const col1 = formatEntry(validEntries[i]);
      const col2 = formatEntry(validEntries[i + 1]);

      console.log(`│ ${col1.padEnd(30)} │ ${col2.padEnd(30)} │`);
    }

    console.log(`└────────────────────────────────────────────────────────────────────────┘`);

    console.log('');
  }

  async stop() {
    console.log('\n🛑 Stopping meter reader...');

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.socket) {
      this.socket.end();
      this.socket.destroy();
    }

    console.log(`📊 Final Statistics:`);
    console.log(`   Total Reads: ${this.readCount}`);
    console.log('✅ Meter reader stopped successfully');
    process.exit(0);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const ip = args.find(arg => arg.startsWith('--ip='))?.split('=')[1] || '10.10.10.11';
  const port = parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '502');
  const slaveId = parseInt(args.find(arg => arg.startsWith('--slave='))?.split('=')[1] || '1');
  const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '5000');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Simple Real-time Modbus Meter Reader');
    console.log('');
    console.log('Usage: node simple-meter-reader.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --ip=<address>     Meter IP address (default: 10.10.10.11)');
    console.log('  --port=<port>      Modbus TCP port (default: 502)');
    console.log('  --slave=<id>       Slave/Unit ID (default: 1)');
    console.log('  --interval=<ms>    Reading interval in milliseconds (default: 5000)');
    console.log('  --help, -h         Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node simple-meter-reader.js');
    console.log('  node simple-meter-reader.js --ip=192.168.1.100 --interval=2000');
    console.log('  node simple-meter-reader.js --port=503 --slave=2');
    return;
  }

  const reader = new SimpleMeterReader(ip, port, slaveId);
  await reader.start(interval);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { SimpleMeterReader };
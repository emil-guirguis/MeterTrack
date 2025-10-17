#!/usr/bin/env node

/**
 * Modbus Scanner - tries different slave IDs and connection methods
 */

const jsmodbus = require('jsmodbus');
const net = require('net');

class ModbusScanner {
  constructor(ip = '10.10.10.11', port = 502) {
    this.ip = ip;
    this.port = port;
  }

  async scanSlaveIds() {
    console.log('🔍 Scanning Modbus Slave IDs...');
    console.log(`Target: ${this.ip}:${this.port}\n`);

    const slaveIds = [0, 1, 2, 3, 4, 5, 10, 247, 255]; // Common slave IDs
    
    for (const slaveId of slaveIds) {
      console.log(`Testing Slave ID ${slaveId}...`);
      
      try {
        const result = await this.testSlaveId(slaveId);
        if (result.success) {
          console.log(`✅ Slave ID ${slaveId} responded!`);
          console.log(`   Register 0: ${result.data[0]}`);
          console.log(`   Register 1: ${result.data[1]}`);
          console.log(`   Register 2: ${result.data[2]}`);
          
          // Try to read more registers
          await this.readMoreRegisters(slaveId);
          return slaveId;
        } else {
          console.log(`❌ Slave ID ${slaveId}: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ Slave ID ${slaveId}: ${error.message}`);
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n❌ No responsive slave IDs found');
    return null;
  }

  async testSlaveId(slaveId) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const client = new jsmodbus.client.TCP(socket, slaveId, 3000);
      
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({ success: false, error: 'Timeout' });
      }, 5000);

      socket.connect(this.port, this.ip);

      socket.once('connect', async () => {
        try {
          // Try to read first 3 registers
          const result = await client.readHoldingRegisters(0, 3);
          clearTimeout(timeout);
          socket.destroy();
          resolve({ 
            success: true, 
            data: result.response.body.values 
          });
        } catch (error) {
          clearTimeout(timeout);
          socket.destroy();
          resolve({ 
            success: false, 
            error: error.message 
          });
        }
      });

      socket.once('error', (error) => {
        clearTimeout(timeout);
        resolve({ 
          success: false, 
          error: error.message 
        });
      });
    });
  }

  async readMoreRegisters(slaveId) {
    console.log(`\n📊 Reading more registers from Slave ID ${slaveId}:`);
    
    const socket = new net.Socket();
    const client = new jsmodbus.client.TCP(socket, slaveId, 5000);
    
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        socket.connect(this.port, this.ip);
        socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        socket.once('error', reject);
      });

      // Read registers 0-19 (common range)
      console.log('   Reading registers 0-19...');
      try {
        const result = await client.readHoldingRegisters(0, 20);
        const values = result.response.body.values;
        
        console.log('   Raw register values:');
        values.forEach((value, index) => {
          console.log(`     Reg ${index.toString().padStart(2)}: ${value.toString().padStart(6)} (${(value/10).toFixed(1).padStart(8)} ÷10, ${(value/100).toFixed(2).padStart(8)} ÷100, ${(value/200).toFixed(2).padStart(8)} ÷200)`);
        });

        // Look for voltage-like values (around 117-118 when scaled)
        console.log('\n   🔍 Looking for voltage-like values (expecting ~117V):');
        values.forEach((value, index) => {
          const scaled10 = value / 10;
          const scaled100 = value / 100;
          const scaled200 = value / 200;
          
          if (scaled10 >= 110 && scaled10 <= 125) {
            console.log(`     ⚡ Reg ${index} ÷ 10 = ${scaled10.toFixed(1)}V (possible voltage!)`);
          }
          if (scaled100 >= 110 && scaled100 <= 125) {
            console.log(`     ⚡ Reg ${index} ÷ 100 = ${scaled100.toFixed(1)}V (possible voltage!)`);
          }
          if (scaled200 >= 110 && scaled200 <= 125) {
            console.log(`     ⚡ Reg ${index} ÷ 200 = ${scaled200.toFixed(1)}V (possible voltage!)`);
          }
        });

        // Look for current-like values (around 0.02A when scaled)
        console.log('\n   🔍 Looking for current-like values (expecting ~0.02A):');
        values.forEach((value, index) => {
          const scaled10 = value / 10;
          const scaled100 = value / 100;
          const scaled1000 = value / 1000;
          
          if (scaled10 >= 0.01 && scaled10 <= 0.1) {
            console.log(`     ⚡ Reg ${index} ÷ 10 = ${scaled10.toFixed(3)}A (possible current!)`);
          }
          if (scaled100 >= 0.01 && scaled100 <= 0.1) {
            console.log(`     ⚡ Reg ${index} ÷ 100 = ${scaled100.toFixed(3)}A (possible current!)`);
          }
          if (scaled1000 >= 0.01 && scaled1000 <= 0.1) {
            console.log(`     ⚡ Reg ${index} ÷ 1000 = ${scaled1000.toFixed(3)}A (possible current!)`);
          }
        });

      } catch (error) {
        console.log(`   ❌ Failed to read registers: ${error.message}`);
      }

    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
    } finally {
      socket.destroy();
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const ip = args.find(arg => arg.startsWith('--ip='))?.split('=')[1] || '10.10.10.11';
  const port = parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '502');

  const scanner = new ModbusScanner(ip, port);
  await scanner.scanSlaveIds();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ModbusScanner };
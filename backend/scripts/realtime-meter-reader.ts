#!/usr/bin/env ts-node

/**
 * Real-time Modbus Meter Reader
 * Connects to meter at 10.10.10.11:502 and displays live values
 */

import { ModbusService } from '../src/services/modbusService.js';
import { ModbusError, ModbusErrorType } from '../src/types/modbus.js';
import winston from 'winston';

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

class RealtimeMeterReader {
  private modbusService: ModbusService;
  private meterIP: string;
  private meterPort: number;
  private slaveId: number;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readCount: number = 0;

  constructor(ip: string = '10.10.10.11', port: number = 502, slaveId: number = 1) {
    this.meterIP = ip;
    this.meterPort = port;
    this.slaveId = slaveId;
    
    // Initialize Modbus service with optimized settings for real-time reading
    this.modbusService = new ModbusService({
      maxConnections: 5,
      idleTimeout: 60000, // 1 minute
      acquireTimeout: 10000, // 10 seconds
      createRetryInterval: 2000,
      maxRetries: 3,
      healthCheckInterval: 30000
    });

    // Handle process termination
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async start(intervalMs: number = 2000): Promise<void> {
    console.log('🚀 Starting Real-time Meter Reader...');
    console.log(`📡 Connecting to meter: ${this.meterIP}:${this.meterPort} (slave ${this.slaveId})`);
    console.log(`⏱️  Reading interval: ${intervalMs}ms`);
    console.log('');

    // Test initial connection
    try {
      const connectionTest = await this.testConnection();
      if (!connectionTest) {
        console.error('❌ Failed to connect to meter. Please check:');
        console.error('   - Meter IP address and port');
        console.error('   - Network connectivity');
        console.error('   - Meter is powered on and responding');
        return;
      }
      console.log('✅ Initial connection successful!');
      console.log('');
    } catch (error) {
      console.error('❌ Connection test failed:', error instanceof Error ? error.message : String(error));
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

  async testConnection(): Promise<boolean> {
    try {
      return await this.modbusService.testConnection(this.meterIP, this.meterPort, this.slaveId);
    } catch (error) {
      logger.error('Connection test failed:', error);
      return false;
    }
  }

  async readMeterValues(): Promise<void> {
    if (!this.isRunning) return;

    const startTime = Date.now();
    this.readCount++;

    try {
      // Read meter data using the real meter mapping from the original implementation
      const result = await this.modbusService.readMeterData(this.meterIP, {
        port: this.meterPort,
        unitId: this.slaveId,
        registers: {
          // Core measurements (based on real device at 10.10.10.11:502)
          voltage: { address: 5, count: 1, scale: 200 },    // Register 5 / 200
          current: { address: 6, count: 1, scale: 100 },    // Register 6 / 100  
          power: { address: 7, count: 1, scale: 1 },        // Register 7 direct watts
          energy: { address: 8, count: 1, scale: 1 },       // Register 8 estimate
          frequency: { address: 0, count: 1, scale: 10 },   // Register 0 / 10
          powerFactor: { address: 9, count: 1, scale: 1000 }, // Register 9 / 1000
          
          // Additional measurements
          phaseAVoltage: { address: 12, count: 1, scale: 10 },
          phaseBVoltage: { address: 14, count: 1, scale: 10 },
          phaseCVoltage: { address: 16, count: 1, scale: 10 },
          
          phaseACurrent: { address: 18, count: 1, scale: 100 },
          phaseBCurrent: { address: 20, count: 1, scale: 100 },
          phaseCCurrent: { address: 22, count: 1, scale: 100 },
          
          totalReactivePower: { address: 36, count: 1, scale: 1 },
          totalApparentPower: { address: 38, count: 1, scale: 1 },
          
          temperatureC: { address: 46, count: 1, scale: 10 },
          neutralCurrent: { address: 48, count: 1, scale: 100 }
        }
      });

      const responseTime = Date.now() - startTime;

      if (result.success && result.data) {
        this.displayMeterValues(result.data, responseTime);
      } else {
        console.log(`❌ Read #${this.readCount} failed: ${result.error || 'Unknown error'} (${responseTime}ms)`);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ModbusError) {
        console.log(`❌ Read #${this.readCount} failed: ${error.type} - ${error.message} (${responseTime}ms)`);
        
        // Handle specific error types
        switch (error.type) {
          case ModbusErrorType.CONNECTION_FAILED:
            console.log('   🔄 Attempting to reconnect...');
            break;
          case ModbusErrorType.TIMEOUT:
            console.log('   ⏱️  Request timed out, will retry next cycle');
            break;
          case ModbusErrorType.DEVICE_BUSY:
            console.log('   ⏳ Device busy, will retry next cycle');
            break;
        }
      } else {
        console.log(`❌ Read #${this.readCount} failed: ${error instanceof Error ? error.message : String(error)} (${responseTime}ms)`);
      }
    }
  }

  private displayMeterValues(data: any, responseTime: number): void {
    const timestamp = new Date().toLocaleTimeString();
    
    // Clear previous line and display new values
    process.stdout.write('\r\x1b[K'); // Clear current line
    
    // Core measurements
    const voltage = data.voltage?.toFixed(1) || 'N/A';
    const current = data.current?.toFixed(2) || 'N/A';
    const power = data.power?.toFixed(0) || 'N/A';
    const frequency = data.frequency?.toFixed(1) || 'N/A';
    const powerFactor = data.powerFactor?.toFixed(3) || 'N/A';
    const energy = data.energy?.toFixed(0) || 'N/A';
    
    // Calculate apparent power and efficiency
    const apparentPower = (parseFloat(voltage) * parseFloat(current)).toFixed(0);
    const efficiency = data.totalApparentPower ? 
      ((parseFloat(power) / data.totalApparentPower) * 100).toFixed(1) : 'N/A';

    console.log(`[${timestamp}] Read #${this.readCount} (${responseTime}ms)`);
    console.log(`┌─ Core Measurements ────────────────────────────────────────────────────┐`);
    console.log(`│ Voltage: ${voltage.padStart(8)}V  │ Current: ${current.padStart(8)}A  │ Power: ${power.padStart(8)}W    │`);
    console.log(`│ Frequency: ${frequency.padStart(6)}Hz │ PF: ${powerFactor.padStart(10)}   │ Energy: ${energy.padStart(7)}Wh  │`);
    console.log(`└────────────────────────────────────────────────────────────────────────┘`);

    // Phase measurements (if available)
    if (data.phaseAVoltage !== null || data.phaseBVoltage !== null || data.phaseCVoltage !== null) {
      const vA = data.phaseAVoltage?.toFixed(1) || 'N/A';
      const vB = data.phaseBVoltage?.toFixed(1) || 'N/A';
      const vC = data.phaseCVoltage?.toFixed(1) || 'N/A';
      
      console.log(`┌─ Phase Voltages ───────────────────────────────────────────────────────┐`);
      console.log(`│ Phase A: ${vA.padStart(7)}V │ Phase B: ${vB.padStart(7)}V │ Phase C: ${vC.padStart(7)}V │`);
      console.log(`└────────────────────────────────────────────────────────────────────────┘`);
    }

    // Phase currents (if available)
    if (data.phaseACurrent !== null || data.phaseBCurrent !== null || data.phaseCCurrent !== null) {
      const iA = data.phaseACurrent?.toFixed(2) || 'N/A';
      const iB = data.phaseBCurrent?.toFixed(2) || 'N/A';
      const iC = data.phaseCCurrent?.toFixed(2) || 'N/A';
      
      console.log(`┌─ Phase Currents ───────────────────────────────────────────────────────┐`);
      console.log(`│ Phase A: ${iA.padStart(7)}A │ Phase B: ${iB.padStart(7)}A │ Phase C: ${iC.padStart(7)}A │`);
      console.log(`└────────────────────────────────────────────────────────────────────────┘`);
    }

    // Additional measurements
    if (data.totalReactivePower !== null || data.totalApparentPower !== null || data.temperatureC !== null) {
      const reactivePower = data.totalReactivePower?.toFixed(0) || 'N/A';
      const apparentPowerMeter = data.totalApparentPower?.toFixed(0) || 'N/A';
      const temperature = data.temperatureC?.toFixed(1) || 'N/A';
      
      console.log(`┌─ Additional Measurements ──────────────────────────────────────────────┐`);
      console.log(`│ Reactive: ${reactivePower.padStart(6)}VAR │ Apparent: ${apparentPowerMeter.padStart(6)}VA │ Temp: ${temperature.padStart(6)}°C │`);
      console.log(`└────────────────────────────────────────────────────────────────────────┘`);
    }

    console.log(''); // Add spacing between readings
  }

  async stop(): Promise<void> {
    console.log('\n🛑 Stopping real-time meter reader...');
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Close all connections
    this.modbusService.closeAllConnections();
    
    // Get final pool stats
    const poolStats = this.modbusService.getPoolStats();
    console.log(`📊 Final Statistics:`);
    console.log(`   Total Reads: ${this.readCount}`);
    console.log(`   Pool Stats: ${poolStats.totalConnections} total, ${poolStats.activeConnections} active, ${poolStats.idleConnections} idle`);
    
    console.log('✅ Meter reader stopped successfully');
    process.exit(0);
  }

  // Method to change reading interval while running
  public updateInterval(newIntervalMs: number): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(async () => {
        await this.readMeterValues();
      }, newIntervalMs);
      console.log(`⏱️  Updated reading interval to ${newIntervalMs}ms`);
    }
  }

  // Method to get connection pool statistics
  public getPoolStats(): any {
    return this.modbusService.getPoolStats();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const ip = args.find(arg => arg.startsWith('--ip='))?.split('=')[1] || '10.10.10.11';
  const port = parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '502');
  const slaveId = parseInt(args.find(arg => arg.startsWith('--slave='))?.split('=')[1] || '1');
  const interval = parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1] || '2000');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Real-time Modbus Meter Reader');
    console.log('');
    console.log('Usage: npm run meter:realtime [options]');
    console.log('');
    console.log('Options:');
    console.log('  --ip=<address>     Meter IP address (default: 10.10.10.11)');
    console.log('  --port=<port>      Modbus TCP port (default: 502)');
    console.log('  --slave=<id>       Slave/Unit ID (default: 1)');
    console.log('  --interval=<ms>    Reading interval in milliseconds (default: 2000)');
    console.log('  --help, -h         Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  npm run meter:realtime');
    console.log('  npm run meter:realtime -- --ip=192.168.1.100 --interval=1000');
    console.log('  npm run meter:realtime -- --port=503 --slave=2');
    return;
  }

  const reader = new RealtimeMeterReader(ip, port, slaveId);
  await reader.start(interval);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { RealtimeMeterReader };
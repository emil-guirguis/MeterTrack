/**
 * Development script for comparing modbus-serial and jsmodbus libraries in MCP agent
 * This script helps test both libraries side by side during migration
 */

import ModbusRTU from 'modbus-serial';
import jsmodbus from 'jsmodbus';
import winston from 'winston';
import { ModbusClientConfig, MeterReading, PerformanceMetrics } from '../types/modbus';

interface LibraryTestResult {
  library: 'modbus-serial' | 'jsmodbus';
  success: boolean;
  reading?: MeterReading;
  error?: string;
  metrics: PerformanceMetrics;
}

export class MCPModbusLibraryComparison {
  private config: ModbusClientConfig;
  private logger: winston.Logger;

  constructor(config: ModbusClientConfig) {
    this.config = config;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
      transports: [
        new winston.transports.Console()
      ]
    });
  }

  /**
   * Test meter reading using modbus-serial library
   */
  async testModbusSerial(): Promise<LibraryTestResult> {
    const startTime = Date.now();
    const client = new ModbusRTU();
    let connectionTime = 0;
    let readTime = 0;
    let retryCount = 0;
    let errorCount = 0;

    try {
      // Connection phase
      const connectStart = Date.now();
      await client.connectTCP(this.config.host, { port: this.config.port });
      client.setID(this.config.unitId);
      client.setTimeout(this.config.timeout);
      connectionTime = Date.now() - connectStart;

      // Reading phase
      const readStart = Date.now();
      
      // Read the same registers as the current implementation
      const allData = await client.readHoldingRegisters(0, 20);
      readTime = Date.now() - readStart;

      // Process data using the same logic as current implementation
      const voltage = allData.data[5] / 200;  // Register 5 / 200
      const current = allData.data[6] / 100;  // Register 6 / 100
      const power = allData.data[7] / 1;      // Register 7 direct

      // Calculate derived values
      const apparentPower = voltage * current;
      const powerFactor = apparentPower > 0 ? Math.min(power / apparentPower, 1.0) : 0;
      const frequency = allData.data[0] > 50 && allData.data[0] < 70 ? 
        allData.data[0] / 10 : 60;
      const energy = power * 0.001;

      const reading: MeterReading = {
        timestamp: new Date(),
        deviceIP: this.config.host,
        meterId: `${this.config.host}:${this.config.port}:${this.config.unitId}`,
        slaveId: this.config.unitId,
        quality: 'good',
        source: 'modbus-serial-test',
        voltage,
        current,
        power,
        energy,
        frequency,
        powerFactor
      };

      const totalTime = Date.now() - startTime;
      client.close();

      return {
        library: 'modbus-serial',
        success: true,
        reading,
        metrics: {
          connectionTime,
          readTime,
          totalTime,
          retryCount,
          errorCount,
          successRate: 1.0
        }
      };
    } catch (error) {
      errorCount++;
      const totalTime = Date.now() - startTime;
      client.close();

      return {
        library: 'modbus-serial',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          connectionTime,
          readTime,
          totalTime,
          retryCount,
          errorCount,
          successRate: 0.0
        }
      };
    }
  }

  /**
   * Test meter reading using jsmodbus library
   */
  async testJsModbus(): Promise<LibraryTestResult> {
    const startTime = Date.now();
    let connectionTime = 0;
    let readTime = 0;
    let retryCount = 0;
    let errorCount = 0;

    try {
      // Connection phase
      const connectStart = Date.now();
      const client = jsmodbus.client.tcp.complete({
        host: this.config.host,
        port: this.config.port,
        unitId: this.config.unitId,
        timeout: this.config.timeout,
        autoReconnect: false
      });

      await new Promise<void>((resolve, reject) => {
        client.connect();
        client.on('connect', resolve);
        client.on('error', reject);
        
        // Timeout fallback
        setTimeout(() => reject(new Error('Connection timeout')), this.config.timeout);
      });
      connectionTime = Date.now() - connectStart;

      // Reading phase
      const readStart = Date.now();
      const result = await client.readHoldingRegisters(0, 20);
      readTime = Date.now() - readStart;

      const allData = result.response.body.values;

      // Process data using the same logic
      const voltage = allData[5] / 200;
      const current = allData[6] / 100;
      const power = allData[7] / 1;

      const apparentPower = voltage * current;
      const powerFactor = apparentPower > 0 ? Math.min(power / apparentPower, 1.0) : 0;
      const frequency = allData[0] > 50 && allData[0] < 70 ? 
        allData[0] / 10 : 60;
      const energy = power * 0.001;

      const reading: MeterReading = {
        timestamp: new Date(),
        deviceIP: this.config.host,
        meterId: `${this.config.host}:${this.config.port}:${this.config.unitId}`,
        slaveId: this.config.unitId,
        quality: 'good',
        source: 'jsmodbus-test',
        voltage,
        current,
        power,
        energy,
        frequency,
        powerFactor
      };

      const totalTime = Date.now() - startTime;
      client.close();

      return {
        library: 'jsmodbus',
        success: true,
        reading,
        metrics: {
          connectionTime,
          readTime,
          totalTime,
          retryCount,
          errorCount,
          successRate: 1.0
        }
      };
    } catch (error) {
      errorCount++;
      const totalTime = Date.now() - startTime;

      return {
        library: 'jsmodbus',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          connectionTime,
          readTime,
          totalTime,
          retryCount,
          errorCount,
          successRate: 0.0
        }
      };
    }
  }

  /**
   * Compare both libraries for meter reading
   */
  async compareLibraries(): Promise<{
    modbusSerial: LibraryTestResult;
    jsmodbus: LibraryTestResult;
    analysis: {
      bothSucceeded: boolean;
      dataConsistency: boolean;
      performanceWinner: string;
      recommendation: string;
      differences: string[];
    };
  }> {
    this.logger.info(`Starting library comparison for ${this.config.host}:${this.config.port}`);
    
    // Test both libraries
    const [modbusSerialResult, jsmodbusResult] = await Promise.all([
      this.testModbusSerial(),
      this.testJsModbus()
    ]);

    // Analyze results
    const bothSucceeded = modbusSerialResult.success && jsmodbusResult.success;
    let dataConsistency = false;
    const differences: string[] = [];

    if (bothSucceeded && modbusSerialResult.reading && jsmodbusResult.reading) {
      const oldReading = modbusSerialResult.reading;
      const newReading = jsmodbusResult.reading;

      // Compare key measurements with tolerance
      const tolerance = 0.01; // 1% tolerance
      const compareValues = (key: keyof MeterReading, oldVal: number, newVal: number) => {
        const diff = Math.abs(oldVal - newVal);
        const relativeDiff = diff / Math.max(oldVal, newVal);
        if (relativeDiff > tolerance) {
          differences.push(`${key}: ${oldVal} vs ${newVal} (${(relativeDiff * 100).toFixed(2)}% diff)`);
          return false;
        }
        return true;
      };

      const voltageMatch = compareValues('voltage', oldReading.voltage, newReading.voltage);
      const currentMatch = compareValues('current', oldReading.current, newReading.current);
      const powerMatch = compareValues('power', oldReading.power, newReading.power);
      const frequencyMatch = compareValues('frequency', oldReading.frequency, newReading.frequency);

      dataConsistency = voltageMatch && currentMatch && powerMatch && frequencyMatch;
    }

    // Performance analysis
    let performanceWinner = 'tie';
    if (bothSucceeded) {
      const oldTime = modbusSerialResult.metrics.totalTime;
      const newTime = jsmodbusResult.metrics.totalTime;
      if (newTime < oldTime * 0.9) {
        performanceWinner = 'jsmodbus';
      } else if (oldTime < newTime * 0.9) {
        performanceWinner = 'modbus-serial';
      }
    }

    // Generate recommendation
    let recommendation = '';
    if (bothSucceeded) {
      if (dataConsistency) {
        recommendation = performanceWinner === 'jsmodbus' 
          ? 'Migration recommended: jsmodbus is faster with consistent data'
          : performanceWinner === 'modbus-serial'
          ? 'Migration optional: modbus-serial is faster but jsmodbus works correctly'
          : 'Migration safe: both libraries perform similarly with consistent data';
      } else {
        recommendation = 'Migration needs investigation: data inconsistencies detected';
      }
    } else if (modbusSerialResult.success) {
      recommendation = 'Migration risky: only modbus-serial succeeded';
    } else if (jsmodbusResult.success) {
      recommendation = 'Migration beneficial: only jsmodbus succeeded';
    } else {
      recommendation = 'Both libraries failed: check device connectivity';
    }

    return {
      modbusSerial: modbusSerialResult,
      jsmodbus: jsmodbusResult,
      analysis: {
        bothSucceeded,
        dataConsistency,
        performanceWinner,
        recommendation,
        differences
      }
    };
  }

  /**
   * Run comprehensive comparison test
   */
  async runComprehensiveTest(): Promise<void> {
    console.log('='.repeat(80));
    console.log('MCP MODBUS AGENT - LIBRARY COMPARISON TEST');
    console.log('='.repeat(80));
    
    const result = await this.compareLibraries();
    
    console.log('\n📊 TEST RESULTS:');
    console.log('-'.repeat(50));
    
    // modbus-serial results
    console.log(`\n🔧 modbus-serial:`);
    console.log(`   Success: ${result.modbusSerial.success ? '✅' : '❌'}`);
    console.log(`   Connection Time: ${result.modbusSerial.metrics.connectionTime}ms`);
    console.log(`   Read Time: ${result.modbusSerial.metrics.readTime}ms`);
    console.log(`   Total Time: ${result.modbusSerial.metrics.totalTime}ms`);
    if (result.modbusSerial.success && result.modbusSerial.reading) {
      const r = result.modbusSerial.reading;
      console.log(`   Voltage: ${r.voltage.toFixed(2)}V`);
      console.log(`   Current: ${r.current.toFixed(2)}A`);
      console.log(`   Power: ${r.power}W`);
      console.log(`   Frequency: ${r.frequency.toFixed(1)}Hz`);
    }
    if (result.modbusSerial.error) {
      console.log(`   Error: ${result.modbusSerial.error}`);
    }
    
    // jsmodbus results
    console.log(`\n🚀 jsmodbus:`);
    console.log(`   Success: ${result.jsmodbus.success ? '✅' : '❌'}`);
    console.log(`   Connection Time: ${result.jsmodbus.metrics.connectionTime}ms`);
    console.log(`   Read Time: ${result.jsmodbus.metrics.readTime}ms`);
    console.log(`   Total Time: ${result.jsmodbus.metrics.totalTime}ms`);
    if (result.jsmodbus.success && result.jsmodbus.reading) {
      const r = result.jsmodbus.reading;
      console.log(`   Voltage: ${r.voltage.toFixed(2)}V`);
      console.log(`   Current: ${r.current.toFixed(2)}A`);
      console.log(`   Power: ${r.power}W`);
      console.log(`   Frequency: ${r.frequency.toFixed(1)}Hz`);
    }
    if (result.jsmodbus.error) {
      console.log(`   Error: ${result.jsmodbus.error}`);
    }
    
    // Analysis
    console.log(`\n📈 ANALYSIS:`);
    console.log(`   Both Succeeded: ${result.analysis.bothSucceeded ? '✅' : '❌'}`);
    console.log(`   Data Consistency: ${result.analysis.dataConsistency ? '✅' : '❌'}`);
    console.log(`   Performance Winner: ${result.analysis.performanceWinner}`);
    console.log(`   Recommendation: ${result.analysis.recommendation}`);
    
    if (result.analysis.differences.length > 0) {
      console.log(`\n⚠️  DATA DIFFERENCES:`);
      result.analysis.differences.forEach(diff => console.log(`   - ${diff}`));
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Example usage for development testing
if (require.main === module) {
  const testConfig: ModbusClientConfig = {
    host: process.env.TEST_MODBUS_HOST || '10.10.10.11',
    port: parseInt(process.env.TEST_MODBUS_PORT || '502'),
    unitId: parseInt(process.env.TEST_MODBUS_UNIT_ID || '1'),
    timeout: parseInt(process.env.TEST_MODBUS_TIMEOUT || '5000')
  };

  const comparison = new MCPModbusLibraryComparison(testConfig);
  comparison.runComprehensiveTest().catch(console.error);
}
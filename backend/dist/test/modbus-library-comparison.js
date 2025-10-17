/**
 * Development script for comparing modbus-serial and jsmodbus libraries
 * This script helps test both libraries side by side during migration
 */
import ModbusRTU from 'modbus-serial';
import jsmodbus from 'jsmodbus';
export class ModbusLibraryComparison {
    constructor(config) {
        this.config = config;
    }
    /**
     * Test connection using modbus-serial library
     */
    async testModbusSerial() {
        const startTime = Date.now();
        const client = new ModbusRTU();
        try {
            await client.connectTCP(this.config.host, { port: this.config.port });
            client.setID(this.config.unitId);
            client.setTimeout(this.config.timeout);
            // Test read
            const result = await client.readHoldingRegisters(0, 10);
            const responseTime = Date.now() - startTime;
            client.close();
            return {
                library: 'modbus-serial',
                success: true,
                data: result.data,
                responseTime
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            client.close();
            return {
                library: 'modbus-serial',
                success: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime
            };
        }
    }
    /**
     * Test connection using jsmodbus library
     */
    async testJsModbus() {
        const startTime = Date.now();
        try {
            const client = jsmodbus.client.tcp.complete({
                host: this.config.host,
                port: this.config.port,
                unitId: this.config.unitId,
                timeout: this.config.timeout,
                autoReconnect: false
            });
            await new Promise((resolve, reject) => {
                client.connect();
                client.on('connect', resolve);
                client.on('error', reject);
                // Timeout fallback
                setTimeout(() => reject(new Error('Connection timeout')), this.config.timeout);
            });
            // Test read
            const result = await client.readHoldingRegisters(0, 10);
            const responseTime = Date.now() - startTime;
            client.close();
            return {
                library: 'jsmodbus',
                success: true,
                data: result.response.body.values,
                responseTime
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                library: 'jsmodbus',
                success: false,
                error: error instanceof Error ? error.message : String(error),
                responseTime
            };
        }
    }
    /**
     * Compare both libraries side by side
     */
    async compareLibraries() {
        console.log(`Testing connection to ${this.config.host}:${this.config.port} (Unit ID: ${this.config.unitId})`);
        // Test both libraries
        const [modbusSerialResult, jsmodbusResult] = await Promise.all([
            this.testModbusSerial(),
            this.testJsModbus()
        ]);
        // Compare results
        const bothSucceeded = modbusSerialResult.success && jsmodbusResult.success;
        let dataMatches = false;
        if (bothSucceeded && modbusSerialResult.data && jsmodbusResult.data) {
            dataMatches = JSON.stringify(modbusSerialResult.data) === JSON.stringify(jsmodbusResult.data);
        }
        const performanceDiff = jsmodbusResult.responseTime - modbusSerialResult.responseTime;
        let recommendation = '';
        if (bothSucceeded) {
            if (dataMatches) {
                recommendation = performanceDiff < 0
                    ? 'jsmodbus is faster and produces identical results'
                    : 'modbus-serial is faster but jsmodbus produces identical results';
            }
            else {
                recommendation = 'Both libraries work but produce different data - investigate further';
            }
        }
        else if (modbusSerialResult.success) {
            recommendation = 'Only modbus-serial succeeded - jsmodbus may need configuration adjustments';
        }
        else if (jsmodbusResult.success) {
            recommendation = 'Only jsmodbus succeeded - consider migration beneficial';
        }
        else {
            recommendation = 'Both libraries failed - check device configuration and network connectivity';
        }
        return {
            modbusSerial: modbusSerialResult,
            jsmodbus: jsmodbusResult,
            comparison: {
                bothSucceeded,
                dataMatches,
                performanceDiff,
                recommendation
            }
        };
    }
    /**
     * Run comprehensive test suite
     */
    async runComprehensiveTest() {
        console.log('='.repeat(60));
        console.log('MODBUS LIBRARY COMPARISON TEST');
        console.log('='.repeat(60));
        const result = await this.compareLibraries();
        console.log('\n📊 RESULTS:');
        console.log('-'.repeat(40));
        // modbus-serial results
        console.log(`\n🔧 modbus-serial:`);
        console.log(`   Success: ${result.modbusSerial.success ? '✅' : '❌'}`);
        console.log(`   Response Time: ${result.modbusSerial.responseTime}ms`);
        if (result.modbusSerial.success && result.modbusSerial.data) {
            console.log(`   Data: [${result.modbusSerial.data.slice(0, 5).join(', ')}${result.modbusSerial.data.length > 5 ? '...' : ''}]`);
        }
        if (result.modbusSerial.error) {
            console.log(`   Error: ${result.modbusSerial.error}`);
        }
        // jsmodbus results
        console.log(`\n🚀 jsmodbus:`);
        console.log(`   Success: ${result.jsmodbus.success ? '✅' : '❌'}`);
        console.log(`   Response Time: ${result.jsmodbus.responseTime}ms`);
        if (result.jsmodbus.success && result.jsmodbus.data) {
            console.log(`   Data: [${result.jsmodbus.data.slice(0, 5).join(', ')}${result.jsmodbus.data.length > 5 ? '...' : ''}]`);
        }
        if (result.jsmodbus.error) {
            console.log(`   Error: ${result.jsmodbus.error}`);
        }
        // Comparison
        console.log(`\n📈 COMPARISON:`);
        console.log(`   Both Succeeded: ${result.comparison.bothSucceeded ? '✅' : '❌'}`);
        console.log(`   Data Matches: ${result.comparison.dataMatches ? '✅' : '❌'}`);
        console.log(`   Performance Diff: ${result.comparison.performanceDiff > 0 ? '+' : ''}${result.comparison.performanceDiff}ms`);
        console.log(`   Recommendation: ${result.comparison.recommendation}`);
        console.log('\n' + '='.repeat(60));
    }
}
// Example usage for development testing
if (require.main === module) {
    const testConfig = {
        host: process.env.TEST_MODBUS_HOST || '10.10.10.11',
        port: parseInt(process.env.TEST_MODBUS_PORT || '502'),
        unitId: parseInt(process.env.TEST_MODBUS_UNIT_ID || '1'),
        timeout: parseInt(process.env.TEST_MODBUS_TIMEOUT || '5000')
    };
    const comparison = new ModbusLibraryComparison(testConfig);
    comparison.runComprehensiveTest().catch(console.error);
}
//# sourceMappingURL=modbus-library-comparison.js.map
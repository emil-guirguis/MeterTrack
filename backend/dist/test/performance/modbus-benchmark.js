"use strict";
const modbusService = require('../../services/modbusService.ts');
const { performance } = require('perf_hooks');
/**
 * Modbus Performance Benchmark Suite
 * Tests the new TypeScript implementation performance
 */
class ModbusBenchmark {
    constructor() {
        this.testDeviceIP = process.env.TEST_MODBUS_IP || '192.168.1.100';
        this.testPort = parseInt(process.env.TEST_MODBUS_PORT) || 502;
        this.testSlaveId = parseInt(process.env.TEST_MODBUS_SLAVE_ID) || 1;
        this.results = {};
    }
    async runAllBenchmarks() {
        console.log('🚀 Starting Modbus Performance Benchmarks...\n');
        console.log(`Test Device: ${this.testDeviceIP}:${this.testPort} (slave ${this.testSlaveId})\n`);
        try {
            // Test device availability first
            const isAvailable = await this.testDeviceAvailability();
            if (!isAvailable) {
                console.warn('⚠️  Test device not available. Running limited benchmarks...\n');
            }
            // Run benchmarks
            await this.benchmarkConnectionPooling();
            await this.benchmarkConcurrentConnections();
            await this.benchmarkErrorHandling();
            await this.benchmarkMemoryUsage();
            await this.benchmarkThroughput();
            // Generate report
            this.generateReport();
        }
        catch (error) {
            console.error('❌ Benchmark failed:', error);
        }
        finally {
            // Cleanup
            modbusService.closeAllConnections();
        }
    }
    async testDeviceAvailability() {
        console.log('🔍 Testing device availability...');
        try {
            const startTime = performance.now();
            const isAvailable = await modbusService.testConnection(this.testDeviceIP, this.testPort, this.testSlaveId);
            const responseTime = performance.now() - startTime;
            if (isAvailable) {
                console.log(`✅ Device available (${responseTime.toFixed(2)}ms)\n`);
            }
            else {
                console.log(`❌ Device not available (${responseTime.toFixed(2)}ms)\n`);
            }
            return isAvailable;
        }
        catch (error) {
            console.log(`❌ Device availability check failed: ${error.message}\n`);
            return false;
        }
    }
    async benchmarkConnectionPooling() {
        console.log('📊 Benchmarking Connection Pooling...');
        const iterations = 100;
        const times = [];
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            try {
                await modbusService.testConnection(this.testDeviceIP, this.testPort, this.testSlaveId);
                const endTime = performance.now();
                times.push(endTime - startTime);
            }
            catch (error) {
                // Count failed attempts
                times.push(null);
            }
            // Progress indicator
            if ((i + 1) % 20 === 0) {
                process.stdout.write(`${i + 1}/${iterations} `);
            }
        }
        console.log('\n');
        const validTimes = times.filter(t => t !== null);
        const avgTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const minTime = Math.min(...validTimes);
        const maxTime = Math.max(...validTimes);
        const successRate = (validTimes.length / iterations) * 100;
        this.results.connectionPooling = {
            iterations,
            successRate: successRate.toFixed(2),
            avgResponseTime: avgTime.toFixed(2),
            minResponseTime: minTime.toFixed(2),
            maxResponseTime: maxTime.toFixed(2)
        };
        console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`   Avg Response Time: ${avgTime.toFixed(2)}ms`);
        console.log(`   Min/Max: ${minTime.toFixed(2)}ms / ${maxTime.toFixed(2)}ms\n`);
    }
    async benchmarkConcurrentConnections() {
        console.log('🔄 Benchmarking Concurrent Connections...');
        const concurrencyLevels = [1, 5, 10, 20, 50];
        const results = {};
        for (const concurrency of concurrencyLevels) {
            console.log(`   Testing ${concurrency} concurrent connections...`);
            const startTime = performance.now();
            const promises = [];
            for (let i = 0; i < concurrency; i++) {
                promises.push(modbusService.testConnection(this.testDeviceIP, this.testPort, this.testSlaveId).catch(error => ({ error: error.message })));
            }
            const responses = await Promise.all(promises);
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const successCount = responses.filter(r => r !== false && !r.error).length;
            const successRate = (successCount / concurrency) * 100;
            const avgTimePerConnection = totalTime / concurrency;
            results[concurrency] = {
                totalTime: totalTime.toFixed(2),
                successRate: successRate.toFixed(2),
                avgTimePerConnection: avgTimePerConnection.toFixed(2),
                throughput: (concurrency / (totalTime / 1000)).toFixed(2)
            };
            console.log(`     Total Time: ${totalTime.toFixed(2)}ms`);
            console.log(`     Success Rate: ${successRate.toFixed(2)}%`);
            console.log(`     Throughput: ${(concurrency / (totalTime / 1000)).toFixed(2)} conn/sec`);
        }
        this.results.concurrentConnections = results;
        console.log('');
    }
    async benchmarkErrorHandling() {
        console.log('⚠️  Benchmarking Error Handling...');
        const errorScenarios = [
            {
                name: 'Invalid IP',
                ip: '192.168.255.255',
                port: this.testPort,
                slaveId: this.testSlaveId
            },
            {
                name: 'Invalid Port',
                ip: this.testDeviceIP,
                port: 9999,
                slaveId: this.testSlaveId
            },
            {
                name: 'Invalid Slave ID',
                ip: this.testDeviceIP,
                port: this.testPort,
                slaveId: 255
            }
        ];
        const results = {};
        for (const scenario of errorScenarios) {
            console.log(`   Testing ${scenario.name}...`);
            const startTime = performance.now();
            try {
                await modbusService.testConnection(scenario.ip, scenario.port, scenario.slaveId);
                results[scenario.name] = {
                    handled: false,
                    responseTime: (performance.now() - startTime).toFixed(2)
                };
            }
            catch (error) {
                results[scenario.name] = {
                    handled: true,
                    responseTime: (performance.now() - startTime).toFixed(2),
                    errorType: error.constructor.name,
                    errorMessage: error.message
                };
            }
            console.log(`     Response Time: ${results[scenario.name].responseTime}ms`);
            console.log(`     Error Handled: ${results[scenario.name].handled}`);
        }
        this.results.errorHandling = results;
        console.log('');
    }
    async benchmarkMemoryUsage() {
        console.log('💾 Benchmarking Memory Usage...');
        const initialMemory = process.memoryUsage();
        console.log(`   Initial Memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        // Create many connections to test memory usage
        const connectionCount = 100;
        const promises = [];
        console.log(`   Creating ${connectionCount} connections...`);
        for (let i = 0; i < connectionCount; i++) {
            promises.push(modbusService.testConnection(this.testDeviceIP, this.testPort, this.testSlaveId).catch(() => false));
        }
        await Promise.all(promises);
        const peakMemory = process.memoryUsage();
        console.log(`   Peak Memory: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));
        const finalMemory = process.memoryUsage();
        console.log(`   Final Memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        this.results.memoryUsage = {
            initial: (initialMemory.heapUsed / 1024 / 1024).toFixed(2),
            peak: (peakMemory.heapUsed / 1024 / 1024).toFixed(2),
            final: (finalMemory.heapUsed / 1024 / 1024).toFixed(2),
            increase: ((peakMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2),
            cleanup: ((peakMemory.heapUsed - finalMemory.heapUsed) / 1024 / 1024).toFixed(2)
        };
        console.log(`   Memory Increase: ${this.results.memoryUsage.increase} MB`);
        console.log(`   Memory Cleanup: ${this.results.memoryUsage.cleanup} MB\n`);
    }
    async benchmarkThroughput() {
        console.log('🚄 Benchmarking Throughput...');
        const testDuration = 10000; // 10 seconds
        const startTime = performance.now();
        let operationCount = 0;
        let successCount = 0;
        console.log(`   Running operations for ${testDuration / 1000} seconds...`);
        while (performance.now() - startTime < testDuration) {
            try {
                const success = await modbusService.testConnection(this.testDeviceIP, this.testPort, this.testSlaveId);
                if (success)
                    successCount++;
            }
            catch (error) {
                // Count as failed operation
            }
            operationCount++;
        }
        const actualDuration = performance.now() - startTime;
        const operationsPerSecond = (operationCount / (actualDuration / 1000)).toFixed(2);
        const successRate = ((successCount / operationCount) * 100).toFixed(2);
        this.results.throughput = {
            duration: actualDuration.toFixed(2),
            totalOperations: operationCount,
            successfulOperations: successCount,
            operationsPerSecond,
            successRate
        };
        console.log(`   Total Operations: ${operationCount}`);
        console.log(`   Successful Operations: ${successCount}`);
        console.log(`   Operations/Second: ${operationsPerSecond}`);
        console.log(`   Success Rate: ${successRate}%\n`);
    }
    generateReport() {
        console.log('📋 Performance Benchmark Report');
        console.log('================================\n');
        console.log('🔗 Connection Pooling Performance:');
        const pooling = this.results.connectionPooling;
        console.log(`   Iterations: ${pooling.iterations}`);
        console.log(`   Success Rate: ${pooling.successRate}%`);
        console.log(`   Average Response Time: ${pooling.avgResponseTime}ms`);
        console.log(`   Response Time Range: ${pooling.minResponseTime}ms - ${pooling.maxResponseTime}ms\n`);
        console.log('🔄 Concurrent Connection Performance:');
        Object.entries(this.results.concurrentConnections).forEach(([concurrency, data]) => {
            console.log(`   ${concurrency} connections:`);
            console.log(`     Total Time: ${data.totalTime}ms`);
            console.log(`     Success Rate: ${data.successRate}%`);
            console.log(`     Throughput: ${data.throughput} conn/sec`);
        });
        console.log('');
        console.log('⚠️  Error Handling Performance:');
        Object.entries(this.results.errorHandling).forEach(([scenario, data]) => {
            console.log(`   ${scenario}:`);
            console.log(`     Response Time: ${data.responseTime}ms`);
            console.log(`     Error Handled: ${data.handled}`);
            if (data.errorType) {
                console.log(`     Error Type: ${data.errorType}`);
            }
        });
        console.log('');
        console.log('💾 Memory Usage:');
        const memory = this.results.memoryUsage;
        console.log(`   Initial: ${memory.initial} MB`);
        console.log(`   Peak: ${memory.peak} MB`);
        console.log(`   Final: ${memory.final} MB`);
        console.log(`   Memory Increase: ${memory.increase} MB`);
        console.log(`   Memory Cleanup: ${memory.cleanup} MB\n`);
        console.log('🚄 Throughput Performance:');
        const throughput = this.results.throughput;
        console.log(`   Test Duration: ${throughput.duration}ms`);
        console.log(`   Total Operations: ${throughput.totalOperations}`);
        console.log(`   Operations/Second: ${throughput.operationsPerSecond}`);
        console.log(`   Success Rate: ${throughput.successRate}%\n`);
        // Performance assessment
        this.assessPerformance();
        // Save results to file
        this.saveResults();
    }
    assessPerformance() {
        console.log('🎯 Performance Assessment:');
        const pooling = this.results.connectionPooling;
        const throughput = this.results.throughput;
        const memory = this.results.memoryUsage;
        // Connection pooling assessment
        if (parseFloat(pooling.avgResponseTime) < 100) {
            console.log('   ✅ Connection pooling: Excellent (<100ms avg)');
        }
        else if (parseFloat(pooling.avgResponseTime) < 500) {
            console.log('   ⚠️  Connection pooling: Good (100-500ms avg)');
        }
        else {
            console.log('   ❌ Connection pooling: Needs improvement (>500ms avg)');
        }
        // Throughput assessment
        if (parseFloat(throughput.operationsPerSecond) > 50) {
            console.log('   ✅ Throughput: Excellent (>50 ops/sec)');
        }
        else if (parseFloat(throughput.operationsPerSecond) > 20) {
            console.log('   ⚠️  Throughput: Good (20-50 ops/sec)');
        }
        else {
            console.log('   ❌ Throughput: Needs improvement (<20 ops/sec)');
        }
        // Memory usage assessment
        if (parseFloat(memory.increase) < 50) {
            console.log('   ✅ Memory usage: Excellent (<50MB increase)');
        }
        else if (parseFloat(memory.increase) < 100) {
            console.log('   ⚠️  Memory usage: Good (50-100MB increase)');
        }
        else {
            console.log('   ❌ Memory usage: Needs improvement (>100MB increase)');
        }
        // Success rate assessment
        if (parseFloat(pooling.successRate) > 95) {
            console.log('   ✅ Reliability: Excellent (>95% success rate)');
        }
        else if (parseFloat(pooling.successRate) > 90) {
            console.log('   ⚠️  Reliability: Good (90-95% success rate)');
        }
        else {
            console.log('   ❌ Reliability: Needs improvement (<90% success rate)');
        }
        console.log('');
    }
    saveResults() {
        const fs = require('fs');
        const path = require('path');
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `modbus-benchmark-${timestamp}.json`;
        const filepath = path.join(resultsDir, filename);
        const report = {
            timestamp: new Date().toISOString(),
            testDevice: {
                ip: this.testDeviceIP,
                port: this.testPort,
                slaveId: this.testSlaveId
            },
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                memory: process.memoryUsage()
            },
            results: this.results
        };
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.log(`📄 Results saved to: ${filepath}`);
    }
}
// Run benchmarks if called directly
if (require.main === module) {
    const benchmark = new ModbusBenchmark();
    benchmark.runAllBenchmarks().catch(console.error);
}
module.exports = ModbusBenchmark;
//# sourceMappingURL=modbus-benchmark.js.map
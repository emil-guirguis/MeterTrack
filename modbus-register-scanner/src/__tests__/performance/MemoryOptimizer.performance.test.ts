import { MemoryOptimizer } from '../../performance/MemoryOptimizer';
import { RegisterInfo } from '../../types';

describe('MemoryOptimizer Performance Tests', () => {
  let memoryOptimizer: MemoryOptimizer;

  beforeEach(() => {
    memoryOptimizer = new MemoryOptimizer({
      maxRegistersInMemory: 5000,
      streamingThreshold: 2500,
      gcInterval: 10000,
      memoryCheckInterval: 1000
    });
  });

  afterEach(() => {
    memoryOptimizer.cleanup();
  });

  /**
   * Create mock register data for testing
   */
  function createMockRegisters(count: number, startAddress: number = 0): RegisterInfo[] {
    const registers: RegisterInfo[] = [];
    for (let i = 0; i < count; i++) {
      registers.push({
        address: startAddress + i,
        functionCode: 3,
        dataType: 'holding',
        value: Math.floor(Math.random() * 65536),
        accessible: Math.random() > 0.1, // 90% accessible
        timestamp: new Date()
      });
    }
    return registers;
  }

  test('should handle large register sets efficiently', async () => {
    const startTime = Date.now();
    const initialMemory = process.memoryUsage().heapUsed;
    
    let streamedCount = 0;
    const streamCallback = async (registers: RegisterInfo[]) => {
      streamedCount += registers.length;
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    memoryOptimizer.initialize(streamCallback);

    // Add 10,000 registers in batches
    const batchSize = 500;
    const totalRegisters = 10000;
    
    for (let i = 0; i < totalRegisters; i += batchSize) {
      const registers = createMockRegisters(batchSize, i);
      await memoryOptimizer.addRegisters(registers);
    }

    // Final flush
    await memoryOptimizer.flushBuffer();

    const endTime = Date.now();
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    const processingTime = endTime - startTime;

    console.log(`Performance Test Results:`);
    console.log(`- Processed ${totalRegisters} registers in ${processingTime}ms`);
    console.log(`- Throughput: ${(totalRegisters / processingTime * 1000).toFixed(0)} registers/second`);
    console.log(`- Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    console.log(`- Streamed: ${streamedCount} registers`);

    // Performance assertions
    expect(streamedCount).toBe(totalRegisters);
    expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Should not use more than 100MB
  });

  test('should maintain memory efficiency under sustained load', async () => {
    const memoryReadings: number[] = [];
    let streamedTotal = 0;

    const streamCallback = async (registers: RegisterInfo[]) => {
      streamedTotal += registers.length;
    };

    memoryOptimizer.initialize(streamCallback);

    // Monitor memory usage during sustained load
    const memoryMonitor = setInterval(() => {
      memoryReadings.push(process.memoryUsage().heapUsed);
    }, 100);

    try {
      // Simulate sustained load for 3 seconds
      const duration = 3000;
      const startTime = Date.now();
      let registerCount = 0;

      while (Date.now() - startTime < duration) {
        const registers = createMockRegisters(100, registerCount);
        await memoryOptimizer.addRegisters(registers);
        registerCount += 100;
        
        // Small delay to simulate realistic load
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await memoryOptimizer.flushBuffer();

    } finally {
      clearInterval(memoryMonitor);
    }

    // Analyze memory usage patterns
    const maxMemory = Math.max(...memoryReadings);
    const minMemory = Math.min(...memoryReadings);
    const avgMemory = memoryReadings.reduce((sum, mem) => sum + mem, 0) / memoryReadings.length;
    const memoryVariance = maxMemory - minMemory;

    console.log(`Sustained Load Test Results:`);
    console.log(`- Total registers processed: ${streamedTotal}`);
    console.log(`- Memory usage - Min: ${(minMemory / 1024 / 1024).toFixed(2)}MB, Max: ${(maxMemory / 1024 / 1024).toFixed(2)}MB, Avg: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`- Memory variance: ${(memoryVariance / 1024 / 1024).toFixed(2)}MB`);

    // Memory efficiency assertions
    expect(memoryVariance).toBeLessThan(200 * 1024 * 1024); // Memory variance should be reasonable
    expect(streamedTotal).toBeGreaterThan(1000); // Should process significant number of registers
  });

  test('should provide accurate memory statistics', () => {
    const registers = createMockRegisters(1000);
    
    // Add registers without streaming to test memory tracking
    const memoryOptimizerNoStream = new MemoryOptimizer({
      maxRegistersInMemory: 10000,
      streamingThreshold: 10000
    });

    memoryOptimizerNoStream.initialize();

    // Add registers synchronously for testing
    registers.forEach(register => {
      memoryOptimizerNoStream.addRegisters([register]);
    });

    const stats = memoryOptimizerNoStream.getCurrentMemoryStats();
    const summary = memoryOptimizerNoStream.getMemorySummary();

    console.log(`Memory Statistics Test:`);
    console.log(`- Registers in memory: ${stats.registersInMemory}`);
    console.log(`- Estimated memory per register: ${stats.estimatedMemoryPerRegister.toFixed(2)} bytes`);
    console.log(`- Total processed: ${summary.totalProcessed}`);

    // Statistics accuracy assertions
    expect(stats.registersInMemory).toBe(1000);
    expect(stats.estimatedMemoryPerRegister).toBeGreaterThan(0);
    expect(summary.totalProcessed).toBe(1000);
    expect(stats.heapUsed).toBeGreaterThan(0);

    memoryOptimizerNoStream.cleanup();
  });

  test('should handle memory pressure gracefully', async () => {
    // Configure for aggressive memory management
    const aggressiveOptimizer = new MemoryOptimizer({
      maxRegistersInMemory: 100,
      streamingThreshold: 50,
      gcInterval: 1000,
      memoryCheckInterval: 100
    });

    let streamCallCount = 0;
    const streamCallback = async (registers: RegisterInfo[]) => {
      streamCallCount++;
      // Simulate slow processing to create backpressure
      await new Promise(resolve => setTimeout(resolve, 5));
    };

    aggressiveOptimizer.initialize(streamCallback);

    try {
      // Add many registers quickly to test memory pressure handling
      for (let i = 0; i < 10; i++) {
        const registers = createMockRegisters(100, i * 100);
        await aggressiveOptimizer.addRegisters(registers);
      }

      await aggressiveOptimizer.flushBuffer();

      console.log(`Memory Pressure Test:`);
      console.log(`- Stream callback invoked ${streamCallCount} times`);
      console.log(`- Memory health: ${aggressiveOptimizer.isMemoryUsageHealthy()}`);

      // Should have triggered multiple stream operations
      expect(streamCallCount).toBeGreaterThan(5);
      
    } finally {
      aggressiveOptimizer.cleanup();
    }
  });

  test('should provide useful optimization recommendations', () => {
    // Test with different memory scenarios
    const scenarios = [
      { registers: 100, threshold: 1000, expected: 'acceptable' },
      { registers: 5000, threshold: 1000, expected: 'streaming' },
      { registers: 10000, threshold: 5000, expected: 'memory' }
    ];

    scenarios.forEach(scenario => {
      const optimizer = new MemoryOptimizer({
        maxRegistersInMemory: scenario.threshold,
        streamingThreshold: scenario.threshold / 2
      });

      optimizer.initialize();

      // Add registers to simulate the scenario
      const registers = createMockRegisters(scenario.registers);
      registers.forEach(register => {
        optimizer.addRegisters([register]);
      });

      const recommendations = optimizer.getOptimizationRecommendations();
      
      console.log(`Scenario ${scenario.expected}:`, recommendations);
      
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      
      optimizer.cleanup();
    });
  });
});
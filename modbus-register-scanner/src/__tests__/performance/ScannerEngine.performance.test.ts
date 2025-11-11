import { ScannerEngine } from '../../scanner/ScannerEngine';
import { ConnectionManager } from '../../connection/ConnectionManager';
import { RegisterReader } from '../../reader/RegisterReader';
import { BatchOptimizer } from '../../optimizer/BatchOptimizer';
import { ScanConfig, RegisterInfo } from '../../types';

// Mock the dependencies
jest.mock('../../connection/ConnectionManager');
jest.mock('../../reader/RegisterReader');
jest.mock('../../optimizer/BatchOptimizer');

describe('ScannerEngine Performance Tests', () => {
  let scannerEngine: ScannerEngine;
  let mockConnectionManager: jest.Mocked<ConnectionManager>;
  let mockRegisterReader: jest.Mocked<RegisterReader>;
  let mockBatchOptimizer: jest.Mocked<BatchOptimizer>;
  let scanConfig: ScanConfig;

  beforeEach(() => {
    scanConfig = {
      host: '192.168.1.100',
      port: 502,
      slaveId: 1,
      timeout: 5000,
      retries: 3,
      batchSize: 125
    };

    // Create mocks
    mockConnectionManager = new ConnectionManager(scanConfig) as jest.Mocked<ConnectionManager>;
    mockRegisterReader = new RegisterReader({} as any, 1) as jest.Mocked<RegisterReader>;
    mockBatchOptimizer = new BatchOptimizer(mockRegisterReader) as jest.Mocked<BatchOptimizer>;

    // Setup mock implementations
    mockConnectionManager.isConnected.mockReturnValue(true);
    mockConnectionManager.connect.mockResolvedValue();
    mockConnectionManager.disconnect.mockResolvedValue();

    // Mock batch optimizer to return realistic data
    mockBatchOptimizer.readOptimizedBatches.mockImplementation(async (addresses, functionCode) => {
      const registers: RegisterInfo[] = addresses.map(address => ({
        address,
        functionCode,
        dataType: getDataTypeForFunctionCode(functionCode),
        value: Math.random() > 0.1 ? Math.floor(Math.random() * 65536) : 0,
        accessible: Math.random() > 0.1, // 90% accessible
        timestamp: new Date()
      }));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
      return registers;
    });

    mockBatchOptimizer.getStats.mockReturnValue({
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      fallbackReads: 0,
      totalRegisters: 0,
      batchEfficiency: 100,
      averageBatchSize: 50,
      successRateBySize: new Map()
    });

    // Mock register reader for individual reads
    mockRegisterReader.readSingleRegister.mockImplementation(async (address, functionCode) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5 + 2));
      return {
        address,
        functionCode,
        dataType: getDataTypeForFunctionCode(functionCode),
        value: Math.random() > 0.1 ? Math.floor(Math.random() * 65536) : 0,
        accessible: Math.random() > 0.1,
        timestamp: new Date()
      };
    });
  });

  afterEach(() => {
    if (scannerEngine) {
      scannerEngine.cleanup();
    }
  });

  function getDataTypeForFunctionCode(functionCode: number): string {
    switch (functionCode) {
      case 1: return 'coil';
      case 2: return 'discrete';
      case 3: return 'holding';
      case 4: return 'input';
      default: return 'unknown';
    }
  }

  test('should handle small range scans efficiently', async () => {
    scannerEngine = new ScannerEngine(
      mockConnectionManager,
      mockRegisterReader,
      mockBatchOptimizer,
      scanConfig,
      {
        startAddress: 0,
        endAddress: 99, // 100 registers
        functionCodes: [3, 4], // 2 function codes = 200 total operations
        enableBatching: true,
        enableMemoryOptimization: true,
        enableNetworkOptimization: true
      }
    );

    const startTime = Date.now();
    const results = await scannerEngine.startScan();
    const endTime = Date.now();

    const scanTime = endTime - startTime;
    const totalOperations = 100 * 2; // 100 addresses * 2 function codes
    const throughput = totalOperations / (scanTime / 1000);

    console.log(`Small Range Scan Performance:`);
    console.log(`- Scanned ${totalOperations} register operations in ${scanTime}ms`);
    console.log(`- Throughput: ${throughput.toFixed(2)} operations/second`);
    console.log(`- Found ${results.accessibleRegisters} accessible registers`);
    console.log(`- Success rate: ${(results.accessibleRegisters / results.totalRegisters * 100).toFixed(1)}%`);

    // Performance assertions for small scans
    expect(scanTime).toBeLessThan(5000); // Should complete within 5 seconds
    expect(throughput).toBeGreaterThan(20); // Should achieve reasonable throughput
    expect(results.totalRegisters).toBe(totalOperations);
    expect(results.accessibleRegisters).toBeGreaterThan(0);
  });

  test('should handle medium range scans with streaming', async () => {
    let streamedRegisters = 0;
    const streamCallback = async (registers: RegisterInfo[]) => {
      streamedRegisters += registers.length;
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1));
    };

    scannerEngine = new ScannerEngine(
      mockConnectionManager,
      mockRegisterReader,
      mockBatchOptimizer,
      scanConfig,
      {
        startAddress: 0,
        endAddress: 999, // 1000 registers
        functionCodes: [3], // 1 function code = 1000 total operations
        enableBatching: true,
        enableStreaming: true,
        streamingThreshold: 500,
        enableMemoryOptimization: true,
        enableNetworkOptimization: true,
        streamCallback
      }
    );

    const startTime = Date.now();
    const results = await scannerEngine.startScan();
    const endTime = Date.now();

    const scanTime = endTime - startTime;
    const totalOperations = 1000;
    const throughput = totalOperations / (scanTime / 1000);

    console.log(`Medium Range Scan Performance (with streaming):`);
    console.log(`- Scanned ${totalOperations} register operations in ${scanTime}ms`);
    console.log(`- Throughput: ${throughput.toFixed(2)} operations/second`);
    console.log(`- Streamed ${streamedRegisters} registers`);
    console.log(`- Memory efficiency: ${streamedRegisters > 0 ? 'Streaming active' : 'No streaming'}`);

    // Performance assertions for medium scans
    expect(scanTime).toBeLessThan(15000); // Should complete within 15 seconds
    expect(throughput).toBeGreaterThan(15); // Should maintain good throughput
    expect(streamedRegisters).toBeGreaterThan(0); // Streaming should be active
  });

  test('should maintain performance with different optimization settings', async () => {
    const testConfigurations = [
      {
        name: 'All Optimizations Enabled',
        options: {
          enableBatching: true,
          enableMemoryOptimization: true,
          enableNetworkOptimization: true,
          enableStreaming: false
        }
      },
      {
        name: 'Batching Only',
        options: {
          enableBatching: true,
          enableMemoryOptimization: false,
          enableNetworkOptimization: false,
          enableStreaming: false
        }
      },
      {
        name: 'Individual Reads Only',
        options: {
          enableBatching: false,
          enableMemoryOptimization: false,
          enableNetworkOptimization: false,
          enableStreaming: false
        }
      }
    ];

    const performanceResults: any[] = [];

    for (const config of testConfigurations) {
      const engine = new ScannerEngine(
        mockConnectionManager,
        mockRegisterReader,
        mockBatchOptimizer,
        scanConfig,
        {
          startAddress: 0,
          endAddress: 49, // 50 registers for quick testing
          functionCodes: [3],
          ...config.options
        }
      );

      const startTime = Date.now();
      const results = await engine.startScan();
      const endTime = Date.now();

      const scanTime = endTime - startTime;
      const throughput = 50 / (scanTime / 1000);

      performanceResults.push({
        name: config.name,
        scanTime,
        throughput,
        accessibleRegisters: results.accessibleRegisters
      });

      engine.cleanup();
    }

    console.log(`Optimization Comparison:`);
    performanceResults.forEach(result => {
      console.log(`- ${result.name}: ${result.scanTime}ms, ${result.throughput.toFixed(2)} ops/sec, ${result.accessibleRegisters} accessible`);
    });

    // All configurations should complete successfully
    performanceResults.forEach(result => {
      expect(result.scanTime).toBeLessThan(10000); // All should complete within 10 seconds
      expect(result.throughput).toBeGreaterThan(1); // All should achieve some throughput
      expect(result.accessibleRegisters).toBeGreaterThanOrEqual(0);
    });

    // Optimized configurations should generally perform better
    const optimizedResult = performanceResults.find(r => r.name === 'All Optimizations Enabled');
    const unoptimizedResult = performanceResults.find(r => r.name === 'Individual Reads Only');
    
    if (optimizedResult && unoptimizedResult) {
      expect(optimizedResult.throughput).toBeGreaterThanOrEqual(unoptimizedResult.throughput * 0.8); // At least 80% as good
    }
  });

  test('should handle scan interruption gracefully', async () => {
    scannerEngine = new ScannerEngine(
      mockConnectionManager,
      mockRegisterReader,
      mockBatchOptimizer,
      scanConfig,
      {
        startAddress: 0,
        endAddress: 999, // Large range to allow interruption
        functionCodes: [3, 4],
        enableBatching: true
      }
    );

    // Start the scan
    const scanPromise = scannerEngine.startScan();

    // Interrupt after a short delay
    setTimeout(() => {
      scannerEngine.stopScan();
    }, 100);

    const startTime = Date.now();
    
    try {
      await scanPromise;
    } catch (error) {
      // Scan may throw due to interruption
    }
    
    const endTime = Date.now();
    const interruptionTime = endTime - startTime;

    const scanState = scannerEngine.getScanState();
    const progress = scannerEngine.getScanProgress();

    console.log(`Scan Interruption Test:`);
    console.log(`- Interruption time: ${interruptionTime}ms`);
    console.log(`- Scan progress: ${progress.totalProgress.toFixed(1)}%`);
    console.log(`- Registers scanned: ${scanState.scannedAddresses}`);
    console.log(`- Is running: ${scanState.isRunning}`);

    // Interruption should be handled gracefully
    expect(interruptionTime).toBeLessThan(1000); // Should stop quickly
    expect(scanState.isRunning).toBe(false); // Should not be running after interruption
    expect(progress.totalProgress).toBeLessThan(100); // Should not be complete
  });

  test('should provide accurate performance statistics', async () => {
    let progressUpdates = 0;
    let discoveredCount = 0;

    scannerEngine = new ScannerEngine(
      mockConnectionManager,
      mockRegisterReader,
      mockBatchOptimizer,
      scanConfig,
      {
        startAddress: 0,
        endAddress: 99,
        functionCodes: [3],
        enableBatching: true,
        progressCallback: (progress) => {
          progressUpdates++;
        },
        registerDiscoveredCallback: (register) => {
          if (register.accessible) {
            discoveredCount++;
          }
        }
      }
    );

    const startTime = Date.now();
    const results = await scannerEngine.startScan();
    const endTime = Date.now();

    const statistics = scannerEngine.getScanStatistics();
    const recommendations = scannerEngine.getPerformanceRecommendations();

    console.log(`Performance Statistics Test:`);
    console.log(`- Scan duration: ${endTime - startTime}ms`);
    console.log(`- Progress updates: ${progressUpdates}`);
    console.log(`- Discovered via callback: ${discoveredCount}`);
    console.log(`- Total in results: ${results.totalRegisters}`);
    console.log(`- Accessible in results: ${results.accessibleRegisters}`);
    console.log(`- Performance recommendations: ${recommendations.length}`);

    // Statistics should be accurate and consistent
    expect(progressUpdates).toBeGreaterThan(0); // Should have progress updates
    expect(discoveredCount).toBe(results.accessibleRegisters); // Callback count should match results
    expect(statistics.totalDiscovered).toBe(results.totalRegisters);
    expect(statistics.accessibleCount).toBe(results.accessibleRegisters);
    expect(recommendations).toBeDefined();
    expect(recommendations.length).toBeGreaterThan(0);
  });

  test('should handle memory pressure during large scans', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    let maxMemoryUsage = initialMemory;
    
    // Monitor memory usage during scan
    const memoryMonitor = setInterval(() => {
      const currentMemory = process.memoryUsage().heapUsed;
      maxMemoryUsage = Math.max(maxMemoryUsage, currentMemory);
    }, 100);

    try {
      scannerEngine = new ScannerEngine(
        mockConnectionManager,
        mockRegisterReader,
        mockBatchOptimizer,
        scanConfig,
        {
          startAddress: 0,
          endAddress: 499, // 500 registers
          functionCodes: [1, 2, 3, 4], // All function codes = 2000 operations
          enableBatching: true,
          enableMemoryOptimization: true,
          streamingThreshold: 1000 // Should trigger streaming
        }
      );

      const results = await scannerEngine.startScan();
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = maxMemoryUsage - initialMemory;

      console.log(`Memory Pressure Test:`);
      console.log(`- Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`- Peak memory: ${(maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
      console.log(`- Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`- Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`- Total operations: ${results.totalRegisters}`);

      // Memory usage should be reasonable
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB increase
      expect(results.totalRegisters).toBe(2000); // Should complete all operations

    } finally {
      clearInterval(memoryMonitor);
    }
  });
});
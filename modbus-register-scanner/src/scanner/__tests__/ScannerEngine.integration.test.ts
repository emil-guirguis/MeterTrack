import ModbusRTU from 'modbus-serial';
import { ScannerEngine, ScanState, ScanProgress } from '../ScannerEngine';
import { ScanStateManager } from '../ScanStateManager';
import { ConnectionManager } from '../../connection/ConnectionManager';
import { RegisterReader } from '../../reader/RegisterReader';
import { BatchOptimizer } from '../../optimizer/BatchOptimizer';
import { ScanConfig, RegisterInfo, ScanResults } from '../../types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock modbus-serial for testing
jest.mock('modbus-serial');

describe('ScannerEngine Integration Tests', () => {
  let scannerEngine: ScannerEngine;
  let connectionManager: ConnectionManager;
  let registerReader: RegisterReader;
  let batchOptimizer: BatchOptimizer;
  let mockClient: any;
  let config: ScanConfig;
  let testStateDir: string;

  beforeAll(() => {
    // Create test state directory
    testStateDir = path.join(__dirname, 'test-state');
  });

  beforeEach(async () => {
    // Clean up test state directory
    try {
      await fs.rm(testStateDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    // Create mock Modbus client
    mockClient = {
      connectTCP: jest.fn().mockResolvedValue(undefined),
      setID: jest.fn(),
      setTimeout: jest.fn(),
      isOpen: true,
      close: jest.fn((callback: any) => callback && callback()),
      readCoils: jest.fn(),
      readDiscreteInputs: jest.fn(),
      readHoldingRegisters: jest.fn(),
      readInputRegisters: jest.fn()
    };

    // Mock ModbusRTU constructor
    (ModbusRTU as any).mockImplementation(() => mockClient);

    // Create test configuration
    config = {
      host: '192.168.1.100',
      port: 502,
      slaveId: 1,
      timeout: 5000,
      retries: 3,
      batchSize: 10
    };

    // Create components
    connectionManager = new ConnectionManager(config);
    registerReader = new RegisterReader(mockClient, config.slaveId);
    batchOptimizer = new BatchOptimizer(registerReader, config.batchSize);

    // Create scanner engine with test state directory
    scannerEngine = new ScannerEngine(
      connectionManager,
      registerReader,
      batchOptimizer,
      config,
      {
        startAddress: 0,
        endAddress: 10, // Small range for testing
        functionCodes: [1, 3], // Test with coils and holding registers
        enableBatching: true
      },
      testStateDir
    );
  });

  afterEach(async () => {
    // Cleanup scanner engine
    scannerEngine.cleanup();

    // Clean up test state directory
    try {
      await fs.rm(testStateDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Scanning Workflow', () => {
    it('should perform a complete scan with mock responses', async () => {
      // Mock successful responses with varying values based on address
      mockClient.readCoils.mockImplementation((address: number) => {
        return Promise.resolve({
          data: [address % 2 === 0] // Alternating true/false based on address
        });
      });
      
      mockClient.readHoldingRegisters.mockImplementation((address: number) => {
        return Promise.resolve({
          data: [100 + address] // Incrementing values based on address
        });
      });

      // Track progress updates
      const progressUpdates: ScanProgress[] = [];
      const discoveredRegisters: RegisterInfo[] = [];

      // Configure callbacks
      scannerEngine.updateOptions({
        progressCallback: (progress) => progressUpdates.push({ ...progress }),
        registerDiscoveredCallback: (register) => discoveredRegisters.push({ ...register })
      });

      // Start scan
      const results = await scannerEngine.startScan();

      // Verify scan completed successfully
      expect(results).toBeDefined();
      expect(results.totalRegisters).toBe(22); // 11 addresses × 2 function codes
      expect(results.accessibleRegisters).toBe(22); // All should be accessible with mocked responses
      expect(results.registers).toHaveLength(22);
      expect(results.errors).toHaveLength(0);

      // Verify progress was tracked
      expect(progressUpdates.length).toBeGreaterThan(0);
      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.totalProgress).toBe(100);

      // Verify registers were discovered
      expect(discoveredRegisters.length).toBe(22);

      // Verify coil registers
      const coilRegisters = results.registers.filter(r => r.functionCode === 1);
      expect(coilRegisters).toHaveLength(11);
      expect(coilRegisters[0].value).toBe(true);  // address 0 % 2 === 0 -> true
      expect(coilRegisters[1].value).toBe(false); // address 1 % 2 === 1 -> false

      // Verify holding registers
      const holdingRegisters = results.registers.filter(r => r.functionCode === 3);
      expect(holdingRegisters).toHaveLength(11);
      expect(holdingRegisters[0].value).toBe(100); // 100 + 0 = 100
      expect(holdingRegisters[1].value).toBe(101); // 100 + 1 = 101
    });

    it('should handle mixed success and failure responses', async () => {
      // Mock mixed responses - some succeed, some fail based on address
      mockClient.readCoils.mockImplementation((address: number) => {
        if (address % 2 === 1) {
          return Promise.reject(new Error('Illegal data address'));
        }
        return Promise.resolve({ data: [true] });
      });

      mockClient.readHoldingRegisters.mockImplementation((address: number) => {
        if (address === 2) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve({ data: [100 + address] });
      });

      // Configure for individual reads (disable batching for predictable test)
      scannerEngine.updateOptions({
        enableBatching: false,
        endAddress: 3 // Test with just 4 addresses (0-3)
      });

      const results = await scannerEngine.startScan();

      // Verify mixed results
      expect(results.totalRegisters).toBe(8); // 4 addresses × 2 function codes
      expect(results.accessibleRegisters).toBeLessThan(8); // Some should fail
      
      // Check that some registers are accessible and some are not
      const accessibleCount = results.registers.filter(r => r.accessible).length;
      const inaccessibleCount = results.registers.filter(r => !r.accessible).length;
      expect(accessibleCount).toBeGreaterThan(0);
      expect(inaccessibleCount).toBeGreaterThan(0);
      
      // Verify that inaccessible registers have error information
      const inaccessibleRegisters = results.registers.filter(r => !r.accessible);
      expect(inaccessibleRegisters.length).toBeGreaterThan(0);
    });
  });

  describe('Scan Interruption and Resumption', () => {
    it('should save and restore scan state correctly', async () => {
      // Mock responses for partial scan
      mockClient.readCoils.mockResolvedValue({ data: [true] });
      mockClient.readHoldingRegisters.mockResolvedValue({ data: [100] });

      // Configure for individual reads to control timing
      scannerEngine.updateOptions({
        enableBatching: false,
        endAddress: 5 // Small range for testing
      });

      // Start scan and interrupt it after a short time
      const scanPromise = scannerEngine.startScan();
      
      // Wait a bit then stop the scan
      setTimeout(() => {
        scannerEngine.stopScan();
      }, 100);

      try {
        await scanPromise;
      } catch (error) {
        // Scan might throw due to interruption, that's expected
      }

      // Save current state
      await scannerEngine.saveCurrentState();

      // Verify state was saved
      expect(await scannerEngine.canResumeScan()).toBe(true);

      // Get saved state info
      const stateInfo = await scannerEngine.getSavedStateInfo();
      expect(stateInfo.exists).toBe(true);
      expect(stateInfo.totalRegisters).toBeGreaterThan(0);

      // Create new scanner engine to test resumption
      const newScannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 5,
          functionCodes: [1, 3],
          enableBatching: false
        },
        testStateDir
      );

      // Resume scan
      const resumedResults: ScanResults = await newScannerEngine.resumeFromSavedState();

      // Verify resumed scan completed
      expect(resumedResults).toBeDefined();
      expect(resumedResults.totalRegisters).toBeGreaterThanOrEqual(12); // Should be at least 12 registers
      expect(resumedResults.registers.length).toBe(resumedResults.totalRegisters);
      
      // Verify we have registers for both function codes
      const coilRegisters = resumedResults.registers.filter(r => r.functionCode === 1);
      const holdingRegisters = resumedResults.registers.filter(r => r.functionCode === 3);
      expect(coilRegisters.length).toBeGreaterThan(0);
      expect(holdingRegisters.length).toBeGreaterThan(0);

      // Cleanup
      newScannerEngine.cleanup();
    });

    it('should handle state validation correctly', async () => {
      // Create invalid state file
      const stateManager = new ScanStateManager(testStateDir);
      const invalidState = {
        version: '0.0.1', // Invalid version
        config: null, // Missing config
        state: null, // Missing state
        discoveredRegisters: 'invalid', // Invalid type
        lastSavedTime: new Date()
      };

      await fs.mkdir(testStateDir, { recursive: true });
      await fs.writeFile(
        path.join(testStateDir, 'scan-state.json'),
        JSON.stringify(invalidState),
        'utf8'
      );

      // Verify validation fails
      const validation = await stateManager.validateSavedState();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Verify resumption fails with invalid state
      await expect(scannerEngine.resumeFromSavedState()).rejects.toThrow();
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress accurately throughout scan', async () => {
      // Mock responses
      mockClient.readCoils.mockResolvedValue({ data: [true] });
      mockClient.readHoldingRegisters.mockResolvedValue({ data: [100] });

      const progressUpdates: ScanProgress[] = [];
      let lastProgress = 0;

      scannerEngine.updateOptions({
        enableBatching: false,
        endAddress: 4, // 5 addresses for testing
        progressCallback: (progress) => {
          progressUpdates.push({ ...progress });
          // Verify progress is monotonically increasing
          expect(progress.totalProgress).toBeGreaterThanOrEqual(lastProgress);
          lastProgress = progress.totalProgress;
        }
      });

      await scannerEngine.startScan();

      // Verify progress tracking
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Check first progress update
      const firstProgress = progressUpdates[0];
      expect(firstProgress.totalProgress).toBeGreaterThanOrEqual(0);
      expect(firstProgress.scannedCount).toBeGreaterThanOrEqual(0);
      
      // Check final progress update
      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.totalProgress).toBe(100);
      expect(finalProgress.scannedCount).toBe(10); // 5 addresses × 2 function codes

      // Verify timing information is present
      expect(finalProgress.elapsedTime).toBeGreaterThan(0);
      expect(finalProgress.scanRate).toBeGreaterThan(0);
    });

    it('should provide accurate estimated time remaining', async () => {
      // Mock responses with delay to simulate real scanning
      mockClient.readCoils.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [true] }), 10))
      );
      mockClient.readHoldingRegisters.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [100] }), 10))
      );

      const progressUpdates: ScanProgress[] = [];

      scannerEngine.updateOptions({
        enableBatching: false,
        endAddress: 3, // Small range for faster test
        progressCallback: (progress) => {
          progressUpdates.push({ ...progress });
        }
      });

      await scannerEngine.startScan();

      // Find a mid-scan progress update
      const midScanProgress = progressUpdates.find(p => p.totalProgress > 10 && p.totalProgress < 90);
      
      if (midScanProgress) {
        // Verify estimated time remaining is reasonable
        expect(midScanProgress.estimatedTimeRemaining).toBeGreaterThan(0);
        expect(midScanProgress.estimatedTimeRemaining).toBeLessThan(60000); // Less than 1 minute for small test
        expect(midScanProgress.scanRate).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failures gracefully', async () => {
      // Mock connection failure
      mockClient.connectTCP.mockRejectedValue(new Error('Connection refused'));

      // Verify scan fails with connection error
      await expect(scannerEngine.startScan()).rejects.toThrow();
    });

    it('should continue scanning after individual register failures', async () => {
      // Mock mixed responses - some fail, some succeed
      let callCount = 0;
      mockClient.readCoils.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.reject(new Error('Register not available'));
        }
        return Promise.resolve({ data: [true] });
      });

      mockClient.readHoldingRegisters.mockResolvedValue({ data: [100] });

      const errorMessages: string[] = [];
      scannerEngine.updateOptions({
        enableBatching: false,
        endAddress: 3, // 4 addresses
        errorCallback: (error) => errorMessages.push(error)
      });

      const results = await scannerEngine.startScan();

      // Verify scan completed despite errors
      expect(results.totalRegisters).toBe(8); // 4 addresses × 2 function codes
      
      // Verify some registers succeeded and some failed
      const accessibleRegisters = results.registers.filter(r => r.accessible);
      const inaccessibleRegisters = results.registers.filter(r => !r.accessible);
      expect(accessibleRegisters.length).toBeGreaterThan(0);
      expect(inaccessibleRegisters.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Optimization Integration', () => {
    it('should use batch optimization when enabled', async () => {
      // Mock batch responses
      mockClient.readCoils.mockResolvedValue({
        data: [true, false, true, false, true]
      });
      mockClient.readHoldingRegisters.mockResolvedValue({
        data: [100, 200, 300, 400, 500]
      });

      scannerEngine.updateOptions({
        enableBatching: true,
        endAddress: 4 // 5 addresses
      });

      await scannerEngine.startScan();

      // Verify batch methods were called (fewer calls than individual reads)
      const totalCalls = mockClient.readCoils.mock.calls.length + mockClient.readHoldingRegisters.mock.calls.length;
      expect(totalCalls).toBeLessThan(10); // Should be fewer than 10 individual calls
    });

    it('should fall back to individual reads when batching fails', async () => {
      // Mock batch failure followed by individual success
      mockClient.readCoils
        .mockRejectedValueOnce(new Error('Batch read failed'))
        .mockResolvedValue({ data: [true] }); // Individual reads succeed

      mockClient.readHoldingRegisters
        .mockRejectedValueOnce(new Error('Batch read failed'))
        .mockResolvedValue({ data: [100] }); // Individual reads succeed

      scannerEngine.updateOptions({
        enableBatching: true,
        endAddress: 2 // 3 addresses for testing
      });

      const results = await scannerEngine.startScan();

      // Verify scan completed successfully despite batch failures
      expect(results.totalRegisters).toBe(6); // 3 addresses × 2 function codes
      expect(results.accessibleRegisters).toBe(6); // All should succeed with individual reads
    });
  });

  describe('Comprehensive Integration Scenarios', () => {
    it('should handle all four function codes in a complete scan', async () => {
      // Mock responses for all function codes
      mockClient.readCoils.mockImplementation((address: number) => 
        Promise.resolve({ data: [address % 2 === 0] })
      );
      mockClient.readDiscreteInputs.mockImplementation((address: number) => 
        Promise.resolve({ data: [address % 3 === 0] })
      );
      mockClient.readHoldingRegisters.mockImplementation((address: number) => 
        Promise.resolve({ data: [1000 + address] })
      );
      mockClient.readInputRegisters.mockImplementation((address: number) => 
        Promise.resolve({ data: [2000 + address] })
      );

      // Configure for all function codes
      scannerEngine.updateOptions({
        startAddress: 0,
        endAddress: 4, // 5 addresses
        functionCodes: [1, 2, 3, 4], // All function codes
        enableBatching: false
      });

      const results = await scannerEngine.startScan();

      // Verify all function codes were scanned
      expect(results.totalRegisters).toBe(20); // 5 addresses × 4 function codes
      expect(results.accessibleRegisters).toBe(20); // All should be accessible

      // Verify each function code has registers
      const coils = results.registers.filter(r => r.functionCode === 1);
      const discreteInputs = results.registers.filter(r => r.functionCode === 2);
      const holdingRegisters = results.registers.filter(r => r.functionCode === 3);
      const inputRegisters = results.registers.filter(r => r.functionCode === 4);

      expect(coils).toHaveLength(5);
      expect(discreteInputs).toHaveLength(5);
      expect(holdingRegisters).toHaveLength(5);
      expect(inputRegisters).toHaveLength(5);

      // Verify data types are correct
      expect(coils.every(r => r.dataType === 'coil')).toBe(true);
      expect(discreteInputs.every(r => r.dataType === 'discrete')).toBe(true);
      expect(holdingRegisters.every(r => r.dataType === 'holding')).toBe(true);
      expect(inputRegisters.every(r => r.dataType === 'input')).toBe(true);
    });

    it('should handle scan with large address range efficiently', async () => {
      // Mock responses for larger range
      mockClient.readCoils.mockImplementation((address: number) => 
        Promise.resolve({ data: [true] })
      );
      mockClient.readHoldingRegisters.mockImplementation((address: number) => 
        Promise.resolve({ data: [address] })
      );

      const progressUpdates: ScanProgress[] = [];
      
      scannerEngine.updateOptions({
        startAddress: 100,
        endAddress: 199, // 100 addresses
        functionCodes: [1, 3],
        enableBatching: false,
        progressCallback: (progress) => progressUpdates.push({ ...progress })
      });

      const results = await scannerEngine.startScan();

      // Verify large scan completed
      expect(results.totalRegisters).toBe(200); // 100 addresses × 2 function codes
      expect(results.accessibleRegisters).toBe(200);

      // Verify progress was tracked throughout
      expect(progressUpdates.length).toBeGreaterThan(10);
      
      // Verify final progress is 100%
      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.totalProgress).toBe(100);
      
      // Verify addresses are in correct range
      const addresses = results.registers.map(r => r.address);
      expect(Math.min(...addresses)).toBe(100);
      expect(Math.max(...addresses)).toBe(199);
    });

    it('should handle rapid scan interruption and resumption cycles', async () => {
      // Mock responses
      mockClient.readCoils.mockResolvedValue({ data: [true] });
      mockClient.readHoldingRegisters.mockResolvedValue({ data: [100] });

      scannerEngine.updateOptions({
        startAddress: 0,
        endAddress: 20, // Moderate range
        functionCodes: [1, 3],
        enableBatching: false
      });

      // Start and quickly interrupt scan
      const scanPromise = scannerEngine.startScan();
      setTimeout(() => scannerEngine.stopScan(), 50);

      try {
        await scanPromise;
      } catch (error) {
        // Expected due to interruption
      }

      // Save state
      await scannerEngine.saveCurrentState();
      expect(await scannerEngine.canResumeScan()).toBe(true);

      // Create new scanner and resume
      const newScanner = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 20,
          functionCodes: [1, 3],
          enableBatching: false
        },
        testStateDir
      );

      const resumedResults = await newScanner.resumeFromSavedState();
      
      // Verify resumption completed successfully
      expect(resumedResults).toBeDefined();
      expect(resumedResults.totalRegisters).toBeGreaterThan(0);
      expect(resumedResults.registers.length).toBe(resumedResults.totalRegisters);

      // Cleanup
      newScanner.cleanup();
    });

    it('should maintain scan statistics accuracy throughout process', async () => {
      // Mock responses with some failures
      mockClient.readCoils.mockImplementation((address: number) => {
        if (address > 5) {
          return Promise.reject(new Error('Address out of range'));
        }
        return Promise.resolve({ data: [true] });
      });
      
      mockClient.readHoldingRegisters.mockResolvedValue({ data: [100] });

      const progressUpdates: ScanProgress[] = [];
      const discoveredRegisters: RegisterInfo[] = [];

      scannerEngine.updateOptions({
        startAddress: 0,
        endAddress: 9, // 10 addresses
        functionCodes: [1, 3],
        enableBatching: false,
        progressCallback: (progress) => progressUpdates.push({ ...progress }),
        registerDiscoveredCallback: (register) => discoveredRegisters.push({ ...register })
      });

      const results = await scannerEngine.startScan();

      // Verify statistics consistency
      expect(results.totalRegisters).toBe(20); // 10 addresses × 2 function codes
      expect(results.registers).toHaveLength(20);
      
      // Verify accessible vs inaccessible counts
      const accessibleCount = results.registers.filter(r => r.accessible).length;
      const inaccessibleCount = results.registers.filter(r => !r.accessible).length;
      expect(accessibleCount + inaccessibleCount).toBe(results.totalRegisters);
      expect(results.accessibleRegisters).toBe(accessibleCount);

      // Verify discovered registers callback was called correctly
      expect(discoveredRegisters.length).toBe(accessibleCount);

      // Verify progress tracking was accurate
      expect(progressUpdates.length).toBeGreaterThan(0);
      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.scannedCount).toBe(results.totalRegisters);
      expect(finalProgress.discoveredCount).toBe(accessibleCount);
    });
  });
});
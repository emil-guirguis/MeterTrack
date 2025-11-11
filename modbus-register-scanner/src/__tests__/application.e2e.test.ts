import ModbusRTU from 'modbus-serial';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { ConnectionManager } from '../connection/ConnectionManager';
import { RegisterReader } from '../reader/RegisterReader';
import { BatchOptimizer } from '../optimizer/BatchOptimizer';
import { ScannerEngine } from '../scanner/ScannerEngine';
import { ProgressReporter } from '../reporter/ProgressReporter';
import { ErrorLogger } from '../reporter/ErrorLogger';
import { ExportManager, ExportFormat } from '../export/ExportManager';
import { ScanConfig, RegisterInfo, ScanResults } from '../types';

// Mock modbus-serial for testing
jest.mock('modbus-serial');

describe('End-to-End Application Flow Tests', () => {
  let mockClient: any;
  let config: ScanConfig;
  let testOutputDir: string;
  let testStateDir: string;

  beforeAll(() => {
    testOutputDir = path.join(__dirname, 'e2e-output');
    testStateDir = path.join(__dirname, 'e2e-state');
  });

  beforeEach(async () => {
    // Clean up test directories
    await Promise.all([
      fs.rm(testOutputDir, { recursive: true, force: true }).catch(() => {}),
      fs.rm(testStateDir, { recursive: true, force: true }).catch(() => {})
    ]);

    // Create test directories
    await Promise.all([
      fs.mkdir(testOutputDir, { recursive: true }),
      fs.mkdir(testStateDir, { recursive: true })
    ]);

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
  });

  afterEach(async () => {
    // Clean up test directories
    await Promise.all([
      fs.rm(testOutputDir, { recursive: true, force: true }).catch(() => {}),
      fs.rm(testStateDir, { recursive: true, force: true }).catch(() => {})
    ]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  /**
   * Simulate a complete application workflow
   */
  const runCompleteWorkflow = async (options: {
    startAddress?: number;
    endAddress?: number;
    functionCodes?: number[];
    enableBatching?: boolean;
    outputFile?: string;
    exportFormat?: string;
    simulateErrors?: boolean;
    simulateInterruption?: boolean;
  } = {}) => {
    const {
      startAddress = 0,
      endAddress = 10,
      functionCodes = [1, 3],
      enableBatching = true,
      outputFile = 'test-scan',
      exportFormat = 'both',
      simulateErrors = false,
      simulateInterruption = false
    } = options;

    // Mock responses based on options
    if (simulateErrors) {
      // Simulate mixed success/failure responses
      mockClient.readCoils.mockImplementation((address: number) => {
        if (address % 3 === 0) {
          return Promise.reject(new Error('Illegal data address'));
        }
        return Promise.resolve({ data: [address % 2 === 0] });
      });
      
      mockClient.readHoldingRegisters.mockImplementation((address: number) => {
        if (address === 5) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve({ data: [1000 + address] });
      });
    } else {
      // Simulate successful responses
      mockClient.readCoils.mockImplementation((address: number) => 
        Promise.resolve({ data: [address % 2 === 0] })
      );
      mockClient.readHoldingRegisters.mockImplementation((address: number) => 
        Promise.resolve({ data: [1000 + address] })
      );
    }

    // Initialize components
    const connectionManager = new ConnectionManager(config);
    const registerReader = new RegisterReader(mockClient, config.slaveId);
    const batchOptimizer = new BatchOptimizer(registerReader);
    const errorLogger = new ErrorLogger(true, testStateDir);
    
    const totalAddresses = endAddress - startAddress + 1;
    const totalRegisters = totalAddresses * functionCodes.length;
    const progressReporter = new ProgressReporter(totalRegisters);

    // Track callbacks
    const progressUpdates: any[] = [];
    const discoveredRegisters: RegisterInfo[] = [];
    const errors: string[] = [];

    // Initialize scanner engine
    const scannerEngine = new ScannerEngine(
      connectionManager,
      registerReader,
      batchOptimizer,
      config,
      {
        startAddress,
        endAddress,
        functionCodes,
        enableBatching,
        progressCallback: (progress) => {
          progressUpdates.push(progress);
          progressReporter.updateProgress(progress.currentAddress, progress.currentFunctionCode);
        },
        registerDiscoveredCallback: (register) => {
          discoveredRegisters.push(register);
          progressReporter.reportDiscoveredRegister(register);
        },
        errorCallback: (error) => {
          errors.push(error);
          errorLogger.logGenericError(error, 'unknown', 'medium');
        }
      },
      testStateDir
    );

    // Start progress reporting
    progressReporter.startScan({
      host: config.host,
      port: config.port,
      slaveId: config.slaveId
    });

    let results: ScanResults;

    if (simulateInterruption) {
      // Start scan and interrupt it
      const scanPromise = scannerEngine.startScan();
      setTimeout(() => scannerEngine.stopScan(), 100);
      
      try {
        results = await scanPromise;
      } catch (error) {
        // Save state and create new scanner to resume
        await scannerEngine.saveCurrentState();
        
        const newScannerEngine = new ScannerEngine(
          connectionManager,
          registerReader,
          batchOptimizer,
          config,
          {
            startAddress,
            endAddress,
            functionCodes,
            enableBatching,
            progressCallback: (progress) => progressUpdates.push(progress),
            registerDiscoveredCallback: (register) => discoveredRegisters.push(register),
            errorCallback: (error) => errors.push(error)
          },
          testStateDir
        );

        results = await newScannerEngine.resumeFromSavedState();
        newScannerEngine.cleanup();
      }
    } else {
      // Normal scan
      results = await scannerEngine.startScan();
    }

    // Complete progress reporting
    progressReporter.completeScan();

    // Export results
    const exportManager = new ExportManager();
    const exportedFiles: string[] = [];

    if (results.accessibleRegisters > 0) {
      const formats = exportFormat === 'both' ? ['csv', 'json'] : [exportFormat];
      
      for (const format of formats) {
        const exportFormatEnum = format === 'csv' ? ExportFormat.CSV : ExportFormat.JSON;
        const filePath = await exportManager.exportResults(results, {
          format: exportFormatEnum,
          filename: outputFile,
          outputPath: testOutputDir,
          includeTimestamp: true
        });
        exportedFiles.push(filePath);
      }
    }

    // Generate error report if needed
    const errorStats = errorLogger.getErrorStatistics();
    let errorReportPath: string | undefined;
    if (errorStats.totalErrors > 0) {
      const errorReport = errorLogger.generateErrorReport();
      errorReportPath = path.join(testOutputDir, `${outputFile}_error_report.txt`);
      await fs.writeFile(errorReportPath, errorReport);
    }

    // Cleanup
    scannerEngine.cleanup();
    await connectionManager.disconnect();

    return {
      results,
      progressUpdates,
      discoveredRegisters,
      errors,
      errorStats,
      exportedFiles,
      errorReportPath
    };
  };

  describe('Complete Application Workflows', () => {
    it('should execute successful scan workflow with CSV export', async () => {
      const workflow = await runCompleteWorkflow({
        startAddress: 0,
        endAddress: 5,
        functionCodes: [1, 3],
        enableBatching: false,
        outputFile: 'successful-scan',
        exportFormat: 'csv'
      });

      // Verify scan results
      expect(workflow.results).toBeDefined();
      expect(workflow.results.totalRegisters).toBe(12); // 6 addresses × 2 function codes
      expect(workflow.results.accessibleRegisters).toBe(12);
      expect(workflow.results.registers).toHaveLength(12);
      expect(workflow.results.errors).toHaveLength(0);

      // Verify progress tracking
      expect(workflow.progressUpdates.length).toBeGreaterThan(0);
      const finalProgress = workflow.progressUpdates[workflow.progressUpdates.length - 1];
      expect(finalProgress.totalProgress).toBe(100);

      // Verify discovered registers
      expect(workflow.discoveredRegisters).toHaveLength(12);

      // Verify export files
      expect(workflow.exportedFiles).toHaveLength(1);
      expect(workflow.exportedFiles[0]).toContain('.csv');
      expect(existsSync(workflow.exportedFiles[0])).toBe(true);

      // Verify CSV content
      const csvContent = await fs.readFile(workflow.exportedFiles[0], 'utf8');
      expect(csvContent).toContain('Register Address');
      expect(csvContent).toContain('Function Code');
      expect(csvContent).toContain('Data Type');
      expect(csvContent).toContain('Sample Value');
    });

    it('should execute successful scan workflow with JSON export', async () => {
      const workflow = await runCompleteWorkflow({
        startAddress: 10,
        endAddress: 15,
        functionCodes: [2, 4],
        enableBatching: true,
        outputFile: 'json-scan',
        exportFormat: 'json'
      });

      // Mock discrete inputs and input registers
      mockClient.readDiscreteInputs.mockImplementation((address: number) => 
        Promise.resolve({ data: [address % 3 === 0] })
      );
      mockClient.readInputRegisters.mockImplementation((address: number) => 
        Promise.resolve({ data: [2000 + address] })
      );

      // Verify export files
      expect(workflow.exportedFiles).toHaveLength(1);
      expect(workflow.exportedFiles[0]).toContain('.json');
      expect(existsSync(workflow.exportedFiles[0])).toBe(true);

      // Verify JSON content
      const jsonContent = await fs.readFile(workflow.exportedFiles[0], 'utf8');
      const jsonData = JSON.parse(jsonContent);
      
      expect(jsonData).toHaveProperty('scanInfo');
      expect(jsonData).toHaveProperty('registers');
      expect(jsonData.scanInfo).toHaveProperty('config');
      expect(jsonData.scanInfo).toHaveProperty('totalRegisters');
      expect(jsonData.scanInfo).toHaveProperty('accessibleRegisters');
      expect(Array.isArray(jsonData.registers)).toBe(true);
    });

    it('should execute workflow with both CSV and JSON export', async () => {
      const workflow = await runCompleteWorkflow({
        startAddress: 0,
        endAddress: 3,
        functionCodes: [1, 2, 3, 4],
        enableBatching: true,
        outputFile: 'both-formats',
        exportFormat: 'both'
      });

      // Mock all function codes
      mockClient.readDiscreteInputs.mockImplementation((address: number) => 
        Promise.resolve({ data: [address % 2 === 1] })
      );
      mockClient.readInputRegisters.mockImplementation((address: number) => 
        Promise.resolve({ data: [3000 + address] })
      );

      // Verify both export files were created
      expect(workflow.exportedFiles).toHaveLength(2);
      
      const csvFile = workflow.exportedFiles.find(f => f.endsWith('.csv'));
      const jsonFile = workflow.exportedFiles.find(f => f.endsWith('.json'));
      
      expect(csvFile).toBeDefined();
      expect(jsonFile).toBeDefined();
      expect(existsSync(csvFile!)).toBe(true);
      expect(existsSync(jsonFile!)).toBe(true);

      // Verify file contents
      const csvContent = await fs.readFile(csvFile!, 'utf8');
      const jsonContent = await fs.readFile(jsonFile!, 'utf8');
      
      expect(csvContent).toContain('Register Address');
      expect(JSON.parse(jsonContent)).toHaveProperty('scanInfo');
    });

    it('should handle workflow with errors and generate error report', async () => {
      const workflow = await runCompleteWorkflow({
        startAddress: 0,
        endAddress: 10,
        functionCodes: [1, 3],
        enableBatching: false,
        outputFile: 'error-scan',
        exportFormat: 'csv',
        simulateErrors: true
      });

      // Verify scan completed with mixed results
      expect(workflow.results.totalRegisters).toBe(22); // 11 addresses × 2 function codes
      expect(workflow.results.accessibleRegisters).toBeLessThan(22);
      expect(workflow.errors.length).toBeGreaterThan(0);

      // Verify error statistics
      expect(workflow.errorStats.totalErrors).toBeGreaterThan(0);
      expect(workflow.errorStats.errorsByType).toBeDefined();

      // Verify error report was generated
      expect(workflow.errorReportPath).toBeDefined();
      expect(existsSync(workflow.errorReportPath!)).toBe(true);

      // Verify error report content
      const errorReportContent = await fs.readFile(workflow.errorReportPath!, 'utf8');
      expect(errorReportContent).toContain('MODBUS SCANNER ERROR REPORT');
      expect(errorReportContent).toContain('Total Errors:');
      expect(errorReportContent).toContain('ERRORS BY TYPE:');
    });

    it('should handle scan interruption and resumption workflow', async () => {
      const workflow = await runCompleteWorkflow({
        startAddress: 0,
        endAddress: 20,
        functionCodes: [1, 3],
        enableBatching: false,
        outputFile: 'interrupted-scan',
        exportFormat: 'json',
        simulateInterruption: true
      });

      // Verify scan eventually completed
      expect(workflow.results).toBeDefined();
      expect(workflow.results.totalRegisters).toBe(42); // 21 addresses × 2 function codes
      expect(workflow.results.registers).toHaveLength(42);

      // Verify progress was tracked
      expect(workflow.progressUpdates.length).toBeGreaterThan(0);

      // Verify export was created
      expect(workflow.exportedFiles).toHaveLength(1);
      expect(existsSync(workflow.exportedFiles[0])).toBe(true);
    });
  });

  describe('Component Integration Verification', () => {
    it('should verify all components work together correctly', async () => {
      // Mock responses for comprehensive test
      mockClient.readCoils.mockImplementation((address: number) => 
        Promise.resolve({ data: [address % 2 === 0] })
      );
      mockClient.readHoldingRegisters.mockImplementation((address: number) => 
        Promise.resolve({ data: [1000 + address] })
      );

      // Initialize all components
      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);
      const errorLogger = new ErrorLogger(true, testStateDir);
      const progressReporter = new ProgressReporter(20); // 10 addresses × 2 function codes
      const exportManager = new ExportManager();

      // Track component interactions
      const componentInteractions = {
        connectionEstablished: false,
        registersRead: 0,
        batchesOptimized: 0,
        progressUpdated: 0,
        errorsLogged: 0,
        resultsExported: false
      };

      // Create scanner with detailed tracking
      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 9,
          functionCodes: [1, 3],
          enableBatching: true,
          progressCallback: (progress) => {
            componentInteractions.progressUpdated++;
            progressReporter.updateProgress(progress.currentAddress, progress.currentFunctionCode);
          },
          registerDiscoveredCallback: (register) => {
            componentInteractions.registersRead++;
            progressReporter.reportDiscoveredRegister(register);
          },
          errorCallback: (error) => {
            componentInteractions.errorsLogged++;
            errorLogger.logGenericError(error, 'unknown', 'medium');
          }
        },
        testStateDir
      );

      // Execute scan
      progressReporter.startScan({
        host: config.host,
        port: config.port,
        slaveId: config.slaveId
      });

      const results = await scannerEngine.startScan();
      componentInteractions.connectionEstablished = connectionManager.isConnected();

      progressReporter.completeScan();

      // Export results
      if (results.accessibleRegisters > 0) {
        const filePath = await exportManager.exportResults(results, {
          format: ExportFormat.JSON,
          filename: 'integration-test',
          outputPath: testOutputDir,
          includeTimestamp: true
        });
        componentInteractions.resultsExported = existsSync(filePath);
      }

      // Verify component interactions
      expect(componentInteractions.connectionEstablished).toBe(true);
      expect(componentInteractions.registersRead).toBe(20); // All registers discovered
      expect(componentInteractions.progressUpdated).toBeGreaterThan(0);
      expect(componentInteractions.resultsExported).toBe(true);

      // Verify final results
      expect(results.totalRegisters).toBe(20);
      expect(results.accessibleRegisters).toBe(20);
      expect(results.registers).toHaveLength(20);

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });

    it('should verify error propagation through all components', async () => {
      // Mock connection failure
      mockClient.connectTCP.mockRejectedValue(new Error('Connection refused'));

      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);
      const errorLogger = new ErrorLogger(true, testStateDir);

      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 5,
          functionCodes: [1],
          enableBatching: false,
          errorCallback: (error) => {
            errorLogger.logGenericError(error, 'connection', 'critical');
          }
        },
        testStateDir
      );

      // Verify scan fails with connection error
      await expect(scannerEngine.startScan()).rejects.toThrow();

      // Verify error was logged
      const errorStats = errorLogger.getErrorStatistics();
      expect(errorStats.totalErrors).toBeGreaterThan(0);

      // Cleanup
      scannerEngine.cleanup();
    });
  });

  describe('Real-world Simulation Tests', () => {
    it('should simulate scanning a typical industrial device', async () => {
      // Simulate a typical PLC with mixed register types
      mockClient.readCoils.mockImplementation((address: number) => {
        // Simulate some coils being used, others not
        if (address >= 0 && address <= 100) {
          return Promise.resolve({ data: [address % 4 === 0] });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      mockClient.readHoldingRegisters.mockImplementation((address: number) => {
        // Simulate holding registers in specific ranges
        if ((address >= 1000 && address <= 1100) || (address >= 2000 && address <= 2050)) {
          return Promise.resolve({ data: [address] });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      const workflow = await runCompleteWorkflow({
        startAddress: 0,
        endAddress: 2100,
        functionCodes: [1, 3],
        enableBatching: true,
        outputFile: 'industrial-device',
        exportFormat: 'both'
      });

      // Verify realistic results
      expect(workflow.results.totalRegisters).toBe(4202); // 2101 addresses × 2 function codes
      expect(workflow.results.accessibleRegisters).toBeLessThan(workflow.results.totalRegisters);
      expect(workflow.results.accessibleRegisters).toBeGreaterThan(0);

      // Verify export files were created
      expect(workflow.exportedFiles).toHaveLength(2);
      
      // Verify realistic scan statistics
      const successRate = (workflow.results.accessibleRegisters / workflow.results.totalRegisters) * 100;
      expect(successRate).toBeGreaterThan(0);
      expect(successRate).toBeLessThan(100);
    });

    it('should simulate scanning with network instability', async () => {
      let callCount = 0;
      
      // Simulate intermittent network issues
      mockClient.readCoils.mockImplementation((address: number) => {
        callCount++;
        if (callCount % 10 === 0) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve({ data: [true] });
      });

      mockClient.readHoldingRegisters.mockImplementation((address: number) => {
        callCount++;
        if (callCount % 15 === 0) {
          return Promise.reject(new Error('Connection lost'));
        }
        return Promise.resolve({ data: [address] });
      });

      const workflow = await runCompleteWorkflow({
        startAddress: 0,
        endAddress: 50,
        functionCodes: [1, 3],
        enableBatching: false,
        outputFile: 'unstable-network',
        exportFormat: 'csv',
        simulateErrors: false // We're simulating errors manually
      });

      // Verify scan handled network issues
      expect(workflow.results.totalRegisters).toBe(102); // 51 addresses × 2 function codes
      expect(workflow.results.accessibleRegisters).toBeLessThan(102);
      expect(workflow.errors.length).toBeGreaterThan(0);

      // Verify error statistics show network issues
      expect(workflow.errorStats.totalErrors).toBeGreaterThan(0);
      expect(workflow.errorStats.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle large address ranges efficiently', async () => {
      // Mock fast responses for performance test
      mockClient.readCoils.mockImplementation((address: number) => 
        Promise.resolve({ data: [address % 2 === 0] })
      );
      mockClient.readHoldingRegisters.mockImplementation((address: number) => 
        Promise.resolve({ data: [address] })
      );

      const startTime = Date.now();
      
      const workflow = await runCompleteWorkflow({
        startAddress: 0,
        endAddress: 1000, // Large range
        functionCodes: [1, 3],
        enableBatching: true,
        outputFile: 'large-range',
        exportFormat: 'json'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify large scan completed
      expect(workflow.results.totalRegisters).toBe(2002); // 1001 addresses × 2 function codes
      expect(workflow.results.accessibleRegisters).toBe(2002);

      // Verify reasonable performance (should complete within reasonable time)
      expect(duration).toBeLessThan(30000); // Less than 30 seconds

      // Verify export file was created and is reasonable size
      expect(workflow.exportedFiles).toHaveLength(1);
      const stats = await fs.stat(workflow.exportedFiles[0]);
      expect(stats.size).toBeGreaterThan(1000); // Should have substantial content
    });

    it('should handle memory efficiently with large result sets', async () => {
      // Mock responses for memory test
      mockClient.readCoils.mockResolvedValue({ data: [true] });
      mockClient.readHoldingRegisters.mockResolvedValue({ data: [12345] });

      const workflow = await runCompleteWorkflow({
        startAddress: 0,
        endAddress: 500,
        functionCodes: [1, 2, 3, 4],
        enableBatching: true,
        outputFile: 'memory-test',
        exportFormat: 'both'
      });

      // Mock all function codes
      mockClient.readDiscreteInputs.mockResolvedValue({ data: [false] });
      mockClient.readInputRegisters.mockResolvedValue({ data: [54321] });

      // Verify large result set was handled
      expect(workflow.results.totalRegisters).toBe(2004); // 501 addresses × 4 function codes
      expect(workflow.results.registers).toHaveLength(2004);

      // Verify both export files were created
      expect(workflow.exportedFiles).toHaveLength(2);
      
      // Verify export files contain all data
      const jsonFile = workflow.exportedFiles.find(f => f.endsWith('.json'));
      const jsonContent = await fs.readFile(jsonFile!, 'utf8');
      const jsonData = JSON.parse(jsonContent);
      expect(jsonData.registers).toHaveLength(2004);
    });
  });
});

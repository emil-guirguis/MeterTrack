import ModbusRTU from 'modbus-serial';
import { ConnectionManager } from '../connection/ConnectionManager';
import { RegisterReader } from '../reader/RegisterReader';
import { ScannerEngine } from '../scanner/ScannerEngine';
import { BatchOptimizer } from '../optimizer/BatchOptimizer';
import { ScanConfig } from '../types';

// Mock modbus-serial for testing
jest.mock('modbus-serial');

describe('Modbus Device Simulator Tests', () => {
  let mockClient: any;
  let config: ScanConfig;

  beforeEach(() => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  /**
   * Simulate different types of Modbus devices
   */
  describe('Device Type Simulations', () => {
    it('should handle PLC simulation with typical register layout', async () => {
      // Simulate a typical PLC with specific register ranges
      mockClient.readCoils.mockImplementation((address: number, count: number) => {
        // Digital outputs: addresses 0-99
        if (address >= 0 && address < 100) {
          const data = Array.from({ length: count }, (_, i) => (address + i) % 4 === 0);
          return Promise.resolve({ data });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      mockClient.readDiscreteInputs.mockImplementation((address: number, count: number) => {
        // Digital inputs: addresses 100-199
        if (address >= 100 && address < 200) {
          const data = Array.from({ length: count }, (_, i) => (address + i) % 3 === 0);
          return Promise.resolve({ data });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      mockClient.readHoldingRegisters.mockImplementation((address: number, count: number) => {
        // Configuration registers: 1000-1099, Process data: 2000-2199
        if ((address >= 1000 && address < 1100) || (address >= 2000 && address < 2200)) {
          const data = Array.from({ length: count }, (_, i) => 1000 + address + i);
          return Promise.resolve({ data });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      mockClient.readInputRegisters.mockImplementation((address: number, count: number) => {
        // Analog inputs: addresses 3000-3099
        if (address >= 3000 && address < 3100) {
          const data = Array.from({ length: count }, (_, i) => 3000 + address + i);
          return Promise.resolve({ data });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      // Create components
      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 3199,
          functionCodes: [1, 2, 3, 4],
          enableBatching: true
        }
      );

      const results = await scannerEngine.startScan();

      // Verify PLC-like results
      expect(results.totalRegisters).toBe(12800); // 3200 addresses × 4 function codes
      expect(results.accessibleRegisters).toBe(600); // Only specific ranges are accessible
      
      // Verify specific register types
      const coils = results.registers.filter(r => r.functionCode === 1 && r.accessible);
      const discreteInputs = results.registers.filter(r => r.functionCode === 2 && r.accessible);
      const holdingRegisters = results.registers.filter(r => r.functionCode === 3 && r.accessible);
      const inputRegisters = results.registers.filter(r => r.functionCode === 4 && r.accessible);

      expect(coils.length).toBe(100); // Addresses 0-99
      expect(discreteInputs.length).toBe(100); // Addresses 100-199
      expect(holdingRegisters.length).toBe(300); // Addresses 1000-1099 + 2000-2199
      expect(inputRegisters.length).toBe(100); // Addresses 3000-3099

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });

    it('should handle energy meter simulation', async () => {
      // Simulate an energy meter with specific measurement registers
      mockClient.readHoldingRegisters.mockImplementation((address: number, count: number) => {
        // Energy meter typically has measurements in specific ranges
        const meterRanges = [
          { start: 0, end: 10 },     // Basic measurements (voltage, current, power)
          { start: 100, end: 120 },  // Energy counters
          { start: 200, end: 210 },  // Power quality measurements
          { start: 1000, end: 1050 } // Configuration registers
        ];

        for (const range of meterRanges) {
          if (address >= range.start && address <= range.end) {
            const data = Array.from({ length: count }, (_, i) => {
              const addr = address + i;
              if (addr <= range.end) {
                // Simulate realistic meter values
                if (addr >= 0 && addr <= 10) return 2300 + addr * 10; // Voltage/current values
                if (addr >= 100 && addr <= 120) return addr * 1000; // Energy counters
                if (addr >= 200 && addr <= 210) return 500 + addr; // Power quality
                if (addr >= 1000 && addr <= 1050) return addr; // Config values
              }
              return 0;
            });
            return Promise.resolve({ data });
          }
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      // Energy meters typically don't use coils or discrete inputs
      mockClient.readCoils.mockRejectedValue(new Error('Function not supported'));
      mockClient.readDiscreteInputs.mockRejectedValue(new Error('Function not supported'));
      mockClient.readInputRegisters.mockRejectedValue(new Error('Function not supported'));

      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 1100,
          functionCodes: [1, 2, 3, 4],
          enableBatching: true
        }
      );

      const results = await scannerEngine.startScan();

      // Verify energy meter results
      const holdingRegisters = results.registers.filter(r => r.functionCode === 3 && r.accessible);
      expect(holdingRegisters.length).toBe(92); // Sum of all ranges: 11 + 21 + 11 + 51 = 94

      // Verify no coils or discrete inputs are accessible
      const coils = results.registers.filter(r => r.functionCode === 1 && r.accessible);
      const discreteInputs = results.registers.filter(r => r.functionCode === 2 && r.accessible);
      const inputRegisters = results.registers.filter(r => r.functionCode === 4 && r.accessible);

      expect(coils.length).toBe(0);
      expect(discreteInputs.length).toBe(0);
      expect(inputRegisters.length).toBe(0);

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });

    it('should handle I/O module simulation', async () => {
      // Simulate a digital I/O module
      mockClient.readCoils.mockImplementation((address: number, count: number) => {
        // Digital outputs: 16 channels (addresses 0-15)
        if (address >= 0 && address < 16) {
          const data = Array.from({ length: Math.min(count, 16 - address) }, (_, i) => 
            (address + i) % 2 === 0
          );
          return Promise.resolve({ data });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      mockClient.readDiscreteInputs.mockImplementation((address: number, count: number) => {
        // Digital inputs: 16 channels (addresses 0-15)
        if (address >= 0 && address < 16) {
          const data = Array.from({ length: Math.min(count, 16 - address) }, (_, i) => 
            (address + i) % 3 === 0
          );
          return Promise.resolve({ data });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      // I/O modules typically don't have analog registers
      mockClient.readHoldingRegisters.mockRejectedValue(new Error('Function not supported'));
      mockClient.readInputRegisters.mockRejectedValue(new Error('Function not supported'));

      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 50,
          functionCodes: [1, 2, 3, 4],
          enableBatching: true
        }
      );

      const results = await scannerEngine.startScan();

      // Verify I/O module results
      const coils = results.registers.filter(r => r.functionCode === 1 && r.accessible);
      const discreteInputs = results.registers.filter(r => r.functionCode === 2 && r.accessible);
      const holdingRegisters = results.registers.filter(r => r.functionCode === 3 && r.accessible);
      const inputRegisters = results.registers.filter(r => r.functionCode === 4 && r.accessible);

      expect(coils.length).toBe(16);
      expect(discreteInputs.length).toBe(16);
      expect(holdingRegisters.length).toBe(0);
      expect(inputRegisters.length).toBe(0);

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });
  });

  describe('Error Condition Simulations', () => {
    it('should handle device with partial function code support', async () => {
      // Simulate device that only supports holding registers
      mockClient.readHoldingRegisters.mockImplementation((address: number, count: number) => {
        if (address >= 0 && address < 100) {
          const data = Array.from({ length: count }, (_, i) => address + i);
          return Promise.resolve({ data });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      // Other function codes not supported
      mockClient.readCoils.mockRejectedValue(new Error('Illegal function'));
      mockClient.readDiscreteInputs.mockRejectedValue(new Error('Illegal function'));
      mockClient.readInputRegisters.mockRejectedValue(new Error('Illegal function'));

      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const errorMessages: string[] = [];
      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 150,
          functionCodes: [1, 2, 3, 4],
          enableBatching: false,
          errorCallback: (error) => errorMessages.push(error)
        }
      );

      const results = await scannerEngine.startScan();

      // Verify only holding registers are accessible
      const accessibleByFC = results.registers.reduce((acc, reg) => {
        if (reg.accessible) {
          acc[reg.functionCode] = (acc[reg.functionCode] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>);

      expect(accessibleByFC[3]).toBe(100); // Holding registers
      expect(accessibleByFC[1]).toBeUndefined(); // No coils
      expect(accessibleByFC[2]).toBeUndefined(); // No discrete inputs
      expect(accessibleByFC[4]).toBeUndefined(); // No input registers

      // Verify errors were logged for unsupported function codes
      expect(errorMessages.length).toBeGreaterThan(0);

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });

    it('should handle device with sparse register map', async () => {
      // Simulate device with registers only at specific addresses
      const validAddresses = [0, 1, 5, 10, 50, 100, 500, 1000, 2000, 5000];

      mockClient.readHoldingRegisters.mockImplementation((address: number, count: number) => {
        if (validAddresses.includes(address) && count === 1) {
          return Promise.resolve({ data: [address * 10] });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      mockClient.readCoils.mockRejectedValue(new Error('Function not supported'));
      mockClient.readDiscreteInputs.mockRejectedValue(new Error('Function not supported'));
      mockClient.readInputRegisters.mockRejectedValue(new Error('Function not supported'));

      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 5000,
          functionCodes: [3],
          enableBatching: false // Use individual reads to test sparse map
        }
      );

      const results = await scannerEngine.startScan();

      // Verify only valid addresses are accessible
      const accessibleAddresses = results.registers
        .filter(r => r.accessible)
        .map(r => r.address)
        .sort((a, b) => a - b);

      expect(accessibleAddresses).toEqual(validAddresses);
      expect(results.accessibleRegisters).toBe(validAddresses.length);

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });

    it('should handle device with timeout issues', async () => {
      let callCount = 0;

      // Simulate intermittent timeouts
      mockClient.readHoldingRegisters.mockImplementation((address: number) => {
        callCount++;
        if (callCount % 5 === 0) {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
          });
        }
        return Promise.resolve({ data: [address] });
      });

      mockClient.readCoils.mockRejectedValue(new Error('Function not supported'));
      mockClient.readDiscreteInputs.mockRejectedValue(new Error('Function not supported'));
      mockClient.readInputRegisters.mockRejectedValue(new Error('Function not supported'));

      const connectionManager = new ConnectionManager({
        ...config,
        timeout: 200 // Short timeout for testing
      });
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const errorMessages: string[] = [];
      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 20,
          functionCodes: [3],
          enableBatching: false,
          errorCallback: (error) => errorMessages.push(error)
        }
      );

      const results = await scannerEngine.startScan();

      // Verify some registers succeeded and some failed due to timeout
      expect(results.accessibleRegisters).toBeLessThan(results.totalRegisters);
      expect(results.accessibleRegisters).toBeGreaterThan(0);
      expect(errorMessages.length).toBeGreaterThan(0);

      // Verify timeout errors were logged
      const timeoutErrors = errorMessages.filter(msg => msg.toLowerCase().includes('timeout'));
      expect(timeoutErrors.length).toBeGreaterThan(0);

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });
  });

  describe('Performance Simulation Tests', () => {
    it('should handle high-performance device simulation', async () => {
      // Simulate a fast-responding device
      mockClient.readHoldingRegisters.mockImplementation((address: number, count: number) => {
        // Immediate response with batch support
        const data = Array.from({ length: count }, (_, i) => address + i);
        return Promise.resolve({ data });
      });

      mockClient.readCoils.mockImplementation((address: number, count: number) => {
        const data = Array.from({ length: count }, (_, i) => (address + i) % 2 === 0);
        return Promise.resolve({ data });
      });

      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const startTime = Date.now();
      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 1000,
          functionCodes: [1, 3],
          enableBatching: true // Should use batching for better performance
        }
      );

      const results = await scannerEngine.startScan();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify fast scan completed
      expect(results.totalRegisters).toBe(2002); // 1001 addresses × 2 function codes
      expect(results.accessibleRegisters).toBe(2002);
      expect(duration).toBeLessThan(5000); // Should complete quickly with batching

      // Verify batching was used (fewer calls than individual reads)
      const totalCalls = mockClient.readHoldingRegisters.mock.calls.length + 
                        mockClient.readCoils.mock.calls.length;
      expect(totalCalls).toBeLessThan(200); // Much fewer than 2002 individual calls

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });

    it('should handle slow device simulation', async () => {
      // Simulate a slow-responding device
      mockClient.readHoldingRegisters.mockImplementation((address: number) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: [address] });
          }, 50); // 50ms delay per read
        });
      });

      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const progressUpdates: any[] = [];
      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 20,
          functionCodes: [3],
          enableBatching: false, // Individual reads to test slow response
          progressCallback: (progress) => progressUpdates.push(progress)
        }
      );

      const startTime = Date.now();
      const results = await scannerEngine.startScan();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify slow scan completed
      expect(results.totalRegisters).toBe(21);
      expect(results.accessibleRegisters).toBe(21);
      expect(duration).toBeGreaterThan(1000); // Should take time due to delays

      // Verify progress was tracked during slow scan
      expect(progressUpdates.length).toBeGreaterThan(0);
      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.totalProgress).toBe(100);

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });
  });

  describe('Real Device Behavior Simulation', () => {
    it('should simulate Schneider Electric device behavior', async () => {
      // Simulate typical Schneider PLC register layout
      mockClient.readCoils.mockImplementation((address: number, count: number) => {
        // %M memory bits: addresses 0-9999
        if (address >= 0 && address < 10000) {
          const data = Array.from({ length: Math.min(count, 10000 - address) }, 
            (_, i) => (address + i) % 7 === 0);
          return Promise.resolve({ data });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      mockClient.readHoldingRegisters.mockImplementation((address: number, count: number) => {
        // %MW memory words: addresses 0-9999
        if (address >= 0 && address < 10000) {
          const data = Array.from({ length: Math.min(count, 10000 - address) }, 
            (_, i) => (address + i) * 10);
          return Promise.resolve({ data });
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 100,
          functionCodes: [1, 3],
          enableBatching: true
        }
      );

      const results = await scannerEngine.startScan();

      // Verify Schneider-like behavior
      expect(results.accessibleRegisters).toBe(202); // 101 addresses × 2 function codes
      
      const coils = results.registers.filter(r => r.functionCode === 1 && r.accessible);
      const holdingRegs = results.registers.filter(r => r.functionCode === 3 && r.accessible);
      
      expect(coils.length).toBe(101);
      expect(holdingRegs.length).toBe(101);

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });

    it('should simulate Siemens device behavior', async () => {
      // Simulate typical Siemens S7 register layout
      mockClient.readCoils.mockImplementation((address: number, count: number) => {
        // Merker bits: specific ranges
        const validRanges = [
          { start: 0, end: 255 },     // M0.0 - M255.7
          { start: 1000, end: 1255 }  // Extended range
        ];

        for (const range of validRanges) {
          if (address >= range.start && address <= range.end) {
            const data = Array.from({ length: Math.min(count, range.end - address + 1) }, 
              (_, i) => (address + i) % 4 === 0);
            return Promise.resolve({ data });
          }
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      mockClient.readHoldingRegisters.mockImplementation((address: number, count: number) => {
        // Data blocks: DB addresses
        const validRanges = [
          { start: 0, end: 99 },      // DB1
          { start: 1000, end: 1199 }, // DB2
          { start: 2000, end: 2099 }  // DB3
        ];

        for (const range of validRanges) {
          if (address >= range.start && address <= range.end) {
            const data = Array.from({ length: Math.min(count, range.end - address + 1) }, 
              (_, i) => 1000 + address + i);
            return Promise.resolve({ data });
          }
        }
        return Promise.reject(new Error('Illegal data address'));
      });

      const connectionManager = new ConnectionManager(config);
      const registerReader = new RegisterReader(mockClient, config.slaveId);
      const batchOptimizer = new BatchOptimizer(registerReader);

      const scannerEngine = new ScannerEngine(
        connectionManager,
        registerReader,
        batchOptimizer,
        config,
        {
          startAddress: 0,
          endAddress: 2200,
          functionCodes: [1, 3],
          enableBatching: true
        }
      );

      const results = await scannerEngine.startScan();

      // Verify Siemens-like sparse register map
      const accessibleCoils = results.registers.filter(r => r.functionCode === 1 && r.accessible);
      const accessibleHolding = results.registers.filter(r => r.functionCode === 3 && r.accessible);

      expect(accessibleCoils.length).toBe(512); // 256 + 256 from two ranges
      expect(accessibleHolding.length).toBe(500); // 100 + 200 + 100 from three ranges

      // Cleanup
      scannerEngine.cleanup();
      await connectionManager.disconnect();
    });
  });
});

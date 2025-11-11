// import { ProgressReporter, ScanProgress, ErrorInfo } from '../ProgressReporter';
// import { RegisterInfo } from '../../types';

// // Mock console methods to capture output
// const mockConsoleLog = jest.fn();
// const mockConsoleWrite = jest.fn();

// // Store original console methods
// const originalConsoleLog = console.log;
// const originalProcessStdoutWrite = process.stdout.write;

// describe('ProgressReporter', () => {
//   let progressReporter: ProgressReporter;
  
//   beforeEach(() => {
//     // Mock console methods
//     console.log = mockConsoleLog;
//     process.stdout.write = mockConsoleWrite;
    
//     // Clear mocks
//     mockConsoleLog.mockClear();
//     mockConsoleWrite.mockClear();
    
//     // Create new instance for each test
//     progressReporter = new ProgressReporter(1000); // Small total for testing
//   });

//   afterEach(() => {
//     // Restore original console methods
//     console.log = originalConsoleLog;
//     process.stdout.write = originalProcessStdoutWrite;
//   });

//   describe('Progress Calculations', () => {
//     test('should calculate correct percentage complete', () => {
//       // Simulate scanning 100 registers out of 1000
//       for (let i = 0; i < 100; i++) {
//         progressReporter.updateProgress(i, 3);
//       }
      
//       const progress = progressReporter.getProgress(99, 3);
//       expect(progress.percentComplete).toBe(10); // 100/1000 * 100
//       expect(progress.registersScanned).toBe(100);
//     });

//     test('should track current address and function code', () => {
//       progressReporter.updateProgress(42, 3);
      
//       const progress = progressReporter.getProgress(42, 3);
//       expect(progress.currentAddress).toBe(42);
//       expect(progress.currentFunctionCode).toBe(3);
//     });

//     test('should handle progress calculations with basic metrics', () => {
//       // Simulate some scanning
//       for (let i = 0; i < 50; i++) {
//         progressReporter.updateProgress(i, 3);
//       }
      
//       const progress = progressReporter.getProgress(49, 3);
//       expect(progress.registersScanned).toBe(50);
//       expect(progress.totalRegistersToScan).toBe(1000);
//       expect(progress.percentComplete).toBe(5); // 50/1000 * 100
//       expect(progress.elapsedTime).toBeGreaterThanOrEqual(0);
//     });

//     test('should handle zero scan rate gracefully', () => {
//       const progress = progressReporter.getProgress(0, 1);
//       expect(progress.estimatedTimeRemaining).toBe(0);
//       expect(progress.scanRate).toBeGreaterThanOrEqual(0);
//     });
//   });

//   describe('Register Discovery Reporting', () => {
//     test('should track discovered registers correctly', () => {
//       const register1: RegisterInfo = {
//         address: 100,
//         functionCode: 3,
//         dataType: 'holding',
//         value: 42,
//         accessible: true,
//         timestamp: new Date()
//       };
      
//       const register2: RegisterInfo = {
//         address: 200,
//         functionCode: 1,
//         dataType: 'coil',
//         value: true,
//         accessible: true,
//         timestamp: new Date()
//       };
      
//       progressReporter.reportDiscoveredRegister(register1);
//       progressReporter.reportDiscoveredRegister(register2);
      
//       const discoveredRegisters = progressReporter.getDiscoveredRegisters();
//       expect(discoveredRegisters).toHaveLength(2);
//       expect(discoveredRegisters[0]).toEqual(register1);
//       expect(discoveredRegisters[1]).toEqual(register2);
      
//       // Should display discovered registers
//       expect(mockConsoleLog).toHaveBeenCalledWith('✅ Found: Holding 100 = 42');
//       expect(mockConsoleLog).toHaveBeenCalledWith('✅ Found: Coil 200 = TRUE');
//     });

//     test('should format different value types correctly', () => {
//       const booleanRegister: RegisterInfo = {
//         address: 1,
//         functionCode: 1,
//         dataType: 'coil',
//         value: false,
//         accessible: true,
//         timestamp: new Date()
//       };
      
//       const numericRegister: RegisterInfo = {
//         address: 2,
//         functionCode: 3,
//         dataType: 'holding',
//         value: 12345,
//         accessible: true,
//         timestamp: new Date()
//       };
      
//       progressReporter.reportDiscoveredRegister(booleanRegister);
//       progressReporter.reportDiscoveredRegister(numericRegister);
      
//       expect(mockConsoleLog).toHaveBeenCalledWith('✅ Found: Coil 1 = FALSE');
//       expect(mockConsoleLog).toHaveBeenCalledWith('✅ Found: Holding 2 = 12345');
//     });
//   });

//   describe('Error Logging', () => {
//     test('should track errors correctly', () => {
//       const error1: ErrorInfo = {
//         timestamp: new Date(),
//         type: 'connection',
//         message: 'Connection failed',
//         details: { address: 100, functionCode: 3 }
//       };
      
//       const error2: ErrorInfo = {
//         timestamp: new Date(),
//         type: 'timeout',
//         message: 'Request timeout',
//         details: { address: 200, functionCode: 1 }
//       };
      
//       progressReporter.logError(error1);
//       progressReporter.logError(error2);
      
//       const errors = progressReporter.getErrors();
//       expect(errors).toHaveLength(2);
//       expect(errors[0]).toEqual(error1);
//       expect(errors[1]).toEqual(error2);
//     });

//     test('should display critical errors immediately', () => {
//       const connectionError: ErrorInfo = {
//         timestamp: new Date(),
//         type: 'connection',
//         message: 'TCP connection failed',
//         details: {}
//       };
      
//       const networkError: ErrorInfo = {
//         timestamp: new Date(),
//         type: 'network',
//         message: 'Network unreachable',
//         details: {}
//       };
      
//       progressReporter.logError(connectionError);
//       progressReporter.logError(networkError);
      
//       expect(mockConsoleLog).toHaveBeenCalledWith('❌ CONNECTION: TCP connection failed');
//       expect(mockConsoleLog).toHaveBeenCalledWith('❌ NETWORK: Network unreachable');
//     });
//   });

//   describe('Progress Display', () => {
//     test('should display scan start information', () => {
//       const config = { host: '192.168.1.100', port: 502, slaveId: 1 };
      
//       progressReporter.startScan(config);
      
//       expect(mockConsoleLog).toHaveBeenCalledWith('\n🔍 Starting Modbus Register Scan');
//       expect(mockConsoleLog).toHaveBeenCalledWith('Target: 192.168.1.100:502 (Slave ID: 1)');
//       expect(mockConsoleLog).toHaveBeenCalledWith('Total registers to scan: 1,000');
//     });

//     test('should display completion summary', () => {
//       // Add some discovered registers
//       const register: RegisterInfo = {
//         address: 100,
//         functionCode: 3,
//         dataType: 'holding',
//         value: 42,
//         accessible: true,
//         timestamp: new Date()
//       };
      
//       progressReporter.reportDiscoveredRegister(register);
      
//       // Simulate some scanning
//       for (let i = 0; i < 100; i++) {
//         progressReporter.updateProgress(i, 3);
//       }
      
//       progressReporter.completeScan();
      
//       expect(mockConsoleLog).toHaveBeenCalledWith('🎉 Scan Complete!');
//       expect(mockConsoleLog).toHaveBeenCalledWith('Registers scanned: 100');
//       expect(mockConsoleLog).toHaveBeenCalledWith('Registers found: 1');
//     });
//   });

//   describe('Data Type Display', () => {
//     test('should display correct function code names', () => {
//       const testCases = [
//         { functionCode: 1, expected: 'Coil' },
//         { functionCode: 2, expected: 'Discrete' },
//         { functionCode: 3, expected: 'Holding' },
//         { functionCode: 4, expected: 'Input' },
//         { functionCode: 99, expected: 'FC99' }
//       ];
      
//       testCases.forEach(({ functionCode, expected }) => {
//         const register: RegisterInfo = {
//           address: 1,
//           functionCode,
//           dataType: 'test',
//           value: 0,
//           accessible: true,
//           timestamp: new Date()
//         };
        
//         progressReporter.reportDiscoveredRegister(register);
//         expect(mockConsoleLog).toHaveBeenCalledWith(`✅ Found: ${expected} 1 = 0`);
//         mockConsoleLog.mockClear();
//       });
//     });
//   });

//   describe('Basic Functionality', () => {
//     test('should track discovered registers and errors separately', () => {
//       const register: RegisterInfo = {
//         address: 100,
//         functionCode: 3,
//         dataType: 'holding',
//         value: 42,
//         accessible: true,
//         timestamp: new Date()
//       };
      
//       const error: ErrorInfo = {
//         timestamp: new Date(),
//         type: 'timeout',
//         message: 'Request timeout',
//         details: {}
//       };
      
//       progressReporter.reportDiscoveredRegister(register);
//       progressReporter.logError(error);
      
//       expect(progressReporter.getDiscoveredRegisters()).toHaveLength(1);
//       expect(progressReporter.getErrors()).toHaveLength(1);
//     });
//   });
// });
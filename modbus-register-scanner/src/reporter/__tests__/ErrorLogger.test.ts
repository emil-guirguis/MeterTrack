import { ErrorLogger, DetailedErrorInfo, ErrorStatistics } from '../ErrorLogger';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('ErrorLogger', () => {
  let errorLogger: ErrorLogger;
  const testLogDir = join(process.cwd(), 'test-logs');

  beforeEach(() => {
    // Clean up any existing test logs
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
    
    errorLogger = new ErrorLogger(false); // Disable file logging for most tests
  });

  afterEach(() => {
    // Clean up test logs
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('Error Logging Methods', () => {
    test('should log connection errors correctly', () => {
      errorLogger.logConnectionError('Failed to connect', '192.168.1.100', 502, 1, 'stack trace');
      
      const errors = errorLogger.getErrors();
      expect(errors).toHaveLength(1);
      
      const error = errors[0];
      expect(error.type).toBe('connection');
      expect(error.severity).toBe('high');
      expect(error.message).toBe('Failed to connect');
      expect(error.details.host).toBe('192.168.1.100');
      expect(error.details.port).toBe(502);
      expect(error.details.retryAttempt).toBe(1);
      expect(error.details.stackTrace).toBe('stack trace');
    });

    test('should log timeout errors correctly', () => {
      errorLogger.logTimeoutError('Request timeout', 100, 3, 5000, 2);
      
      const errors = errorLogger.getErrors();
      expect(errors).toHaveLength(1);
      
      const error = errors[0];
      expect(error.type).toBe('timeout');
      expect(error.severity).toBe('medium');
      expect(error.message).toBe('Request timeout');
      expect(error.details.address).toBe(100);
      expect(error.details.functionCode).toBe(3);
      expect(error.details.retryAttempt).toBe(2);
    });

    test('should log Modbus exceptions with correct severity', () => {
      // Test different exception codes and their severities
      const testCases = [
        { code: 1, expectedSeverity: 'low' },    // Illegal Function
        { code: 2, expectedSeverity: 'low' },    // Illegal Data Address
        { code: 3, expectedSeverity: 'medium' }, // Illegal Data Value
        { code: 4, expectedSeverity: 'medium' }, // Slave Device Failure
        { code: 8, expectedSeverity: 'high' },   // Memory Parity Error
        { code: 99, expectedSeverity: 'medium' } // Unknown code
      ];
      
      testCases.forEach(({ code, expectedSeverity }, index) => {
        errorLogger.logModbusException(`Exception ${code}`, 100 + index, 3, code, 'raw data');
      });
      
      const errors = errorLogger.getErrors();
      expect(errors).toHaveLength(testCases.length);
      
      testCases.forEach(({ code, expectedSeverity }, index) => {
        const error = errors[index];
        expect(error.type).toBe('modbus_exception');
        expect(error.severity).toBe(expectedSeverity);
        expect(error.message).toBe(`Exception ${code} (Exception Code: ${code})`);
        expect(error.details.errorCode).toBe(code);
      });
    });

    test('should log network errors correctly', () => {
      errorLogger.logNetworkError('Network unreachable', '192.168.1.100', 502, 'network stack trace');
      
      const errors = errorLogger.getErrors();
      expect(errors).toHaveLength(1);
      
      const error = errors[0];
      expect(error.type).toBe('network');
      expect(error.severity).toBe('high');
      expect(error.message).toBe('Network unreachable');
      expect(error.details.host).toBe('192.168.1.100');
      expect(error.details.port).toBe(502);
      expect(error.details.stackTrace).toBe('network stack trace');
    });

    test('should log protocol errors correctly', () => {
      errorLogger.logProtocolError('Invalid response format', 200, 4, 'invalid data');
      
      const errors = errorLogger.getErrors();
      expect(errors).toHaveLength(1);
      
      const error = errors[0];
      expect(error.type).toBe('protocol');
      expect(error.severity).toBe('medium');
      expect(error.message).toBe('Invalid response format');
      expect(error.details.address).toBe(200);
      expect(error.details.functionCode).toBe(4);
      expect(error.details.rawData).toBe('invalid data');
    });

    test('should log validation errors correctly', () => {
      errorLogger.logValidationError('Invalid input parameter', { parameter: 'slaveId', value: 300 });
      
      const errors = errorLogger.getErrors();
      expect(errors).toHaveLength(1);
      
      const error = errors[0];
      expect(error.type).toBe('validation');
      expect(error.severity).toBe('low');
      expect(error.message).toBe('Invalid input parameter');
      expect(error.details.parameter).toBe('slaveId');
      expect(error.details.value).toBe(300);
    });

    test('should log generic errors correctly', () => {
      errorLogger.logGenericError('Unknown error', 'unknown', 'critical', { custom: 'data' });
      
      const errors = errorLogger.getErrors();
      expect(errors).toHaveLength(1);
      
      const error = errors[0];
      expect(error.type).toBe('unknown');
      expect(error.severity).toBe('critical');
      expect(error.message).toBe('Unknown error');
      expect(error.details.custom).toBe('data');
    });
  });

  describe('Error Statistics', () => {
    beforeEach(() => {
      // Add various errors for statistics testing
      errorLogger.logConnectionError('Connection failed', '192.168.1.100', 502);
      errorLogger.logConnectionError('Another connection failed', '192.168.1.101', 502);
      errorLogger.logTimeoutError('Timeout 1', 100, 3, 5000);
      errorLogger.logTimeoutError('Timeout 2', 200, 3, 5000);
      errorLogger.logTimeoutError('Timeout 3', 300, 4, 5000);
      errorLogger.logModbusException('Exception', 400, 1, 2);
      errorLogger.logNetworkError('Network error', '192.168.1.100', 502);
    });

    test('should calculate total errors correctly', () => {
      const stats = errorLogger.getErrorStatistics();
      expect(stats.totalErrors).toBe(7);
    });

    test('should group errors by type correctly', () => {
      const stats = errorLogger.getErrorStatistics();
      
      expect(stats.errorsByType.connection).toBe(2);
      expect(stats.errorsByType.timeout).toBe(3);
      expect(stats.errorsByType.modbus_exception).toBe(1);
      expect(stats.errorsByType.network).toBe(1);
    });

    test('should group errors by severity correctly', () => {
      const stats = errorLogger.getErrorStatistics();
      
      expect(stats.errorsBySeverity.high).toBe(3); // 2 connection + 1 network
      expect(stats.errorsBySeverity.medium).toBe(3); // 3 timeout
      expect(stats.errorsBySeverity.low).toBe(1); // 1 modbus exception (code 2)
    });

    test('should group errors by address correctly', () => {
      const stats = errorLogger.getErrorStatistics();
      
      expect(stats.errorsByAddress[100]).toBe(1);
      expect(stats.errorsByAddress[200]).toBe(1);
      expect(stats.errorsByAddress[300]).toBe(1);
      expect(stats.errorsByAddress[400]).toBe(1);
    });

    test('should group errors by function code correctly', () => {
      const stats = errorLogger.getErrorStatistics();
      
      expect(stats.errorsByFunctionCode[3]).toBe(2); // 2 timeouts with FC 3
      expect(stats.errorsByFunctionCode[4]).toBe(1); // 1 timeout with FC 4
      expect(stats.errorsByFunctionCode[1]).toBe(1); // 1 modbus exception with FC 1
    });

    test('should identify most common error correctly', () => {
      const stats = errorLogger.getErrorStatistics();
      
      expect(stats.mostCommonError.type).toBe('timeout');
      expect(stats.mostCommonError.count).toBe(3);
      expect(stats.mostCommonError.message).toBe('Timeout 1');
    });

    test('should calculate error rate correctly', () => {
      // Mock time to control elapsed time calculation
      const startTime = Date.now();
      const mockTime = startTime + 60000; // 1 minute elapsed
      
      Date.now = jest.fn(() => mockTime);
      
      const stats = errorLogger.getErrorStatistics();
      expect(stats.errorRate).toBeCloseTo(7, 0); // 7 errors per minute
      
      // Restore Date.now
      jest.restoreAllMocks();
    });

    test('should handle first and last error correctly', () => {
      const stats = errorLogger.getErrorStatistics();
      
      expect(stats.firstError?.message).toBe('Connection failed');
      expect(stats.lastError?.message).toBe('Network error');
    });
  });

  describe('Error Report Generation', () => {
    beforeEach(() => {
      // Add some test errors
      errorLogger.logConnectionError('Connection failed', '192.168.1.100', 502);
      errorLogger.logTimeoutError('Timeout', 100, 3, 5000);
      errorLogger.logModbusException('Exception', 200, 1, 2);
    });

    test('should generate comprehensive error report', () => {
      const report = errorLogger.generateErrorReport();
      
      expect(report).toContain('MODBUS SCANNER ERROR REPORT');
      expect(report).toContain('Total Errors: 3');
      expect(report).toContain('ERRORS BY TYPE:');
      expect(report).toContain('ERRORS BY SEVERITY:');
      expect(report).toContain('TOP PROBLEMATIC ADDRESSES:');
      expect(report).toContain('RECENT ERRORS');
      expect(report).toContain('CONNECTION');
      expect(report).toContain('TIMEOUT');
      expect(report).toContain('MODBUS_EXCEPTION');
    });
  });

  describe('File Logging', () => {
    test('should create log file when file logging is enabled', () => {
      const fileLogger = new ErrorLogger(true, testLogDir);
      fileLogger.logConnectionError('Test error', '192.168.1.100', 502);
      
      // Check if log directory and file were created
      expect(existsSync(testLogDir)).toBe(true);
      
      // Find the log file (it has a timestamp in the name)
      const fs = require('fs');
      const logFiles = fs.readdirSync(testLogDir).filter((file: string) => file.startsWith('modbus-scanner-'));
      expect(logFiles.length).toBe(1);
      
      // Check log file content
      const logContent = readFileSync(join(testLogDir, logFiles[0]), 'utf-8');
      expect(logContent).toContain('Modbus Scanner Error Log');
      expect(logContent).toContain('HIGH CONNECTION');
      expect(logContent).toContain('Test error');
    });

    test('should export errors to JSON correctly', () => {
      errorLogger.logConnectionError('Test error', '192.168.1.100', 502);
      errorLogger.logTimeoutError('Test timeout', 100, 3, 5000);
      
      // Ensure test directory exists
      const fs = require('fs');
      if (!existsSync(testLogDir)) {
        fs.mkdirSync(testLogDir, { recursive: true });
      }
      
      const exportPath = join(testLogDir, 'errors.json');
      errorLogger.exportErrorsToJson(exportPath);
      
      expect(existsSync(exportPath)).toBe(true);
      
      const exportedData = JSON.parse(readFileSync(exportPath, 'utf-8'));
      expect(exportedData.errors).toHaveLength(2);
      expect(exportedData.statistics.totalErrors).toBe(2);
      expect(exportedData.exportTime).toBeDefined();
    });
  });

  describe('Error Management', () => {
    test('should clear errors correctly', () => {
      errorLogger.logConnectionError('Test error', '192.168.1.100', 502);
      expect(errorLogger.getErrors()).toHaveLength(1);
      
      errorLogger.clearErrors();
      expect(errorLogger.getErrors()).toHaveLength(0);
    });

    test('should return copy of errors array', () => {
      errorLogger.logConnectionError('Test error', '192.168.1.100', 502);
      
      const errors1 = errorLogger.getErrors();
      const errors2 = errorLogger.getErrors();
      
      expect(errors1).not.toBe(errors2); // Different array instances
      expect(errors1).toEqual(errors2); // Same content
    });
  });
});
import { RegisterFormatter } from '../RegisterFormatter';
import { RegisterInfo } from '../../types';

describe('RegisterFormatter', () => {
  let mockRegister: RegisterInfo;
  let mockRegisterWithError: RegisterInfo;

  beforeEach(() => {
    mockRegister = {
      address: 100,
      functionCode: 3,
      dataType: 'holding',
      value: 1234,
      accessible: true,
      timestamp: new Date('2023-01-01T10:00:00Z')
    };

    mockRegisterWithError = {
      address: 200,
      functionCode: 1,
      dataType: 'coil',
      value: false,
      accessible: false,
      timestamp: new Date('2023-01-01T10:00:01Z'),
      error: {
        code: 2,
        message: 'Illegal data address',
        description: 'Register not available on device'
      }
    };
  });

  describe('formatForCsv', () => {
    it('should format register data for CSV export', () => {
      const formatted = RegisterFormatter.formatForCsv(mockRegister);

      expect(formatted).toEqual({
        address: 100,
        functionCode: 3,
        functionCodeName: 'Read Holding Registers',
        dataType: 'holding',
        value: '1234 (0x04D2)',
        accessible: true,
        accessibilityStatus: 'Accessible',
        timestamp: '2023-01-01T10:00:00.000Z',
        error: '',
        errorCode: undefined,
        description: 'Analog Output/Configuration (Read/Write)'
      });
    });

    it('should format register with error for CSV export', () => {
      const formatted = RegisterFormatter.formatForCsv(mockRegisterWithError);

      expect(formatted).toEqual({
        address: 200,
        functionCode: 1,
        functionCodeName: 'Read Coils',
        dataType: 'coil',
        value: 'OFF (0)',
        accessible: false,
        accessibilityStatus: 'Not Accessible',
        timestamp: '2023-01-01T10:00:01.000Z',
        error: 'Illegal data address',
        errorCode: 2,
        description: 'Register not available on device'
      });
    });

    it('should format boolean values correctly', () => {
      const coilRegister: RegisterInfo = {
        address: 0,
        functionCode: 1,
        dataType: 'coil',
        value: true,
        accessible: true,
        timestamp: new Date('2023-01-01T10:00:00Z')
      };

      const formatted = RegisterFormatter.formatForCsv(coilRegister);
      expect(formatted.value).toBe('ON (1)');
    });

    it('should format discrete input values correctly', () => {
      const discreteRegister: RegisterInfo = {
        address: 0,
        functionCode: 2,
        dataType: 'discrete',
        value: false,
        accessible: true,
        timestamp: new Date('2023-01-01T10:00:00Z')
      };

      const formatted = RegisterFormatter.formatForCsv(discreteRegister);
      expect(formatted.value).toBe('OFF (0)');
    });
  });

  describe('formatForJson', () => {
    it('should format register data for JSON export with enhanced metadata', () => {
      const formatted = RegisterFormatter.formatForJson(mockRegister);

      expect(formatted).toEqual({
        address: 100,
        functionCode: {
          code: 3,
          name: 'Read Holding Registers'
        },
        dataType: {
          type: 'holding',
          description: 'Analog Output/Configuration (Read/Write)'
        },
        value: {
          raw: 1234,
          formatted: '1234 (0x04D2)',
          dataType: 'number'
        },
        accessibility: {
          accessible: true,
          status: 'accessible'
        },
        timestamp: '2023-01-01T10:00:00.000Z',
        metadata: {
          readOnly: false,
          bitSize: 16,
          category: 'analog'
        }
      });
    });

    it('should include error information in JSON format', () => {
      const formatted = RegisterFormatter.formatForJson(mockRegisterWithError);

      expect(formatted.error).toEqual({
        code: 2,
        message: 'Illegal data address',
        description: 'Register not available on device',
        type: 'illegal_data_address'
      });
    });

    it('should format coil register metadata correctly', () => {
      const coilRegister: RegisterInfo = {
        address: 0,
        functionCode: 1,
        dataType: 'coil',
        value: true,
        accessible: true,
        timestamp: new Date('2023-01-01T10:00:00Z')
      };

      const formatted = RegisterFormatter.formatForJson(coilRegister);

      expect(formatted.metadata).toEqual({
        readOnly: false,
        bitSize: 1,
        category: 'digital'
      });
    });

    it('should format discrete input register metadata correctly', () => {
      const discreteRegister: RegisterInfo = {
        address: 0,
        functionCode: 2,
        dataType: 'discrete',
        value: false,
        accessible: true,
        timestamp: new Date('2023-01-01T10:00:00Z')
      };

      const formatted = RegisterFormatter.formatForJson(discreteRegister);

      expect(formatted.metadata).toEqual({
        readOnly: true,
        bitSize: 1,
        category: 'digital'
      });
    });

    it('should format input register metadata correctly', () => {
      const inputRegister: RegisterInfo = {
        address: 0,
        functionCode: 4,
        dataType: 'input',
        value: 5678,
        accessible: true,
        timestamp: new Date('2023-01-01T10:00:00Z')
      };

      const formatted = RegisterFormatter.formatForJson(inputRegister);

      expect(formatted.metadata).toEqual({
        readOnly: true,
        bitSize: 16,
        category: 'analog'
      });
    });
  });

  describe('createSummary', () => {
    it('should create summary statistics for register collection', () => {
      const registers: RegisterInfo[] = [
        mockRegister,
        mockRegisterWithError,
        {
          address: 300,
          functionCode: 4,
          dataType: 'input',
          value: 9999,
          accessible: true,
          timestamp: new Date('2023-01-01T10:00:02Z')
        }
      ];

      const summary = RegisterFormatter.createSummary(registers);

      expect(summary).toEqual({
        total: 3,
        accessible: 2,
        byFunctionCode: {
          1: 1,
          3: 1,
          4: 1
        },
        byDataType: {
          holding: 1,
          coil: 1,
          input: 1
        },
        errors: {
          'Illegal data address': 1
        }
      });
    });

    it('should handle empty register collection', () => {
      const summary = RegisterFormatter.createSummary([]);

      expect(summary).toEqual({
        total: 0,
        accessible: 0,
        byFunctionCode: {},
        byDataType: {},
        errors: {}
      });
    });

    it('should count multiple errors correctly', () => {
      const registers: RegisterInfo[] = [
        {
          ...mockRegisterWithError,
          address: 100
        },
        {
          ...mockRegisterWithError,
          address: 101
        },
        {
          ...mockRegisterWithError,
          address: 102,
          error: {
            code: 4,
            message: 'Slave device failure',
            description: 'Device not responding'
          }
        }
      ];

      const summary = RegisterFormatter.createSummary(registers);

      expect(summary.errors).toEqual({
        'Illegal data address': 2,
        'Slave device failure': 1
      });
    });
  });

  describe('error type mapping', () => {
    it('should map known Modbus exception codes correctly', () => {
      const testCases = [
        { code: 1, expected: 'illegal_function' },
        { code: 2, expected: 'illegal_data_address' },
        { code: 3, expected: 'illegal_data_value' },
        { code: 4, expected: 'slave_device_failure' },
        { code: 5, expected: 'acknowledge' },
        { code: 6, expected: 'slave_device_busy' },
        { code: 8, expected: 'memory_parity_error' },
        { code: 10, expected: 'gateway_path_unavailable' },
        { code: 11, expected: 'gateway_target_device_failed' }
      ];

      testCases.forEach(({ code, expected }) => {
        const register: RegisterInfo = {
          address: 0,
          functionCode: 1,
          dataType: 'coil',
          value: false,
          accessible: false,
          timestamp: new Date(),
          error: { code, message: 'Test error' }
        };

        const formatted = RegisterFormatter.formatForJson(register);
        expect(formatted.error.type).toBe(expected);
      });
    });

    it('should handle unknown error codes', () => {
      const register: RegisterInfo = {
        address: 0,
        functionCode: 1,
        dataType: 'coil',
        value: false,
        accessible: false,
        timestamp: new Date(),
        error: { code: 99, message: 'Unknown error' }
      };

      const formatted = RegisterFormatter.formatForJson(register);
      expect(formatted.error.type).toBe('unknown_exception');
    });
  });
});
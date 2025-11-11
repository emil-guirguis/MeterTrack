import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { RegisterReader, ModbusError, ModbusExceptionCode } from '../RegisterReader';
import ModbusRTU from 'modbus-serial';

// Mock the modbus-serial library
jest.mock('modbus-serial');

describe('RegisterReader Response Parsing and Validation', () => {
  let registerReader: RegisterReader;
  let mockClient: jest.Mocked<ModbusRTU>;

  beforeEach(() => {
    mockClient = new ModbusRTU() as jest.Mocked<ModbusRTU>;
    mockClient.setID = jest.fn();
    mockClient.readCoils = jest.fn();
    mockClient.readDiscreteInputs = jest.fn();
    mockClient.readHoldingRegisters = jest.fn();
    mockClient.readInputRegisters = jest.fn();
    
    registerReader = new RegisterReader(mockClient, 1);
  });

  describe('Response Parsing', () => {
    it('should parse valid coil responses correctly', async () => {
      const mockResponse = { 
        data: [true, false, true],
        buffer: Buffer.from([0x01, 0x03, 0x05])
      };
      mockClient.readCoils.mockResolvedValue(mockResponse);

      const result = await registerReader.readCoils(100, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        address: 100,
        functionCode: 1,
        dataType: 'coil',
        value: true,
        accessible: true
      });
      expect(result[1]).toMatchObject({
        address: 101,
        functionCode: 1,
        dataType: 'coil',
        value: false,
        accessible: true
      });
      expect(result[2]).toMatchObject({
        address: 102,
        functionCode: 1,
        dataType: 'coil',
        value: true,
        accessible: true
      });
    });

    it('should parse valid holding register responses correctly', async () => {
      const mockResponse = { 
        data: [1234, 5678, 9999],
        buffer: Buffer.from([0x04, 0xD2, 0x16, 0x2E, 0x27, 0x0F])
      };
      mockClient.readHoldingRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readHoldingRegisters(200, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        address: 200,
        functionCode: 3,
        dataType: 'holding',
        value: 1234,
        accessible: true
      });
      expect(result[1]).toMatchObject({
        address: 201,
        functionCode: 3,
        dataType: 'holding',
        value: 5678,
        accessible: true
      });
      expect(result[2]).toMatchObject({
        address: 202,
        functionCode: 3,
        dataType: 'holding',
        value: 9999,
        accessible: true
      });
    });
  });

  describe('Response Validation', () => {
    it('should handle invalid response format', async () => {
      mockClient.readCoils.mockResolvedValue(null as any);

      const result = await registerReader.readCoils(100, 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        address: 100,
        functionCode: 1,
        dataType: 'coil',
        value: false,
        accessible: false
      });
      expect(result[0].error).toBeDefined();
      expect(result[0].error?.message).toContain('Invalid response');
    });

    it('should handle data length mismatch', async () => {
      const mockResponse = { 
        data: [true], // Expected 3, got 1
        buffer: Buffer.from([0x01])
      };
      mockClient.readCoils.mockResolvedValue(mockResponse);

      const result = await registerReader.readCoils(100, 3);

      expect(result).toHaveLength(3);
      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Data length mismatch');
    });

    it('should validate data types for coils', async () => {
      const mockResponse = { 
        data: [123, 456] as any, // Numbers instead of booleans
        buffer: Buffer.from([0x7B, 0x01, 0xC8])
      };
      mockClient.readCoils.mockResolvedValue(mockResponse);

      const result = await registerReader.readCoils(100, 2);

      expect(result).toHaveLength(2);
      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Invalid data types');
    });

    it('should validate data types for holding registers', async () => {
      const mockResponse = { 
        data: [true, false] as any, // Booleans instead of numbers
        buffer: Buffer.from([0x01, 0x00])
      };
      mockClient.readHoldingRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readHoldingRegisters(200, 2);

      expect(result).toHaveLength(2);
      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Invalid data types');
    });

    it('should validate register value ranges', async () => {
      const mockResponse = { 
        data: [65536, -1], // Out of valid 16-bit range
        buffer: Buffer.from([0xFF, 0xFF, 0xFF, 0xFF])
      };
      mockClient.readHoldingRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readHoldingRegisters(200, 2);

      expect(result).toHaveLength(2);
      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Invalid data types');
    });
  });

  describe('Modbus Exception Handling', () => {
    it('should handle Modbus exception with code', async () => {
      const modbusException = new Error('Modbus exception');
      (modbusException as any).modbusCode = ModbusExceptionCode.ILLEGAL_DATA_ADDRESS;
      mockClient.readHoldingRegisters.mockRejectedValue(modbusException);

      const result = await registerReader.readHoldingRegisters(300, 1);

      expect(result).toHaveLength(1);
      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.code).toBe(ModbusExceptionCode.ILLEGAL_DATA_ADDRESS);
      expect(result[0].error?.message).toContain('Illegal Data Address');
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Network timeout');
      mockClient.readCoils.mockRejectedValue(genericError);

      const result = await registerReader.readCoils(400, 1);

      expect(result).toHaveLength(1);
      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Network timeout');
    });

    it('should extract exception code from error message', async () => {
      const errorWithCode = new Error('Modbus exception code: 0x02');
      mockClient.readInputRegisters.mockRejectedValue(errorWithCode);

      const result = await registerReader.readInputRegisters(500, 1);

      expect(result).toHaveLength(1);
      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.code).toBe(2);
    });
  });

  describe('ModbusError Class', () => {
    it('should provide human-readable exception descriptions', () => {
      const error = new ModbusError(
        'Test error',
        ModbusExceptionCode.SLAVE_DEVICE_BUSY,
        3,
        100
      );

      expect(error.getExceptionDescription()).toContain('Slave Device Busy');
      expect(error.exceptionCode).toBe(ModbusExceptionCode.SLAVE_DEVICE_BUSY);
      expect(error.functionCode).toBe(3);
      expect(error.address).toBe(100);
    });

    it('should handle unknown exception codes', () => {
      const error = new ModbusError('Test error', 0xFF, 1, 200);
      
      expect(error.getExceptionDescription()).toContain('Unknown Exception Code: 0xFF');
    });
  });
});
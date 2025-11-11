import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
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
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { RegisterReader, ModbusError, ModbusExceptionCode } from '../RegisterReader';
import ModbusRTU from 'modbus-serial';

// Mock the modbus-serial library
jest.mock('modbus-serial');

describe('RegisterReader', () => {
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

  describe('Function Code 1 - Read Coils', () => {
    it('should read single coil successfully', async () => {
      const mockResponse = { data: [true], buffer: Buffer.from([0x01]) };
      mockClient.readCoils.mockResolvedValue(mockResponse);

      const result = await registerReader.readCoils(100, 1);

      expect(mockClient.setID).toHaveBeenCalledWith(1);
      expect(mockClient.readCoils).toHaveBeenCalledWith(100, 1);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        address: 100,
        functionCode: 1,
        dataType: 'coil',
        value: true,
        accessible: true
      });
      expect(result[0].timestamp).toBeInstanceOf(Date);
    });

    it('should read multiple coils successfully', async () => {
      const mockResponse = { data: [true, false, true, false], buffer: Buffer.from([0x09]) };
      mockClient.readCoils.mockResolvedValue(mockResponse);

      const result = await registerReader.readCoils(200, 4);

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        address: 200,
        functionCode: 1,
        dataType: 'coil',
        value: true,
        accessible: true
      });
      expect(result[1]).toMatchObject({
        address: 201,
        functionCode: 1,
        dataType: 'coil',
        value: false,
        accessible: true
      });
      expect(result[2]).toMatchObject({
        address: 202,
        functionCode: 1,
        dataType: 'coil',
        value: true,
        accessible: true
      });
      expect(result[3]).toMatchObject({
        address: 203,
        functionCode: 1,
        dataType: 'coil',
        value: false,
        accessible: true
      });
    });

    it('should handle invalid data types for coils', async () => {
      const mockResponse = { data: [123, 456] as any, buffer: Buffer.from([0x7B, 0x01, 0xC8]) };
      mockClient.readCoils.mockResolvedValue(mockResponse);

      const result = await registerReader.readCoils(100, 2);

      expect(result).toHaveLength(2);
      expect(result[0].accessible).toBe(false);
      expect(result[0].value).toBe(false);
      expect(result[0].error?.message).toContain('Invalid data types');
    });
  });

  describe('Function Code 2 - Read Discrete Inputs', () => {
    it('should read single discrete input successfully', async () => {
      const mockResponse = { data: [false], buffer: Buffer.from([0x00]) };
      mockClient.readDiscreteInputs.mockResolvedValue(mockResponse);

      const result = await registerReader.readDiscreteInputs(300, 1);

      expect(mockClient.setID).toHaveBeenCalledWith(1);
      expect(mockClient.readDiscreteInputs).toHaveBeenCalledWith(300, 1);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        address: 300,
        functionCode: 2,
        dataType: 'discrete',
        value: false,
        accessible: true
      });
    });

    it('should read multiple discrete inputs successfully', async () => {
      const mockResponse = { data: [false, true, false], buffer: Buffer.from([0x02]) };
      mockClient.readDiscreteInputs.mockResolvedValue(mockResponse);

      const result = await registerReader.readDiscreteInputs(400, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        address: 400,
        functionCode: 2,
        dataType: 'discrete',
        value: false,
        accessible: true
      });
      expect(result[1]).toMatchObject({
        address: 401,
        functionCode: 2,
        dataType: 'discrete',
        value: true,
        accessible: true
      });
      expect(result[2]).toMatchObject({
        address: 402,
        functionCode: 2,
        dataType: 'discrete',
        value: false,
        accessible: true
      });
    });

    it('should handle invalid data types for discrete inputs', async () => {
      const mockResponse = { data: [789] as any, buffer: Buffer.from([0x15, 0x03]) };
      mockClient.readDiscreteInputs.mockResolvedValue(mockResponse);

      const result = await registerReader.readDiscreteInputs(300, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].value).toBe(false);
      expect(result[0].error?.message).toContain('Invalid data types');
    });
  });

  describe('Function Code 3 - Read Holding Registers', () => {
    it('should read single holding register successfully', async () => {
      const mockResponse = { data: [1234], buffer: Buffer.from([0x04, 0xD2]) };
      mockClient.readHoldingRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readHoldingRegisters(500, 1);

      expect(mockClient.setID).toHaveBeenCalledWith(1);
      expect(mockClient.readHoldingRegisters).toHaveBeenCalledWith(500, 1);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        address: 500,
        functionCode: 3,
        dataType: 'holding',
        value: 1234,
        accessible: true
      });
    });

    it('should read multiple holding registers successfully', async () => {
      const mockResponse = { data: [1000, 2000, 3000, 65535], buffer: Buffer.from([0x03, 0xE8, 0x07, 0xD0, 0x0B, 0xB8, 0xFF, 0xFF]) };
      mockClient.readHoldingRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readHoldingRegisters(600, 4);

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        address: 600,
        functionCode: 3,
        dataType: 'holding',
        value: 1000,
        accessible: true
      });
      expect(result[1]).toMatchObject({
        address: 601,
        functionCode: 3,
        dataType: 'holding',
        value: 2000,
        accessible: true
      });
      expect(result[2]).toMatchObject({
        address: 602,
        functionCode: 3,
        dataType: 'holding',
        value: 3000,
        accessible: true
      });
      expect(result[3]).toMatchObject({
        address: 603,
        functionCode: 3,
        dataType: 'holding',
        value: 65535,
        accessible: true
      });
    });

    it('should handle invalid data types for holding registers', async () => {
      const mockResponse = { data: [true, false] as any, buffer: Buffer.from([0x01, 0x00]) };
      mockClient.readHoldingRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readHoldingRegisters(500, 2);

      expect(result).toHaveLength(2);
      expect(result[0].accessible).toBe(false);
      expect(result[0].value).toBe(0);
      expect(result[0].error?.message).toContain('Invalid data types');
    });

    it('should handle out-of-range values for holding registers', async () => {
      const mockResponse = { data: [65536, -1] as any, buffer: Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]) };
      mockClient.readHoldingRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readHoldingRegisters(500, 2);

      expect(result).toHaveLength(2);
      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Invalid data types');
    });
  });

  describe('Function Code 4 - Read Input Registers', () => {
    it('should read single input register successfully', async () => {
      const mockResponse = { data: [5678], buffer: Buffer.from([0x16, 0x2E]) };
      mockClient.readInputRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readInputRegisters(700, 1);

      expect(mockClient.setID).toHaveBeenCalledWith(1);
      expect(mockClient.readInputRegisters).toHaveBeenCalledWith(700, 1);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        address: 700,
        functionCode: 4,
        dataType: 'input',
        value: 5678,
        accessible: true
      });
    });

    it('should read multiple input registers successfully', async () => {
      const mockResponse = { data: [0, 32767, 65535], buffer: Buffer.from([0x00, 0x00, 0x7F, 0xFF, 0xFF, 0xFF]) };
      mockClient.readInputRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readInputRegisters(800, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        address: 800,
        functionCode: 4,
        dataType: 'input',
        value: 0,
        accessible: true
      });
      expect(result[1]).toMatchObject({
        address: 801,
        functionCode: 4,
        dataType: 'input',
        value: 32767,
        accessible: true
      });
      expect(result[2]).toMatchObject({
        address: 802,
        functionCode: 4,
        dataType: 'input',
        value: 65535,
        accessible: true
      });
    });

    it('should handle invalid data types for input registers', async () => {
      const mockResponse = { data: ['string', null] as any, buffer: Buffer.from([0x00, 0x00]) };
      mockClient.readInputRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readInputRegisters(700, 2);

      expect(result).toHaveLength(2);
      expect(result[0].accessible).toBe(false);
      expect(result[0].value).toBe(0);
      expect(result[0].error?.message).toContain('Invalid data types');
    });
  });

  describe('Error Handling for Invalid Responses', () => {
    it('should handle null response', async () => {
      mockClient.readCoils.mockResolvedValue(null as any);

      const result = await registerReader.readCoils(100, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Invalid response format');
    });

    it('should handle response without data property', async () => {
      mockClient.readHoldingRegisters.mockResolvedValue({} as any);

      const result = await registerReader.readHoldingRegisters(200, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('data is not an array');
    });

    it('should handle data length mismatch', async () => {
      const mockResponse = { data: [true], buffer: Buffer.from([0x01]) }; // Expected 3, got 1
      mockClient.readCoils.mockResolvedValue(mockResponse);

      const result = await registerReader.readCoils(100, 3);

      expect(result).toHaveLength(3);
      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Data length mismatch');
    });

    it('should handle response parsing errors', async () => {
      const mockResponse = { data: [true], buffer: Buffer.from([0x01]) };
      // Simulate parsing error by making data access throw
      Object.defineProperty(mockResponse, 'data', {
        get: () => { throw new Error('Parsing error'); }
      });
      mockClient.readCoils.mockResolvedValue(mockResponse);

      const result = await registerReader.readCoils(100, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Response parsing error');
    });
  });

  describe('Modbus Exception Handling', () => {
    it('should handle Modbus exception with modbusCode', async () => {
      const modbusException = new Error('Modbus exception');
      (modbusException as any).modbusCode = ModbusExceptionCode.ILLEGAL_DATA_ADDRESS;
      mockClient.readHoldingRegisters.mockRejectedValue(modbusException);

      const result = await registerReader.readHoldingRegisters(300, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.code).toBe(ModbusExceptionCode.ILLEGAL_DATA_ADDRESS);
      expect(result[0].error?.message).toContain('Illegal Data Address');
    });

    it('should handle Modbus exception with errno', async () => {
      const modbusException = new Error('Device busy');
      (modbusException as any).errno = ModbusExceptionCode.SLAVE_DEVICE_BUSY;
      mockClient.readCoils.mockRejectedValue(modbusException);

      const result = await registerReader.readCoils(400, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.code).toBe(ModbusExceptionCode.SLAVE_DEVICE_BUSY);
      expect(result[0].error?.message).toContain('Slave Device Busy');
    });

    it('should handle Modbus exception with code property', async () => {
      const modbusException = new Error('Function not supported');
      (modbusException as any).code = ModbusExceptionCode.ILLEGAL_FUNCTION;
      mockClient.readDiscreteInputs.mockRejectedValue(modbusException);

      const result = await registerReader.readDiscreteInputs(500, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.code).toBe(ModbusExceptionCode.ILLEGAL_FUNCTION);
      expect(result[0].error?.message).toContain('Illegal Function');
    });

    it('should extract exception code from error message', async () => {
      const errorWithCode = new Error('Modbus exception code: 0x04');
      mockClient.readInputRegisters.mockRejectedValue(errorWithCode);

      const result = await registerReader.readInputRegisters(600, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.code).toBe(4);
      expect(result[0].error?.message).toContain('Slave Device Failure');
    });

    it('should extract exception code from error message with different format', async () => {
      const errorWithCode = new Error('Exception: 0x06');
      mockClient.readHoldingRegisters.mockRejectedValue(errorWithCode);

      const result = await registerReader.readHoldingRegisters(700, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.code).toBe(6);
    });

    it('should handle generic network errors', async () => {
      const networkError = new Error('Connection timeout');
      mockClient.readCoils.mockRejectedValue(networkError);

      const result = await registerReader.readCoils(800, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Connection timeout');
      expect(result[0].error?.code).toBeUndefined();
    });

    it('should handle non-Error exceptions', async () => {
      mockClient.readHoldingRegisters.mockRejectedValue('String error');

      const result = await registerReader.readHoldingRegisters(900, 1);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Unknown Modbus error');
    });
  });

  describe('Data Parsing Accuracy', () => {
    it('should correctly parse boolean values for coils', async () => {
      const mockResponse = { data: [true, false, true, false, true], buffer: Buffer.from([0x15]) };
      mockClient.readCoils.mockResolvedValue(mockResponse);

      const result = await registerReader.readCoils(1000, 5);

      expect(result[0].value).toBe(true);
      expect(result[1].value).toBe(false);
      expect(result[2].value).toBe(true);
      expect(result[3].value).toBe(false);
      expect(result[4].value).toBe(true);
      expect(result.every(r => r.accessible)).toBe(true);
    });

    it('should correctly parse numeric values for registers', async () => {
      const mockResponse = { data: [0, 1, 32767, 65535, 12345], buffer: Buffer.from([0x00, 0x00, 0x00, 0x01, 0x7F, 0xFF, 0xFF, 0xFF, 0x30, 0x39]) };
      mockClient.readHoldingRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readHoldingRegisters(2000, 5);

      expect(result[0].value).toBe(0);
      expect(result[1].value).toBe(1);
      expect(result[2].value).toBe(32767);
      expect(result[3].value).toBe(65535);
      expect(result[4].value).toBe(12345);
      expect(result.every(r => r.accessible)).toBe(true);
    });

    it('should validate register value boundaries', async () => {
      const validResponse = { data: [0, 65535], buffer: Buffer.from([0x00, 0x00, 0xFF, 0xFF]) };
      mockClient.readInputRegisters.mockResolvedValue(validResponse);

      const result = await registerReader.readInputRegisters(3000, 2);

      expect(result[0].accessible).toBe(true);
      expect(result[0].value).toBe(0);
      expect(result[1].accessible).toBe(true);
      expect(result[1].value).toBe(65535);
    });

    it('should reject non-integer values for registers', async () => {
      const invalidResponse = { data: [3.14, 2.71] as any, buffer: Buffer.from([0x00, 0x03, 0x00, 0x02]) };
      mockClient.readHoldingRegisters.mockResolvedValue(invalidResponse);

      const result = await registerReader.readHoldingRegisters(4000, 2);

      expect(result[0].accessible).toBe(false);
      expect(result[0].error?.message).toContain('Invalid data types');
    });
  });

  describe('Single Register Methods', () => {
    it('should read single register using readSingleRegister method', async () => {
      const mockResponse = { data: [42], buffer: Buffer.from([0x00, 0x2A]) };
      mockClient.readHoldingRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readSingleRegister(5000, 3);

      expect(result).toMatchObject({
        address: 5000,
        functionCode: 3,
        dataType: 'holding',
        value: 42,
        accessible: true
      });
    });

    it('should throw error for invalid function code in readSingleRegister', async () => {
      await expect(registerReader.readSingleRegister(100, 5))
        .rejects.toThrow('Invalid function code: 5');
    });
  });

  describe('Multiple Register Methods', () => {
    it('should read multiple registers using readMultipleRegisters method', async () => {
      const mockResponse = { data: [100, 200, 300], buffer: Buffer.from([0x00, 0x64, 0x00, 0xC8, 0x01, 0x2C]) };
      mockClient.readInputRegisters.mockResolvedValue(mockResponse);

      const result = await registerReader.readMultipleRegisters(6000, 3, 4);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        address: 6000,
        functionCode: 4,
        dataType: 'input',
        value: 100,
        accessible: true
      });
      expect(result[2]).toMatchObject({
        address: 6002,
        functionCode: 4,
        dataType: 'input',
        value: 300,
        accessible: true
      });
    });

    it('should throw error for invalid function code in readMultipleRegisters', async () => {
      await expect(registerReader.readMultipleRegisters(100, 2, 0))
        .rejects.toThrow('Invalid function code: 0');
    });
  });
});
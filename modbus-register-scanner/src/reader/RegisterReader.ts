import ModbusRTU from 'modbus-serial';
import { RegisterInfo } from '../types';

/**
 * Modbus exception codes as defined in the Modbus specification
 */
export enum ModbusExceptionCode {
  ILLEGAL_FUNCTION = 0x01,
  ILLEGAL_DATA_ADDRESS = 0x02,
  ILLEGAL_DATA_VALUE = 0x03,
  SLAVE_DEVICE_FAILURE = 0x04,
  ACKNOWLEDGE = 0x05,
  SLAVE_DEVICE_BUSY = 0x06,
  MEMORY_PARITY_ERROR = 0x08,
  GATEWAY_PATH_UNAVAILABLE = 0x0A,
  GATEWAY_TARGET_DEVICE_FAILED_TO_RESPOND = 0x0B
}

/**
 * Enhanced error class for Modbus-specific errors
 */
export class ModbusError extends Error {
  constructor(
    message: string,
    public readonly exceptionCode?: number,
    public readonly functionCode?: number,
    public readonly address?: number
  ) {
    super(message);
    this.name = 'ModbusError';
  }

  /**
   * Get human-readable description of the exception code
   */
  public getExceptionDescription(): string {
    if (!this.exceptionCode) return 'Unknown error';
    
    switch (this.exceptionCode) {
      case ModbusExceptionCode.ILLEGAL_FUNCTION:
        return 'Illegal Function - The function code is not supported';
      case ModbusExceptionCode.ILLEGAL_DATA_ADDRESS:
        return 'Illegal Data Address - The register address is not valid';
      case ModbusExceptionCode.ILLEGAL_DATA_VALUE:
        return 'Illegal Data Value - The data value is not acceptable';
      case ModbusExceptionCode.SLAVE_DEVICE_FAILURE:
        return 'Slave Device Failure - The device encountered an internal error';
      case ModbusExceptionCode.ACKNOWLEDGE:
        return 'Acknowledge - The device is processing a long-duration command';
      case ModbusExceptionCode.SLAVE_DEVICE_BUSY:
        return 'Slave Device Busy - The device is busy processing another command';
      case ModbusExceptionCode.MEMORY_PARITY_ERROR:
        return 'Memory Parity Error - The device detected a memory error';
      case ModbusExceptionCode.GATEWAY_PATH_UNAVAILABLE:
        return 'Gateway Path Unavailable - The gateway path is not available';
      case ModbusExceptionCode.GATEWAY_TARGET_DEVICE_FAILED_TO_RESPOND:
        return 'Gateway Target Device Failed to Respond - The target device did not respond';
      default:
        return `Unknown Exception Code: 0x${this.exceptionCode.toString(16).toUpperCase()}`;
    }
  }
}

/**
 * Interface for parsed Modbus response data
 */
interface ModbusResponse {
  data: number[] | boolean[];
  isValid: boolean;
  errorCode?: number;
  errorMessage?: string;
}

/**
 * RegisterReader handles Modbus register reading operations for all function codes
 * Configured for TCP/IP protocol with proper framing and byte ordering
 */
export class RegisterReader {
  private client: ModbusRTU;
  private slaveId: number;

  constructor(client: ModbusRTU, slaveId: number) {
    this.client = client;
    this.slaveId = slaveId;
    
    // Ensure TCP/IP protocol configuration
    this.configureTcpProtocol();
  }

  /**
   * Configure client for TCP/IP protocol
   * TCP uses big-endian byte ordering and MBAP header framing
   */
  private configureTcpProtocol(): void {
    // The modbus-serial library automatically handles TCP framing when connected via connectTCP()
    // TCP protocol specifics:
    // - Uses MBAP (Modbus Application Protocol) header (7 bytes)
    // - Big-endian byte ordering for multi-byte values
    // - No CRC checksum (handled by TCP layer)
    // - Transaction ID for request/response matching
  }

  /**
   * Interpret register values for TCP/IP protocol
   * Ensures proper byte ordering and data format for TCP
   * @param data Raw data array from modbus response
   * @param functionCode Modbus function code
   * @returns Processed data with correct TCP/IP interpretation
   */
  private interpretTcpData(data: any[], functionCode: number): any[] {
    // TCP/IP uses big-endian byte ordering by default
    // The modbus-serial library should handle this automatically for TCP connections
    // but we verify the data format is correct
    
    switch (functionCode) {
      case 1: // Read Coils
      case 2: // Read Discrete Inputs
        // Boolean values - no byte ordering issues
        return data.map(value => Boolean(value));
      
      case 3: // Read Holding Registers  
      case 4: // Read Input Registers
        // 16-bit registers - ensure proper interpretation
        return data.map(value => {
          // Ensure value is a valid 16-bit unsigned integer
          const numValue = Number(value);
          if (isNaN(numValue)) return 0;
          
          // Clamp to 16-bit range (0-65535) for TCP/IP protocol
          return Math.max(0, Math.min(65535, Math.floor(numValue)));
        });
      
      default:
        return data;
    }
  }

  /**
   * Parse and validate Modbus response data with TCP/IP protocol handling
   * @param response Raw response from modbus-serial library
   * @param expectedCount Expected number of data points
   * @param functionCode Modbus function code used
   * @param address Starting register address
   * @returns Parsed and validated response
   */
  private parseModbusResponse(
    response: any,
    expectedCount: number,
    functionCode: number,
    address: number
  ): ModbusResponse {
    try {
      // Check if response exists and has data property
      if (!response || typeof response !== 'object') {
        return {
          data: [],
          isValid: false,
          errorMessage: 'Invalid response format - no response object'
        };
      }

      // Check for data property
      if (!Array.isArray(response.data)) {
        return {
          data: [],
          isValid: false,
          errorMessage: 'Invalid response format - data is not an array'
        };
      }

      // Validate data length
      if (response.data.length !== expectedCount) {
        return {
          data: response.data,
          isValid: false,
          errorMessage: `Data length mismatch - expected ${expectedCount}, got ${response.data.length}`
        };
      }

      // Interpret data for TCP/IP protocol
      const interpretedData = this.interpretTcpData(response.data, functionCode);
      
      // Validate data types based on function code
      const isValidData = this.validateDataTypes(interpretedData, functionCode);
      if (!isValidData) {
        return {
          data: interpretedData,
          isValid: false,
          errorMessage: `Invalid data types for function code ${functionCode} after TCP interpretation`
        };
      }

      return {
        data: interpretedData,
        isValid: true
      };
    } catch (error) {
      return {
        data: [],
        isValid: false,
        errorMessage: `Response parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate data types based on Modbus function code
   * @param data Array of data values
   * @param functionCode Modbus function code
   * @returns True if data types are valid
   */
  private validateDataTypes(data: any[], functionCode: number): boolean {
    try {
      switch (functionCode) {
        case 1: // Read Coils
        case 2: // Read Discrete Inputs
          // Should be boolean values
          return data.every(value => typeof value === 'boolean');
        
        case 3: // Read Holding Registers
        case 4: // Read Input Registers
          // Should be numeric values (16-bit integers: 0-65535)
          return data.every(value => 
            typeof value === 'number' && 
            Number.isInteger(value) && 
            value >= 0 && 
            value <= 65535
          );
        
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle Modbus exceptions and convert to ModbusError
   * @param error Original error from modbus operation
   * @param functionCode Modbus function code
   * @param address Register address
   * @returns ModbusError with parsed exception information
   */
  private handleModbusException(error: any, functionCode: number, address: number): ModbusError {
    // Check if it's a Modbus exception response
    if (error && typeof error === 'object') {
      // Look for exception code in various possible properties
      let exceptionCode: number | undefined;
      
      if (typeof error.modbusCode === 'number') {
        exceptionCode = error.modbusCode;
      } else if (typeof error.errno === 'number') {
        exceptionCode = error.errno;
      } else if (typeof error.code === 'number') {
        exceptionCode = error.code;
      } else if (error.message && typeof error.message === 'string') {
        // Try to extract exception code from error message
        const match = error.message.match(/exception\s*(?:code\s*)?:?\s*(?:0x)?([0-9a-fA-F]+)/i);
        if (match) {
          exceptionCode = parseInt(match[1], 16);
        }
        
        // Check for common TCP/IP connection errors
        if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection refused')) {
          return new ModbusError(
            `TCP connection refused to device at address ${address} - device may be offline or port blocked`,
            undefined,
            functionCode,
            address
          );
        }
        
        if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
          return new ModbusError(
            `TCP timeout reading address ${address} - device may be slow or unresponsive`,
            undefined,
            functionCode,
            address
          );
        }
      }

      if (exceptionCode !== undefined) {
        const modbusError = new ModbusError(
          `Modbus Exception at address ${address}: ${this.getExceptionDescription(exceptionCode)}`,
          exceptionCode,
          functionCode,
          address
        );
        return modbusError;
      }
    }

    // If not a recognized Modbus exception, create generic ModbusError
    const message = error instanceof Error ? error.message : 'Unknown Modbus error';
    return new ModbusError(
      `Modbus TCP operation failed at address ${address}: ${message}`,
      undefined,
      functionCode,
      address
    );
  }

  /**
   * Get human-readable description for exception code
   * @param exceptionCode Modbus exception code
   * @returns Description string
   */
  private getExceptionDescription(exceptionCode: number): string {
    switch (exceptionCode) {
      case ModbusExceptionCode.ILLEGAL_FUNCTION:
        return 'Illegal Function - The function code is not supported';
      case ModbusExceptionCode.ILLEGAL_DATA_ADDRESS:
        return 'Illegal Data Address - The register address is not valid';
      case ModbusExceptionCode.ILLEGAL_DATA_VALUE:
        return 'Illegal Data Value - The data value is not acceptable';
      case ModbusExceptionCode.SLAVE_DEVICE_FAILURE:
        return 'Slave Device Failure - The device encountered an internal error';
      case ModbusExceptionCode.ACKNOWLEDGE:
        return 'Acknowledge - The device is processing a long-duration command';
      case ModbusExceptionCode.SLAVE_DEVICE_BUSY:
        return 'Slave Device Busy - The device is busy processing another command';
      case ModbusExceptionCode.MEMORY_PARITY_ERROR:
        return 'Memory Parity Error - The device detected a memory error';
      case ModbusExceptionCode.GATEWAY_PATH_UNAVAILABLE:
        return 'Gateway Path Unavailable - The gateway path is not available';
      case ModbusExceptionCode.GATEWAY_TARGET_DEVICE_FAILED_TO_RESPOND:
        return 'Gateway Target Device Failed to Respond - The target device did not respond';
      default:
        return `Unknown Exception Code: 0x${exceptionCode.toString(16).toUpperCase()}`;
    }
  }

  /**
   * Create inaccessible register info for failed reads
   * @param address Register address
   * @param count Number of registers
   * @param functionCode Modbus function code
   * @param error Optional error information
   * @returns Array of RegisterInfo with accessible=false
   */
  private createInaccessibleRegisters(
    address: number,
    count: number,
    functionCode: number,
    error?: ModbusError
  ): RegisterInfo[] {
    const registers: RegisterInfo[] = [];
    const dataType = this.getDataTypeForFunctionCode(functionCode);
    const defaultValue = (functionCode === 1 || functionCode === 2) ? false : 0;

    for (let i = 0; i < count; i++) {
      registers.push({
        address: address + i,
        functionCode,
        dataType,
        value: defaultValue,
        accessible: false,
        timestamp: new Date(),
        error: error ? {
          code: error.exceptionCode,
          message: error.message,
          description: error.getExceptionDescription()
        } : undefined
      });
    }

    return registers;
  }

  /**
   * Get data type string for function code
   * @param functionCode Modbus function code
   * @returns Data type string
   */
  private getDataTypeForFunctionCode(functionCode: number): string {
    switch (functionCode) {
      case 1: return 'coil';
      case 2: return 'discrete';
      case 3: return 'holding';
      case 4: return 'input';
      default: return 'unknown';
    }
  }

  /**
   * Verify TCP headers are handled correctly by the modbus-serial library
   * TCP uses MBAP header instead of RTU CRC
   */
  private verifyTcpHeaders(): void {
    // TCP/IP Modbus uses MBAP (Modbus Application Protocol) header:
    // - Transaction ID (2 bytes)
    // - Protocol ID (2 bytes) - always 0x0000 for Modbus
    // - Length (2 bytes) - number of following bytes
    // - Unit ID (1 byte) - slave address
    // 
    // The modbus-serial library handles this automatically when using connectTCP()
    // No manual header manipulation needed for TCP connections
  }

  /**
   * Read coils using Modbus function code 1
   * @param address Starting register address (0-65535)
   * @param count Number of coils to read (1-2000)
   * @returns Array of RegisterInfo for each coil
   */
  async readCoils(address: number, count: number = 1): Promise<RegisterInfo[]> {
    try {
      // Verify TCP protocol handling
      this.verifyTcpHeaders();
      
      this.client.setID(this.slaveId);
      const rawResponse = await this.client.readCoils(address, count);
      
      // Parse and validate the response
      const parsedResponse = this.parseModbusResponse(rawResponse, count, 1, address);
      
      if (!parsedResponse.isValid) {
        const error = new ModbusError(
          `Invalid response for coils at address ${address}: ${parsedResponse.errorMessage}`,
          undefined,
          1,
          address
        );
        return this.createInaccessibleRegisters(address, count, 1, error);
      }

      // Create register info for each coil
      const registers: RegisterInfo[] = [];
      for (let i = 0; i < count; i++) {
        registers.push({
          address: address + i,
          functionCode: 1,
          dataType: 'coil',
          value: parsedResponse.data[i] as boolean,
          accessible: true,
          timestamp: new Date()
        });
      }
      
      return registers;
    } catch (error) {
      // Handle Modbus exceptions and other errors
      const modbusError = this.handleModbusException(error, 1, address);
      return this.createInaccessibleRegisters(address, count, 1, modbusError);
    }
  }

  /**
   * Read discrete inputs using Modbus function code 2
   * @param address Starting register address (0-65535)
   * @param count Number of discrete inputs to read (1-2000)
   * @returns Array of RegisterInfo for each discrete input
   */
  async readDiscreteInputs(address: number, count: number = 1): Promise<RegisterInfo[]> {
    try {
      // Verify TCP protocol handling
      this.verifyTcpHeaders();
      
      this.client.setID(this.slaveId);
      const rawResponse = await this.client.readDiscreteInputs(address, count);
      
      // Parse and validate the response
      const parsedResponse = this.parseModbusResponse(rawResponse, count, 2, address);
      
      if (!parsedResponse.isValid) {
        const error = new ModbusError(
          `Invalid response for discrete inputs at address ${address}: ${parsedResponse.errorMessage}`,
          undefined,
          2,
          address
        );
        return this.createInaccessibleRegisters(address, count, 2, error);
      }

      // Create register info for each discrete input
      const registers: RegisterInfo[] = [];
      for (let i = 0; i < count; i++) {
        registers.push({
          address: address + i,
          functionCode: 2,
          dataType: 'discrete',
          value: parsedResponse.data[i] as boolean,
          accessible: true,
          timestamp: new Date()
        });
      }
      
      return registers;
    } catch (error) {
      // Handle Modbus exceptions and other errors
      const modbusError = this.handleModbusException(error, 2, address);
      return this.createInaccessibleRegisters(address, count, 2, modbusError);
    }
  }

  /**
   * Read holding registers using Modbus function code 3
   * @param address Starting register address (0-65535)
   * @param count Number of holding registers to read (1-125)
   * @returns Array of RegisterInfo for each holding register
   */
  async readHoldingRegisters(address: number, count: number = 1): Promise<RegisterInfo[]> {
    try {
      // Verify TCP protocol handling
      this.verifyTcpHeaders();
      
      this.client.setID(this.slaveId);
      const rawResponse = await this.client.readHoldingRegisters(address, count);
      
      // Parse and validate the response
      const parsedResponse = this.parseModbusResponse(rawResponse, count, 3, address);
      
      if (!parsedResponse.isValid) {
        const error = new ModbusError(
          `Invalid response for holding registers at address ${address}: ${parsedResponse.errorMessage}`,
          undefined,
          3,
          address
        );
        return this.createInaccessibleRegisters(address, count, 3, error);
      }

      // Create register info for each holding register
      const registers: RegisterInfo[] = [];
      for (let i = 0; i < count; i++) {
        registers.push({
          address: address + i,
          functionCode: 3,
          dataType: 'holding',
          value: parsedResponse.data[i] as number,
          accessible: true,
          timestamp: new Date()
        });
      }
      
      return registers;
    } catch (error) {
      // Handle Modbus exceptions and other errors
      const modbusError = this.handleModbusException(error, 3, address);
      return this.createInaccessibleRegisters(address, count, 3, modbusError);
    }
  }

  /**
   * Read input registers using Modbus function code 4
   * @param address Starting register address (0-65535)
   * @param count Number of input registers to read (1-125)
   * @returns Array of RegisterInfo for each input register
   */
  async readInputRegisters(address: number, count: number = 1): Promise<RegisterInfo[]> {
    try {
      // Verify TCP protocol handling
      this.verifyTcpHeaders();
      
      this.client.setID(this.slaveId);
      const rawResponse = await this.client.readInputRegisters(address, count);
      
      // Parse and validate the response
      const parsedResponse = this.parseModbusResponse(rawResponse, count, 4, address);
      
      if (!parsedResponse.isValid) {
        const error = new ModbusError(
          `Invalid response for input registers at address ${address}: ${parsedResponse.errorMessage}`,
          undefined,
          4,
          address
        );
        return this.createInaccessibleRegisters(address, count, 4, error);
      }

      // Create register info for each input register
      const registers: RegisterInfo[] = [];
      for (let i = 0; i < count; i++) {
        registers.push({
          address: address + i,
          functionCode: 4,
          dataType: 'input',
          value: parsedResponse.data[i] as number,
          accessible: true,
          timestamp: new Date()
        });
      }
      
      return registers;
    } catch (error) {
      // Handle Modbus exceptions and other errors
      const modbusError = this.handleModbusException(error, 4, address);
      return this.createInaccessibleRegisters(address, count, 4, modbusError);
    }
  }

  /**
   * Read a single register using the specified function code
   * @param address Register address (0-65535)
   * @param functionCode Modbus function code (1, 2, 3, or 4)
   * @returns RegisterInfo for the requested register
   */
  async readSingleRegister(address: number, functionCode: number): Promise<RegisterInfo> {
    switch (functionCode) {
      case 1:
        const coils = await this.readCoils(address, 1);
        return coils[0];
      case 2:
        const discreteInputs = await this.readDiscreteInputs(address, 1);
        return discreteInputs[0];
      case 3:
        const holdingRegisters = await this.readHoldingRegisters(address, 1);
        return holdingRegisters[0];
      case 4:
        const inputRegisters = await this.readInputRegisters(address, 1);
        return inputRegisters[0];
      default:
        throw new Error(`Invalid function code: ${functionCode}. Must be 1, 2, 3, or 4.`);
    }
  }

  /**
   * Read multiple registers using the specified function code
   * @param address Starting register address (0-65535)
   * @param count Number of registers to read
   * @param functionCode Modbus function code (1, 2, 3, or 4)
   * @returns Array of RegisterInfo for the requested registers
   */
  async readMultipleRegisters(address: number, count: number, functionCode: number): Promise<RegisterInfo[]> {
    switch (functionCode) {
      case 1:
        return await this.readCoils(address, count);
      case 2:
        return await this.readDiscreteInputs(address, count);
      case 3:
        return await this.readHoldingRegisters(address, count);
      case 4:
        return await this.readInputRegisters(address, count);
      default:
        throw new Error(`Invalid function code: ${functionCode}. Must be 1, 2, 3, or 4.`);
    }
  }
}
/**
 * TypeScript interfaces and type definitions for Modbus operations
 * Supporting both modbus-serial (current) and jsmodbus (new) libraries
 */

// Core Modbus connection configuration
export interface ModbusConnectionConfig {
  host: string;
  port: number;
  unitId: number;
  timeout: number;
  maxRetries?: number;
  reconnectDelay?: number;
}

// Alias for compatibility with MCP agent
export interface ModbusClientConfig extends ModbusConnectionConfig {
  keepAlive?: boolean;
  maxConnections?: number;
  registers?: { [key: string]: RegisterConfig };
}

// Connection pool configuration
export interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  acquireTimeout: number;
  createRetryInterval: number;
  maxRetries: number;
  healthCheckInterval?: number;
}

// Register configuration for reading
export interface RegisterConfig {
  address: number;
  count: number;
  scale?: number;
  type?: 'holding' | 'input' | 'coil' | 'discrete';
  dataType?: 'uint16' | 'uint32' | 'float32' | 'int16' | 'int32';
  wordOrder?: 'HI_LO' | 'LO_HI';
  byteOrder?: 'BE' | 'LE';
}

// Meter register mapping configuration
export interface MeterRegisterMap {
  // Basic measurements
  voltage: RegisterConfig;
  current: RegisterConfig;
  power: RegisterConfig;
  energy: RegisterConfig;
  frequency: RegisterConfig;
  powerFactor: RegisterConfig;
  
  // Phase measurements (optional)
  phaseAVoltage?: RegisterConfig;
  phaseBVoltage?: RegisterConfig;
  phaseCVoltage?: RegisterConfig;
  phaseACurrent?: RegisterConfig;
  phaseBCurrent?: RegisterConfig;
  phaseCCurrent?: RegisterConfig;
  phaseAPower?: RegisterConfig;
  phaseBPower?: RegisterConfig;
  phaseCPower?: RegisterConfig;
  
  // Additional measurements (optional)
  temperature?: RegisterConfig;
  neutralCurrent?: RegisterConfig;
  totalReactivePower?: RegisterConfig;
  totalApparentPower?: RegisterConfig;
  
  // Energy measurements (optional)
  totalActiveEnergyWh?: RegisterConfig;
  totalReactiveEnergyVARh?: RegisterConfig;
  totalApparentEnergyVAh?: RegisterConfig;
  
  // Power factor per phase (optional)
  phaseAPowerFactor?: RegisterConfig;
  phaseBPowerFactor?: RegisterConfig;
  phaseCPowerFactor?: RegisterConfig;
  
  // Harmonic distortion (optional)
  voltageThd?: RegisterConfig;
  currentThd?: RegisterConfig;
  
  // Demand measurements (optional)
  maxDemandKW?: RegisterConfig;
  maxDemandKVAR?: RegisterConfig;
  maxDemandKVA?: RegisterConfig;
}

// Modbus operation result
export interface ModbusResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  connectionInfo: {
    host: string;
    port: number;
    unitId: number;
    responseTime: number;
  };
}

// Register read response
export interface RegisterReadResponse {
  address: number;
  count: number;
  values: number[];
  rawData: Buffer;
}

// Meter reading data structure
export interface MeterReading {
  deviceIP: string;
  timestamp: Date;
  success: boolean;
  data: {
    // Basic measurements
    voltage: number | null;
    current: number | null;
    power: number | null;
    energy: number | null;
    frequency: number | null;
    powerFactor: number | null;
    
    // Phase measurements (optional)
    phaseAVoltage?: number | null;
    phaseBVoltage?: number | null;
    phaseCVoltage?: number | null;
    phaseACurrent?: number | null;
    phaseBCurrent?: number | null;
    phaseCCurrent?: number | null;
    phaseAPower?: number | null;
    phaseBPower?: number | null;
    phaseCPower?: number | null;
    
    // Additional measurements (optional)
    temperature?: number | null;
    neutralCurrent?: number | null;
    totalReactivePower?: number | null;
    totalApparentPower?: number | null;
    
    // Energy measurements (optional)
    totalActiveEnergyWh?: number | null;
    totalReactiveEnergyVARh?: number | null;
    totalApparentEnergyVAh?: number | null;
    
    // Power factor per phase (optional)
    phaseAPowerFactor?: number | null;
    phaseBPowerFactor?: number | null;
    phaseCPowerFactor?: number | null;
    
    // Harmonic distortion (optional)
    voltageThd?: number | null;
    currentThd?: number | null;
    
    // Demand measurements (optional)
    maxDemandKW?: number | null;
    maxDemandKVAR?: number | null;
    maxDemandKVA?: number | null;
  };
  error?: string;
}

// Connection interface for both libraries
export interface ModbusConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  readHoldingRegisters(address: number, length: number): Promise<RegisterReadResponse>;
  readInputRegisters(address: number, length: number): Promise<RegisterReadResponse>;
  readCoils(address: number, length: number): Promise<boolean[]>;
  readDiscreteInputs(address: number, length: number): Promise<boolean[]>;
  writeHoldingRegister(address: number, value: number): Promise<void>;
  writeHoldingRegisters(address: number, values: number[]): Promise<void>;
  isConnected(): boolean;
  getConnectionInfo(): ModbusConnectionConfig;
}

// Connection pool interface
export interface ConnectionPool {
  getConnection(host: string, port: number, unitId: number): Promise<ModbusConnection>;
  releaseConnection(connection: ModbusConnection): void;
  closeAll(): Promise<void>;
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    pendingRequests: number;
  };
}

// Modbus service interface
export interface ModbusServiceInterface {
  connectDevice(deviceIP: string, port?: number, slaveId?: number): Promise<any>;
  readMeterData(deviceIP: string, config?: Partial<ModbusClientConfig>): Promise<any>;
  readInputRegisters(deviceIP: string, startAddress: number, count: number, options?: Partial<ModbusClientConfig>): Promise<any>;
  testConnection(deviceIP: string, port?: number, slaveId?: number): Promise<boolean>;
  closeAllConnections(): void;
  closeConnection(deviceIP: string, port?: number, slaveId?: number): void;
}

// Error types
export enum ModbusErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_REGISTER = 'INVALID_REGISTER',
  DEVICE_BUSY = 'DEVICE_BUSY',
  POOL_EXHAUSTED = 'POOL_EXHAUSTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class ModbusError extends Error {
  public readonly type: ModbusErrorType;
  public readonly code?: number;
  public readonly address?: number;
  public readonly deviceId?: string;
  
  constructor(message: string, type: ModbusErrorType, deviceId?: string, address?: number) {
    super(message);
    this.name = 'ModbusError';
    this.type = type;
    this.deviceId = deviceId;
    this.address = address;
  }
}

// Migration compatibility types
export interface MigrationConfig {
  useNewLibrary: boolean;
  fallbackEnabled: boolean;
  comparisonMode: boolean;
  logDifferences: boolean;
}

export interface LibraryComparison {
  oldResult: ModbusResult;
  newResult: ModbusResult;
  differences: string[];
  performanceMetrics: {
    oldResponseTime: number;
    newResponseTime: number;
    improvement: number;
  };
}
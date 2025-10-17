/**
 * TypeScript interfaces and type definitions for MCP Modbus Agent
 * Supporting both modbus-serial (current) and jsmodbus (new) libraries
 */

// Core Modbus client configuration
export interface ModbusClientConfig {
  host: string;
  port: number;
  unitId: number;
  timeout: number;
  maxConnections?: number;
  reconnectDelay?: number;
  maxRetries?: number;
  keepAlive?: boolean;
}

// Connection pool configuration for MCP agent
export interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  acquireTimeout: number;
  createRetryInterval: number;
  maxRetries: number;
  healthCheckInterval: number;
}

// Field mapping configuration for dynamic register reading
export interface FieldMapping {
  name: string;
  source: 'holding' | 'input' | 'coil' | 'discrete';
  type: 'u16' | 'u32' | 'float32' | 'i16' | 'i32';
  address: number;
  scale?: number;
  wordOrder?: 'HI_LO' | 'LO_HI';
  floatEndian?: 'BE' | 'LE';
  description?: string;
}

// Modbus map configuration file structure
export interface ModbusMapConfig {
  version: string;
  deviceType: string;
  description?: string;
  fields: FieldMapping[];
  defaultConfig?: {
    timeout: number;
    retries: number;
    unitId: number;
  };
}

// Enhanced meter reading for MCP agent
export interface MeterReading {
  timestamp: Date;
  deviceIP: string;
  meterId: string;
  slaveId: number;
  quality: 'good' | 'estimated' | 'questionable' | 'bad';
  source: string;
  
  // Core measurements
  voltage: number;
  current: number;
  power: number;
  energy: number;
  frequency: number;
  powerFactor: number;
  temperature?: number;
  
  // Legacy/calculated fields for backward compatibility
  kWh?: number;
  kW?: number;
  V?: number;
  A?: number;
  dPF?: number;
  dPFchannel?: number;
  kWpeak?: number;
  kVARh?: number;
  kVAh?: number;
  
  // Per-phase measurements
  phaseAVoltage?: number;
  phaseBVoltage?: number;
  phaseCVoltage?: number;
  phaseACurrent?: number;
  phaseBCurrent?: number;
  phaseCCurrent?: number;
  phaseAPower?: number;
  phaseBPower?: number;
  phaseCPower?: number;
  
  // Additional measurements from field mapping
  [key: string]: any;
}

// Connection interface for MCP agent
export interface ModbusConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  readHoldingRegisters(address: number, length: number): Promise<{ data: number[] }>;
  readInputRegisters(address: number, length: number): Promise<{ data: number[] }>;
  readCoils(address: number, length: number): Promise<{ data: boolean[] }>;
  readDiscreteInputs(address: number, length: number): Promise<{ data: boolean[] }>;
  isConnected(): boolean;
  setUnitId(unitId: number): void;
  setTimeout(timeout: number): void;
  close(): void;
}

// Enhanced Modbus client interface for MCP agent
export interface ModbusClientInterface {
  connect(): Promise<boolean>;
  disconnect(): void;
  readMeterData(): Promise<MeterReading | null>;
  testConnection(): Promise<boolean>;
  getConnectionStatus(): boolean;
  getConfig(): ModbusClientConfig;
  
  // Event emitter methods
  on(event: 'connected', listener: () => void): this;
  on(event: 'disconnected', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'data', listener: (reading: MeterReading) => void): this;
  emit(event: string, ...args: any[]): boolean;
}

// Connection pool interface for MCP agent
export interface ConnectionPool {
  getConnection(config: ModbusClientConfig): Promise<any>;
  releaseConnection(connection: any): void;
  closeAll(): Promise<void>;
  healthCheck(): Promise<void>;
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    failedConnections: number;
    pendingRequests: number;
  };
}

// Data collection configuration
export interface CollectionConfig {
  interval: number; // milliseconds
  batchSize: number;
  maxRetries: number;
  errorThreshold: number;
  devices: DeviceConfig[];
}

// Device configuration for data collection
export interface DeviceConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  unitId: number;
  timeout: number;
  enabled: boolean;
  fieldMap?: string; // path to field mapping file
  customFields?: FieldMapping[];
}

// Collection result
export interface CollectionResult {
  deviceId: string;
  success: boolean;
  reading?: MeterReading;
  error?: string;
  timestamp: Date;
  responseTime: number;
}

// Batch collection result
export interface BatchCollectionResult {
  timestamp: Date;
  totalDevices: number;
  successfulReads: number;
  failedReads: number;
  results: CollectionResult[];
  duration: number;
}

// Error handling
export enum ModbusErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  INVALID_REGISTER = 'INVALID_REGISTER',
  DEVICE_BUSY = 'DEVICE_BUSY',
  POOL_EXHAUSTED = 'POOL_EXHAUSTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class ModbusError extends Error {
  public readonly type: ModbusErrorType;
  public readonly deviceId?: string;
  public readonly address?: number;
  public readonly code?: number;
  
  constructor(message: string, type: ModbusErrorType, deviceId?: string, address?: number, code?: number) {
    super(message);
    this.name = 'ModbusError';
    this.type = type;
    this.deviceId = deviceId;
    this.address = address;
    this.code = code;
  }
}

// Performance monitoring
export interface PerformanceMetrics {
  connectionTime: number;
  readTime: number;
  totalTime: number;
  retryCount: number;
  errorCount: number;
  successRate: number;
}

// Migration and comparison types
export interface MigrationWrapper {
  useNewLibrary: boolean;
  fallbackToOld: boolean;
  compareResults: boolean;
  logDifferences: boolean;
}

export interface LibraryComparison {
  oldResult: MeterReading | null;
  newResult: MeterReading | null;
  differences: string[];
  performanceComparison: {
    oldMetrics: PerformanceMetrics;
    newMetrics: PerformanceMetrics;
    improvement: number;
  };
}

// Health monitoring
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  connections: {
    total: number;
    active: number;
    failed: number;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  errors: string[];
}

// Configuration validation
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
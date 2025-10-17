/**
 * TypeScript interfaces and type definitions for MCP Modbus Agent
 * Supporting both modbus-serial (current) and jsmodbus (new) libraries
 */
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
export interface ConnectionPoolConfig {
    maxConnections: number;
    idleTimeout: number;
    acquireTimeout: number;
    createRetryInterval: number;
    maxRetries: number;
    healthCheckInterval: number;
}
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
export interface MeterReading {
    timestamp: Date;
    deviceIP: string;
    meterId: string;
    slaveId: number;
    quality: 'good' | 'estimated' | 'questionable' | 'bad';
    source: string;
    voltage: number;
    current: number;
    power: number;
    energy: number;
    frequency: number;
    powerFactor: number;
    temperature?: number;
    kWh?: number;
    kW?: number;
    V?: number;
    A?: number;
    dPF?: number;
    dPFchannel?: number;
    kWpeak?: number;
    kVARh?: number;
    kVAh?: number;
    phaseAVoltage?: number;
    phaseBVoltage?: number;
    phaseCVoltage?: number;
    phaseACurrent?: number;
    phaseBCurrent?: number;
    phaseCCurrent?: number;
    phaseAPower?: number;
    phaseBPower?: number;
    phaseCPower?: number;
    [key: string]: any;
}
export interface ModbusConnection {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    readHoldingRegisters(address: number, length: number): Promise<{
        data: number[];
    }>;
    readInputRegisters(address: number, length: number): Promise<{
        data: number[];
    }>;
    readCoils(address: number, length: number): Promise<{
        data: boolean[];
    }>;
    readDiscreteInputs(address: number, length: number): Promise<{
        data: boolean[];
    }>;
    isConnected(): boolean;
    setUnitId(unitId: number): void;
    setTimeout(timeout: number): void;
    close(): void;
}
export interface ModbusClientInterface {
    connect(): Promise<boolean>;
    disconnect(): void;
    readMeterData(): Promise<MeterReading | null>;
    testConnection(): Promise<boolean>;
    getConnectionStatus(): boolean;
    getConfig(): ModbusClientConfig;
    on(event: 'connected', listener: () => void): this;
    on(event: 'disconnected', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'data', listener: (reading: MeterReading) => void): this;
    emit(event: string, ...args: any[]): boolean;
}
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
export interface CollectionConfig {
    interval: number;
    batchSize: number;
    maxRetries: number;
    errorThreshold: number;
    devices: DeviceConfig[];
}
export interface DeviceConfig {
    id: string;
    name: string;
    host: string;
    port: number;
    unitId: number;
    timeout: number;
    enabled: boolean;
    fieldMap?: string;
    customFields?: FieldMapping[];
}
export interface CollectionResult {
    deviceId: string;
    success: boolean;
    reading?: MeterReading;
    error?: string;
    timestamp: Date;
    responseTime: number;
}
export interface BatchCollectionResult {
    timestamp: Date;
    totalDevices: number;
    successfulReads: number;
    failedReads: number;
    results: CollectionResult[];
    duration: number;
}
export declare enum ModbusErrorType {
    CONNECTION_FAILED = "CONNECTION_FAILED",
    TIMEOUT = "TIMEOUT",
    PROTOCOL_ERROR = "PROTOCOL_ERROR",
    INVALID_REGISTER = "INVALID_REGISTER",
    DEVICE_BUSY = "DEVICE_BUSY",
    POOL_EXHAUSTED = "POOL_EXHAUSTED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare class ModbusError extends Error {
    readonly type: ModbusErrorType;
    readonly deviceId?: string;
    readonly address?: number;
    readonly code?: number;
    constructor(message: string, type: ModbusErrorType, deviceId?: string, address?: number, code?: number);
}
export interface PerformanceMetrics {
    connectionTime: number;
    readTime: number;
    totalTime: number;
    retryCount: number;
    errorCount: number;
    successRate: number;
}
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
export interface ConfigValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

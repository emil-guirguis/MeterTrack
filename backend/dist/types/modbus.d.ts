/**
 * TypeScript interfaces and type definitions for Modbus operations
 * Supporting both modbus-serial (current) and jsmodbus (new) libraries
 */
export interface ModbusConnectionConfig {
    host: string;
    port: number;
    unitId: number;
    timeout: number;
    maxRetries?: number;
    reconnectDelay?: number;
}
export interface ModbusClientConfig extends ModbusConnectionConfig {
    keepAlive?: boolean;
    maxConnections?: number;
    registers?: {
        [key: string]: RegisterConfig;
    };
}
export interface ConnectionPoolConfig {
    maxConnections: number;
    idleTimeout: number;
    acquireTimeout: number;
    createRetryInterval: number;
    maxRetries: number;
    healthCheckInterval?: number;
}
export interface RegisterConfig {
    address: number;
    count: number;
    scale?: number;
    type?: 'holding' | 'input' | 'coil' | 'discrete';
    dataType?: 'uint16' | 'uint32' | 'float32' | 'int16' | 'int32';
    wordOrder?: 'HI_LO' | 'LO_HI';
    byteOrder?: 'BE' | 'LE';
}
export interface MeterRegisterMap {
    voltage: RegisterConfig;
    current: RegisterConfig;
    power: RegisterConfig;
    energy: RegisterConfig;
    frequency: RegisterConfig;
    powerFactor: RegisterConfig;
    phaseAVoltage?: RegisterConfig;
    phaseBVoltage?: RegisterConfig;
    phaseCVoltage?: RegisterConfig;
    phaseACurrent?: RegisterConfig;
    phaseBCurrent?: RegisterConfig;
    phaseCCurrent?: RegisterConfig;
    phaseAPower?: RegisterConfig;
    phaseBPower?: RegisterConfig;
    phaseCPower?: RegisterConfig;
    temperature?: RegisterConfig;
    neutralCurrent?: RegisterConfig;
    totalReactivePower?: RegisterConfig;
    totalApparentPower?: RegisterConfig;
    totalActiveEnergyWh?: RegisterConfig;
    totalReactiveEnergyVARh?: RegisterConfig;
    totalApparentEnergyVAh?: RegisterConfig;
    phaseAPowerFactor?: RegisterConfig;
    phaseBPowerFactor?: RegisterConfig;
    phaseCPowerFactor?: RegisterConfig;
    voltageThd?: RegisterConfig;
    currentThd?: RegisterConfig;
    maxDemandKW?: RegisterConfig;
    maxDemandKVAR?: RegisterConfig;
    maxDemandKVA?: RegisterConfig;
}
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
export interface RegisterReadResponse {
    address: number;
    count: number;
    values: number[];
    rawData: Buffer;
}
export interface MeterReading {
    deviceIP: string;
    timestamp: Date;
    success: boolean;
    data: {
        voltage: number | null;
        current: number | null;
        power: number | null;
        energy: number | null;
        frequency: number | null;
        powerFactor: number | null;
        phaseAVoltage?: number | null;
        phaseBVoltage?: number | null;
        phaseCVoltage?: number | null;
        phaseACurrent?: number | null;
        phaseBCurrent?: number | null;
        phaseCCurrent?: number | null;
        phaseAPower?: number | null;
        phaseBPower?: number | null;
        phaseCPower?: number | null;
        temperature?: number | null;
        neutralCurrent?: number | null;
        totalReactivePower?: number | null;
        totalApparentPower?: number | null;
        totalActiveEnergyWh?: number | null;
        totalReactiveEnergyVARh?: number | null;
        totalApparentEnergyVAh?: number | null;
        phaseAPowerFactor?: number | null;
        phaseBPowerFactor?: number | null;
        phaseCPowerFactor?: number | null;
        voltageThd?: number | null;
        currentThd?: number | null;
        maxDemandKW?: number | null;
        maxDemandKVAR?: number | null;
        maxDemandKVA?: number | null;
    };
    error?: string;
}
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
export interface ModbusServiceInterface {
    connectDevice(deviceIP: string, port?: number, slaveId?: number): Promise<any>;
    readMeterData(deviceIP: string, config?: Partial<ModbusClientConfig>): Promise<any>;
    readInputRegisters(deviceIP: string, startAddress: number, count: number, options?: Partial<ModbusClientConfig>): Promise<any>;
    testConnection(deviceIP: string, port?: number, slaveId?: number): Promise<boolean>;
    closeAllConnections(): void;
    closeConnection(deviceIP: string, port?: number, slaveId?: number): void;
}
export declare enum ModbusErrorType {
    CONNECTION_FAILED = "CONNECTION_FAILED",
    TIMEOUT = "TIMEOUT",
    PROTOCOL_ERROR = "PROTOCOL_ERROR",
    INVALID_ADDRESS = "INVALID_ADDRESS",
    INVALID_REGISTER = "INVALID_REGISTER",
    DEVICE_BUSY = "DEVICE_BUSY",
    POOL_EXHAUSTED = "POOL_EXHAUSTED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare class ModbusError extends Error {
    readonly type: ModbusErrorType;
    readonly code?: number;
    readonly address?: number;
    readonly deviceId?: string;
    constructor(message: string, type: ModbusErrorType, deviceId?: string, address?: number);
}
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
//# sourceMappingURL=modbus.d.ts.map
import { EventEmitter } from 'events';
import winston from 'winston';
import { ModbusClientConfig, ModbusClientInterface, MeterReading, PerformanceMetrics } from './types/modbus.js';
/**
 * Enhanced Modbus client using jsmodbus (node-modbus) library
 * Supports connection pooling, automatic reconnection, and enhanced error handling
 */
export declare class EnhancedModbusClient extends EventEmitter implements ModbusClientInterface {
    private client;
    private socket;
    private config;
    private logger;
    private isConnected;
    private reconnectTimeout;
    private connectionAttempts;
    private fieldMap;
    private lastConnectionTime;
    private errorHandler;
    private performanceMetrics;
    constructor(config: ModbusClientConfig, logger: winston.Logger);
    private setupClient;
    private setupEventHandlers;
    private loadFieldMap;
    connect(): Promise<boolean>;
    private scheduleReconnect;
    readMeterData(): Promise<MeterReading | null>;
    private readHoldingRegistersWithRetry;
    private readInputRegistersWithRetry;
    private readAdditionalFieldsFromMap;
    testConnection(): Promise<boolean>;
    disconnect(): void;
    destroy(): void;
    getConnectionStatus(): boolean;
    getConfig(): ModbusClientConfig;
    getPerformanceMetrics(): PerformanceMetrics;
    private getDeviceId;
    private updateSuccessRate;
    getHealthStatus(): {
        connected: boolean;
        lastConnectionTime: number;
        connectionAttempts: number;
        performanceMetrics: PerformanceMetrics;
    };
    updateConfig(newConfig: Partial<ModbusClientConfig>): void;
    canReuse(config: ModbusClientConfig): boolean;
    getErrorStatistics(): import("./error-handler.js").ErrorStatistics;
    resetErrorStatistics(): void;
    resetCircuitBreaker(): void;
}

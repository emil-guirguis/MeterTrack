import { EventEmitter } from 'events';
import winston from 'winston';
import { ConnectionPool, ConnectionPoolConfig, ModbusClientConfig } from './types/modbus.js';
import { EnhancedModbusClient } from './enhanced-modbus-client.js';
/**
 * Connection pool for managing multiple Modbus connections efficiently
 * Supports connection reuse, automatic cleanup, and health monitoring
 */
export declare class ModbusConnectionPool extends EventEmitter implements ConnectionPool {
    private connections;
    private pendingRequests;
    private config;
    private logger;
    private healthCheckInterval;
    private cleanupInterval;
    private isShuttingDown;
    private stats;
    constructor(config: Partial<ConnectionPoolConfig>, logger: winston.Logger);
    getConnection(config: ModbusClientConfig): Promise<EnhancedModbusClient>;
    releaseConnection(connection: EnhancedModbusClient): void;
    closeAll(): Promise<void>;
    healthCheck(): Promise<void>;
    getStats(): {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        failedConnections: number;
        pendingRequests: number;
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
    };
    private getConnectionKey;
    private findIdleConnection;
    private findPooledConnection;
    private createConnection;
    private queueConnectionRequest;
    private processPendingRequests;
    private markConnectionInUse;
    private checkConnectionHealth;
    private removeConnection;
    private closeConnection;
    private handleConnectionError;
    private handleConnectionDisconnected;
    private startHealthCheck;
    private startCleanup;
    private cleanupIdleConnections;
    private updateStats;
}

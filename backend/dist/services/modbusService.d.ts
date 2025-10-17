import { ModbusClientConfig, ModbusServiceInterface, ConnectionPoolConfig } from '../types/modbus.js';
interface MeterReadResult {
    deviceIP: string;
    timestamp: Date;
    success: boolean;
    data?: any;
    error?: string;
}
/**
 * Enhanced Modbus service using node-modbus library with connection pooling
 * Provides type-safe interfaces for all Modbus operations
 */
export declare class ModbusService implements ModbusServiceInterface {
    private clients;
    private poolConfig;
    constructor(poolConfig?: Partial<ConnectionPoolConfig>);
    /**
     * Connect to a Modbus TCP device with connection pooling
     */
    connectDevice(deviceIP: string, port?: number, slaveId?: number): Promise<any>;
    /**
     * Read energy meter data from a Modbus device with enhanced type safety
     */
    readMeterData(deviceIP: string, config?: Partial<ModbusClientConfig>): Promise<MeterReadResult>;
    /**
     * Read input registers with type safety
     */
    readInputRegisters(deviceIP: string, startAddress: number, count: number, options?: Partial<ModbusClientConfig>): Promise<MeterReadResult>;
    /**
     * Test connection to a Modbus device
     */
    testConnection(deviceIP: string, port?: number, slaveId?: number): Promise<boolean>;
    /**
     * Close all Modbus connections
     */
    closeAllConnections(): void;
    /**
     * Close specific connection
     */
    closeConnection(deviceIP: string, port?: number, slaveId?: number): void;
    /**
     * Get connection pool statistics
     */
    getPoolStats(): {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
    };
    /**
     * Get default register mapping based on real meter configuration
     */
    private getDefaultRegisterMapping;
    /**
     * Clean up idle connections
     */
    private cleanupIdleConnections;
    /**
     * Remove oldest idle connection to make room for new connections
     */
    private removeOldestIdleConnection;
}
declare const modbusService: ModbusService;
export default modbusService;
//# sourceMappingURL=modbusService.d.ts.map
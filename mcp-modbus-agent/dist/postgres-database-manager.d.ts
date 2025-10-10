import winston from 'winston';
import { MeterReading } from './modbus-client.js';
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}
export declare class PostgresDatabaseManager {
    private pool;
    private config;
    private logger;
    private isConnected;
    constructor(config: DatabaseConfig, logger: winston.Logger);
    connect(): Promise<boolean>;
    private createTable;
    insertMeterReading(reading: MeterReading): Promise<boolean>;
    insertMeterReadings(readings: MeterReading[]): Promise<number>;
    getLatestReading(meterId: string): Promise<MeterReading | null>;
    getReadingsByTimeRange(meterId: string, startTime: Date, endTime: Date, limit?: number): Promise<MeterReading[]>;
    getStatistics(meterId: string, hours?: number): Promise<any>;
    disconnect(): Promise<void>;
    getConnectionStatus(): boolean;
    testConnection(): Promise<boolean>;
}

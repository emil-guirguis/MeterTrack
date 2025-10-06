import winston from 'winston';
import { MeterReading } from './modbus-client.js';
export interface DatabaseConfig {
    uri: string;
    databaseName: string;
    collectionName: string;
}
export declare class DatabaseManager {
    private client;
    private db;
    private collection;
    private config;
    private logger;
    private isConnected;
    constructor(config: DatabaseConfig, logger: winston.Logger);
    connect(): Promise<boolean>;
    private createIndexes;
    insertMeterReading(reading: MeterReading): Promise<boolean>;
    insertMeterReadings(readings: MeterReading[]): Promise<number>;
    getLatestReading(meterId: string): Promise<MeterReading | null>;
    getReadingsByTimeRange(meterId: string, startTime: Date, endTime: Date, limit?: number): Promise<MeterReading[]>;
    getStatistics(meterId: string, hours?: number): Promise<any>;
    disconnect(): Promise<void>;
    getConnectionStatus(): boolean;
    testConnection(): Promise<boolean>;
}

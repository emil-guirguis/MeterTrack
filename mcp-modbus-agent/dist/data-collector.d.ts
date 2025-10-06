import winston from 'winston';
import { ModbusClient, ModbusConfig, MeterReading } from './modbus-client.js';
import { DatabaseManager, DatabaseConfig } from './database-manager.js';
export interface DataCollectorConfig {
    modbus: ModbusConfig;
    database: DatabaseConfig;
    collectionInterval: number;
    autoStart: boolean;
}
export declare class DataCollector {
    readonly modbusClient: ModbusClient;
    readonly databaseManager: DatabaseManager;
    private logger;
    private config;
    private collectionTimer;
    private cronJob;
    private isRunning;
    private errorCount;
    private maxErrors;
    constructor(config: DataCollectorConfig, logger: winston.Logger);
    private setupEventHandlers;
    initialize(): Promise<boolean>;
    start(): Promise<boolean>;
    stop(): void;
    shutdown(): Promise<void>;
    collectData(): Promise<MeterReading | null>;
    private healthCheck;
    getStatus(): Promise<any>;
    getLatestReading(): Promise<MeterReading | null>;
    getStatistics(hours?: number): Promise<any>;
}

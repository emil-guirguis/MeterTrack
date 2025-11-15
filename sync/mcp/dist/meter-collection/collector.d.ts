import winston from 'winston';
import { BACnetConfig } from './bacnet-client.js';
import { SyncDatabase } from '../database/index.js';
export interface MeterConfig {
    id: string;
    name: string;
    bacnet_device_id: number;
    bacnet_ip: string;
    data_points: Array<{
        object_type: number;
        instance: number;
        property: number;
        name: string;
    }>;
}
export interface MetersConfiguration {
    description?: string;
    meters: MeterConfig[];
}
export interface CollectorConfig {
    bacnet: BACnetConfig;
    collectionInterval: number;
    configPath: string;
    autoStart: boolean;
}
export declare class MeterCollector {
    private bacnetClient;
    private database;
    private logger;
    private config;
    private meters;
    private collectionTimer;
    private cronJob;
    private isRunning;
    private errorCount;
    private maxErrors;
    private meterErrorCounts;
    constructor(config: CollectorConfig, database: SyncDatabase, logger: winston.Logger);
    private setupEventHandlers;
    /**
     * Load meter configuration from JSON file
     */
    private loadMeterConfiguration;
    /**
     * Store a meter reading in the Sync Database
     */
    private storeReading;
    /**
     * Initialize the collector
     */
    initialize(): Promise<boolean>;
    /**
     * Start data collection
     */
    start(): Promise<boolean>;
    /**
     * Stop data collection
     */
    stop(): void;
    /**
     * Shutdown the collector
     */
    shutdown(): Promise<void>;
    /**
     * Collect data from all configured meters
     */
    collectAllMeters(): Promise<void>;
    /**
     * Collect data from a single meter
     */
    private collectMeterData;
    /**
     * Perform health check on all meters
     */
    private healthCheck;
    /**
     * Get collector status
     */
    getStatus(): Promise<any>;
    /**
     * Get latest readings for a specific meter
     */
    getLatestReadings(meterId: string, limit?: number): Promise<any[]>;
    /**
     * Get statistics for a meter
     */
    getStatistics(meterId: string, hours?: number): Promise<any>;
}

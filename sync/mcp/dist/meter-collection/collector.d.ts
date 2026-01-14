import winston from 'winston';
import { BACnetConfig } from './bacnet-client.js';
import { SyncDatabase } from '../data-sync/data-sync.js';
import { MeterCache, DeviceRegisterCache } from '../cache/index.js';
export interface MeterConfig {
    meter_id: string;
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
    private meterCache;
    private deviceRegisterCache;
    constructor(config: CollectorConfig, database: SyncDatabase, logger: winston.Logger, meterCache: MeterCache, deviceRegisterCache: DeviceRegisterCache);
    private setupEventHandlers;
    /**
     * Load meter configuration from JSON file
     */
    private loadMeterConfiguration;
    /**
     * Store a meter reading in the Sync Database
     *
     * Uses fieldName from register mapping when available, otherwise falls back to dataPoint name.
     * This ensures readings are stored in the correct column based on the register configuration.
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
     *
     * This method:
     * 1. Gets the device_id from the cached meter
     * 2. Queries device_register table for all registers configured for that device
     * 3. Joins with register table to get register details
     * 4. Calculates element-specific register numbers based on meter element
     * 5. Builds BACnetDataPoint list with calculated register numbers
     * 6. Reads all data points from the meter
     * 7. Stores each reading with the field_name from the register
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

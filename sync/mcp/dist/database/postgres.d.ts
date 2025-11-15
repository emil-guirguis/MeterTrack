/**
 * PostgreSQL Database Client for Sync
 *
 * Provides connection management and query methods for the Sync Database.
 * Handles meters, meter_readings, and sync_log tables.
 */
import { PoolClient, QueryResult } from 'pg';
export interface Meter {
    id: number;
    external_id: string;
    name: string;
    bacnet_device_id?: number;
    bacnet_ip?: string;
    config?: any;
    last_reading_at?: Date;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface MeterReading {
    id: number;
    meter_external_id: string;
    timestamp: Date;
    data_point: string;
    value: number;
    unit?: string;
    is_synchronized: boolean;
    retry_count: number;
    created_at: Date;
}
export interface SyncLog {
    id: number;
    batch_size: number;
    success: boolean;
    error_message?: string;
    synced_at: Date;
}
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}
export declare class SyncDatabase {
    private pool;
    constructor(config: DatabaseConfig);
    /**
     * Test database connectivity
     */
    testConnection(): Promise<boolean>;
    /**
     * Close all database connections
     */
    close(): Promise<void>;
    /**
     * Get all meters
     */
    getMeters(activeOnly?: boolean): Promise<Meter[]>;
    /**
     * Get meter by external ID
     */
    getMeterByExternalId(externalId: string): Promise<Meter | null>;
    /**
     * Get meter by ID
     */
    getMeterById(id: number): Promise<Meter | null>;
    /**
     * Create or update a meter
     */
    upsertMeter(meter: {
        external_id: string;
        name: string;
        bacnet_device_id?: number;
        bacnet_ip?: string;
        config?: any;
        is_active?: boolean;
    }): Promise<Meter>;
    /**
     * Update meter last reading timestamp
     */
    updateMeterLastReading(externalId: string, timestamp: Date): Promise<void>;
    /**
     * Deactivate a meter
     */
    deactivateMeter(externalId: string): Promise<void>;
    /**
     * Insert a single meter reading
     */
    insertReading(reading: {
        meter_external_id: string;
        timestamp: Date;
        data_point: string;
        value: number;
        unit?: string;
    }): Promise<MeterReading>;
    /**
     * Batch insert meter readings
     */
    batchInsertReadings(readings: Array<{
        meter_external_id: string;
        timestamp: Date;
        data_point: string;
        value: number;
        unit?: string;
    }>): Promise<number>;
    /**
     * Get unsynchronized readings for sync
     */
    getUnsynchronizedReadings(limit?: number): Promise<MeterReading[]>;
    /**
     * Get readings by meter and time range
     */
    getReadingsByMeterAndTimeRange(meterExternalId: string, startTime: Date, endTime: Date): Promise<MeterReading[]>;
    /**
     * Get recent readings (last N hours)
     */
    getRecentReadings(hours?: number): Promise<MeterReading[]>;
    /**
     * Mark readings as synchronized
     */
    markReadingsAsSynchronized(readingIds: number[]): Promise<number>;
    /**
     * Delete synchronized readings
     */
    deleteSynchronizedReadings(readingIds: number[]): Promise<number>;
    /**
     * Increment retry count for failed readings
     */
    incrementRetryCount(readingIds: number[]): Promise<number>;
    /**
     * Get count of unsynchronized readings
     */
    getUnsynchronizedCount(): Promise<number>;
    /**
     * Delete old synchronized readings (cleanup)
     */
    deleteOldSynchronizedReadings(daysOld?: number): Promise<number>;
    /**
     * Log a sync operation
     */
    logSyncOperation(batchSize: number, success: boolean, errorMessage?: string): Promise<SyncLog>;
    /**
     * Get recent sync logs
     */
    getRecentSyncLogs(limit?: number): Promise<SyncLog[]>;
    /**
     * Get sync statistics
     */
    getSyncStats(hours?: number): Promise<{
        total_syncs: number;
        successful_syncs: number;
        failed_syncs: number;
        total_readings_synced: number;
        success_rate: number;
    }>;
    /**
     * Delete old sync logs (cleanup)
     */
    deleteOldSyncLogs(daysOld?: number): Promise<number>;
    /**
     * Execute a raw query (for advanced use cases)
     */
    query(text: string, params?: any[]): Promise<QueryResult>;
    /**
     * Get a client from the pool for transactions
     */
    getClient(): Promise<PoolClient>;
}
/**
 * Create a database instance from environment variables
 */
export declare function createDatabaseFromEnv(): SyncDatabase;

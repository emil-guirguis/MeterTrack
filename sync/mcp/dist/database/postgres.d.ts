/**
 * PostgreSQL Database Client for Sync
 *
 * Provides connection management and query methods for the Sync Database.
 * Handles meters, meter_reading, and sync_log tables.
 */
import { Pool, PoolClient, QueryResult } from 'pg';
import { MeterEntity, MeterReadingEntity, SyncLog, TenantEntity, DatabaseConfig } from '../types/entities.js';
export declare class SyncDatabase {
    private pool;
    constructor(config: DatabaseConfig);
    /**
     * Initialize database schema
     */
    initialize(): Promise<void>;
    /**
     * Test local database connectivity
     */
    testConnectionLocal(): Promise<boolean>;
    /**
     * Test remote database connectivity
     */
    testConnectionRemote(remotePool: Pool): Promise<boolean>;
    /**
     * Validate that the tenant table exists and contains valid data
     *
     * Returns:
     * - false if table doesn't exist
     * - false if table has zero records (sync database not set up yet)
     * - true if table has exactly one record (valid state)
     * - throws error if table has more than one record (database may be corrupted)
     */
    validateTenantTable(): Promise<TenantEntity | null>;
    /**
     * Close all database connections
     */
    close(): Promise<void>;
    /**
     * Get all meters
     */
    getMeters(activeOnly?: boolean): Promise<MeterEntity[]>;
    /**
    * Get meter by ID
    */
    getMeterById(id: number): Promise<MeterEntity | null>;
    /**
     * Create or update a meter
     */
    upsertMeter(meter: MeterEntity): Promise<MeterEntity>;
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
    }): Promise<MeterReadingEntity>;
    /**
     * Batch insert meter readings
     */
    batchInsertReadings(readings: Array<Omit<MeterReadingEntity, 'id' | 'created_at' | 'updated_at'>>): Promise<number>;
    /**
     * Get unsynchronized readings for sync
     */
    getUnsynchronizedReadings(limit?: number): Promise<MeterReadingEntity[]>;
    /**
     * Get readings by meter and time range
     */
    getReadingsByMeterAndTimeRange(meterExternalId: string, startTime: Date, endTime: Date): Promise<MeterReadingEntity[]>;
    /**
     * Get recent readings (last N hours)
     */
    getRecentReadings(hours?: number): Promise<MeterReadingEntity[]>;
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
     * Get tenant information
     */
    getTenant(): Promise<TenantEntity | null>;
    /**
     * Synchronize tenant from remote database to local database
     *
     * Queries the remote database for a tenant record by ID and upserts it to the local database.
     * Preserves the original tenant ID from the remote database.
     *
     * @param remotePool - Connection pool to the remote database
     * @param tenantId - The ID of the tenant to synchronize
     * @returns The synchronized tenant record
     * @throws Error if the remote database query fails or tenant is not found
     */
    syncTenantFromRemote(remotePool: Pool, tenantId: number): Promise<TenantEntity>;
    /**
     * Create or update tenant information
     */
    upsertTenant(tenant: {
        id: string;
        name: string;
        url?: string;
        street?: string;
        street2?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
        active?: boolean;
    }): Promise<TenantEntity>;
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

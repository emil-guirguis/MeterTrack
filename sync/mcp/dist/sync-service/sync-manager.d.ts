/**
 * Sync Manager
 *
 * Orchestrates the synchronization of meter readings from Sync Database to Client System.
 * Handles scheduled sync, batching, retry logic, and cleanup.
 */
import { SyncDatabase } from '../database/postgres.js';
import { ClientSystemApiClient } from './api-client.js';
import { BaseEntity } from '../types/entities.js';
export interface SyncManagerConfig {
    database: SyncDatabase;
    apiClient: ClientSystemApiClient;
    syncIntervalMinutes?: number;
    batchSize?: number;
    maxRetries?: number;
    enableAutoSync?: boolean;
    connectivityCheckIntervalMs?: number;
}
export interface MeterEntity extends BaseEntity {
    name: string;
    type: string;
    serial_number: string;
    installation_date: string;
    device_id: string;
    location_id: string;
    ip: string;
    port: string;
    protocol: string;
    status: string;
    notes?: string;
}
export interface SyncStatus {
    isRunning: boolean;
    lastSyncTime?: Date;
    lastSyncSuccess?: boolean;
    lastSyncError?: string;
    queueSize: number;
    totalSynced: number;
    totalFailed: number;
    isClientConnected: boolean;
}
export declare class SyncManager {
    private database;
    private apiClient;
    private connectivityMonitor;
    private syncIntervalMinutes;
    private batchSize;
    private maxRetries;
    private enableAutoSync;
    private cronJob?;
    private isSyncing;
    private status;
    constructor(config: SyncManagerConfig);
    /**
     * Start the sync manager with scheduled sync
     */
    start(): Promise<void>;
    /**
     * Stop the sync manager
     */
    stop(): Promise<void>;
    /**
     * Perform a single sync operation
     */
    performSync(): Promise<void>;
    /**
     * Upload batch with exponential backoff retry logic
     */
    private uploadBatchWithRetry;
    /**
     * Check Client System connectivity
     */
    private checkClientConnectivity;
    /**
     * Update queue size in status
     */
    private updateQueueSize;
    /**
     * Get current sync status
     */
    getStatus(): SyncStatus;
    /**
     * Get connectivity status
     */
    getConnectivityStatus(): import("./connectivity-monitor.js").ConnectivityStatus;
    /**
     * Manually trigger a sync operation
     */
    triggerSync(): Promise<void>;
    /**
     * Manually trigger a sync operation (alias for API compatibility)
     */
    triggerManualSync(): Promise<void>;
    /**
     * Download and update configuration from Client System
     */
    downloadConfiguration(): Promise<void>;
    /**
     * Send heartbeat to Client System
     */
    sendHeartbeat(): Promise<void>;
    /**
     * Get sync statistics
     */
    getSyncStats(hours?: number): Promise<any>;
    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoff;
    /**
     * Sleep utility
     */
    private sleep;
}
/**
 * Create sync manager from environment variables
 */
export declare function createSyncManagerFromEnv(database: SyncDatabase, apiClient: ClientSystemApiClient): SyncManager;

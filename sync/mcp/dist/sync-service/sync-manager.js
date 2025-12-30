/**
 * Sync Manager
 *
 * Orchestrates the synchronization of meter readings from Sync Database to Client System.
 * Handles scheduled sync, batching, retry logic, and cleanup.
 */
import * as cron from 'node-cron';
import { ConnectivityMonitor } from './connectivity-monitor.js';
export class SyncManager {
    database;
    apiClient;
    connectivityMonitor;
    syncIntervalMinutes;
    batchSize;
    maxRetries;
    enableAutoSync;
    cronJob;
    isSyncing = false;
    status;
    constructor(config) {
        this.database = config.database;
        this.apiClient = config.apiClient;
        this.syncIntervalMinutes = config.syncIntervalMinutes || 5;
        this.batchSize = config.batchSize || 1000;
        this.maxRetries = config.maxRetries || 5;
        this.enableAutoSync = config.enableAutoSync !== false;
        // Initialize connectivity monitor
        this.connectivityMonitor = new ConnectivityMonitor(this.apiClient, config.connectivityCheckIntervalMs || 60000);
        // Listen for connectivity restoration
        this.connectivityMonitor.on('connected', () => {
            console.log('Connectivity restored - auto-resuming sync');
            this.performSync();
        });
        this.connectivityMonitor.on('disconnected', () => {
            console.log('Connectivity lost - readings will be queued');
        });
        this.status = {
            isRunning: false,
            queueSize: 0,
            totalSynced: 0,
            totalFailed: 0,
            isClientConnected: false,
        };
    }
    /**
     * Start the sync manager with scheduled sync
     */
    async start() {
        if (this.cronJob) {
            console.log('Sync manager already running');
            return;
        }
        console.log(`Starting sync manager with ${this.syncIntervalMinutes} minute interval`);
        // Start connectivity monitoring
        this.connectivityMonitor.start();
        // Test initial connectivity
        await this.checkClientConnectivity();
        if (this.enableAutoSync) {
            // Schedule sync job
            const cronExpression = `*/${this.syncIntervalMinutes} * * * *`;
            this.cronJob = cron.schedule(cronExpression, async () => {
                await this.performSync();
            });
            console.log(`Sync scheduled: every ${this.syncIntervalMinutes} minutes`);
            // Perform initial sync
            await this.performSync();
        }
        this.status.isRunning = true;
    }
    /**
     * Stop the sync manager
     */
    async stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = undefined;
            console.log('Sync manager stopped');
        }
        // Stop connectivity monitoring
        this.connectivityMonitor.stop();
        this.status.isRunning = false;
    }
    /**
     * Perform a single sync operation
     */
    async performSync() {
        if (this.isSyncing) {
            console.log('Sync already in progress, skipping');
            return;
        }
        this.isSyncing = true;
        try {
            // Check Client System connectivity
            const isConnected = await this.checkClientConnectivity();
            if (!isConnected) {
                console.log('Client System unreachable, queueing readings');
                await this.updateQueueSize();
                return;
            }
            // Get unsynchronized readings
            const readings = await this.database.getUnsynchronizedReadings(this.batchSize);
            if (readings.length === 0) {
                console.log('No readings to sync');
                return;
            }
            console.log(`Syncing ${readings.length} readings...`);
            // Upload batch with retry logic
            const result = await this.uploadBatchWithRetry(readings);
            if (result.success) {
                // Delete synchronized readings
                const readingIds = readings.map((r) => r.meter_id);
                const deletedCount = await this.database.deleteSynchronizedReadings(readingIds);
                console.log(`Successfully synced and deleted ${deletedCount} readings`);
                // Log success
                await this.database.logSyncOperation(readings.length, true);
                this.status.lastSyncTime = new Date();
                this.status.lastSyncSuccess = true;
                this.status.lastSyncError = undefined;
                this.status.totalSynced += readings.length;
            }
            else {
                // Log failure
                await this.database.logSyncOperation(readings.length, false, result.error || 'Unknown error');
                this.status.lastSyncTime = new Date();
                this.status.lastSyncSuccess = false;
                this.status.lastSyncError = result.error;
                this.status.totalFailed += readings.length;
                console.error(`Sync failed: ${result.error}`);
            }
            // Update queue size
            await this.updateQueueSize();
        }
        catch (error) {
            console.error('Sync error:', error);
            this.status.lastSyncTime = new Date();
            this.status.lastSyncSuccess = false;
            this.status.lastSyncError = error instanceof Error ? error.message : 'Unknown error';
            // Log error
            await this.database.logSyncOperation(0, false, error instanceof Error ? error.message : 'Unknown error');
        }
        finally {
            this.isSyncing = false;
        }
    }
    /**
     * Upload batch with exponential backoff retry logic
     */
    async uploadBatchWithRetry(readings, retryCount = 0) {
        try {
            const response = await this.apiClient.uploadBatch(readings);
            if (response.success) {
                return { success: true };
            }
            else {
                return { success: false, error: response.message };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Check if Client System is unreachable
            if (errorMessage.includes('unreachable')) {
                this.status.isClientConnected = false;
                return { success: false, error: 'Client System unreachable' };
            }
            // Retry with exponential backoff
            if (retryCount < this.maxRetries) {
                const delay = this.calculateBackoff(retryCount);
                console.log(`Retry ${retryCount + 1}/${this.maxRetries} in ${delay}ms`);
                await this.sleep(delay);
                // Increment retry count in database
                const readingIds = readings.map((r) => r.meter_id);
                await this.database.incrementRetryCount(readingIds);
                return this.uploadBatchWithRetry(readings, retryCount + 1);
            }
            // Max retries exceeded
            console.error(`Max retries (${this.maxRetries}) exceeded`);
            // Increment retry count one final time
            const readingIds = readings.map((r) => r.meter_id);
            await this.database.incrementRetryCount(readingIds);
            return { success: false, error: `Max retries exceeded: ${errorMessage}` };
        }
    }
    /**
     * Check Client System connectivity
     */
    async checkClientConnectivity() {
        try {
            const isConnected = await this.apiClient.testConnection();
            this.status.isClientConnected = isConnected;
            return isConnected;
        }
        catch (error) {
            this.status.isClientConnected = false;
            return false;
        }
    }
    /**
     * Update queue size in status
     */
    async updateQueueSize() {
        try {
            const count = await this.database.getUnsynchronizedCount();
            this.status.queueSize = count;
        }
        catch (error) {
            console.error('Failed to update queue size:', error);
        }
    }
    /**
     * Get current sync status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Get connectivity status
     */
    getConnectivityStatus() {
        return this.connectivityMonitor.getStatus();
    }
    /**
     * Manually trigger a sync operation
     */
    async triggerSync() {
        console.log('Manual sync triggered');
        await this.performSync();
    }
    /**
     * Manually trigger a sync operation (alias for API compatibility)
     */
    async triggerManualSync() {
        return this.triggerSync();
    }
    /**
     * Download and update configuration from Client System
     */
    async downloadConfiguration() {
        try {
            console.log('Downloading configuration from Client System...');
            const config = await this.apiClient.downloadConfig();
            console.log(`Downloaded configuration with ${config.meters.length} meters`);
            // Configuration is downloaded but meter updates are handled by meter-sync-agent
        }
        catch (error) {
            console.error('Failed to download configuration:', error);
            throw error;
        }
    }
    /**
     * Send heartbeat to Client System
     */
    async sendHeartbeat() {
        try {
            await this.apiClient.sendHeartbeat();
            this.status.isClientConnected = true;
        }
        catch (error) {
            console.error('Failed to send heartbeat:', error);
            this.status.isClientConnected = false;
        }
    }
    /**
     * Get sync statistics
     */
    async getSyncStats(hours = 24) {
        return this.database.getSyncStats(hours);
    }
    /**
     * Calculate exponential backoff delay
     */
    calculateBackoff(retryCount) {
        const baseDelay = 2000; // 2 seconds
        return Math.min(baseDelay * Math.pow(2, retryCount), 60000); // Max 60 seconds
    }
    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
/**
 * Create sync manager from environment variables
 */
export function createSyncManagerFromEnv(database, apiClient) {
    const config = {
        database,
        apiClient,
        syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '5', 10),
        batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),
        maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
        enableAutoSync: process.env.ENABLE_AUTO_SYNC !== 'false',
    };
    return new SyncManager(config);
}
//# sourceMappingURL=sync-manager.js.map
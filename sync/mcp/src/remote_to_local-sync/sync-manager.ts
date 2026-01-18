/**
 * Sync Manager
 * 
 * Orchestrates the synchronization of meter readings from Sync Database to Client System.
 * Handles scheduled sync, batching, retry logic, and cleanup.
 */

import * as cron from 'node-cron';
import { ClientSystemApiClient } from '../api/client-system-api.js';
import { ConnectivityMonitor } from '../api/connectivity-monitor.js';
import { SyncDatabase, MeterReadingEntity } from '../types/entities.js';

export interface SyncManagerConfig {
  database: SyncDatabase;
  apiClient: ClientSystemApiClient;
  syncIntervalMinutes?: number;
  batchSize?: number;
  maxRetries?: number;
  enableAutoSync?: boolean;
  connectivityCheckIntervalMs?: number;
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

export interface TenantData {
  tenant_id: number;
  name: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  api_key?: string;
}

export class SyncManager {
  private database: SyncDatabase;
  private apiClient: ClientSystemApiClient;
  private connectivityMonitor: ConnectivityMonitor;
  private syncIntervalMinutes: number;
  private batchSize: number;
  private maxRetries: number;
  private enableAutoSync: boolean;

  private cronJob?: cron.ScheduledTask;
  private isSyncing: boolean = false;
  private status: SyncStatus;
  private apiKey: string = '';
  private tenantData: TenantData | null = null;

  constructor(config: SyncManagerConfig) {
    this.database = config.database;
    this.apiClient = config.apiClient;
    this.syncIntervalMinutes = config.syncIntervalMinutes || 5;
    this.batchSize = config.batchSize || 1000;
    this.maxRetries = config.maxRetries || 5;
    this.enableAutoSync = config.enableAutoSync !== false;

    this.connectivityMonitor = new ConnectivityMonitor(
      this.apiClient,
      config.connectivityCheckIntervalMs || 60000
    );

    this.connectivityMonitor.on('connected', () => {
      console.log('Connectivity restored - auto-resuming sync');
      this.status.isClientConnected = true;
      this.performSync();
    });

    this.connectivityMonitor.on('disconnected', () => {
      console.log('Connectivity lost - readings will be queued');
      this.status.isClientConnected = false;
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
  async start(): Promise<void> {
    if (this.cronJob) {
      console.log('Sync manager already running');
      return;
    }

    console.log(`Starting sync manager with ${this.syncIntervalMinutes} minute interval`);

    try {
      const tenant = await this.database.getTenant();
      if (tenant && tenant.api_key) {
        this.apiKey = tenant.api_key;
        console.log(`✅ [SyncManager] API key loaded from tenant: ${this.apiKey.substring(0, 8)}...`);
        this.apiClient.setApiKey(this.apiKey);
      } else {
        console.warn('⚠️  [SyncManager] No API key found in tenant, connectivity checks may fail');
      }

      if (tenant) {
        this.tenantData = {
          tenant_id: tenant.tenant_id,
          name: tenant.name || '',
          street: tenant.street,
          street2: tenant.street2,
          city: tenant.city,
          state: tenant.state,
          zip: tenant.zip,
          country: tenant.country,
        };
        console.log(`✅ [SyncManager] Tenant data loaded into memory: ${this.tenantData.name}`);
      }
    } catch (error) {
      console.error('❌ [SyncManager] Failed to load tenant data:', error);
    }

    this.connectivityMonitor.start();
    await this.checkClientConnectivity();

    if (this.enableAutoSync) {
      const cronExpression = `*/${this.syncIntervalMinutes} * * * *`;
      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.performSync();
      });

      console.log(`Sync scheduled: every ${this.syncIntervalMinutes} minutes`);
      await this.performSync();
    }

    this.status.isRunning = true;
  }

  /**
   * Stop the sync manager
   */
  async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
      console.log('Sync manager stopped');
    }

    this.connectivityMonitor.stop();
    this.status.isRunning = false;
  }

  /**
   * Get tenant data from memory
   */
  getTenantData(): TenantData | null {
    return this.tenantData ? { ...this.tenantData } : null;
  }

  /**
   * Update tenant data in memory
   */
  setTenantData(tenant: TenantData): void {
    this.tenantData = { ...tenant };
    console.log(`✅ [SyncManager] Tenant data updated in memory: ${this.tenantData.name}`);
  }

  /**
   * Perform a single sync operation
   */
  async performSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;

    try {
      await this.checkClientConnectivity();
      const readings = await this.database.getUnsynchronizedReadings(this.batchSize);

      if (readings.length === 0) {
        console.log('No readings to sync');
        return;
      }

      console.log(`Syncing ${readings.length} readings...`);

      const result = await this.uploadBatchWithRetry(readings);

      if (result.success) {
        const readingIds = readings.map((r: MeterReadingEntity) => r.meter_reading_id).filter((id): id is number => id !== undefined);
        const deletedCount = await this.database.deleteSynchronizedReadings(readingIds);

        console.log(`Successfully synced and deleted ${deletedCount} readings`);

        await this.database.logSyncOperation(
          'sync',
          readings.length,
          true
        );

        this.status.lastSyncTime = new Date();
        this.status.lastSyncSuccess = true;
        this.status.lastSyncError = undefined;
        this.status.totalSynced += readings.length;
      } else {
        await this.database.logSyncOperation(
          'sync',
          readings.length,
          false,
          result.error || 'Unknown error'
        );

        this.status.lastSyncTime = new Date();
        this.status.lastSyncSuccess = false;
        this.status.lastSyncError = result.error;
        this.status.totalFailed += readings.length;

        console.error(`Sync failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Sync error:', error);

      this.status.lastSyncTime = new Date();
      this.status.lastSyncSuccess = false;
      this.status.lastSyncError = error instanceof Error ? error.message : 'Unknown error';

      await this.database.logSyncOperation(
        'sync',
        0,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Upload batch with exponential backoff retry logic
   */
  private async uploadBatchWithRetry(
    readings: MeterReadingEntity[],
    retryCount: number = 0
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiClient.uploadBatch(readings);

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('unreachable')) {
        this.status.isClientConnected = false;
        return { success: false, error: 'Client System unreachable' };
      }

      if (retryCount < this.maxRetries) {
        const delay = this.calculateBackoff(retryCount);
        console.log(`Retry ${retryCount + 1}/${this.maxRetries} in ${delay}ms`);

        await this.sleep(delay);

        const readingIds = readings.map((r) => r.meter_reading_id).filter((id): id is number => id !== undefined);
        await this.database.incrementRetryCount(readingIds);

        return this.uploadBatchWithRetry(readings, retryCount + 1);
      }

      console.error(`Max retries (${this.maxRetries}) exceeded`);

      const readingIds = readings.map((r) => r.meter_reading_id).filter((id): id is number => id !== undefined);
      await this.database.incrementRetryCount(readingIds);

      return { success: false, error: `Max retries exceeded: ${errorMessage}` };
    }
  }

  /**
   * Check Client System connectivity
   */
  private async checkClientConnectivity(): Promise<boolean> {
    const isConnected = this.connectivityMonitor.isConnected();
    console.log(`🔗 [SyncManager] checkClientConnectivity - Monitor says: ${isConnected}`);
    this.status.isClientConnected = isConnected;
    console.log(`🔗 [SyncManager] Updated status.isClientConnected to: ${isConnected}`);
    return isConnected;
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
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
  async triggerSync(): Promise<void> {
    console.log('Manual sync triggered');
    await this.performSync();
  }

  /**
   * Manually trigger a sync operation (alias for API compatibility)
   */
  async triggerManualSync(): Promise<void> {
    return this.triggerSync();
  }



  /**
   * Get sync statistics
   */
  async getSyncStats(hours: number = 24): Promise<any> {
    return this.database.getSyncStats(hours);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const baseDelay = 2000;
    return Math.min(baseDelay * Math.pow(2, retryCount), 60000);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create sync manager from environment variables
 */
export function createSyncManagerFromEnv(
  database: SyncDatabase,
  apiClient: ClientSystemApiClient
): SyncManager {
  const config: SyncManagerConfig = {
    database,
    apiClient,
    syncIntervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || '5', 10),
    batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
    enableAutoSync: process.env.ENABLE_AUTO_SYNC !== 'false',
  };

  return new SyncManager(config);
}

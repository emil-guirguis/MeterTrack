/**
 * Meter Reading Upload Manager
 * 
 * Orchestrates the uploading of meter readings from Sync Database to Client System.
 * Handles scheduled uploads, batching, retry logic, and cleanup.
 * 
 * This is part of the BACnet collection workflow:
 * 1. BACnetMeterReadingAgent collects readings from BACnet devices
 * 2. Readings are stored in Sync Database
 * 3. MeterReadingUploadManager uploads readings to Client System API
 */

import * as cron from 'node-cron';
import { ClientSystemApiClient } from '../api/client-system-api.js';
import { ConnectivityMonitor } from '../api/connectivity-monitor.js';
import { SyncDatabase, MeterReadingEntity } from '../types/entities.js';
import { cacheManager } from '../cache/cache-manager.js';

export interface MeterReadingUploadManagerConfig {
  database: SyncDatabase;
  apiClient: ClientSystemApiClient;
  uploadIntervalMinutes?: number;
  batchSize?: number;
  maxRetries?: number;
  enableAutoUpload?: boolean;
  connectivityCheckIntervalMs?: number;
}

export interface UploadStatus {
  isRunning: boolean;
  lastUploadTime?: Date;
  lastUploadSuccess?: boolean;
  lastUploadError?: string;
  queueSize: number;
  totalUploaded: number;
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
}

export class MeterReadingUploadManager {
  private database: SyncDatabase;
  private apiClient: ClientSystemApiClient;
  private connectivityMonitor: ConnectivityMonitor;
  private uploadIntervalMinutes: number;
  private batchSize: number;
  private maxRetries: number;
  private enableAutoUpload: boolean;

  private cronJob?: cron.ScheduledTask;
  private isUploading: boolean = false;
  private status: UploadStatus;
  private apiKey: string = '';
  private tenantData: TenantData | null = null;

  constructor(config: MeterReadingUploadManagerConfig) {
    this.database = config.database;
    this.apiClient = config.apiClient;
    this.uploadIntervalMinutes = config.uploadIntervalMinutes || 5;
    this.batchSize = config.batchSize || 1000;
    this.maxRetries = config.maxRetries || 5;
    this.enableAutoUpload = config.enableAutoUpload !== false;

    this.connectivityMonitor = new ConnectivityMonitor(
      this.apiClient,
      config.connectivityCheckIntervalMs || 60000
    );

    this.connectivityMonitor.on('connected', () => {
      console.log('Connectivity restored - auto-resuming upload');
      this.status.isClientConnected = true;
      this.performUpload();
    });

    this.connectivityMonitor.on('disconnected', () => {
      console.log('Connectivity lost - readings will be queued');
      this.status.isClientConnected = false;
    });

    this.status = {
      isRunning: false,
      queueSize: 0,
      totalUploaded: 0,
      totalFailed: 0,
      isClientConnected: false,
    };
  }

  /**
   * Start the upload manager with scheduled uploads
   */
  async start(): Promise<void> {
    if (this.cronJob) {
      console.log('Upload manager already running');
      return;
    }

    console.log(`Starting upload manager with ${this.uploadIntervalMinutes} minute interval`);

    try {
      const tenant = cacheManager.getTenantCache().getTenant();
      if (tenant && tenant.api_key) {
        this.apiKey = tenant.api_key;
        console.log(`✅ [UploadManager] API key loaded from tenant: ${this.apiKey.substring(0, 8)}...`);
        this.apiClient.setApiKey(this.apiKey);
      } else {
        console.warn('⚠️  [UploadManager] No API key found in tenant, connectivity checks may fail');
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
        console.log(`✅ [UploadManager] Tenant data loaded into memory: ${this.tenantData.name}`);
      }
    } catch (error) {
      console.error('❌ [UploadManager] Failed to load tenant data:', error);
    }

    this.connectivityMonitor.start();
    await this.checkClientConnectivity();

    if (this.enableAutoUpload) {
      const cronExpression = `*/${this.uploadIntervalMinutes} * * * *`;
      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.performUpload();
      });

      console.log(`Upload scheduled: every ${this.uploadIntervalMinutes} minutes`);
      await this.performUpload();
    }

    this.status.isRunning = true;
  }

  /**
   * Stop the upload manager
   */
  async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
      console.log('Upload manager stopped');
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
    console.log(`✅ [UploadManager] Tenant data updated in memory: ${this.tenantData.name}`);
  }

  /**
   * Perform a single upload operation
   */
  async performUpload(): Promise<void> {
    if (this.isUploading) {
      console.log('Upload already in progress, skipping');
      return;
    }

    this.isUploading = true;

    try {
      await this.checkClientConnectivity();
      const readings = await this.database.getUnsynchronizedReadings(this.batchSize);

      if (readings.length === 0) {
        console.log('No readings to upload');
        return;
      }

      console.log(`Uploading ${readings.length} readings...`);

      const result = await this.uploadBatchWithRetry(readings);

      if (result.success) {
        const readingIds = readings.map((r: MeterReadingEntity) => r.meter_reading_id).filter((id): id is number => id !== undefined);
        const deletedCount = await this.database.deleteSynchronizedReadings(readingIds);

        console.log(`Successfully uploaded and deleted ${deletedCount} readings`);

        await this.database.logSyncOperation(readings.length, true);

        this.status.lastUploadTime = new Date();
        this.status.lastUploadSuccess = true;
        this.status.lastUploadError = undefined;
        this.status.totalUploaded += readings.length;
      } else {
        await this.database.logSyncOperation(
          readings.length,
          false,
          result.error || 'Unknown error'
        );

        this.status.lastUploadTime = new Date();
        this.status.lastUploadSuccess = false;
        this.status.lastUploadError = result.error;
        this.status.totalFailed += readings.length;

        console.error(`Upload failed: ${result.error}`);
      }

    } catch (error) {
      console.error('Upload error:', error);

      this.status.lastUploadTime = new Date();
      this.status.lastUploadSuccess = false;
      this.status.lastUploadError = error instanceof Error ? error.message : 'Unknown error';

      await this.database.logSyncOperation(
        0,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      this.isUploading = false;
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
    console.log(`🔗 [UploadManager] checkClientConnectivity - Monitor says: ${isConnected}`);
    this.status.isClientConnected = isConnected;
    console.log(`🔗 [UploadManager] Updated status.isClientConnected to: ${isConnected}`);
    return isConnected;
  }

  /**
   * Get current upload status
   */
  getStatus(): UploadStatus {
    return { ...this.status };
  }

  /**
   * Get connectivity status
   */
  getConnectivityStatus() {
    return this.connectivityMonitor.getStatus();
  }

  /**
   * Manually trigger an upload operation
   */
  async triggerUpload(): Promise<void> {
    console.log('Manual upload triggered');
    await this.performUpload();
  }

  /**
   * Manually trigger an upload operation (alias for API compatibility)
   */
  async triggerManualUpload(): Promise<void> {
    return this.triggerUpload();
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(hours: number = 24): Promise<any> {
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
 * Create upload manager from environment variables
 */
export function createMeterReadingUploadManagerFromEnv(
  database: SyncDatabase,
  apiClient: ClientSystemApiClient
): MeterReadingUploadManager {
  const config: MeterReadingUploadManagerConfig = {
    database,
    apiClient,
    uploadIntervalMinutes: parseInt(process.env.UPLOAD_INTERVAL_MINUTES || '5', 10),
    batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
    enableAutoUpload: process.env.ENABLE_AUTO_UPLOAD !== 'false',
  };

  return new MeterReadingUploadManager(config);
}

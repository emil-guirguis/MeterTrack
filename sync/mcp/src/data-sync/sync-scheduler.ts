/**
 * Sync Scheduler
 * 
 * Orchestrates the sync cycle execution with configurable interval timing.
 * Implements mutual exclusion to prevent concurrent sync cycles and graceful shutdown.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import winston from 'winston';
import { UploadSyncManager, UploadSyncResult } from './upload-sync-manager';
import { DownloadSyncManager, MeterSyncResult, TenantSyncResult } from './download-sync-manager';
import { ErrorHandler } from './error-handler';

export interface SyncCycleResult {
  success: boolean;
  uploadResult: UploadSyncResult;
  meterDownloadResult: MeterSyncResult;
  tenantDownloadResult: TenantSyncResult;
  totalDuration: number;
  timestamp: Date;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime?: Date;
  lastSyncSuccess: boolean;
  lastSyncError?: string;
  queueSize: number;
  totalRecordsSynced: number;
  localMeterCount: number;
  remoteMeterCount: number;
  localTenantCount: number;
  remoteTenantCount: number;
  localDbConnected: boolean;
  remoteDbConnected: boolean;
}

export interface SyncSchedulerConfig {
  uploadManager: UploadSyncManager;
  downloadManager: DownloadSyncManager;
  connectionManager: any; // DatabaseConnectionManager
  intervalSeconds?: number;
  logger?: winston.Logger;
}

export class SyncScheduler {
  private uploadManager: UploadSyncManager;
  private downloadManager: DownloadSyncManager;
  private connectionManager: any; // DatabaseConnectionManager
  private intervalSeconds: number;
  private logger: winston.Logger;
  private errorHandler: ErrorHandler;
  
  private isRunning: boolean = false;
  private isSyncInProgress: boolean = false;
  private intervalHandle?: NodeJS.Timeout;
  private shutdownRequested: boolean = false;
  
  private lastSyncTime?: Date;
  private lastSyncSuccess: boolean = false;
  private lastSyncError?: string;
  private totalRecordsSynced: number = 0;

  constructor(config: SyncSchedulerConfig) {
    this.uploadManager = config.uploadManager;
    this.downloadManager = config.downloadManager;
    this.connectionManager = config.connectionManager;
    this.intervalSeconds = config.intervalSeconds || 60;
    this.logger = config.logger || this.createDefaultLogger();
    this.errorHandler = new ErrorHandler(this.logger);
  }

  /**
   * Start scheduled sync cycles
   * Requirements: 5.1, 5.2, 5.3
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Sync scheduler is already running');
      return;
    }

    this.isRunning = true;
    this.shutdownRequested = false;
    this.logger.info(`Starting sync scheduler with ${this.intervalSeconds}s interval`);

    // Execute first sync cycle immediately
    this.executeSyncCycleWrapper();

    // Schedule subsequent sync cycles
    this.intervalHandle = setInterval(() => {
      this.executeSyncCycleWrapper();
    }, this.intervalSeconds * 1000);
  }

  /**
   * Stop scheduled sync with graceful shutdown
   * Requirements: 5.5
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Sync scheduler is not running');
      return;
    }

    this.logger.info('Stopping sync scheduler...');
    this.shutdownRequested = true;

    // Clear the interval to prevent new cycles from starting
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }

    // Wait for current sync cycle to complete
    if (this.isSyncInProgress) {
      this.logger.info('Waiting for current sync cycle to complete...');
      
      // Poll until sync is complete (with timeout)
      const maxWaitTime = 300000; // 5 minutes
      const pollInterval = 1000; // 1 second
      let waitedTime = 0;

      while (this.isSyncInProgress && waitedTime < maxWaitTime) {
        await this.sleep(pollInterval);
        waitedTime += pollInterval;
      }

      if (this.isSyncInProgress) {
        this.logger.warn('Sync cycle did not complete within timeout, forcing shutdown');
      } else {
        this.logger.info('Current sync cycle completed');
      }
    }

    this.isRunning = false;
    this.logger.info('Sync scheduler stopped');
  }

  /**
   * Wrapper for executeSyncCycle that implements mutual exclusion
   * Requirements: 5.4
   */
  private async executeSyncCycleWrapper(): Promise<void> {
    // Mutual exclusion: prevent concurrent sync cycles
    if (this.isSyncInProgress) {
      this.logger.warn('Sync cycle already in progress, skipping this interval');
      return;
    }

    // Check if shutdown was requested
    if (this.shutdownRequested) {
      this.logger.info('Shutdown requested, skipping sync cycle');
      return;
    }

    try {
      await this.executeSyncCycle();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Sync cycle wrapper error:', errorMessage);
    }
  }

  /**
   * Execute one complete sync cycle
   * Uploads meter readings and downloads meter configurations and tenant data
   * Requirements: 5.1, 7.1, 7.2, 7.3, 7.4, 7.5, 6.5
   */
  async executeSyncCycle(): Promise<SyncCycleResult> {
    // Set sync in progress flag
    this.isSyncInProgress = true;
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      // Get queue size before sync (Requirement 7.1)
      const queueSize = await this.uploadManager.getQueueSize();
      this.logger.info(`Starting sync cycle - Queue size: ${queueSize}`);

      // Execute upload sync (meter readings from local to remote)
      const uploadResult = await this.uploadManager.syncReadings();
      
      if (uploadResult.success) {
        // Requirement 7.2: Log successful upload with record count and duration
        this.logger.info(
          `Upload completed: ${uploadResult.recordsUploaded} records uploaded, ` +
          `${uploadResult.recordsDeleted} records deleted in ${uploadResult.duration}ms`
        );
        this.totalRecordsSynced += uploadResult.recordsUploaded;
      } else {
        // Requirement 7.4: Log error with context
        this.logger.error(`Upload failed: ${uploadResult.error}`);
      }

      // Execute meter configuration download (from remote to local)
      // Download failures are isolated and don't block other operations (Requirement 9.5)
      let meterDownloadResult: MeterSyncResult;
      try {
        // Get tenant ID from local database
        const tenantRows = await this.downloadManager.getTenantId();
        if (tenantRows.length === 0) {
          this.logger.warn('No tenant found in local database, skipping meter sync');
          meterDownloadResult = {
            success: false,
            newMeters: 0,
            updatedMeters: 0,
            totalMeters: 0,
            error: 'No tenant found in local database',
            duration: 0,
            newMeterIds: [],
            updatedMeterIds: [],
          };
        } else {
          const tenantId = tenantRows[0].id;
          meterDownloadResult = await this.downloadManager.syncMeterConfigurations(tenantId);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        meterDownloadResult = {
          success: false,
          newMeters: 0,
          updatedMeters: 0,
          totalMeters: 0,
          error: errorMessage,
          duration: 0,
          newMeterIds: [],
          updatedMeterIds: [],
        };
      }
      
      if (meterDownloadResult.success) {
        this.logger.info(
          `Meter download completed: ${meterDownloadResult.newMeters} new, ` +
          `${meterDownloadResult.updatedMeters} updated in ${meterDownloadResult.duration}ms`
        );
      } else {
        // Requirement 7.4: Log error with context
        this.logger.error(`Meter download failed: ${meterDownloadResult.error}`);
      }

      // Execute tenant data download (from remote to local)
      // Download failures are isolated and don't block other operations (Requirement 11.5)
      const tenantDownloadResult = await this.downloadManager.syncTenantData();
      
      if (tenantDownloadResult.success) {
        this.logger.info(
          `Tenant download completed: ${tenantDownloadResult.newTenants} new, ` +
          `${tenantDownloadResult.updatedTenants} updated in ${tenantDownloadResult.duration}ms`
        );
      } else {
        // Requirement 7.4: Log error with context
        this.logger.error(`Tenant download failed: ${tenantDownloadResult.error}`);
      }

      const totalDuration = Date.now() - startTime;
      const overallSuccess = uploadResult.success && meterDownloadResult.success && tenantDownloadResult.success;

      // Update status
      this.lastSyncTime = timestamp;
      this.lastSyncSuccess = overallSuccess;
      this.lastSyncError = overallSuccess ? undefined : 'One or more sync operations failed';

      this.logger.info(`Sync cycle completed in ${totalDuration}ms - Success: ${overallSuccess}`);

      return {
        success: overallSuccess,
        uploadResult,
        meterDownloadResult,
        tenantDownloadResult,
        totalDuration,
        timestamp,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const totalDuration = Date.now() - startTime;

      // Handle unhandled exception at top level (Requirement 6.5)
      this.errorHandler.handleUnhandledException(err, {
        operation: 'executeSyncCycle',
        details: {
          timestamp: timestamp.toISOString(),
          duration: totalDuration,
        },
      });
      
      // Update status
      this.lastSyncTime = timestamp;
      this.lastSyncSuccess = false;
      this.lastSyncError = err.message;

      // Return failed result with empty sub-results
      return {
        success: false,
        uploadResult: {
          success: false,
          recordsUploaded: 0,
          recordsDeleted: 0,
          error: err.message,
          duration: 0,
        },
        meterDownloadResult: {
          success: false,
          newMeters: 0,
          updatedMeters: 0,
          totalMeters: 0,
          error: err.message,
          duration: 0,
          newMeterIds: [],
          updatedMeterIds: [],
        },
        tenantDownloadResult: {
          success: false,
          newTenants: 0,
          updatedTenants: 0,
          totalTenants: 0,
          error: err.message,
          duration: 0,
          newTenantIds: [],
          updatedTenantIds: [],
          tenantChanges: [],
        },
        totalDuration,
        timestamp,
      };
    } finally {
      // Clear sync in progress flag
      this.isSyncInProgress = false;
    }
  }

  /**
   * Get current sync status
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
   */
  async getStatus(): Promise<SyncStatus> {
    try {
      // Get queue size from upload manager (Requirement 12.3)
      const queueSize = await this.uploadManager.getQueueSize();
      
      // Get meter and tenant counts from download manager (Requirement 12.5)
      const localMeterCount = await this.downloadManager.getLocalMeterCount();
      const localTenantCount = await this.downloadManager.getLocalTenantCount();
      const remoteMeterCount = await this.downloadManager.getRemoteMeterCount();
      const remoteTenantCount = await this.downloadManager.getRemoteTenantCount();

      // Get connection status from connection manager (Requirement 12.5)
      const connectionStatus = this.connectionManager.getStatus();

      // Return complete status (Requirements 12.1, 12.2, 12.3, 12.4, 12.5)
      return {
        isRunning: this.isRunning, // Requirement 12.1
        lastSyncTime: this.lastSyncTime, // Requirement 12.2
        lastSyncSuccess: this.lastSyncSuccess, // Requirement 12.2
        lastSyncError: this.lastSyncError, // Requirement 12.2
        queueSize, // Requirement 12.3
        totalRecordsSynced: this.totalRecordsSynced, // Requirement 12.4
        localMeterCount, // Requirement 12.5
        remoteMeterCount, // Requirement 12.5
        localTenantCount, // Requirement 12.5
        remoteTenantCount, // Requirement 12.5
        localDbConnected: connectionStatus.localConnected, // Requirement 12.5
        remoteDbConnected: connectionStatus.remoteConnected, // Requirement 12.5
      };
    } catch (error) {
      this.logger.error('Failed to get status:', error);
      
      // Return partial status on error
      return {
        isRunning: this.isRunning,
        lastSyncTime: this.lastSyncTime,
        lastSyncSuccess: this.lastSyncSuccess,
        lastSyncError: this.lastSyncError,
        queueSize: 0,
        totalRecordsSynced: this.totalRecordsSynced,
        localMeterCount: 0,
        remoteMeterCount: 0,
        localTenantCount: 0,
        remoteTenantCount: 0,
        localDbConnected: false,
        remoteDbConnected: false,
      };
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }
}

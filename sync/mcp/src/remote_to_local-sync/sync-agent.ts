/**
 * Remote to Local Sync Agent
 * 
 * Synchronizes configuration from the remote Client System database to the local Sync database.
 * Handles insert, update, and delete operations for tenants, meters, registers, and device_register associations.
 * Runs automatically on a schedule and can be manually triggered.
 * 
 * Uses generic sync functions for extensibility and code reuse.
 */

import * as cron from 'node-cron';
import { Pool } from 'pg';
import { MeterSyncResult, MeterSyncStatus, SyncDatabase, ComprehensiveSyncResult } from '../types/entities.js';
import { syncPool } from '../data-sync/data-sync.js';
import { syncMeters } from './sync-meter.js';
// import { syncRegisters, RegisterSyncResult } from './sync-register.js';
import { syncDeviceRegisters, DeviceRegisterSyncResult } from './sync-device-register.js';
import { syncTenant, TenantSyncResult } from './sync-tenant.js';
import { BACnetMeterReadingAgent } from '../bacnet-collection/bacnet-reading-agent.js';
import { DeviceRegisterCache, MeterCache } from '../cache/index.js';

export interface RemoteToLocalSyncAgentConfig {
  syncDatabase: SyncDatabase;
  remotePool: Pool;
  syncIntervalMinutes?: number;
  enableAutoSync?: boolean;
  bacnetMeterReadingAgent?: BACnetMeterReadingAgent;
  deviceRegisterCache?: DeviceRegisterCache;
  meterCache?: MeterCache;
}

export class RemoteToLocalSyncAgent {
  private syncDatabase: SyncDatabase;
  private remotePool: Pool;
  private syncIntervalMinutes: number;
  private enableAutoSync: boolean;
  private bacnetMeterReadingAgent?: BACnetMeterReadingAgent;
  private deviceRegisterCache?: DeviceRegisterCache;
  private meterCache?: MeterCache;

  private cronJob?: cron.ScheduledTask;
  private isSyncing: boolean = false;
  private status: MeterSyncStatus;
  private tenant_id?: number;

  constructor(config: RemoteToLocalSyncAgentConfig) {
    this.syncDatabase = config.syncDatabase;
    this.remotePool = config.remotePool;
    this.syncIntervalMinutes = config.syncIntervalMinutes || 60;
    this.enableAutoSync = config.enableAutoSync !== false;
    this.bacnetMeterReadingAgent = config.bacnetMeterReadingAgent;
    this.deviceRegisterCache = config.deviceRegisterCache;
    this.meterCache = config.meterCache;

    this.status = {
      isRunning: false,
      isSyncing: false,
      lastInsertedCount: 0,
      lastUpdatedCount: 0,
      lastDeletedCount: 0,
      count: 0,
      lastSyncSkipped: false,
      lastSyncSkipReason: undefined,
    };
  }

  /**
   * Start the meter sync agent with scheduled sync
   */
  async start(): Promise<void> {
    if (this.cronJob) {
      console.log('Meter sync agent already running');
      return;
    }

    console.log(`Starting meter sync agent with ${this.syncIntervalMinutes} minute interval`);

    // Get tenant ID from local database
    try {
      const tenant = await this.syncDatabase.getTenant();
      if (tenant && tenant.tenant_id) {
        this.tenant_id = tenant.tenant_id;
        console.log(`Meter sync agent configured for tenant: ${this.tenant_id}`);
      } else {
        console.warn('No tenant found in local database, meter sync will not run');
        return;
      }
    } catch (error) {
      console.error('Failed to get tenant from database:', error);
      return;
    }

    if (this.enableAutoSync) {
      // Schedule sync job
      const cronExpression = `0 */${this.syncIntervalMinutes} * * *`; // Every N hours at minute 0
      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.performSync();
      });

      console.log(`Meter sync scheduled: every ${this.syncIntervalMinutes} hour(s)`);

      // Perform initial sync
      await this.performSync();
    }

    this.status.isRunning = true;
  }

  /**
   * Stop the meter sync agent
   */
  async stop(): Promise<void> {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
      console.log('Meter sync agent stopped');
    }

    this.status.isRunning = false;
  }

  /**
   * Reload caches based on which tables were modified during sync
   * 
   * Checks the comprehensive sync result to determine which tables were modified
   * and reloads the appropriate caches:
   * - If register table modified: reload RegisterCache
   * - If meter or device_register table modified: reload MeterCache
   * 
   * @param comprehensiveResult - The sync result containing modification counts
   */
  private async reloadCachesAfterSync(comprehensiveResult: ComprehensiveSyncResult): Promise<void> {
    try {
      console.log(`\n🔄 [Cache Reload] Checking which caches need to be reloaded...`);

      // Check if meter or device_register table was modified
      const meterTableModified = 
        comprehensiveResult.meters.inserted > 0 || 
        comprehensiveResult.meters.updated > 0 || 
        comprehensiveResult.meters.deleted > 0;

      const deviceRegisterTableModified = 
        comprehensiveResult.deviceRegisters.inserted > 0 || 
        comprehensiveResult.deviceRegisters.updated > 0 || 
        comprehensiveResult.deviceRegisters.deleted > 0;

      // Reload MeterCache if meter or device_register table was modified
      if ((meterTableModified || deviceRegisterTableModified) && this.meterCache) {
        try {
          console.log(`🔄 [Cache Reload] Meter or device_register table was modified, reloading MeterCache...`);
          await this.meterCache.reload(this.syncDatabase);
          console.log(`✅ [Cache Reload] MeterCache reloaded successfully`);
        } catch (error) {
          console.error(`❌ [Cache Reload] Failed to reload MeterCache:`, error);
          // Continue even if this fails - collection will use previous cache state
        }
      }

    } catch (error) {
      console.error(`❌ [Cache Reload] Unexpected error during cache reload:`, error);
      // Don't throw - cache reload failures should not stop the sync process
    }
  }

  /**
   * Perform a single meter sync operation using generic sync functions
   */
  async performSync(): Promise<MeterSyncResult> {
    if (this.isSyncing) {
      console.log('Meter sync already in progress, skipping');
      return {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        error: 'Sync already in progress',
        timestamp: new Date(),
      };
    }

    // Check if BACnet meter collection is currently active
    if (this.bacnetMeterReadingAgent) {
      const bacnetStatus = this.bacnetMeterReadingAgent.getStatus();
      if (bacnetStatus.isRunning && bacnetStatus.lastCycleResult) {
        // Check if a cycle is currently executing by looking at the last cycle result
        // If the cycle is recent and still within the collection interval, it's likely still executing
        const lastCycleEndTime = new Date(bacnetStatus.lastCycleResult.endTime);
        const timeSinceLastCycle = Date.now() - lastCycleEndTime.getTime();
        const collectionIntervalMs = (this.bacnetMeterReadingAgent as any).config?.collectionIntervalSeconds * 1000 || 60000;
        
        // If the last cycle ended very recently (within 5 seconds), skip the sync
        if (timeSinceLastCycle < 5000) {
          const skipReason = 'BACnet meter collection cycle in progress';
          console.log(`⏭️  [Sync Agent] Skipping sync: ${skipReason}`);
          
          this.status.lastSyncSkipped = true;
          this.status.lastSyncSkipReason = skipReason;
          this.status.lastSyncTime = new Date();
          
          return {
            success: false,
            inserted: 0,
            updated: 0,
            deleted: 0,
            error: skipReason,
            timestamp: new Date(),
          };
        }
      }
    }

    this.isSyncing = true;
    this.status.isSyncing = true;
    this.status.lastSyncSkipped = false;
    this.status.lastSyncSkipReason = undefined;

    try {
      // Initialize tenant_id if not already set
      if (!this.tenant_id) {
        console.log('🔍 [Meter Sync] Tenant ID not initialized, retrieving from database...');
        try {
          const tenant = await this.syncDatabase.getTenant();
          if (!tenant) {
            throw new Error('No tenant configured in sync database');
          }
          if (!tenant.tenant_id) {
            throw new Error('Tenant ID not found in database');
          }
          this.tenant_id = tenant.tenant_id;
          console.log(`✅ [Meter Sync] Tenant ID initialized: ${this.tenant_id}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to initialize tenant: ${errorMsg}`);
        }
      }

      console.log(`\n🔄 [Sync Agent] Starting comprehensive synchronization for tenant ${this.tenant_id}...`);

      // ==================== TENANT SYNC ====================
      console.log(`\n${'='.repeat(60)}`);
      console.log(`PHASE 0: TENANT SYNCHRONIZATION`);
      console.log(`${'='.repeat(60)}`);

      let tenantSyncResult: TenantSyncResult;
      try {
        tenantSyncResult = await syncTenant(this.remotePool, syncPool, this.tenant_id);
        
        // If API key was loaded, update the SyncManager's API client
        if (tenantSyncResult.loadedApiKey) {
          console.log(`✅ [Sync Agent] API key loaded from tenant sync, updating client...`);
          // Note: The SyncManager will need to be updated separately to use this key
          // This is handled in SyncManager.start() which loads the key from the database
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`\n❌ [Tenant Sync] Sync failed:`, error);

        tenantSyncResult = {
          success: false,
          inserted: 0,
          updated: 0,
          error: errorMessage,
          timestamp: new Date(),
        };
      }

      // ==================== METER SYNC ====================
      console.log(`\n${'='.repeat(60)}`);
      console.log(`PHASE 1: METER SYNCHRONIZATION`);
      console.log(`${'='.repeat(60)}`);

      let meterSyncResult: MeterSyncResult;
      try {
        meterSyncResult = await syncMeters(this.remotePool, syncPool, this.tenant_id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`\n❌ [Meter Sync] Sync failed:`, error);

        meterSyncResult = {
          success: false,
          inserted: 0,
          updated: 0,
          deleted: 0,
          error: errorMessage,
          timestamp: new Date(),
        };
      }

      // // ==================== REGISTER SYNC ====================
      // console.log(`\n${'='.repeat(60)}`);
      // console.log(`PHASE 2: REGISTER SYNCHRONIZATION`);
      // console.log(`${'='.repeat(60)}`);

      // let registerSyncResult: RegisterSyncResult;
      // try {
      //   registerSyncResult = await syncRegisters(this.remotePool, syncPool, this.tenant_id);
      // } catch (error) {
      //   const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      //   console.error(`\n❌ [Register Sync] Sync failed:`, error);

      //   registerSyncResult = {
      //     success: false,
      //     inserted: 0,
      //     updated: 0,
      //     deleted: 0,
      //     error: errorMessage,
      //     timestamp: new Date(),
      //   };
      // }

      // ==================== DEVICE REGISTER SYNC ====================
      console.log(`\n${'='.repeat(60)}`);
      console.log(`PHASE 3: DEVICE REGISTER SYNCHRONIZATION`);
      console.log(`${'='.repeat(60)}`);

      let deviceRegisterSyncResult: DeviceRegisterSyncResult;
      try {
        deviceRegisterSyncResult = await syncDeviceRegisters(this.remotePool, syncPool);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`\n❌ [Device Register Sync] Sync failed:`, error);

        deviceRegisterSyncResult = {
          success: false,
          inserted: 0,
          updated: 0,
          deleted: 0,
          skipped: 0,
          error: errorMessage,
          timestamp: new Date(),
        };
      }

      // ==================== AGGREGATE RESULTS ====================
      console.log(`\n${'='.repeat(60)}`);
      console.log(`SYNC SUMMARY`);
      console.log(`${'='.repeat(60)}`);

      const comprehensiveResult: ComprehensiveSyncResult = {
        // success: tenantSyncResult.success && meterSyncResult.success && registerSyncResult.success && deviceRegisterSyncResult.success,
        success: tenantSyncResult.success && meterSyncResult.success  && deviceRegisterSyncResult.success,
        tenants: {
          inserted: tenantSyncResult.inserted,
          updated: tenantSyncResult.updated,
          deleted: 0
        },
        meters: {
          inserted: meterSyncResult.inserted,
          updated: meterSyncResult.updated,
          deleted: meterSyncResult.deleted,
        },
        deviceRegisters: {
          inserted: deviceRegisterSyncResult.inserted,
          updated: deviceRegisterSyncResult.updated,
          deleted: deviceRegisterSyncResult.deleted,
          skipped: deviceRegisterSyncResult.skipped,
        },
        timestamp: new Date(),
      };

      // Log any errors
      if (!tenantSyncResult.success) {
        comprehensiveResult.error = `Tenant sync failed: ${tenantSyncResult.error}`;
      } else if (!meterSyncResult.success) {
        comprehensiveResult.error = `Meter sync failed: ${meterSyncResult.error}`;
      // } else if (!registerSyncResult.success) {
      //   comprehensiveResult.error = `Register sync failed: ${registerSyncResult.error}`;
      } else if (!deviceRegisterSyncResult.success) {
        comprehensiveResult.error = `Device register sync failed: ${deviceRegisterSyncResult.error}`;
      }

      // Print summary
      console.log(`\n📊 COMPREHENSIVE SYNC RESULTS:`);
      console.log(`   Tenants:          Inserted: ${comprehensiveResult.tenants.inserted}, Updated: ${comprehensiveResult.tenants.updated}, Deleted: ${comprehensiveResult.tenants.deleted}`);
      console.log(`   Meters:           Inserted: ${comprehensiveResult.meters.inserted}, Updated: ${comprehensiveResult.meters.updated}, Deleted: ${comprehensiveResult.meters.deleted}`);
      console.log(`   Device Registers: Inserted: ${comprehensiveResult.deviceRegisters.inserted}, Updated: ${comprehensiveResult.deviceRegisters.updated}, Deleted: ${comprehensiveResult.deviceRegisters.deleted}, Skipped: ${comprehensiveResult.deviceRegisters.skipped}`);

      if (comprehensiveResult.success) {
        console.log(`\n✅ [Sync Agent] All sync operations completed successfully\n`);
      } else {
        console.log(`\n⚠️  [Sync Agent] Some sync operations failed: ${comprehensiveResult.error}\n`);
      }

      // Update status
      this.status.lastSyncTime = new Date();
      this.status.lastSyncSuccess = comprehensiveResult.success;
      this.status.lastSyncError = comprehensiveResult.error;
      this.status.lastInsertedCount = meterSyncResult.inserted;
      this.status.lastUpdatedCount = meterSyncResult.updated;
      this.status.lastDeletedCount = meterSyncResult.deleted;

      // Reload caches if sync was successful and tables were modified
      if (comprehensiveResult.success) {
        await this.reloadCachesAfterSync(comprehensiveResult);
      }

      // Return meter sync result for backward compatibility
      return {
        success: comprehensiveResult.success,
        inserted: meterSyncResult.inserted,
        updated: meterSyncResult.updated,
        deleted: meterSyncResult.deleted,
        error: comprehensiveResult.error,
        timestamp: comprehensiveResult.timestamp,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ [Sync Agent] Sync failed:`, error);

      // Log the failed sync operation
      try {
        await this.syncDatabase.logSyncOperation(0, false, errorMessage);
      } catch (logError) {
        console.error('Failed to log sync error:', logError);
      }

      // Update status
      this.status.lastSyncTime = new Date();
      this.status.lastSyncSuccess = false;
      this.status.lastSyncError = errorMessage;

      return {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        error: errorMessage,
        timestamp: new Date(),
      };
    } finally {
      this.isSyncing = false;
      this.status.isSyncing = false;
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): MeterSyncStatus {
    return { ...this.status };
  }

  /**
   * Manually trigger a sync operation
   */
  async triggerSync(): Promise<MeterSyncResult> {
    console.log('Manual meter sync triggered');
    return this.performSync();
  }
}

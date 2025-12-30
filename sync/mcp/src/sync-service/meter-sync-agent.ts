/**
 * Meter Sync Agent
 * 
 * Synchronizes meter configuration from the remote Client System database to the local Sync database.
 * Handles insert, update, and delete operations for meters filtered by tenant_id.
 * Runs automatically on a schedule and can be manually triggered.
 */

import * as cron from 'node-cron';
import { Pool } from 'pg';
import { MeterSyncResult, MeterSyncStatus, MeterEntity, SyncDatabase } from '../types/entities.js';

export interface MeterSyncAgentConfig {
  syncDatabase: SyncDatabase;
  remotePool: Pool;
  syncIntervalMinutes?: number;
  enableAutoSync?: boolean;
}

export class MeterSyncAgent {
  private syncDatabase: SyncDatabase;
  private remotePool: Pool;
  private syncIntervalMinutes: number;
  private enableAutoSync: boolean;

  private cronJob?: cron.ScheduledTask;
  private isSyncing: boolean = false;
  private status: MeterSyncStatus;
  private tenant_id?: number;

  constructor(config: MeterSyncAgentConfig) {
    this.syncDatabase = config.syncDatabase;
    this.remotePool = config.remotePool;
    this.syncIntervalMinutes = config.syncIntervalMinutes || 60;
    this.enableAutoSync = config.enableAutoSync !== false;

    this.status = {
      isRunning: false,
      isSyncing: false,
      lastInsertedCount: 0,
      lastUpdatedCount: 0,
      lastDeletedCount: 0,
      count: 0,
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
        console.log(`Meter sync agent configured for tenant ID: ${this.tenant_id}`);
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
   * Perform a single meter sync operation
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

    this.isSyncing = true;
    this.status.isSyncing = true;

    try {
      if (!this.tenant_id) {
        throw new Error('Tenant ID not configured');
      }

      console.log(`\n🔄 [Meter Sync] Starting meter synchronization for tenant ${this.tenant_id}...`);

      // Get remote meters for this tenant
      console.log(`🔍 [Meter Sync] Querying remote database for meters...`);
      const remoteMeters = await this.getRemoteMeters(this.tenant_id);
      console.log(`📋 [Meter Sync] Found ${remoteMeters.length} remote meter(s)`);

      // Get local meters
      console.log(`🔍 [Meter Sync] Querying local database for meters...`);
      const localMeters = await this.syncDatabase.getMeters(false); // Include inactive
      console.log(`📋 [Meter Sync] Found ${localMeters.length} local meter(s)`);

      // Track changes
      let insertedCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;

      // Create maps for efficient lookup
      const remoteMap = new Map(remoteMeters.map((m: MeterEntity) => [m.meter_id, m]));
      const localMap = new Map(localMeters.map((m: MeterEntity) => [m.meter_id, m]));

      // Insert new meters
      console.log(`\n➕ [Meter Sync] Processing new meters...`);
      for (const remoteMeter of remoteMeters) {
        if (!localMap.has(remoteMeter.meter_id)) {
          try {
            await this.syncDatabase.upsertMeter({
              meter_id: remoteMeter.meter_id,
              meter_element_id: remoteMeter.meter_element_id,
              ip: remoteMeter.ip,
              port: remoteMeter.port,
              active: remoteMeter.active,
              element: remoteMeter.element,
            });
            insertedCount++;
            console.log(`   ✅ Inserted meter: ${remoteMeter.meter_id} (${remoteMeter.meter_element_id})`);
          } catch (error) {
            console.error(`   ❌ Failed to insert meter ${remoteMeter.meter_id}:`, error);
          }
        }
      }

      // Update existing meters
      console.log(`\n🔄 [Meter Sync] Processing meter updates...`);
      for (const remoteMeter of remoteMeters) {
        const localMeter = localMap.get(remoteMeter.meter_id);
        if (localMeter) {
          // Check if any fields have changed
          const hasChanges =
            localMeter.ip !== remoteMeter.ip ||
            localMeter.port !== remoteMeter.port ||
            localMeter.active !== remoteMeter.active ||
            !localMeter.active;

          if (hasChanges) {
            try {
              await this.syncDatabase.upsertMeter({
                meter_id: remoteMeter.meter_id,
                meter_element_id: remoteMeter.meter_element_id,
                ip: remoteMeter.ip,
                port: remoteMeter.port,
                active: remoteMeter.active,
                element: remoteMeter.element,
              });
              updatedCount++;
              console.log(`   ✅ Updated meter: ${remoteMeter.meter_id} (${remoteMeter.meter_element_id})`);
            } catch (error) {
              console.error(`   ❌ Failed to update meter ${remoteMeter.meter_id}:`, error);
            }
          }
        }
      }

      // Deactivate deleted meters
      console.log(`\n➖ [Meter Sync] Processing deleted meters...`);
      for (const localMeter of localMeters) {
        const remoteMeter = remoteMap.get(localMeter.meter_id);
        // Deactivate if meter doesn't exist in remote or is inactive in remote
        if ((!remoteMeter || !remoteMeter.active) && localMeter.active) {
          try {
            await this.syncDatabase.deleteInactiveMeter(String(localMeter.meter_id));
            deletedCount++;
            console.log(`   ✅ Deactivated meter: ${localMeter.meter_id}`);
          } catch (error) {
            console.error(`   ❌ Failed to deactivate meter ${localMeter.meter_id}:`, error);
          }
        }
      }

      // Get updated meter count
      const updatedLocalMeters = await this.syncDatabase.getMeters(true);
      const meterCount = updatedLocalMeters.length;

      // Log the sync operation
      console.log(`\n📝 [Meter Sync] Logging sync operation...`);
      await this.syncDatabase.logSyncOperation(
        insertedCount + updatedCount + deletedCount,
        true
      );

      // Update status
      this.status.lastSyncTime = new Date();
      this.status.lastSyncSuccess = true;
      this.status.lastSyncError = undefined;
      this.status.lastInsertedCount = insertedCount;
      this.status.lastUpdatedCount = updatedCount;
      this.status.lastDeletedCount = deletedCount;
      this.status.count = meterCount;

      const result: MeterSyncResult = {
        success: true,
        inserted: insertedCount,
        updated: updatedCount,
        deleted: deletedCount,
        timestamp: new Date(),
      };

      console.log(`\n✅ [Meter Sync] Sync completed successfully`);
      console.log(`   Inserted: ${insertedCount}, Updated: ${updatedCount}, Deleted: ${deletedCount}`);
      console.log(`   Total active meters: ${meterCount}\n`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`\n❌ [Meter Sync] Sync failed:`, error);

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
   * Get meters from remote database for a specific tenant
   */
  private async getRemoteMeters(tenantId: number): Promise<MeterEntity[]> {
    try {
      const query = `
        SELECT m.id as meter_id,
               me.ip as ip,
               me.port as port,
               m.active as active,
               me.element as element,
               me.meter_element_id as meter_element_id
          FROM meter m
               JOIN meter_element me ON me.meter_id = me.id
        WHERE tenant_id = $1
      `;

      console.log(`🔍 [Meter Sync] Executing remote query for tenant ${tenantId}`);
      const result = await this.remotePool.query(query, [tenantId]);
      console.log(`✅ [Meter Sync] Remote query returned ${result.rows.length} meter(s)`);

      return result.rows as MeterEntity[];
    } catch (error) {
      console.error('Failed to query remote meters:', error);
      throw new Error(`Failed to query remote database: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

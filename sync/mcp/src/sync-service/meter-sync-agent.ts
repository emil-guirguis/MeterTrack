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
          throw new Error(`Failed to initialize tenant ID: ${errorMsg}`);
        }
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

      // Create maps for efficient lookup using composite key (meter_id, meter_element_id)
      const remoteMap = new Map(
        remoteMeters.map((m: MeterEntity) => [`${m.meter_id}:${m.meter_element_id}`, m])
      );
      const localMap = new Map(
        localMeters.map((m: MeterEntity) => [`${m.meter_id}:${m.meter_element_id}`, m])
      );

      // Deactivate deleted meters (those in local but not in remote)
      console.log(`\n➖ [Meter Sync] Processing deleted meters...`);
      for (const localMeter of localMeters) {
        const compositeKey = `${localMeter.meter_id}:${localMeter.meter_element_id}`;
        const remoteMeter = remoteMap.get(compositeKey);

        if ((remoteMeter && !remoteMeter.active) && localMeter.active) {
          try {
            await this.syncDatabase.deleteSyncMeter(localMeter.meter_id);
            deletedCount++;
            console.log(`   ✅ Deleted sync meter: ${localMeter.meter_id} (element: ${localMeter.element})`);
          } catch (error) {
            console.error(`   ❌ Failed to delete meter ${localMeter.meter_id}:`, error);
          }
        } else if (!remoteMeter) {
          try {
            await this.syncDatabase.deleteSyncMeter(localMeter.meter_id, localMeter.meter_element_id);
            deletedCount++;
            console.log(`   ✅ Deleted sync meter: ${localMeter.name} `);
          } catch (error) {
            console.error(`   ❌ Failed to delete meter ${localMeter.meter_id}:`, error);
          }
        }
      }

      // Insert new meters
      console.log(`\n➕ [Meter Sync] Processing new meters...`);
      for (const remoteMeter of remoteMeters) {
        const compositeKey = `${remoteMeter.meter_id}:${remoteMeter.meter_element_id}`;
        if (!localMap.has(compositeKey)) {
          try {
            await this.syncDatabase.upsertMeter({
              meter_id: remoteMeter.meter_id,
              name: remoteMeter.name,
              ip: remoteMeter.ip,
              port: remoteMeter.port,
              active: remoteMeter.active,
              meter_element_id: remoteMeter.meter_element_id,
              element: remoteMeter.element,
            });
            insertedCount++;
            console.log(`   ✅ Inserted meter: ${remoteMeter.name} (${remoteMeter.element})`);
          } catch (error) {
            console.error(`   ❌ Failed to insert meter ${remoteMeter.meter_id}:`, error);
          }
        }
      }

      // Update existing meters
      console.log(`\n🔄 [Meter Sync] Processing meter updates...`);
      for (const remoteMeter of remoteMeters) {
        const compositeKey = `${remoteMeter.meter_id}:${remoteMeter.meter_element_id}`;
        const localMeter = localMap.get(compositeKey);
        if (localMeter) {
          // Check if any fields have changed
          const hasChanges =
            localMeter.ip !== remoteMeter.ip ||
            localMeter.port !== remoteMeter.port ||
            localMeter.active !== remoteMeter.active ||
            localMeter.element !== remoteMeter.element ||
            !localMeter.active;

          if (hasChanges) {
            try {
              await this.syncDatabase.upsertMeter({
                meter_id: remoteMeter.meter_id,
                name: remoteMeter.name,
                ip: remoteMeter.ip,
                port: remoteMeter.port,
                active: remoteMeter.active,
                meter_element_id: remoteMeter.meter_element_id,
                element: remoteMeter.element,
              });
              updatedCount++;
              console.log(`   ✅ Updated meter: ${remoteMeter.name} (${remoteMeter.element})`);
            } catch (error) {
              console.error(`   ❌ Failed to update meter ${remoteMeter.meter_id}:`, error);
            }
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
        SELECT m.id AS meter_id, m.ip,m.port,m.active,me.element,
               me.id AS meter_element_id, 
               m.name || '-' || me.name AS name
          FROM meter m
               JOIN meter_element me ON me.meter_id = m.id 
        WHERE m.tenant_id = $1
      `;

      console.log(`🔍 [Meter Sync] Executing remote query for tenant ${tenantId}`);
      console.log(`🔍 [Meter Sync SQL]  ${query}`);
      const result = await this.remotePool.query(query, [tenantId]);
      console.log(`✅ [Meter Sync] Remote query returned ${result.rows.length} meter(s)`);
      if (result.rows.length > 0) {
        console.log(`📋 [Meter Sync] Sample meter data:`, JSON.stringify(result.rows[0], null, 2));
      }

      // Convert meter_id to number
      return result.rows.map((row: any) => ({
        ...row,
        meter_id: Number(row.meter_id),
      })) as MeterEntity[];
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

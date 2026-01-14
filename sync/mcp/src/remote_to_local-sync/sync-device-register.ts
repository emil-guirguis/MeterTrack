/**
 * Device Register Sync Functions
 * 
 * Orchestrates synchronization of the device_register junction table from the remote Client System database
 * to the local Sync database. Handles insert, update, and delete operations for device-to-register associations.
 * 
 * Note: device_register associations are NOT tenant-filtered because devices are not tenant-scoped.
 * However, referential integrity is validated to ensure associated devices and registers exist.
 */

import { Pool } from 'pg';
import {
  getRemoteEntities,
  getLocalEntities,
  upsertEntity,
  deleteEntity,
  buildCompositeKeyString,
} from '../helpers/sync-functions.js';
import { validateEntityExists } from '../helpers/entity-validation.js';

export interface DeviceRegisterSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  skipped: number;
  error?: string;
  timestamp: Date;
}

/**
 * Synchronize device_register associations from remote database to local sync database
 * 
 * Orchestrates the complete device_register sync process:
 * 1. Query remote database for all device_register associations (no tenant filtering)
 * 2. Query local database for all device_register associations
 * 3. Validate referential integrity (devices and registers must exist)
 * 4. Identify inserts (in remote, not in local)
 * 5. Identify updates (in both, with different values)
 * 6. Identify deletes (in local, not in remote)
 * 7. Execute insert/update/delete operations
 * 8. Track and return counts
 * 
 * @param remotePool - Connection pool to the remote database
 * @param syncPool - Connection pool to the local sync database
 * @returns DeviceRegisterSyncResult with counts of inserted, updated, deleted, and skipped associations
 */
export async function syncDeviceRegisters(
  remotePool: Pool,
  syncPool: Pool
): Promise<DeviceRegisterSyncResult> {
  try {
    console.log(`\n🔄 [Device Register Sync] Starting device_register synchronization...`);

    // Get remote device_register associations (no tenant filtering)
    console.log(`\n🔍 [Device Register Sync] Querying remote database for device_register associations...`);
    const remoteAssociations = await getRemoteEntities(remotePool, 'device_register', 0, 'syncDeviceRegisters');
    console.log(`📋 [Device Register Sync] Found ${remoteAssociations.length} remote device_register association(s)`);
    if (remoteAssociations.length > 0) {
      console.log(`📊 [Device Register Sync] Remote device_register data:`, JSON.stringify(remoteAssociations, null, 2));
    }

    // Get local device_register associations
    console.log(`\n🔍 [Device Register Sync] Querying local database for device_register associations...`);
    const localAssociations = await getLocalEntities(syncPool, 'device_register');
    console.log(`📋 [Device Register Sync] Found ${localAssociations.length} local device_register association(s)`);
    if (localAssociations.length > 0) {
      console.log(`📊 [Device Register Sync] Local device_register data:`, JSON.stringify(localAssociations, null, 2));
    }

    // Track changes
    let insertedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    let skippedCount = 0;

    // Create maps for efficient lookup using composite key (device_id, register_id)
    const remoteMap = new Map(
      remoteAssociations.map((a: any) => [buildCompositeKeyString(['device_id', 'register_id'], a), a])
    );
    const localMap = new Map(
      localAssociations.map((a: any) => [buildCompositeKeyString(['device_id', 'register_id'], a), a])
    );

    // Process deletes (associations in local but not in remote)
    console.log(`\n➖ [Device Register Sync] Processing associations to delete...`);
    for (const localAssociation of localAssociations) {
      const compositeKey = buildCompositeKeyString(['device_id', 'register_id'], localAssociation);
      if (!remoteMap.has(compositeKey)) {
        try {
          await deleteEntity(syncPool, 'device_register', [localAssociation.device_id, localAssociation.register_id]);
          deletedCount++;
          console.log(`   ✅ Deleted device_register: device_id=${localAssociation.device_id}, register_id=${localAssociation.register_id}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete device_register (${compositeKey}):`, error);
        }
      }
    }

    // Process inserts (associations in remote but not in local)
    console.log(`\n➕ [Device Register Sync] Processing new device_register associations...`);
    for (const remoteAssociation of remoteAssociations) {
      const compositeKey = buildCompositeKeyString(['device_id', 'register_id'], remoteAssociation);
      if (!localMap.has(compositeKey)) {
        try {
          // Validate referential integrity before inserting
          //const devieRegisterExists = await validateEntityExists(syncPool, 'device_register', remoteAssociation.device_register_id);
          const registerExists = await validateEntityExists(syncPool, 'register', remoteAssociation.register_id);

          // if (!deviceExists) {
          //   console.warn(`   ⚠️  Skipping device_register: device_id=${remoteAssociation.device_id} does not exist in sync database`);
          //   skippedCount++;
          //   continue;
          // }

          if (!registerExists) {
            console.warn(`   ⚠️  Skipping device_register: register_id=${remoteAssociation.register_id} does not exist in sync database`);
            skippedCount++;
            continue;
          }

          await upsertEntity(syncPool, 'device_register', remoteAssociation, 'sync-device.ts>syncDeviceRegisters');
          insertedCount++;
          console.log(`   ✅ Inserted device_register: device_id=${remoteAssociation.device_id}, register_id=${remoteAssociation.register_id}`);
        } catch (error) {
          console.error(`   ❌ Failed to insert device_register (${compositeKey}):`, error);
        }
      }
    }

    // Process updates (associations in both with different values)
    console.log(`\n🔄 [Device Register Sync] Processing device_register updates...`);
    for (const remoteAssociation of remoteAssociations) {
      const compositeKey = buildCompositeKeyString(['device_id', 'register_id'], remoteAssociation);
      const localAssociation = localMap.get(compositeKey);
      if (localAssociation) {
        // Check if any fields have changed
        const hasChanges =
          localAssociation.created_at !== remoteAssociation.created_at ||
          localAssociation.updated_at !== remoteAssociation.updated_at;

        if (hasChanges) {
          try {
            // Validate referential integrity before updating
           const deviceRegisterExists = await validateEntityExists(syncPool, 'device_register', remoteAssociation.device_register_id);
          const registerExists = await validateEntityExists(syncPool, 'register', remoteAssociation.register_id);

            // if (!deviceExists) {
            //   console.warn(`   ⚠️  Skipping device_register update: device_id=${remoteAssociation.device_id} does not exist in sync database`);
            //   skippedCount++;
            //   continue;
            // }

            if (!registerExists) {
              console.warn(`   ⚠️  Skipping device_register update: register_id=${remoteAssociation.register_id} does not exist in sync database`);
              skippedCount++;
              continue;
            }

            await upsertEntity(syncPool, 'device_register', remoteAssociation, 'syncDeviceRegisters');
            updatedCount++;
            console.log(`   ✅ Updated device_register: device_id=${remoteAssociation.device_id}, register_id=${remoteAssociation.register_id}`);
          } catch (error) {
            console.error(`   ❌ Failed to update device_register (${compositeKey}):`, error);
          }
        }
      }
    }

    // Log the sync operation
    console.log(`\n📝 [Device Register Sync] Logging sync operation...`);

    const result: DeviceRegisterSyncResult = {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      deleted: deletedCount,
      skipped: skippedCount,
      timestamp: new Date(),
    };

    console.log(`\n✅ [Device Register Sync] Sync completed successfully`);
    console.log(`   Inserted: ${insertedCount}, Updated: ${updatedCount}, Deleted: ${deletedCount}, Skipped: ${skippedCount}\n`);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ [Device Register Sync] Sync failed:`, error);

    return {
      success: false,
      inserted: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}

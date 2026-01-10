/**
 * Register Sync Functions
 * 
 * Orchestrates synchronization of the register table from the remote Client System database
 * to the local Sync database. Handles insert, update, and delete operations for registers
 * filtered by tenant_id.
 */

import { Pool } from 'pg';
import {
  getRemoteEntities,
  getLocalEntities,
  upsertEntity,
  deleteEntity,
  buildCompositeKeyString,
} from '../helpers/sync-functions.js';

export interface RegisterSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  error?: string;
  timestamp: Date;
}

/**
 * Synchronize registers from remote database to local sync database
 * 
 * Orchestrates the complete register sync process:
 * 1. Query remote database for all registers (filtered by tenant_id)
 * 2. Query local database for all registers
 * 3. Identify inserts (in remote, not in local)
 * 4. Identify updates (in both, with different values)
 * 5. Identify deletes (in local, not in remote)
 * 6. Execute insert/update/delete operations
 * 7. Track and return counts
 * 
 * @param remotePool - Connection pool to the remote database
 * @param syncPool - Connection pool to the local sync database
 * @param tenantId - Tenant ID for filtering registers
 * @returns RegisterSyncResult with counts of inserted, updated, and deleted registers
 */
export async function syncRegisters(
  remotePool: Pool,
  syncPool: Pool,
  tenantId: number
): Promise<RegisterSyncResult> {
  try {
    console.log(`\n🔄 [Register Sync] Starting register synchronization for tenant ${tenantId}...`);

    // Get remote registers filtered by tenant_id
    console.log(`\n🔍 [Register Sync] Querying remote database for registers...`);
    const remoteRegisters = await getRemoteEntities(remotePool, 'register', tenantId, 'syncRegisters>getRemoteEntities');
    console.log(`📋 [Register Sync] Found ${remoteRegisters.length} remote register(s)`);

    // Get local registers
    console.log(`\n🔍 [Register Sync] Querying local database for registers...`);
    const localRegisters = await getLocalEntities(syncPool, 'register');
    console.log(`📋 [Register Sync] Found ${localRegisters.length} local register(s)`);

    // Track changes
    let insertedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    // Create maps for efficient lookup using primary key (id)
    const remoteMap = new Map(remoteRegisters.map((r: any) => [r.register_id, r]));
    const localMap = new Map(localRegisters.map((r: any) => [r.register_id, r]));

    // Process deletes (registers in local but not in remote)
    console.log(`\n➖ [Register Sync] Processing registers to delete...`);
    for (const localRegister of localRegisters) {
      if (!remoteMap.has(localRegister.register_id)) {
        try {
          await deleteEntity(syncPool, 'register', localRegister.register_id);
          deletedCount++;
          console.log(`   ✅ Deleted register: ${localRegister.name} (ID: ${localRegister.register_id})`);
        } catch (error) {
          console.error(`   ❌ Failed to delete register ${localRegister.register_id}:`, error);
        }
      }
    }

    // Process inserts (registers in remote but not in local)
    console.log(`\n➕ [Register Sync] Processing new registers...`);
    for (const remoteRegister of remoteRegisters) {
      if (!localMap.has(remoteRegister.register_id)) {
        try {
          await upsertEntity(syncPool, 'register', remoteRegister, 'syncRegisters>upsertEntity1');
          insertedCount++;
          console.log(`   ✅ Inserted register: ${remoteRegister.name} (ID: ${remoteRegister.register_id})`);
        } catch (error) {
          console.error(`   ❌ Failed to insert register ${remoteRegister.register_id}:`, error);
        }
      }
    }

    // Process updates (registers in both with different values)
    console.log(`\n🔄 [Register Sync] Processing register updates...`);
    for (const remoteRegister of remoteRegisters) {
      const localRegister = localMap.get(remoteRegister.register_id);
      if (localRegister) {
        // Check if any fields have changed
        const hasChanges =
          localRegister.name !== remoteRegister.name ||
          localRegister.number !== remoteRegister.number ||
          localRegister.unit !== remoteRegister.unit ||
          localRegister.field_name !== remoteRegister.field_name;

        if (hasChanges) {
          try {
            await upsertEntity(syncPool, 'register', remoteRegister, 'syncRegisters>upsertEntity2');
            updatedCount++;
            console.log(`   ✅ Updated register: ${remoteRegister.name} (ID: ${remoteRegister.register_id})`);
          } catch (error) {
            console.error(`   ❌ Failed to update register ${remoteRegister.register_id}:`, error);
          }
        }
      }
    }

    // Log the sync operation
    console.log(`\n📝 [Register Sync] Logging sync operation...`);

    const result: RegisterSyncResult = {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      deleted: deletedCount,
      timestamp: new Date(),
    };

    console.log(`\n✅ [Register Sync] Sync completed successfully`);
    console.log(`   Inserted: ${insertedCount}, Updated: ${updatedCount}, Deleted: ${deletedCount}\n`);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ [Register Sync] Sync failed:`, error);

    return {
      success: false,
      inserted: 0,
      updated: 0,
      deleted: 0,
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}

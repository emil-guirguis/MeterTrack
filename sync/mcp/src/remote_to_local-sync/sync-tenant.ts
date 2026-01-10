/**
 * Tenant Sync Functions
 * 
 * Orchestrates synchronization of the tenant table from the remote Client System database
 * to the local Sync database. Handles insert, and update operations for tenants.
 * 
 * Note: Tenant sync is critical for loading API keys used in connectivity checks.
 */

import { Pool } from 'pg';
import {
  getRemoteEntities,
  getLocalEntities,
  upsertEntity,
} from '../helpers/sync-functions.js';
import { TenantEntity } from '../types/entities.js';

export interface TenantSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  error?: string;
  timestamp: Date;
  loadedApiKey?: string;
}

/**
 * Synchronize tenants from remote database to local sync database
 * 
 * Orchestrates the complete tenant sync process:
 * 1. Query remote database for all tenants
 * 2. Query local database for all tenants
 * 3. Identify inserts (in remote, not in local)
 * 4. Identify updates (in both, with different values)
 * 6. Execute insert/update operations
 * 7. Extract and return API key from synced tenant
 * 8. Track and return counts
 * 
 * @param remotePool - Connection pool to the remote database
 * @param syncPool - Connection pool to the local sync database
 * @param tenantId - Tenant ID to sync (optional, if not provided syncs all tenants)
 * @returns TenantSyncResult with counts of inserted, and updated tenants, plus loaded API key
 */
export async function syncTenant(
  remotePool: Pool,
  syncPool: Pool,
  tenantId: number
): Promise<TenantSyncResult> {
  try {
    console.log(`\n🔄 [Tenant Sync] Starting tenant synchronization${tenantId ? ` for tenant ${tenantId}` : ''}...`);

    // Get remote tenants
    console.log(`\n🔍 [Tenant Sync] Querying remote database for tenants...`);
    const remoteQuery = tenantId
      ? `SELECT * FROM tenant WHERE tenant_id = $1`
      : `SELECT * FROM tenant`;
    const remoteTenants = await getRemoteEntities(remotePool, 'tenant', tenantId, ' sync-tenant.ts > syncTenant1');
    console.log(`📋 [Tenant Sync] Found ${remoteTenants.length} remote tenant(s)`);

    // Get local tenants
    console.log(`\n🔍 [Tenant Sync] Querying local database for tenants...`);
    const localTenants = await getLocalEntities(syncPool, 'tenant');
    console.log(`📋 [Tenant Sync] Found ${localTenants.length} local tenant(s)`);

    // Track changes
    let insertedCount = 0;
    let updatedCount = 0;
    let loadedApiKey: string | undefined;

    // Create maps for efficient lookup using primary key (tenant_id)
    const remoteMap = new Map(remoteTenants.map((t: any) => [t.tenant_id, t]));
    const localMap = new Map(localTenants.map((t: any) => [t.tenant_id, t]));

    // Process inserts (tenants in remote but not in local)
    console.log(`\n➕ [Tenant Sync] Processing new tenants...`);
    for (const remoteTenant of remoteTenants) {
      if (!localMap.has(remoteTenant.tenant_id)) {
        try {
          await upsertEntity(syncPool, 'tenant', remoteTenant , 'sync-tenant.ts > syncTenant2');
          insertedCount++;
          console.log(`   ✅ Inserted tenant: ${remoteTenant.name} (ID: ${remoteTenant.tenant_id})`);

          // If this is the target tenant, capture its API key
          if (!tenantId || remoteTenant.tenant_id === tenantId) {
            if (remoteTenant.api_key) {
              loadedApiKey = remoteTenant.api_key;
              console.log(`   🔑 [Tenant Sync] Captured API key for tenant ${remoteTenant.tenant_id}`);
            }
          }
        } catch (error) {
          console.error(`   ❌ Failed to insert tenant ${remoteTenant.tenant_id}:`, error);
        }
      }
    }

    // Process updates (tenants in both with different values)
    console.log(`\n🔄 [Tenant Sync] Processing tenant updates...`);
    for (const remoteTenant of remoteTenants) {
      const localTenant = localMap.get(remoteTenant.tenant_id);
      if (localTenant) {
        // Check if any fields have changed
        const hasChanges =
          localTenant.name !== remoteTenant.name ||
          localTenant.url !== remoteTenant.url ||
          localTenant.street !== remoteTenant.street ||
          localTenant.street2 !== remoteTenant.street2 ||
          localTenant.city !== remoteTenant.city ||
          localTenant.state !== remoteTenant.state ||
          localTenant.zip !== remoteTenant.zip ||
          localTenant.country !== remoteTenant.country ||
          localTenant.api_key !== remoteTenant.api_key;

        if (hasChanges) {
          try {
            await upsertEntity(syncPool, 'tenant', remoteTenant, 'sync-tenant.ts > syncTenant3');
            updatedCount++;
            console.log(`   ✅ Updated tenant: ${remoteTenant.name} (ID: ${remoteTenant.tenant_id})`);

            // If this is the target tenant and API key changed, capture it
            if (!tenantId || remoteTenant.tenant_id === tenantId) {
              if (remoteTenant.api_key && remoteTenant.api_key !== localTenant.api_key) {
                loadedApiKey = remoteTenant.api_key;
                console.log(`   🔑 [Tenant Sync] Updated API key for tenant ${remoteTenant.tenant_id}`);
              }
            }
          } catch (error) {
            console.error(`   ❌ Failed to update tenant ${remoteTenant.tenant_id}:`, error);
          }
        }
      }
    }

    // If no specific tenant was requested, try to load API key from first tenant with one
    if (!loadedApiKey && remoteTenants.length > 0) {
      for (const remoteTenant of remoteTenants) {
        if (remoteTenant.api_key) {
          loadedApiKey = remoteTenant.api_key;
          console.log(`   🔑 [Tenant Sync] Loaded API key from tenant ${remoteTenant.tenant_id}`);
          break;
        }
      }
    }

    // Log the sync operation
    console.log(`\n📝 [Tenant Sync] Logging sync operation...`);

    const result: TenantSyncResult = {
      success: true,
      inserted: insertedCount,
      updated: updatedCount,
      timestamp: new Date(),
      loadedApiKey,
    };

    console.log(`\n✅ [Tenant Sync] Sync completed successfully`);
    console.log(`   Inserted: ${insertedCount}, Updated: ${updatedCount}`);
    if (loadedApiKey) {
      console.log(`   🔑 API key loaded: ${loadedApiKey.substring(0, 8)}...`);
    }
    console.log();

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ [Tenant Sync] Sync failed:`, error);

    return {
      success: false,
      inserted: 0,
      updated: 0,
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}

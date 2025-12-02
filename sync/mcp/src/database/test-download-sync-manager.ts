/**
 * Test Download Sync Manager
 * 
 * Manual test script to verify meter configuration download functionality
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DatabaseConnectionManager, createConnectionManagerFromEnv } from './connection-manager.js';
import { DownloadSyncManager } from './download-sync-manager.js';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root and sync/mcp directories
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config({ path: join(__dirname, '../../.env') });

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

async function testDownloadSyncManager() {
  let connectionManager: DatabaseConnectionManager | null = null;

  try {
    logger.info('=== Testing Download Sync Manager ===\n');

    // Initialize connection manager
    logger.info('Step 1: Initializing database connections...');
    connectionManager = createConnectionManagerFromEnv(logger);
    await connectionManager.initialize();
    logger.info('✅ Database connections initialized\n');

    // Create download sync manager
    logger.info('Step 2: Creating Download Sync Manager...');
    const downloadManager = new DownloadSyncManager({
      localPool: connectionManager.getLocalPool(),
      remotePool: connectionManager.getRemotePool(),
      logger,
    });
    logger.info('✅ Download Sync Manager created\n');

    // Get initial counts
    logger.info('Step 3: Getting initial meter counts...');
    const initialLocalCount = await downloadManager.getLocalMeterCount();
    logger.info(`Local meter count: ${initialLocalCount}\n`);

    // Execute meter sync
    logger.info('Step 4: Executing meter configuration sync...');
    const result = await downloadManager.syncMeterConfigurations();
    
    logger.info('\n=== Sync Results ===');
    logger.info(`Success: ${result.success}`);
    logger.info(`Total meters in remote: ${result.totalMeters}`);
    logger.info(`New meters added: ${result.newMeters}`);
    logger.info(`Meters updated: ${result.updatedMeters}`);
    logger.info(`Duration: ${result.duration}ms`);
    
    if (result.newMeterIds.length > 0) {
      logger.info(`New meter IDs: ${result.newMeterIds.join(', ')}`);
    }
    if (result.updatedMeterIds.length > 0) {
      logger.info(`Updated meter IDs: ${result.updatedMeterIds.join(', ')}`);
    }
    if (result.error) {
      logger.error(`Error: ${result.error}`);
    }

    // Get final counts
    logger.info('\nStep 5: Getting final meter counts...');
    const finalLocalCount = await downloadManager.getLocalMeterCount();
    logger.info(`Local meter count: ${finalLocalCount}`);
    logger.info(`Change: ${finalLocalCount - initialLocalCount > 0 ? '+' : ''}${finalLocalCount - initialLocalCount}\n`);

    // Get initial tenant counts
    logger.info('Step 6: Getting initial tenant counts...');
    const initialTenantCount = await downloadManager.getLocalTenantCount();
    logger.info(`Local tenant count: ${initialTenantCount}\n`);

    // Execute tenant sync
    logger.info('Step 7: Executing tenant data sync...');
    const tenantResult = await downloadManager.syncTenantData();
    
    logger.info('\n=== Tenant Sync Results ===');
    logger.info(`Success: ${tenantResult.success}`);
    logger.info(`Total tenants in remote: ${tenantResult.totalTenants}`);
    logger.info(`New tenants added: ${tenantResult.newTenants}`);
    logger.info(`Tenants updated: ${tenantResult.updatedTenants}`);
    logger.info(`Duration: ${tenantResult.duration}ms`);
    
    if (tenantResult.newTenantIds.length > 0) {
      logger.info(`New tenant IDs: ${tenantResult.newTenantIds.join(', ')}`);
    }
    if (tenantResult.updatedTenantIds.length > 0) {
      logger.info(`Updated tenant IDs: ${tenantResult.updatedTenantIds.join(', ')}`);
    }
    if (tenantResult.tenantChanges.length > 0) {
      logger.info('Tenant changes:');
      for (const change of tenantResult.tenantChanges) {
        logger.info(`  Tenant ${change.tenant_id}: ${change.changedFields.join(', ')}`);
      }
    }
    if (tenantResult.error) {
      logger.error(`Error: ${tenantResult.error}`);
    }

    // Get final tenant counts
    logger.info('\nStep 8: Getting final tenant counts...');
    const finalTenantCount = await downloadManager.getLocalTenantCount();
    logger.info(`Local tenant count: ${finalTenantCount}`);
    logger.info(`Change: ${finalTenantCount - initialTenantCount > 0 ? '+' : ''}${finalTenantCount - initialTenantCount}\n`);

    logger.info('=== Test Complete ===');
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  } finally {
    if (connectionManager) {
      await connectionManager.close();
      logger.info('Database connections closed');
    }
  }
}

// Run test
testDownloadSyncManager();

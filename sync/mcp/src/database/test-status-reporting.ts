/**
 * Test Status Reporting
 * 
 * Unit test to verify status reporting functionality
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import winston from 'winston';
import { SyncScheduler, SyncStatus } from './sync-scheduler.js';

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Mock managers
const mockUploadManager = {
  syncReadings: async () => ({
    success: true,
    recordsUploaded: 10,
    recordsDeleted: 10,
    duration: 100,
  }),
  getQueueSize: async () => 42, // Mock queue size
};

const mockDownloadManager = {
  syncMeterConfigurations: async () => ({
    success: true,
    newMeters: 2,
    updatedMeters: 3,
    totalMeters: 50,
    duration: 150,
    newMeterIds: [1, 2],
    updatedMeterIds: [3, 4, 5],
  }),
  syncTenantData: async () => ({
    success: true,
    newTenants: 1,
    updatedTenants: 2,
    totalTenants: 10,
    duration: 100,
    newTenantIds: [1],
    updatedTenantIds: [2, 3],
    tenantChanges: [
      { tenant_id: 2, changedFields: ['name', 'url'] },
      { tenant_id: 3, changedFields: ['active'] },
    ],
  }),
  getLocalMeterCount: async () => 50, // Mock local meter count
  getLocalTenantCount: async () => 10, // Mock local tenant count
  getRemoteMeterCount: async () => 55, // Mock remote meter count
  getRemoteTenantCount: async () => 12, // Mock remote tenant count
};

const mockConnectionManager = {
  getStatus: () => ({
    localConnected: true,
    remoteConnected: true,
    lastLocalCheck: new Date(),
    lastRemoteCheck: new Date(),
  }),
};

async function testStatusReporting() {
  try {
    logger.info('=== Testing Status Reporting ===\n');

    // 1. Create sync scheduler
    logger.info('1. Creating sync scheduler...');
    const scheduler = new SyncScheduler({
      uploadManager: mockUploadManager as any,
      downloadManager: mockDownloadManager as any,
      connectionManager: mockConnectionManager,
      intervalSeconds: 60,
      logger,
    });
    logger.info('✓ Sync scheduler created\n');

    // 2. Test initial status (before any sync)
    logger.info('2. Testing initial status (before any sync)...');
    const initialStatus = await scheduler.getStatus();
    
    // Verify initial status
    logger.info('Initial status:');
    logger.info(`  - isRunning: ${initialStatus.isRunning} (expected: false)`);
    logger.info(`  - lastSyncTime: ${initialStatus.lastSyncTime} (expected: undefined)`);
    logger.info(`  - lastSyncSuccess: ${initialStatus.lastSyncSuccess} (expected: false)`);
    logger.info(`  - queueSize: ${initialStatus.queueSize} (expected: 42)`);
    logger.info(`  - totalRecordsSynced: ${initialStatus.totalRecordsSynced} (expected: 0)`);
    logger.info(`  - localMeterCount: ${initialStatus.localMeterCount} (expected: 50)`);
    logger.info(`  - remoteMeterCount: ${initialStatus.remoteMeterCount} (expected: 55)`);
    logger.info(`  - localTenantCount: ${initialStatus.localTenantCount} (expected: 10)`);
    logger.info(`  - remoteTenantCount: ${initialStatus.remoteTenantCount} (expected: 12)`);
    logger.info(`  - localDbConnected: ${initialStatus.localDbConnected} (expected: true)`);
    logger.info(`  - remoteDbConnected: ${initialStatus.remoteDbConnected} (expected: true)`);
    
    // Assertions for initial status
    if (initialStatus.isRunning !== false) {
      throw new Error('Initial isRunning should be false');
    }
    if (initialStatus.lastSyncTime !== undefined) {
      throw new Error('Initial lastSyncTime should be undefined');
    }
    if (initialStatus.queueSize !== 42) {
      throw new Error(`Queue size should be 42, got ${initialStatus.queueSize}`);
    }
    if (initialStatus.totalRecordsSynced !== 0) {
      throw new Error('Initial totalRecordsSynced should be 0');
    }
    if (initialStatus.localMeterCount !== 50) {
      throw new Error(`Local meter count should be 50, got ${initialStatus.localMeterCount}`);
    }
    if (initialStatus.remoteMeterCount !== 55) {
      throw new Error(`Remote meter count should be 55, got ${initialStatus.remoteMeterCount}`);
    }
    if (initialStatus.localTenantCount !== 10) {
      throw new Error(`Local tenant count should be 10, got ${initialStatus.localTenantCount}`);
    }
    if (initialStatus.remoteTenantCount !== 12) {
      throw new Error(`Remote tenant count should be 12, got ${initialStatus.remoteTenantCount}`);
    }
    if (initialStatus.localDbConnected !== true) {
      throw new Error('Local DB should be connected');
    }
    if (initialStatus.remoteDbConnected !== true) {
      throw new Error('Remote DB should be connected');
    }
    logger.info('✓ Initial status verified\n');

    // 3. Execute one sync cycle
    logger.info('3. Executing one sync cycle...');
    const cycleResult = await scheduler.executeSyncCycle();
    logger.info(`✓ Sync cycle completed (success: ${cycleResult.success})\n`);

    // 4. Test status after sync
    logger.info('4. Testing status after sync...');
    const afterSyncStatus = await scheduler.getStatus();
    
    logger.info('Status after sync:');
    logger.info(`  - isRunning: ${afterSyncStatus.isRunning} (expected: false)`);
    logger.info(`  - lastSyncTime: ${afterSyncStatus.lastSyncTime} (expected: defined)`);
    logger.info(`  - lastSyncSuccess: ${afterSyncStatus.lastSyncSuccess} (expected: true)`);
    logger.info(`  - totalRecordsSynced: ${afterSyncStatus.totalRecordsSynced} (expected: 10)`);
    logger.info(`  - queueSize: ${afterSyncStatus.queueSize} (expected: 42)`);
    
    // Assertions for after sync status
    if (afterSyncStatus.lastSyncTime === undefined) {
      throw new Error('lastSyncTime should be defined after sync');
    }
    if (afterSyncStatus.lastSyncSuccess !== true) {
      throw new Error('lastSyncSuccess should be true after successful sync');
    }
    if (afterSyncStatus.totalRecordsSynced !== 10) {
      throw new Error(`totalRecordsSynced should be 10, got ${afterSyncStatus.totalRecordsSynced}`);
    }
    logger.info('✓ Status after sync verified\n');

    // 5. Start scheduler
    logger.info('5. Starting scheduler...');
    scheduler.start();
    logger.info('✓ Scheduler started\n');

    // 6. Test status while running
    logger.info('6. Testing status while running...');
    const runningStatus = await scheduler.getStatus();
    
    logger.info('Status while running:');
    logger.info(`  - isRunning: ${runningStatus.isRunning} (expected: true)`);
    
    if (runningStatus.isRunning !== true) {
      throw new Error('isRunning should be true when scheduler is started');
    }
    logger.info('✓ Running status verified\n');

    // 7. Stop scheduler
    logger.info('7. Stopping scheduler...');
    await scheduler.stop();
    logger.info('✓ Scheduler stopped\n');

    // 8. Test final status
    logger.info('8. Testing final status...');
    const finalStatus = await scheduler.getStatus();
    
    logger.info('Final status:');
    logger.info(`  - isRunning: ${finalStatus.isRunning} (expected: false)`);
    logger.info(`  - lastSyncTime: ${finalStatus.lastSyncTime} (expected: defined)`);
    logger.info(`  - totalRecordsSynced: ${finalStatus.totalRecordsSynced} (expected: >= 10)`);
    
    if (finalStatus.isRunning !== false) {
      throw new Error('isRunning should be false after stop');
    }
    if (finalStatus.totalRecordsSynced < 10) {
      throw new Error(`totalRecordsSynced should be >= 10, got ${finalStatus.totalRecordsSynced}`);
    }
    logger.info('✓ Final status verified\n');

    logger.info('=== All status reporting tests passed ===');
    logger.info('\nStatus reporting implementation satisfies requirements:');
    logger.info('  ✓ 12.1: Reports running state (isRunning)');
    logger.info('  ✓ 12.2: Reports last sync time and success/error');
    logger.info('  ✓ 12.3: Reports queue size from local database');
    logger.info('  ✓ 12.4: Reports total records synced since startup');
    logger.info('  ✓ 12.5: Reports connection status and meter/tenant counts');
    
  } catch (error) {
    logger.error('Test failed:', error);
    throw error;
  }
}

// Run test
testStatusReporting().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

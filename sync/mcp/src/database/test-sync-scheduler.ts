/**
 * Test Sync Scheduler
 * 
 * Manual test script to verify sync scheduler functionality
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import { DatabaseConnectionManager, createConnectionManagerFromEnv } from './connection-manager.js';
import { UploadSyncManager } from './upload-sync-manager.js';
import { DownloadSyncManager } from './download-sync-manager.js';
import { SyncScheduler } from './sync-scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

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

async function testSyncScheduler() {
  let connectionManager: DatabaseConnectionManager | null = null;
  let scheduler: SyncScheduler | null = null;

  try {
    logger.info('=== Testing Sync Scheduler ===\n');

    // 1. Initialize connection manager
    logger.info('1. Initializing connection manager...');
    connectionManager = createConnectionManagerFromEnv(logger);
    await connectionManager.initialize();
    logger.info('✓ Connection manager initialized\n');

    // 2. Create upload and download managers
    logger.info('2. Creating sync managers...');
    const uploadManager = new UploadSyncManager({
      localPool: connectionManager.getLocalPool(),
      remotePool: connectionManager.getRemotePool(),
      batchSize: 100,
      logger,
    });

    const downloadManager = new DownloadSyncManager({
      localPool: connectionManager.getLocalPool(),
      remotePool: connectionManager.getRemotePool(),
      logger,
    });
    logger.info('✓ Sync managers created\n');

    // 3. Create sync scheduler with short interval for testing
    logger.info('3. Creating sync scheduler...');
    scheduler = new SyncScheduler({
      uploadManager,
      downloadManager,
      connectionManager,
      intervalSeconds: 10, // 10 seconds for testing
      logger,
    });
    logger.info('✓ Sync scheduler created\n');

    // 4. Get initial status
    logger.info('4. Getting initial status...');
    const initialStatus = await scheduler.getStatus();
    logger.info('Initial status:', JSON.stringify(initialStatus, null, 2));
    logger.info('');

    // 5. Execute one sync cycle manually
    logger.info('5. Executing one sync cycle manually...');
    const cycleResult = await scheduler.executeSyncCycle();
    logger.info('Sync cycle result:', JSON.stringify(cycleResult, null, 2));
    logger.info('');

    // 6. Get status after sync
    logger.info('6. Getting status after sync...');
    const afterSyncStatus = await scheduler.getStatus();
    logger.info('Status after sync:', JSON.stringify(afterSyncStatus, null, 2));
    logger.info('');

    // 7. Start scheduler (will run for 30 seconds)
    logger.info('7. Starting scheduler (will run for 30 seconds)...');
    scheduler.start();
    logger.info('✓ Scheduler started\n');

    // Wait for 30 seconds to let it run a few cycles
    logger.info('Waiting 30 seconds for scheduler to run...');
    await sleep(30000);

    // 8. Get status while running
    logger.info('8. Getting status while running...');
    const runningStatus = await scheduler.getStatus();
    logger.info('Running status:', JSON.stringify(runningStatus, null, 2));
    logger.info('');

    // 9. Stop scheduler gracefully
    logger.info('9. Stopping scheduler gracefully...');
    await scheduler.stop();
    logger.info('✓ Scheduler stopped\n');

    // 10. Get final status
    logger.info('10. Getting final status...');
    const finalStatus = await scheduler.getStatus();
    logger.info('Final status:', JSON.stringify(finalStatus, null, 2));
    logger.info('');

    logger.info('=== All tests completed successfully ===');
  } catch (error) {
    logger.error('Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    if (scheduler) {
      try {
        await scheduler.stop();
      } catch (error) {
        logger.error('Error stopping scheduler:', error);
      }
    }

    if (connectionManager) {
      await connectionManager.close();
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run test
testSyncScheduler().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

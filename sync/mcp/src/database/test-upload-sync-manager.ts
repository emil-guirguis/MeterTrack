/**
 * Test script for Upload Sync Manager
 * 
 * Tests uploading meter readings from local to remote database
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import winston from 'winston';
import { createConnectionManagerFromEnv } from './connection-manager.js';
import { UploadSyncManager } from './upload-sync-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../../.env') }); // Root .env
dotenv.config({ path: join(__dirname, '../../.env') }); // Local .env

// Configure logger
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

async function testUploadSyncManager() {
  logger.info('=== Testing Upload Sync Manager ===');
  
  let connectionManager;
  
  try {
    // Create connection manager
    logger.info('Creating connection manager...');
    connectionManager = createConnectionManagerFromEnv(logger);
    
    // Initialize connections
    logger.info('Initializing connections...');
    await connectionManager.initialize();
    
    // Create upload sync manager
    logger.info('Creating upload sync manager...');
    const uploadSyncManager = new UploadSyncManager({
      localPool: connectionManager.getLocalPool(),
      remotePool: connectionManager.getRemotePool(),
      batchSize: 100,
      maxQueryRetries: 3,
      logger,
    });
    
    // Get initial queue size
    logger.info('\n=== Checking Queue Size ===');
    const queueSize = await uploadSyncManager.getQueueSize();
    logger.info(`Queue size: ${queueSize} unsynchronized readings`);
    
    // Insert test data if queue is empty
    if (queueSize === 0) {
      logger.info('\n=== Inserting Test Data ===');
      const localPool = connectionManager.getLocalPool();
      
      // Get a valid meter_id from the database
      const meterResult = await localPool.query('SELECT id FROM meter LIMIT 1');
      
      if (meterResult.rows.length === 0) {
        logger.warn('No meters found in database. Skipping test data insertion.');
      } else {
        const meterId = meterResult.rows[0].id;
        
        // Insert test meter readings with actual schema
        await localPool.query(`
          INSERT INTO meter_reading (
            meter_id, createdat, energy, power, voltage, current, 
            frequency, tenant_id, is_synchronized
          )
          VALUES 
            ($1, NOW() - INTERVAL '1 hour', 100.5, 50.2, 230.0, 10.5, 50.0, 1, false),
            ($1, NOW() - INTERVAL '30 minutes', 200.3, 75.8, 231.0, 15.2, 50.1, 1, false),
            ($1, NOW() - INTERVAL '15 minutes', 150.7, 60.1, 229.5, 12.8, 49.9, 1, false)
        `, [meterId]);
        
        logger.info('Inserted 3 test meter readings');
        
        const newQueueSize = await uploadSyncManager.getQueueSize();
        logger.info(`New queue size: ${newQueueSize} unsynchronized readings`);
      }
    }
    
    // Perform sync
    logger.info('\n=== Performing Upload Sync ===');
    const result = await uploadSyncManager.syncReadings();
    
    logger.info('Sync Result:', {
      success: result.success,
      recordsUploaded: result.recordsUploaded,
      recordsDeleted: result.recordsDeleted,
      duration: `${result.duration}ms`,
      error: result.error,
    });
    
    // Verify data in remote database
    if (result.success && result.recordsUploaded > 0) {
      logger.info('\n=== Verifying Remote Database ===');
      const remotePool = connectionManager.getRemotePool();
      const remoteResult = await remotePool.query(
        `SELECT COUNT(*) as count FROM meter_reading WHERE createdat >= NOW() - INTERVAL '2 hours'`
      );
      logger.info(`Remote database has ${remoteResult.rows[0].count} recent meter readings`);
    }
    
    // Check final queue size
    logger.info('\n=== Final Queue Size ===');
    const finalQueueSize = await uploadSyncManager.getQueueSize();
    logger.info(`Final queue size: ${finalQueueSize} unsynchronized readings`);
    
    // Close connections
    logger.info('\n=== Closing Connections ===');
    await connectionManager.close();
    
    if (result.success) {
      logger.info('\n✅ All tests passed!');
    } else {
      logger.error('\n❌ Test failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    logger.error('❌ Test failed:', error);
    
    // Close connections on error
    if (connectionManager) {
      try {
        await connectionManager.close();
      } catch (closeError) {
        logger.error('Failed to close connections:', closeError);
      }
    }
    
    process.exit(1);
  }
}

// Run test
testUploadSyncManager();

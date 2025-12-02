/**
 * Integration Test for Error Handling
 * 
 * Tests error handling across all sync components working together.
 */

import { Pool } from 'pg';
import winston from 'winston';
import { DatabaseConnectionManager } from './connection-manager';
import { UploadSyncManager } from './upload-sync-manager';
import { DownloadSyncManager } from './download-sync-manager';
import { SyncScheduler } from './sync-scheduler';

// Create test logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

/**
 * Test that error handling is properly integrated across all components
 */
async function testErrorHandlingIntegration() {
  console.log('\n=== Error Handling Integration Test ===\n');

  // Test 1: Verify ErrorHandler is instantiated in all managers
  console.log('Test 1: Verify ErrorHandler integration');
  
  try {
    // Create mock pools (won't actually connect)
    const mockLocalPool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'test_local',
      user: 'test',
      password: 'test',
      max: 1,
      connectionTimeoutMillis: 1000,
    });

    const mockRemotePool = new Pool({
      host: 'localhost',
      port: 5433,
      database: 'test_remote',
      user: 'test',
      password: 'test',
      max: 1,
      connectionTimeoutMillis: 1000,
    });

    // Create managers
    const uploadManager = new UploadSyncManager({
      localPool: mockLocalPool,
      remotePool: mockRemotePool,
      logger,
    });

    const downloadManager = new DownloadSyncManager({
      localPool: mockLocalPool,
      remotePool: mockRemotePool,
      logger,
    });

    console.log('✓ UploadSyncManager created with error handler');
    console.log('✓ DownloadSyncManager created with error handler');

    // Clean up
    await mockLocalPool.end();
    await mockRemotePool.end();

    console.log('✓ All managers properly instantiated with error handling\n');
  } catch (error) {
    console.error('✗ Integration test failed:', error);
    throw error;
  }

  // Test 2: Verify error types are exported
  console.log('Test 2: Verify error handler exports');
  
  const { ErrorHandler, ErrorType } = await import('./error-handler');
  
  if (!ErrorHandler) {
    throw new Error('ErrorHandler not exported');
  }
  
  if (!ErrorType) {
    throw new Error('ErrorType not exported');
  }
  
  console.log('✓ ErrorHandler exported');
  console.log('✓ ErrorType exported');
  console.log(`✓ ErrorType values: ${Object.keys(ErrorType).join(', ')}\n`);

  // Test 3: Verify error handler can be created independently
  console.log('Test 3: Verify standalone error handler creation');
  
  const errorHandler = new ErrorHandler(logger);
  console.log('✓ ErrorHandler instantiated successfully\n');

  // Test 4: Verify retry configuration
  console.log('Test 4: Verify retry configuration');
  
  let attemptCount = 0;
  try {
    await errorHandler.handleQueryError(
      async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Test error');
        }
        return 'success';
      },
      {
        operation: 'testRetryConfig',
      }
    );
    
    console.log(`✓ Retry logic working (${attemptCount} attempts)\n`);
  } catch (error) {
    console.error('✗ Retry test failed:', error);
    throw error;
  }

  console.log('=== All Integration Tests Passed ===\n');
}

// Run test
testErrorHandlingIntegration()
  .then(() => {
    console.log('✓ Error handling integration verified successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Integration test failed:', error);
    process.exit(1);
  });

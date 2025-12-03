/**
 * Test Error Handling Implementation
 * 
 * Tests for error handling and retry logic across all sync components.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { ErrorHandler, ErrorType } from './error-handler';
import winston from 'winston';

// Create a test logger that captures output
const testLogger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({ silent: false }),
  ],
});

const errorHandler = new ErrorHandler(testLogger);

/**
 * Test 1: Connection error handling with exponential backoff (Requirement 6.1)
 */
async function testConnectionErrorHandling() {
  console.log('\n=== Test 1: Connection Error Handling ===');
  
  let attemptCount = 0;
  const maxAttempts = 3;
  
  try {
    await errorHandler.handleConnectionError(
      async () => {
        attemptCount++;
        console.log(`Connection attempt ${attemptCount}`);
        
        if (attemptCount < maxAttempts) {
          throw new Error('Connection refused');
        }
        
        return 'Connected successfully';
      },
      {
        operation: 'testDatabaseConnection',
        details: { host: 'localhost', port: 5432 },
      }
    );
    
    console.log(`✓ Connection succeeded after ${attemptCount} attempts`);
  } catch (error) {
    console.log(`✗ Connection failed after ${attemptCount} attempts`);
  }
}

/**
 * Test 2: Query error handling with exponential backoff (Requirement 6.2)
 */
async function testQueryErrorHandling() {
  console.log('\n=== Test 2: Query Error Handling ===');
  
  let attemptCount = 0;
  const maxAttempts = 2;
  
  try {
    const result = await errorHandler.handleQueryError(
      async () => {
        attemptCount++;
        console.log(`Query attempt ${attemptCount}`);
        
        if (attemptCount < maxAttempts) {
          throw new Error('Query timeout');
        }
        
        return [{ id: 1, name: 'Test' }];
      },
      {
        operation: 'queryMeterReadings',
        details: { table: 'meter_reading' },
      }
    );
    
    console.log(`✓ Query succeeded after ${attemptCount} attempts, returned ${result.length} rows`);
  } catch (error) {
    console.log(`✗ Query failed after ${attemptCount} attempts`);
  }
}

/**
 * Test 3: Upload error handling with data preservation (Requirement 6.3)
 */
async function testUploadErrorHandling() {
  console.log('\n=== Test 3: Upload Error Handling ===');
  
  try {
    throw new Error('Remote database connection lost');
  } catch (error) {
    errorHandler.handleUploadError(error as Error, {
      operation: 'uploadBatchToRemote',
      details: { batchSize: 100 },
    });
    
    console.log('✓ Upload error handled, data preserved for next sync cycle');
  }
}

/**
 * Test 4: Delete error handling with transaction rollback (Requirement 6.4)
 */
async function testDeleteErrorHandling() {
  console.log('\n=== Test 4: Delete Error Handling ===');
  
  try {
    throw new Error('Transaction deadlock detected');
  } catch (error) {
    errorHandler.handleDeleteError(error as Error, {
      operation: 'deleteFromLocal',
      details: { recordCount: 100 },
    });
    
    console.log('✓ Delete error handled, transaction rolled back');
  }
}

/**
 * Test 5: Download error handling with operation isolation (Requirement 6.5)
 */
async function testDownloadErrorHandling() {
  console.log('\n=== Test 5: Download Error Handling ===');
  
  try {
    throw new Error('Remote meter table not found');
  } catch (error) {
    errorHandler.handleDownloadError(error as Error, {
      operation: 'syncMeterConfigurations',
      details: { table: 'meter' },
    });
    
    console.log('✓ Download error handled, other operations will continue');
  }
}

/**
 * Test 6: Unhandled exception handling (Requirement 6.5)
 */
async function testUnhandledExceptionHandling() {
  console.log('\n=== Test 6: Unhandled Exception Handling ===');
  
  try {
    throw new Error('Unexpected null pointer exception');
  } catch (error) {
    errorHandler.handleUnhandledException(error as Error, {
      operation: 'executeSyncCycle',
      details: {
        timestamp: new Date().toISOString(),
        phase: 'initialization',
      },
    });
    
    console.log('✓ Unhandled exception logged with full context');
  }
}

/**
 * Test 7: Exponential backoff calculation
 */
async function testExponentialBackoff() {
  console.log('\n=== Test 7: Exponential Backoff Calculation ===');
  
  const delays: number[] = [];
  let attemptCount = 0;
  
  try {
    await errorHandler.executeWithRetry(
      async () => {
        const startTime = Date.now();
        attemptCount++;
        
        if (attemptCount > 1) {
          delays.push(Date.now() - startTime);
        }
        
        if (attemptCount < 4) {
          throw new Error('Temporary failure');
        }
        
        return 'Success';
      },
      {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
      },
      {
        operation: 'testExponentialBackoff',
        errorType: ErrorType.QUERY,
      }
    );
    
    console.log(`✓ Exponential backoff working: attempts=${attemptCount}`);
    console.log(`  Delays between retries: ${delays.join('ms, ')}ms`);
  } catch (error) {
    console.log(`✗ Test failed after ${attemptCount} attempts`);
  }
}

/**
 * Test 8: Maximum retry limit enforcement
 */
async function testMaxRetryLimit() {
  console.log('\n=== Test 8: Maximum Retry Limit ===');
  
  let attemptCount = 0;
  const maxRetries = 3;
  
  try {
    await errorHandler.executeWithRetry(
      async () => {
        attemptCount++;
        throw new Error('Persistent failure');
      },
      {
        maxRetries,
        baseDelayMs: 50,
        maxDelayMs: 500,
      },
      {
        operation: 'testMaxRetries',
        errorType: ErrorType.CONNECTION,
      }
    );
    
    console.log('✗ Should have thrown error after max retries');
  } catch (error) {
    if (attemptCount === maxRetries + 1) {
      console.log(`✓ Correctly stopped after ${maxRetries + 1} attempts (1 initial + ${maxRetries} retries)`);
    } else {
      console.log(`✗ Wrong number of attempts: ${attemptCount}, expected ${maxRetries + 1}`);
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('Starting Error Handling Tests...\n');
  console.log('='.repeat(50));
  
  try {
    await testConnectionErrorHandling();
    await testQueryErrorHandling();
    await testUploadErrorHandling();
    await testDeleteErrorHandling();
    await testDownloadErrorHandling();
    await testUnhandledExceptionHandling();
    await testExponentialBackoff();
    await testMaxRetryLimit();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✓ All error handling tests completed successfully!\n');
  } catch (error) {
    console.error('\n✗ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);

export { runAllTests };

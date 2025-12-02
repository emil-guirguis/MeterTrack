# Upload Sync Manager Implementation

## Overview

The Upload Sync Manager has been successfully implemented to handle uploading meter readings from the local database to the remote database. This implementation fulfills all requirements specified in the design document.

## Implementation Details

### Files Created

1. **`src/database/upload-sync-manager.ts`** - Main Upload Sync Manager class
2. **`src/database/test-upload-sync-manager.ts`** - Test script for the Upload Sync Manager
3. **`migrations/004_add_sync_columns_to_meter_readings.sql`** - Migration to add `is_synchronized` column
4. **`run-migration.mjs`** - Simple migration runner script
5. **`check-schema.mjs`** - Schema inspection utility
6. **`insert-test-data.mjs`** - Test data insertion script

### Key Features Implemented

#### 1. Query Unsynchronized Readings (Requirements 2.1-2.5)
- Queries meter_readings table for records where `is_synchronized = false`
- Limits results to configurable batch size (default: 100 records)
- Orders by `createdat ASC` to process oldest readings first
- Implements retry logic with exponential backoff (max 3 retries)
- Handles all columns dynamically to support the complex production schema

#### 2. Batch Upload to Remote Database (Requirements 3.1-3.5)
- Uses PostgreSQL transactions for atomicity
- Builds dynamic batch INSERT statements based on actual columns
- Excludes `is_synchronized` column from remote insert
- Commits transaction on success
- Rolls back transaction on failure
- Comprehensive error logging

#### 3. Delete from Local Database (Requirements 4.1-4.5)
- Deletes successfully uploaded readings using UUID array
- Uses transactions to ensure atomicity
- Rolls back on failure to preserve data
- Returns count of deleted records
- Graceful error handling without throwing exceptions

#### 4. Error Handling
- Exponential backoff retry logic for queries
- Transaction rollback on all failures
- Comprehensive logging at all stages
- Data preservation on errors (readings remain for next sync cycle)

#### 5. Queue Management
- `getQueueSize()` method to check unsynchronized reading count
- Efficient counting query with proper indexing

### Schema Adaptations

The implementation was adapted to work with the actual production schema:

**Local Database (Sync Server):**
- Table: `meter_readings`
- Primary Key: `id` (UUID)
- Foreign Key: `meter_id` (bigint)
- Timestamp: `createdat` (timestamp with time zone)
- Sync Flag: `is_synchronized` (boolean) - added by migration
- 100+ columns for various meter reading data points

**Remote Database (Client Server):**
- Same schema as local (minus `is_synchronized` column)

### Configuration

The Upload Sync Manager accepts the following configuration:

```typescript
interface UploadSyncManagerConfig {
  localPool: Pool;           // PostgreSQL connection pool for local DB
  remotePool: Pool;          // PostgreSQL connection pool for remote DB
  batchSize?: number;        // Default: 100
  maxQueryRetries?: number;  // Default: 3
  logger?: winston.Logger;   // Optional custom logger
}
```

### Usage Example

```typescript
import { DatabaseConnectionManager, UploadSyncManager } from './database';

// Create connection manager
const connectionManager = createConnectionManagerFromEnv();
await connectionManager.initialize();

// Create upload sync manager
const uploadSyncManager = new UploadSyncManager({
  localPool: connectionManager.getLocalPool(),
  remotePool: connectionManager.getRemotePool(),
  batchSize: 100,
  maxQueryRetries: 3,
});

// Perform sync
const result = await uploadSyncManager.syncReadings();

console.log(`Uploaded: ${result.recordsUploaded}, Deleted: ${result.recordsDeleted}`);
```

### Testing

The implementation includes:

1. **Unit Test Script** (`test-upload-sync-manager.ts`)
   - Tests connection initialization
   - Tests queue size checking
   - Tests sync operation
   - Tests data verification in remote database
   - Graceful connection cleanup

2. **Migration Script** (`run-migration.mjs`)
   - Adds `is_synchronized` column to existing tables
   - Creates index for efficient sync queries

3. **Test Data Script** (`insert-test-data.mjs`)
   - Inserts test meter readings for sync testing
   - Validates foreign key constraints

### Test Results

✅ All tests passed successfully:
- Database connections established (local and remote)
- Upload Sync Manager created successfully
- Queue size queried correctly
- Sync operation completed without errors
- Connections closed gracefully

### Requirements Coverage

| Requirement | Status | Implementation |
|------------|--------|----------------|
| 2.1 | ✅ | Query meter_readings where is_synchronized = false |
| 2.2 | ✅ | Limit to 100 records (configurable) |
| 2.3 | ✅ | Handle empty queue gracefully |
| 2.4 | ✅ | Retrieve all columns dynamically |
| 2.5 | ✅ | Retry with exponential backoff on query failure |
| 3.1 | ✅ | Insert to remote meter_readings table |
| 3.2 | ✅ | Single batch INSERT statement |
| 3.3 | ✅ | Use transaction for atomicity |
| 3.4 | ✅ | Commit on success |
| 3.5 | ✅ | Rollback on failure with error logging |
| 4.1 | ✅ | Delete after successful upload |
| 4.2 | ✅ | Use record IDs from uploaded batch |
| 4.3 | ✅ | Use transaction for delete |
| 4.4 | ✅ | Commit and log count on success |
| 4.5 | ✅ | Rollback on failure without retry |

### Next Steps

The Upload Sync Manager is complete and ready for integration with:
1. Download Sync Manager (Task 3 & 4)
2. Sync Scheduler (Task 5)
3. Comprehensive logging (Task 6)
4. Status reporting (Task 7)

### Notes

- The implementation uses dynamic column handling to support the complex production schema with 100+ columns
- UUID primary keys are properly handled
- Foreign key constraints are respected
- The `is_synchronized` flag was added via migration to the existing production schema
- All error scenarios are handled gracefully with proper transaction management

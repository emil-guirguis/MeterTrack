# Requirements Document: Sync Database Missing Methods

## Introduction

The Sync MCP server is failing with an error "Use SyncDatabase from connection-pools" when trying to call `getUnsynchronizedCount()` on the database instance. The `SyncDatabase` interface defines several required methods that are not implemented in the `SyncDatabase` class, causing runtime errors when the API server tries to use them.

## Glossary

- **SyncDatabase**: Interface defining the contract for database operations in the sync system
- **SyncDatabase Class**: The concrete implementation of the SyncDatabase interface
- **Unsynchronized Readings**: Meter readings that have not yet been synced to the remote database
- **Sync Log**: Records of synchronization operations including batch size, success status, and errors
- **Queue Size**: The count of unsynchronized readings waiting to be synced

## Requirements

### Requirement 1: Implement getUnsynchronizedCount Method

**User Story:** As a sync API consumer, I want to query the count of unsynchronized readings, so that I can monitor the sync queue size and display it in the UI.

#### Acceptance Criteria

1. WHEN the API calls `database.getUnsynchronizedCount()`, THE SyncDatabase SHALL return the count of meter_reading records where `is_synchronized = false`
2. WHEN there are no unsynchronized readings, THE SyncDatabase SHALL return 0
3. WHEN the query fails, THE SyncDatabase SHALL throw an error with a descriptive message
4. THE method SHALL execute efficiently without locking the database

### Requirement 2: Implement getMeters Method

**User Story:** As a sync service, I want to retrieve all meters from the local database, so that I can manage meter synchronization and display meter information.

#### Acceptance Criteria

1. WHEN `database.getMeters(true)` is called with `activeOnly = true`, THE SyncDatabase SHALL return only meters where `active = true`
2. WHEN `database.getMeters(false)` is called with `activeOnly = false`, THE SyncDatabase SHALL return all meters regardless of active status
3. WHEN there are no meters, THE SyncDatabase SHALL return an empty array
4. WHEN the query fails, THE SyncDatabase SHALL throw an error with a descriptive message

### Requirement 3: Implement logSyncOperation Method

**User Story:** As a sync service, I want to log synchronization operations, so that I can track sync history and debug issues.

#### Acceptance Criteria

1. WHEN `database.logSyncOperation(batchSize, success, errorMessage)` is called, THE SyncDatabase SHALL insert a record into the sync_log table
2. WHEN `success = true`, THE SyncDatabase SHALL insert a record with `error_message = NULL`
3. WHEN `success = false`, THE SyncDatabase SHALL insert a record with the provided error message
4. THE method SHALL automatically set `synced_at` to the current timestamp
5. WHEN the insert fails, THE SyncDatabase SHALL throw an error with a descriptive message

### Requirement 4: Implement getUnsynchronizedReadings Method

**User Story:** As a sync service, I want to retrieve unsynchronized readings in batches, so that I can process them for synchronization.

#### Acceptance Criteria

1. WHEN `database.getUnsynchronizedReadings(limit)` is called, THE SyncDatabase SHALL return up to `limit` meter_reading records where `is_synchronized = false`
2. WHEN there are fewer unsynchronized readings than the limit, THE SyncDatabase SHALL return all available readings
3. WHEN there are no unsynchronized readings, THE SyncDatabase SHALL return an empty array
4. WHEN the query fails, THE SyncDatabase SHALL throw an error with a descriptive message

### Requirement 5: Implement deleteSynchronizedReadings Method

**User Story:** As a sync service, I want to delete synchronized readings, so that I can clean up the local database and free up storage.

#### Acceptance Criteria

1. WHEN `database.deleteSynchronizedReadings(readingIds)` is called with an array of reading IDs, THE SyncDatabase SHALL delete those records from the meter_reading table
2. WHEN the array is empty, THE SyncDatabase SHALL return 0 without executing a query
3. THE method SHALL return the count of deleted records
4. WHEN the delete fails, THE SyncDatabase SHALL throw an error with a descriptive message

### Requirement 6: Implement incrementRetryCount Method

**User Story:** As a sync service, I want to increment the retry count for failed readings, so that I can track synchronization attempts and implement retry logic.

#### Acceptance Criteria

1. WHEN `database.incrementRetryCount(readingIds)` is called with an array of reading IDs, THE SyncDatabase SHALL increment the `retry_count` field by 1 for those records
2. WHEN the array is empty, THE SyncDatabase SHALL return without executing a query
3. WHEN the update fails, THE SyncDatabase SHALL throw an error with a descriptive message

### Requirement 7: Implement getSyncStats Method

**User Story:** As a sync service, I want to retrieve synchronization statistics, so that I can monitor sync performance and health.

#### Acceptance Criteria

1. WHEN `database.getSyncStats(hours)` is called, THE SyncDatabase SHALL return statistics for sync operations in the last `hours` hours
2. THE returned statistics SHALL include: total_synced, total_failed, total_records_processed, average_batch_size
3. WHEN there are no sync logs in the specified time period, THE SyncDatabase SHALL return zero values
4. WHEN the query fails, THE SyncDatabase SHALL throw an error with a descriptive message

### Requirement 8: Implement getRecentSyncLogs Method

**User Story:** As a sync service, I want to retrieve recent sync logs, so that I can display sync history and debug issues.

#### Acceptance Criteria

1. WHEN `database.getRecentSyncLogs(limit)` is called, THE SyncDatabase SHALL return up to `limit` sync_log records ordered by `synced_at` descending
2. WHEN there are fewer sync logs than the limit, THE SyncDatabase SHALL return all available logs
3. WHEN there are no sync logs, THE SyncDatabase SHALL return an empty array
4. WHEN the query fails, THE SyncDatabase SHALL throw an error with a descriptive message

### Requirement 9: Ensure Interface Compliance

**User Story:** As a developer, I want the SyncDatabase class to fully implement the SyncDatabase interface, so that the code compiles without errors and all methods are available.

#### Acceptance Criteria

1. THE SyncDatabase class SHALL implement all methods defined in the SyncDatabase interface
2. WHEN the code is compiled, THE TypeScript compiler SHALL report no missing method errors
3. ALL method signatures SHALL match the interface definitions exactly
4. ALL methods SHALL have proper error handling and logging

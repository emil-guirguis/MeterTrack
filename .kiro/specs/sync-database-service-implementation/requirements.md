# Requirements: Sync Database Service Implementation

## Introduction

The Sync MCP Server's `index.ts` file tries to import `SyncDatabaseService` from a non-existent file `./database/sync-database.js`. The actual `SyncDatabase` class exists in `data-sync.ts` but is missing several methods required by the `SyncDatabase` interface. This causes the API server to fail with "Error: Use SyncDatabase from connection-pools.ts" when trying to retrieve meter data. We need to fix the import and implement the missing methods.

## Glossary

- **SyncDatabase**: Interface defining all database operations needed by the sync system
- **SyncDatabase Class**: Concrete implementation in `data-sync.ts` that executes queries against the sync database pool
- **Sync Pool**: PostgreSQL connection pool for the local sync database
- **Meter**: A device that collects readings (has id, name, ip, port, etc.)
- **Meter Reading**: A data point collected from a meter (has meter_id, timestamp, data_point, value, etc.)
- **Tenant**: The organization/site configuration stored in the sync database

## Requirements

### Requirement 1: Fix Import in index.ts

**User Story:** As a developer, I want the index.ts file to correctly import the SyncDatabase class, so that the server can initialize without errors.

#### Acceptance Criteria

1. WHEN index.ts is loaded, THE import statement SHALL reference the correct file path for SyncDatabase
2. WHEN SyncDatabase is instantiated, THE instance SHALL be created from the correct class in data-sync.ts
3. WHEN the server starts, THE SyncDatabase instance SHALL be properly initialized with the syncPool

### Requirement 2: Implement getMeters Method

**User Story:** As a sync service, I want to retrieve meter configurations from the sync database, so that I can know which meters to sync.

#### Acceptance Criteria

1. WHEN getMeters(true) is called, THE SyncDatabase SHALL return only active meters
2. WHEN getMeters(false) is called, THE SyncDatabase SHALL return all meters (active and inactive)
3. WHEN no meters exist, THE SyncDatabase SHALL return an empty array
4. WHEN meters exist, THE SyncDatabase SHALL return all meter fields (id, name, active, ip, port, etc.)
5. WHEN a database error occurs, THE SyncDatabase SHALL throw an error with descriptive message

### Requirement 3: Implement upsertMeter Method

**User Story:** As a sync service, I want to insert or update meter records, so that I can keep meter configuration in sync.

#### Acceptance Criteria

1. WHEN a new meter is provided, THE SyncDatabase SHALL insert it into the meter table
2. WHEN an existing meter is provided, THE SyncDatabase SHALL update its fields
3. WHEN upsertMeter completes successfully, THE SyncDatabase SHALL not return any value
4. WHEN a database error occurs, THE SyncDatabase SHALL throw an error with descriptive message

### Requirement 4: Implement logSyncOperation Method

**User Story:** As a sync service, I want to log sync operations, so that I can track sync history and debug issues.

#### Acceptance Criteria

1. WHEN logSyncOperation is called with success=true, THE SyncDatabase SHALL insert a sync_log record with success flag set
2. WHEN logSyncOperation is called with success=false, THE SyncDatabase SHALL insert a sync_log record with error_message
3. WHEN logSyncOperation completes successfully, THE SyncDatabase SHALL not return any value
4. WHEN a database error occurs, THE SyncDatabase SHALL throw an error with descriptive message

### Requirement 5: Implement getUnsynchronizedReadings Method

**User Story:** As a sync service, I want to retrieve unsynchronized readings, so that I can upload them to the client system.

#### Acceptance Criteria

1. WHEN getUnsynchronizedReadings(limit) is called, THE SyncDatabase SHALL return up to limit readings where is_synchronized=false
2. WHEN no unsynchronized readings exist, THE SyncDatabase SHALL return an empty array
3. WHEN unsynchronized readings exist, THE SyncDatabase SHALL return all reading fields
4. WHEN a database error occurs, THE SyncDatabase SHALL throw an error with descriptive message

### Requirement 6: Implement deleteSynchronizedReadings Method

**User Story:** As a sync service, I want to delete readings after they are synchronized, so that I can clean up the local database.

#### Acceptance Criteria

1. WHEN deleteSynchronizedReadings is called with reading IDs, THE SyncDatabase SHALL delete those readings from the meter_reading table
2. WHEN readings are deleted, THE SyncDatabase SHALL return the count of deleted rows
3. WHEN no readings match the IDs, THE SyncDatabase SHALL return 0
4. WHEN a database error occurs, THE SyncDatabase SHALL throw an error with descriptive message

### Requirement 7: Implement incrementRetryCount Method

**User Story:** As a sync service, I want to increment retry counts for failed readings, so that I can track retry attempts.

#### Acceptance Criteria

1. WHEN incrementRetryCount is called with reading IDs, THE SyncDatabase SHALL increment retry_count for those readings
2. WHEN incrementRetryCount completes successfully, THE SyncDatabase SHALL not return any value
3. WHEN reading IDs don't exist, THE SyncDatabase SHALL not raise an error
4. WHEN a database error occurs, THE SyncDatabase SHALL throw an error with descriptive message

### Requirement 8: Implement getSyncStats Method

**User Story:** As a sync service, I want to retrieve sync statistics, so that I can monitor sync performance.

#### Acceptance Criteria

1. WHEN getSyncStats(hours) is called, THE SyncDatabase SHALL return statistics for sync operations in the last N hours
2. WHEN getSyncStats returns data, THE SyncDatabase SHALL include total_synced, total_failed, success_rate, and last_sync_time
3. WHEN no sync operations exist in the time range, THE SyncDatabase SHALL return zero values
4. WHEN a database error occurs, THE SyncDatabase SHALL throw an error with descriptive message

### Requirement 9: Implement getRecentSyncLogs Method

**User Story:** As a sync service, I want to retrieve recent sync logs, so that I can check sync history.

#### Acceptance Criteria

1. WHEN getRecentSyncLogs(limit) is called, THE SyncDatabase SHALL return the most recent sync log records
2. WHEN no sync logs exist, THE SyncDatabase SHALL return an empty array
3. WHEN sync logs exist, THE SyncDatabase SHALL return all log fields (id, batch_size, success, error_message, synced_at)
4. WHEN a database error occurs, THE SyncDatabase SHALL throw an error with descriptive message

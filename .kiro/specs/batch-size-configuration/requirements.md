# Requirements Document: Batch Size Configuration for Meter Reading Sync

## Introduction

The meter reading synchronization system currently processes readings in fixed batch sizes (1000 for remote uploads, 100 for database inserts). This causes excessive SQL activity and makes it difficult to optimize performance for different network conditions and database loads. This feature adds configurable batch sizes for both downloading readings to the sync database and uploading readings to the remote database.

## Glossary

- **Sync Database**: Local PostgreSQL database that stores meter readings before uploading to remote
- **Remote Database**: Central database where meter readings are persisted
- **Batch Size**: Number of records processed in a single operation
- **Download Batch**: Readings fetched from remote database to sync database
- **Upload Batch**: Readings sent from sync database to remote database
- **Sync Configuration**: System settings that control synchronization behavior

## Requirements

### Requirement 1: Add Batch Size Configuration Columns to Tenant Table

**User Story:** As a system administrator, I want to store batch size configuration per tenant, so that different tenants can have optimized synchronization settings.

#### Acceptance Criteria

1. WHEN the sync database initializes, THE System SHALL add download_batch_size and upload_batch_size columns to the tenant table
2. WHEN the tenant table is updated, THE System SHALL set default values (download_batch_size=1000, upload_batch_size=100)
3. WHEN the tenant table already has these columns, THE System SHALL not attempt to recreate them
4. WHEN batch size columns are added, THE System SHALL use INTEGER data type with NOT NULL constraint and defaults
5. WHEN the tenant table is queried, THE System SHALL return the batch size settings for each tenant

### Requirement 2: Load Tenant-Specific Batch Size Configuration at Startup

**User Story:** As a system operator, I want batch sizes to be loaded per tenant from the database at startup, so that configuration changes persist across restarts.

#### Acceptance Criteria

1. WHEN the SyncManager initializes for a tenant, THE System SHALL load batch size settings from the tenant table
2. WHEN tenant batch sizes are not set, THE System SHALL use default values (download_batch_size=1000, upload_batch_size=100)
3. WHEN batch sizes are loaded, THE System SHALL use download_batch_size for fetching readings from remote
4. WHEN batch sizes are loaded, THE System SHALL use upload_batch_size for sending readings to remote
5. WHEN batch sizes cannot be loaded, THE System SHALL log a warning and use default values

### Requirement 3: Use Configurable Batch Sizes in Sync Operations

**User Story:** As a developer, I want the sync system to use configurable batch sizes, so that performance can be tuned without code changes.

#### Acceptance Criteria

1. WHEN MeterReadingUploadManager fetches unsynchronized readings, THE System SHALL use the configured upload_batch_size
2. WHEN SyncManager fetches readings from remote, THE System SHALL use the configured download_batch_size
3. WHEN batch sizes are updated in sync_config, THE System SHALL use new values on the next sync cycle
4. WHEN reading batches are inserted into sync database, THE System SHALL respect the configured batch size for splitting operations

### Requirement 4: Store Tenant-Specific Batch Size Configuration

**User Story:** As a system administrator, I want batch sizes to be configurable per tenant, so that different tenants can have optimized settings based on their needs.

#### Acceptance Criteria

1. WHEN the sync database initializes, THE System SHALL add download_batch_size and upload_batch_size columns to the tenant table
2. WHEN a new tenant is created, THE System SHALL set default batch sizes (download_batch_size=1000, upload_batch_size=100)
3. WHEN batch sizes are loaded for a tenant, THE System SHALL use tenant-specific values if configured
4. WHEN tenant batch sizes are not configured, THE System SHALL fall back to global defaults
5. WHEN batch sizes are updated for a tenant, THE System SHALL only be done via backend database operations (not exposed to client API)

### Requirement 5: Reduce SQL Activity Through Optimized Batching

**User Story:** As a system operator, I want to reduce excessive SQL activity, so that database load is minimized.

#### Acceptance Criteria

1. WHEN readings are uploaded to remote database, THE System SHALL insert them in batches of upload_batch_size
2. WHEN readings are inserted into sync database, THE System SHALL split large operations into batches of upload_batch_size
3. WHEN batch operations complete, THE System SHALL log the number of batches processed and total records
4. WHEN batch sizes are optimized, THE System SHALL reduce the total number of SQL queries executed

### Requirement 6: Update Sync Status After Successful Remote Upload

**User Story:** As a system operator, I want the sync status to be updated after successful upload, so that the system accurately tracks which readings have been synchronized.

#### Acceptance Criteria

1. WHEN readings are successfully uploaded to remote database, THE System SHALL update the is_synchronized flag to true in sync database
2. WHEN readings are successfully uploaded to remote database, THE System SHALL update the sync_status column to 'synchronized'
3. WHEN a batch upload fails, THE System SHALL NOT update the is_synchronized flag
4. WHEN readings are marked as synchronized, THE System SHALL log the count of updated records
5. WHEN the sync status is updated, THE System SHALL use a single UPDATE query per batch to minimize SQL operations

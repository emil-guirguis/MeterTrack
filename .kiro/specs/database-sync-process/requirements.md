# Requirements Document

## Introduction

This document defines the requirements for a Database-to-Database Sync Process that provides bi-directional synchronization between a local PostgreSQL database (Sync Server) and a remote PostgreSQL database (Client Server). The sync process uploads meter reading data from local to remote, and downloads meter configuration data from remote to local. The process operates independently, connecting directly to both databases and transferring data in batches.

## Glossary

- **Sync Process**: The automated service that transfers data bi-directionally between local and remote databases
- **Local Database**: The PostgreSQL database running on the Sync Server (POSTGRES_SYNC_*)
- **Remote Database**: The PostgreSQL database running on the Client Server (POSTGRES_CLIENT_*)
- **Meter Reading**: A data record containing meter measurement data with timestamp and metadata
- **Meter Configuration**: A data record defining meter properties including meter_id, name, location, type, and settings
- **Tenant**: Organization or customer data including tenant_id, name, configuration, and operational parameters
- **Upload Batch**: A group of meter readings transferred from local to remote (100 records)
- **Download Batch**: A group of configurations (meters and tenant data) transferred from remote to local
- **Sync Cycle**: One complete execution of uploading readings and downloading configurations (meters and tenant data)

## Requirements

### Requirement 1

**User Story:** As a system operator, I want the sync process to connect to both local and remote PostgreSQL databases, so that meter readings can be transferred directly between databases.

#### Acceptance Criteria

1. WHEN the sync process starts THEN the system SHALL establish a connection to the local PostgreSQL database using POSTGRES_SYNC_HOST, POSTGRES_SYNC_PORT, POSTGRES_SYNC_DB, POSTGRES_SYNC_USER, and POSTGRES_SYNC_PASSWORD
2. WHEN the sync process starts THEN the system SHALL establish a connection to the remote PostgreSQL database using POSTGRES_CLIENT_HOST, POSTGRES_CLIENT_PORT, POSTGRES_CLIENT_DB, POSTGRES_CLIENT_USER, and POSTGRES_CLIENT_PASSWORD
3. WHEN either database connection fails THEN the system SHALL log the error and retry connection with exponential backoff
4. WHEN both database connections are established THEN the system SHALL verify connectivity by executing a test query on each database
5. WHEN the sync process shuts down THEN the system SHALL close both database connections gracefully

### Requirement 2

**User Story:** As a system operator, I want the sync process to query meter readings from the local database, so that data can be identified for upload.

#### Acceptance Criteria

1. WHEN a sync cycle begins THEN the system SHALL query the meter_readings table in the local database for records where is_synchronized equals false
2. WHEN querying meter readings THEN the system SHALL limit results to 100 records ordered by timestamp ascending
3. WHEN no unsynchronized records exist THEN the system SHALL log that the queue is empty and wait for the next sync cycle
4. WHEN unsynchronized records exist THEN the system SHALL retrieve all columns including id, meter_id, timestamp, value, unit, and metadata
5. WHEN the query fails THEN the system SHALL log the error and retry the query with exponential backoff

### Requirement 3

**User Story:** As a system operator, I want the sync process to upload meter readings to the remote database in batches, so that data is transferred efficiently and reliably.

#### Acceptance Criteria

1. WHEN meter readings are retrieved from the local database THEN the system SHALL insert them into the meter_readings table in the remote database
2. WHEN inserting records THEN the system SHALL use a single batch INSERT statement for all 100 records
3. WHEN inserting records THEN the system SHALL use a transaction to ensure atomicity
4. WHEN the insert succeeds THEN the system SHALL commit the transaction
5. WHEN the insert fails THEN the system SHALL rollback the transaction and log the error with full details

### Requirement 4

**User Story:** As a system operator, I want successfully uploaded meter readings to be deleted from the local database, so that storage space is reclaimed and duplicate uploads are prevented.

#### Acceptance Criteria

1. WHEN a batch upload to the remote database succeeds THEN the system SHALL delete the uploaded records from the local database
2. WHEN deleting records THEN the system SHALL use the record IDs from the successfully uploaded batch
3. WHEN deleting records THEN the system SHALL use a transaction to ensure atomicity
4. WHEN the delete succeeds THEN the system SHALL commit the transaction and log the number of records deleted
5. WHEN the delete fails THEN the system SHALL rollback the transaction and log the error without retrying the upload

### Requirement 5

**User Story:** As a system operator, I want the sync process to run continuously on a schedule, so that meter readings are synchronized automatically without manual intervention.

#### Acceptance Criteria

1. WHEN the sync process starts THEN the system SHALL begin executing sync cycles at a configurable interval
2. WHEN a sync cycle completes THEN the system SHALL wait for the configured interval before starting the next cycle
3. WHEN the configured interval is not specified THEN the system SHALL use a default interval of 60 seconds
4. WHEN a sync cycle is in progress THEN the system SHALL not start another sync cycle
5. WHEN the sync process receives a shutdown signal THEN the system SHALL complete the current sync cycle before shutting down

### Requirement 6

**User Story:** As a system operator, I want the sync process to handle errors gracefully, so that temporary failures do not cause data loss or process crashes.

#### Acceptance Criteria

1. WHEN a database connection error occurs THEN the system SHALL retry with exponential backoff up to 5 attempts
2. WHEN a query error occurs THEN the system SHALL log the error and retry the query up to 3 attempts
3. WHEN an upload error occurs THEN the system SHALL log the error and leave records in the local database for the next sync cycle
4. WHEN maximum retry attempts are reached THEN the system SHALL log a critical error and continue to the next sync cycle
5. WHEN an unhandled exception occurs THEN the system SHALL log the stack trace and attempt to continue operation

### Requirement 7

**User Story:** As a system operator, I want the sync process to log all operations, so that I can monitor sync activity and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a sync cycle starts THEN the system SHALL log the start time and queue size
2. WHEN a batch upload succeeds THEN the system SHALL log the number of records uploaded and the time taken
3. WHEN a batch delete succeeds THEN the system SHALL log the number of records deleted
4. WHEN any error occurs THEN the system SHALL log the error type, message, and context
5. WHEN the sync process starts or stops THEN the system SHALL log the event with timestamp

### Requirement 8

**User Story:** As a system operator, I want the sync process to download meter configuration data from the remote database, so that the local system has up-to-date meter definitions.

#### Acceptance Criteria

1. WHEN a sync cycle begins THEN the system SHALL query the meters table in the remote database for all meter configuration records
2. WHEN querying meter configurations THEN the system SHALL retrieve all columns including meter_id, name, location_id, meter_type, unit, and configuration metadata
3. WHEN meter configurations are retrieved THEN the system SHALL compare them with existing records in the local meters table
4. WHEN a meter configuration does not exist in the local database THEN the system SHALL insert the new meter record
5. WHEN a meter configuration exists but has been updated THEN the system SHALL update the local meter record with the new values

### Requirement 9

**User Story:** As a system operator, I want the sync process to track newly downloaded meters, so that I can be notified when new meters are added to the system.

#### Acceptance Criteria

1. WHEN a new meter configuration is inserted into the local database THEN the system SHALL log the new meter with its meter_id and name
2. WHEN multiple new meters are downloaded in a sync cycle THEN the system SHALL log the total count of new meters added
3. WHEN a meter configuration is updated THEN the system SHALL log the meter_id and which fields were changed
4. WHEN no new meters are downloaded THEN the system SHALL log that meter configurations are up to date
5. WHEN the meter configuration download fails THEN the system SHALL log the error and continue with the meter reading upload

### Requirement 10

**User Story:** As a system operator, I want the sync process to download tenant data from the remote database, so that the local system has up-to-date tenant information.

#### Acceptance Criteria

1. WHEN a sync cycle begins THEN the system SHALL query the tenant table in the remote database for all tenant records
2. WHEN querying tenant data THEN the system SHALL retrieve all columns including tenant_id, name, configuration, and metadata
3. WHEN tenant records are retrieved THEN the system SHALL compare them with existing records in the local tenant table
4. WHEN a tenant does not exist in the local database THEN the system SHALL insert the new tenant record
5. WHEN a tenant exists but has been updated THEN the system SHALL update the local tenant record with the new values

### Requirement 11

**User Story:** As a system operator, I want the sync process to track tenant changes, so that I can be notified when tenant data is updated.

#### Acceptance Criteria

1. WHEN a new tenant is inserted into the local database THEN the system SHALL log the new tenant with its tenant_id and name
2. WHEN multiple new tenants are downloaded in a sync cycle THEN the system SHALL log the total count of new tenants added
3. WHEN a tenant record is updated THEN the system SHALL log the tenant_id and which fields were changed
4. WHEN no tenant changes are detected THEN the system SHALL log that tenant data is up to date
5. WHEN the tenant download fails THEN the system SHALL log the error and continue with other sync operations

### Requirement 12

**User Story:** As a system operator, I want the sync process to provide status information, so that I can monitor its health and performance.

#### Acceptance Criteria

1. WHEN queried for status THEN the system SHALL report whether it is running or stopped
2. WHEN queried for status THEN the system SHALL report the timestamp of the last successful sync cycle
3. WHEN queried for status THEN the system SHALL report the current queue size in the local database
4. WHEN queried for status THEN the system SHALL report the total number of records synced since startup
5. WHEN queried for status THEN the system SHALL report the connection status of both databases and the count of meters and tenants in the local database

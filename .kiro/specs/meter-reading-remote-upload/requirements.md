# Requirements Document: Meter Reading Remote Upload

## Introduction

The sync MCP system currently collects meter readings from BACnet devices and stores them in the local sync database. However, these readings are never uploaded to the remote client database. This feature adds the capability to synchronize collected meter readings from the local sync database to the remote client database, enabling the client application to access and display the readings.

## Glossary

- **Sync Database**: Local PostgreSQL database that stores meter readings collected from BACnet devices
- **Remote Database**: Client-side PostgreSQL database that the client application uses
- **Meter Reading**: A single data point collected from a meter at a specific timestamp
- **Unsynchronized Reading**: A meter reading in the sync database that has not yet been uploaded to the remote database
- **Synchronized Reading**: A meter reading that has been successfully uploaded to the remote database
- **Batch Upload**: Uploading multiple meter readings in a single transaction
- **Retry Logic**: Mechanism to retry failed uploads with exponential backoff

## Requirements

### Requirement 1: Upload Unsynchronized Readings to Remote Database

**User Story:** As a sync system, I want to upload collected meter readings to the remote client database, so that the client application can access and display the readings.

#### Acceptance Criteria

1. WHEN unsynchronized readings exist in the sync database, THE Upload_Service SHALL query them ordered by timestamp ascending
2. WHEN readings are queried, THE Upload_Service SHALL retrieve them in batches of up to 1000 readings per query
3. WHEN readings are retrieved, THE Upload_Service SHALL insert them into the remote database meter_reading table
4. WHEN an insert succeeds, THE Upload_Service SHALL mark the reading as synchronized in the sync database
5. WHEN an insert fails, THE Upload_Service SHALL retry the operation with exponential backoff (1s, 2s, 4s)
6. WHEN max retries are exceeded, THE Upload_Service SHALL log the failure and move to the next batch
7. WHEN a batch completes, THE Upload_Service SHALL log the operation with counts of inserted, failed, and skipped readings

### Requirement 2: Automatic Upload Scheduling

**User Story:** As a sync system, I want to automatically upload readings on a regular schedule, so that readings are continuously synchronized without manual intervention.

#### Acceptance Criteria

1. WHEN the sync MCP starts, THE Upload_Agent SHALL initialize with a configurable upload interval
2. WHEN the upload interval elapses, THE Upload_Agent SHALL trigger an upload cycle
3. WHEN an upload cycle completes, THE Upload_Agent SHALL schedule the next cycle based on the configured interval
4. WHEN the upload interval is configured via environment variable, THE Upload_Agent SHALL use that value (default: 5 minutes)
5. WHEN auto-upload is disabled via environment variable, THE Upload_Agent SHALL not schedule automatic cycles

### Requirement 3: Manual Upload Triggering

**User Story:** As a user, I want to manually trigger an upload cycle, so that I can upload readings on demand without waiting for the scheduled interval.

#### Acceptance Criteria

1. WHEN the trigger_upload MCP tool is called, THE Upload_Agent SHALL immediately start an upload cycle
2. WHEN an upload cycle is already in progress, THE Upload_Agent SHALL return a status indicating the current cycle is running
3. WHEN an upload cycle completes, THE Upload_Agent SHALL return the results including counts and any errors

### Requirement 4: Upload Status Monitoring

**User Story:** As a user, I want to monitor the status of the upload process, so that I can verify readings are being synchronized correctly.

#### Acceptance Criteria

1. WHEN the get_upload_status MCP tool is called, THE Upload_Agent SHALL return the current status
2. WHEN returning status, THE Upload_Agent SHALL include the last upload time, total readings uploaded, success rate, and any recent errors
3. WHEN an upload cycle is in progress, THE Upload_Agent SHALL indicate the cycle is running and show progress
4. WHEN no uploads have occurred, THE Upload_Agent SHALL return appropriate default values

### Requirement 5: Error Handling and Logging

**User Story:** As a system operator, I want detailed logging of upload operations, so that I can diagnose issues and monitor system health.

#### Acceptance Criteria

1. WHEN an upload operation starts, THE Upload_Service SHALL log the operation with timestamp and batch size
2. WHEN an upload operation completes, THE Upload_Service SHALL log the results including inserted, failed, and skipped counts
3. WHEN an error occurs during upload, THE Upload_Service SHALL log the error with full context including reading IDs and error message
4. WHEN retries occur, THE Upload_Service SHALL log each retry attempt with the retry count and delay
5. WHEN max retries are exceeded, THE Upload_Service SHALL log a warning with the reading IDs that failed

### Requirement 6: Data Integrity

**User Story:** As a system architect, I want to ensure data integrity during uploads, so that readings are not duplicated or lost.

#### Acceptance Criteria

1. WHEN readings are uploaded, THE Upload_Service SHALL use database transactions to ensure atomicity
2. WHEN a transaction fails, THE Upload_Service SHALL rollback all changes and retry the batch
3. WHEN readings are marked as synchronized, THE Upload_Service SHALL only mark readings that were successfully inserted
4. WHEN duplicate readings are detected, THE Upload_Service SHALL skip them and log the duplicate
5. WHEN the remote database is unavailable, THE Upload_Service SHALL retry with exponential backoff and eventually fail gracefully

### Requirement 7: Cleanup of Synchronized Readings

**User Story:** As a system operator, I want to clean up old synchronized readings, so that the sync database doesn't grow unbounded.

#### Acceptance Criteria

1. WHEN a cleanup cycle runs, THE Cleanup_Service SHALL delete synchronized readings older than a configurable threshold (default: 7 days)
2. WHEN readings are deleted, THE Cleanup_Service SHALL log the count of deleted readings
3. WHEN the cleanup interval is configured via environment variable, THE Cleanup_Service SHALL use that value (default: daily)
4. WHEN no old readings exist, THE Cleanup_Service SHALL log that no cleanup was needed

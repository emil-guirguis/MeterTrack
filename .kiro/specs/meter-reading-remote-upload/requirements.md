# Requirements Document: Meter Reading Remote Upload

## Introduction

After meter readings are collected from BACnet devices and inserted into the sync database, the system must upload these readings to the remote client database. This feature ensures that meter readings are synchronized from the sync system to the client system, with proper error handling and data cleanup. Readings remain in the sync database until successfully uploaded, ensuring no data loss.

## Glossary

- **Sync Database**: Local database in the sync system where meter readings are initially stored
- **Remote Database**: Client system database where meter readings are ultimately stored
- **Meter Reading**: A single data point collected from a meter at a specific timestamp
- **Unsynchronized Reading**: A meter reading in the sync database that has not yet been uploaded to the remote database
- **Synchronized Reading**: A meter reading that has been successfully uploaded to the remote database
- **Upload Batch**: A group of meter readings uploaded together to the remote database
- **Retry Count**: Number of times an upload has been attempted for a reading
- **Connectivity**: The ability to reach the remote client system API

## Requirements

### Requirement 1: Retrieve and Upload Unsynchronized Readings in Batches

**User Story:** As a sync system, I want to retrieve meter readings that have not yet been uploaded and upload them in batches of 50, so that I can efficiently send them to the remote database.

#### Acceptance Criteria

1. WHEN the upload manager starts, THE System SHALL query the sync database for readings where is_synchronized = false
2. WHEN querying for unsynchronized readings, THE System SHALL retrieve them in batches of 50 readings
3. WHEN retrieving readings, THE System SHALL include all required fields: meter_reading_id, meter_id, timestamp, data_point, value, unit, retry_count
4. WHEN retrieving readings, THE System SHALL order them by timestamp ascending to maintain chronological order
5. WHEN a batch of 50 readings is retrieved, THE System SHALL upload that batch to the remote database
6. WHEN all batches have been uploaded successfully, THE System SHALL delete them from the sync database
7. IF no unsynchronized readings exist, THEN THE System SHALL return an empty result and skip upload

### Requirement 2: Format and Upload Readings in Batches of 50

**User Story:** As a sync system, I want to format meter readings according to the remote API specification and upload them in batches of 50, so that they can be properly received and stored.

#### Acceptance Criteria

1. WHEN preparing readings for upload, THE System SHALL format each reading into the format expected by the remote API
2. WHEN formatting readings, THE System SHALL include meter_id, timestamp, data_point, value, and unit fields
3. WHEN formatting readings, THE System SHALL ensure timestamp is in ISO 8601 format
4. WHEN formatting readings, THE System SHALL ensure value is a valid number
5. WHEN a batch of 50 readings is formatted, THE System SHALL send them together to the remote API endpoint
6. WHEN multiple batches are needed, THE System SHALL upload each batch of 50 separately and sequentially
7. WHEN all batches are uploaded successfully, THE System SHALL delete them from the sync database

### Requirement 3: Upload Readings to Remote Database via API

**User Story:** As a sync system, I want to upload meter readings in batches of 50 to the remote database, so that the client system has access to the collected data.

#### Acceptance Criteria

1. WHEN a batch of 50 readings is ready for upload, THE System SHALL send them to the remote client API endpoint
2. WHEN sending a batch, THE System SHALL include the tenant API key for authentication
3. WHEN the API request is sent, THE System SHALL wait for a response indicating success or failure
4. IF the API returns success (HTTP 200), THEN THE System SHALL mark the batch as successful and delete those readings from sync database
5. IF the API returns an error (HTTP 4xx or 5xx), THEN THE System SHALL log the error and prepare the batch for retry
6. WHEN a batch fails, THE System SHALL increment retry_count for all readings in that batch
7. WHEN multiple batches are being uploaded, THE System SHALL upload them sequentially (one at a time)

### Requirement 4: Handle Connection Failures Gracefully

**User Story:** As a sync system, I want to handle connection failures to the remote database, so that readings remain queued until connectivity is restored.

#### Acceptance Criteria

1. WHEN the remote API is unreachable, THE System SHALL catch the connection error and not delete readings from sync database
2. WHEN a connection error occurs, THE System SHALL log the error with details about which batch failed
3. WHEN a connection error occurs, THE System SHALL maintain the readings in the sync database for later retry
4. WHEN connectivity is restored, THE System SHALL automatically resume uploading queued batches
5. WHILE the remote API is unreachable, THE System SHALL continue collecting new readings into the sync database
6. WHEN a batch fails due to connection error, THE System SHALL increment retry_count for all readings in that batch

### Requirement 5: Implement Retry Logic with Exponential Backoff and 8-Hour Cap

**User Story:** As a sync system, I want to retry failed uploads with exponential backoff, so that transient failures don't cause permanent data loss, with retries continuing indefinitely at 8-hour intervals after reaching the cap.

#### Acceptance Criteria

1. WHEN an upload fails, THE System SHALL increment the retry_count for affected readings
2. WHEN an upload fails, THE System SHALL schedule a retry with exponential backoff
3. WHEN scheduling a retry, THE System SHALL use exponential backoff: 2^retry_count minutes (2m, 4m, 8m, 16m, 32m, 64m, 128m, 256m)
4. WHEN the calculated retry delay would exceed 8 hours (480 minutes), THE System SHALL cap the retry delay at 8 hours
5. WHEN a reading reaches the 8-hour retry interval, THE System SHALL continue retrying every 8 hours indefinitely
6. WHEN connectivity is restored after a failed upload, THE System SHALL reset the retry interval back to exponential backoff starting at 2 minutes
7. WHEN a reading is retrying indefinitely, THE System SHALL never mark it as failed - it remains in the sync database for manual intervention

### Requirement 6: Delete Successfully Uploaded Readings from Sync Database

**User Story:** As a sync system, I want to delete meter readings after successful upload, so that the sync database doesn't grow unbounded.

#### Acceptance Criteria

1. WHEN an upload batch completes successfully, THE System SHALL delete the uploaded readings from the sync database
2. WHEN deleting readings, THE System SHALL use the meter_reading_id to identify which readings to delete
3. WHEN deletion completes, THE System SHALL log the count of deleted readings
4. IF deletion fails, THEN THE System SHALL log the error but not retry (readings will be re-uploaded on next cycle)
5. WHEN all readings in a batch are deleted, THE System SHALL verify the sync database no longer contains them

### Requirement 7: Track Upload Status and Metrics

**User Story:** As a sync system, I want to track upload status and metrics, so that I can monitor the health of the upload process.

#### Acceptance Criteria

1. WHEN an upload operation completes, THE System SHALL record the timestamp of the operation
2. WHEN an upload operation completes, THE System SHALL record whether it succeeded or failed
3. WHEN an upload operation completes, THE System SHALL record the count of readings uploaded
4. WHEN an upload operation completes, THE System SHALL record the count of readings that failed
5. WHEN an upload operation completes, THE System SHALL record any error messages
6. WHEN queried, THE System SHALL return upload status including last upload time, success/failure, and queue size

### Requirement 8: Monitor Connectivity to Remote Database

**User Story:** As a sync system, I want to continuously monitor connectivity to the remote database, so that I can detect when the client system becomes available or unavailable.

#### Acceptance Criteria

1. WHEN the upload manager starts, THE System SHALL begin monitoring connectivity to the remote API
2. WHEN the remote API is reachable, THE System SHALL mark the connection as active
3. WHEN the remote API is unreachable, THE System SHALL mark the connection as inactive
4. WHEN connectivity changes from inactive to active, THE System SHALL trigger an immediate upload attempt
5. WHEN connectivity is being monitored, THE System SHALL check at regular intervals (default 60 seconds)

### Requirement 9: Schedule Automatic Uploads

**User Story:** As a sync system, I want to automatically upload readings on a schedule, so that data is synchronized without manual intervention.

#### Acceptance Criteria

1. WHEN the upload manager starts, THE System SHALL schedule automatic uploads at regular intervals (default 5 minutes)
2. WHEN the scheduled time arrives, THE System SHALL trigger an upload operation if one is not already in progress
3. IF an upload is already in progress, THEN THE System SHALL skip the scheduled upload and wait for the next interval
4. WHEN the upload manager is stopped, THE System SHALL cancel all scheduled uploads
5. WHEN the upload manager is restarted, THE System SHALL resume scheduled uploads

### Requirement 10: Provide Manual Upload Trigger

**User Story:** As a user, I want to manually trigger an upload operation, so that I can upload readings on demand without waiting for the schedule.

#### Acceptance Criteria

1. WHEN a manual upload is triggered, THE System SHALL immediately start an upload operation
2. WHEN a manual upload is triggered while one is in progress, THE System SHALL skip the new request and log a message
3. WHEN a manual upload completes, THE System SHALL return the upload status and metrics
4. WHEN a manual upload fails, THE System SHALL return the error details
5. WHEN a manual upload is triggered, THE System SHALL not affect the scheduled upload interval

### Requirement 11: Display Meter Reading Upload Status Card in Frontend

**User Story:** As a sync system operator, I want to see a card displaying meter reading upload status, so that I can monitor the health of the upload process and manually trigger retries.

#### Acceptance Criteria

1. WHEN the sync frontend loads, THE System SHALL display a meter reading upload status card
2. WHEN the card is displayed, THE System SHALL show the count of readings currently in the sync database (queue size)
3. WHEN the card is displayed, THE System SHALL show the count of total readings uploaded
4. WHEN the card is displayed, THE System SHALL show the timestamp of the last upload attempt
5. WHEN the card is displayed, THE System SHALL show whether the last upload was successful or failed
6. WHEN the card is displayed, THE System SHALL show the timestamp of the next scheduled upload
7. WHEN the card is displayed, THE System SHALL show the current connectivity status to the remote database
8. WHEN the card is displayed, THE System SHALL show a log of recent upload operations with timestamps and results
9. WHEN a user clicks the "Retry Upload" button, THE System SHALL trigger a manual upload operation
10. WHEN the upload is in progress, THE System SHALL display a loading indicator on the button
11. WHEN the upload completes, THE System SHALL update the card with new metrics and log entry
12. WHEN the card is displayed, THE System SHALL refresh the metrics every 30 seconds to show current status

</content>
</invoke>
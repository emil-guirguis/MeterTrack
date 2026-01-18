# Implementation Plan: Meter Reading Remote Upload

## Overview

This implementation plan breaks down the meter reading remote upload feature into discrete, manageable coding tasks. The feature orchestrates uploading meter readings from the sync database to the remote client database, with proper error handling, retry logic, connectivity monitoring, and automatic cleanup of successfully uploaded readings.

Most of the core functionality is already implemented in `MeterReadingUploadManager`. This plan focuses on verifying the implementation, adding any missing pieces, and ensuring all correctness properties are validated through tests.

## Tasks

- [x] 1. Verify SyncDatabase methods for reading retrieval and deletion
  - [x] 1.1 Verify `getUnsynchronizedReadings(50)` method exists and works correctly
    - Query sync database for readings where is_synchronized = false
    - Return readings ordered by timestamp ascending
    - Limit results to 50 readings per batch
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Verify `incrementRetryCount(readingIds)` method exists and works correctly
    - Increment retry_count for specified readings
    - Update updated_at timestamp
    - _Requirements: 5.1, 5.2, 4.6_

  - [x] 1.3 Verify `deleteSynchronizedReadings(readingIds)` method exists and works correctly
    - Delete readings by meter_reading_id
    - Return count of deleted rows
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.4 Verify `logSyncOperation(count, success, error)` method exists and works correctly
    - Insert record into sync_operation_log table
    - Include tenant_id, operation_type, readings_count, success, error_message
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Verify MeterReadingUploadManager initialization and configuration
  - [x] 2.1 Verify upload manager initializes with correct configuration
    - Load API key from tenant cache
    - Set upload interval (default 5 minutes)
    - Set batch size (default 1000)
    - Set max retries (default 5)
    - _Requirements: 9.1, 10.1_

  - [x] 2.2 Verify connectivity monitor is initialized and started
    - ConnectivityMonitor created with correct interval
    - Listens for 'connected' and 'disconnected' events
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 3. Verify upload scheduling and manual trigger
  - [x] 3.1 Verify cron job schedules uploads at correct interval
    - Cron expression matches configured interval
    - Uploads triggered at scheduled times
    - _Requirements: 9.1, 9.2_

  - [x] 3.2 Verify manual upload trigger works correctly
    - `triggerUpload()` method starts upload immediately
    - Skips if upload already in progress
    - Returns upload status
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 3.3 Write property test for scheduled uploads don't overlap
    - **Property 7: Scheduled Uploads Don't Overlap**
    - **Validates: Requirements 9.2, 9.3**

  - [ ]* 3.4 Write property test for manual upload doesn't affect schedule
    - **Property 8: Manual Upload Doesn't Affect Schedule**
    - **Validates: Requirements 10.5**

- [x] 4. Verify reading retrieval and formatting
  - [x] 4.1 Verify unsynchronized readings are retrieved in batches of 50
    - Query returns readings where is_synchronized = false
    - Results ordered by timestamp ascending
    - Batch size is exactly 50 readings
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Verify readings are formatted for remote API
    - Transform to API format with meter_id, timestamp, data_point, value, unit
    - Timestamp in ISO 8601 format
    - Value is valid number
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.3 Verify batches of 50 are uploaded sequentially
    - Each batch of 50 is uploaded separately
    - Batches are uploaded one at a time (sequentially)
    - Next batch waits for previous batch to complete
    - _Requirements: 2.5, 2.6, 3.7_

  - [ ]* 4.4 Write property test for unsynchronized readings retrieved in order
    - **Property 5: Unsynchronized Readings Are Retrieved in Order**
    - **Validates: Requirements 1.4**

- [x] 5. Verify API upload and response handling
  - [x] 5.1 Verify batches of 50 readings are uploaded to remote API
    - API endpoint called with correct URL
    - API key included in request headers
    - Batch payload contains exactly 50 readings
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Verify successful API response is handled
    - HTTP 200 response marks batch as successful
    - Batch readings prepared for deletion
    - _Requirements: 3.4_

  - [x] 5.3 Verify API error response is handled
    - HTTP 4xx/5xx response logged
    - Batch readings kept in sync database
    - Retry count incremented for all readings in batch
    - _Requirements: 3.5, 3.6, 4.6_

  - [x] 5.4 Verify sequential batch uploads
    - Multiple batches uploaded one at a time
    - Next batch waits for previous to complete
    - _Requirements: 3.7_

  - [ ]* 5.5 Write property test for successful upload deletes from sync database
    - **Property 1: Successful Upload Deletes from Sync Database**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 6. Verify connection failure handling
  - [x] 6.1 Verify connection errors are caught and handled
    - Network errors caught (ECONNREFUSED, ETIMEDOUT, etc.)
    - Error logged with details
    - Batch readings kept in sync database
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.2 Verify connectivity monitoring detects outages
    - ConnectivityMonitor detects when API is unreachable
    - Status updated to disconnected
    - 'disconnected' event emitted
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.3 Verify automatic resume on connectivity restoration
    - ConnectivityMonitor detects when API is reachable again
    - Status updated to connected
    - 'connected' event emitted
    - Immediate upload triggered
    - _Requirements: 4.4, 8.4_

  - [x] 6.4 Verify retry count incremented for failed batches
    - When batch fails, retry_count incremented for all readings in batch
    - _Requirements: 4.6_

  - [ ]* 6.5 Write property test for failed upload preserves readings
    - **Property 2: Failed Upload Preserves Readings in Sync Database**
    - **Validates: Requirements 4.1, 4.2, 4.3, 5.1, 5.2**

  - [ ]* 6.6 Write property test for connectivity restoration triggers upload
    - **Property 4: Connectivity Restoration Triggers Upload**
    - **Validates: Requirements 4.4, 8.4**

- [x] 7. Verify retry logic with exponential backoff and 8-hour cap
  - [x] 7.1 Verify retry count is incremented on failure
    - Failed readings have retry_count incremented
    - Updated_at timestamp updated
    - _Requirements: 5.1, 5.2_

  - [x] 7.2 Verify exponential backoff calculation in minutes
    - Retry 1: 2 minutes (2^1)
    - Retry 2: 4 minutes (2^2)
    - Retry 3: 8 minutes (2^3)
    - Retry 4: 16 minutes (2^4)
    - Retry 5: 32 minutes (2^5)
    - Retry 6: 64 minutes (2^6)
    - Retry 7: 128 minutes (2^7)
    - Retry 8+: 480 minutes (8 hours) - continues indefinitely
    - _Requirements: 5.3, 5.4_

  - [x] 7.3 Verify 8-hour retry interval continues indefinitely
    - After reaching 8-hour interval, continue retrying every 8 hours
    - Keep reading in sync database indefinitely
    - Never mark reading as failed
    - Log that reading is in indefinite 8-hour retry state
    - _Requirements: 5.5, 5.7_

  - [x] 7.4 Verify connectivity restoration resets retry interval
    - When connectivity is restored, reset retry_count or tracking
    - Next retry uses exponential backoff starting at 2 minutes
    - _Requirements: 5.6_

  - [ ]* 7.5 Write property test for retry respects 8-hour cap with indefinite intervals
    - **Property 3: Retry Logic Respects 8-Hour Cap with Indefinite 8-Hour Intervals**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

- [x] 8. Verify deletion of successfully uploaded readings
  - [x] 8.1 Verify readings are deleted after successful upload
    - Delete called with correct reading IDs
    - Readings removed from sync database
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.2 Verify deletion count is logged
    - Log message includes count of deleted readings
    - _Requirements: 6.3_

  - [x] 8.3 Verify deletion errors don't block next batch
    - If deletion fails, log error but continue
    - Don't retry deletion
    - Readings will be re-uploaded on next cycle (safe due to idempotency)
    - _Requirements: 6.4_

- [x] 9. Verify upload status and metrics tracking
  - [x] 9.1 Verify upload status is tracked correctly
    - isRunning reflects current state
    - lastUploadTime updated after each upload
    - lastUploadSuccess reflects success/failure
    - lastUploadError contains error message if failed
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.2 Verify queue size is calculated correctly
    - queueSize reflects count of unsynchronized readings
    - Updated after each upload
    - _Requirements: 7.6_

  - [x] 9.3 Verify total counters are incremented correctly
    - totalUploaded incremented on successful upload
    - totalFailed incremented on failed upload
    - _Requirements: 7.1, 7.2_

  - [ ]* 9.4 Write property test for upload status metrics accuracy
    - **Property 6: Upload Status Metrics Are Accurate**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [x] 10. Verify API key management
  - [x] 10.1 Verify API key is loaded from tenant cache
    - On start, load API key from tenant
    - Set API key on ClientSystemApiClient
    - Log success/warning if key not found
    - _Requirements: 3.2_

  - [x] 10.2 Verify API key is used in all API requests
    - API key included in request headers
    - Correct format for authentication
    - _Requirements: 3.2_

- [x] 11. Checkpoint - Verify all core functionality works
  - Verify all methods exist and are callable
  - Verify basic upload flow works end-to-end
  - Verify error handling works
  - Ask the user if questions arise

- [x] 12. Integration testing
  - [x] 12.1 Test end-to-end upload flow with batches of 50
    - Retrieve 150 readings (3 batches of 50)
    - Format for API
    - Upload batch 1 successfully
    - Upload batch 2 successfully
    - Upload batch 3 successfully
    - Delete all 150 from sync database
    - Verify metrics updated
    - _Requirements: 1.1, 2.1, 3.1, 6.1, 7.1_

  - [x] 12.2 Test upload with connection failure and recovery
    - Retrieve 100 readings (2 batches of 50)
    - Upload batch 1 successfully
    - Attempt batch 2 with API unreachable
    - Verify batch 2 kept in sync database
    - Restore connectivity
    - Verify automatic upload triggered
    - Verify batch 2 uploaded successfully
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.4_

  - [x] 12.3 Test upload with API error and retry
    - Retrieve 50 readings (1 batch)
    - Mock API to return 500 error
    - Attempt upload
    - Verify retry_count incremented for all 50 readings
    - Verify retry scheduled with exponential backoff (in minutes)
    - Mock API to return success on retry
    - Verify batch uploaded and deleted
    - _Requirements: 3.5, 3.6, 5.1, 5.2, 5.3_

  - [x] 12.4 Test multiple batches with mixed success/failure
    - Create 150 readings (3 batches of 50)
    - Upload batch 1 successfully
    - Mock API to fail on batch 2
    - Verify batch 1 deleted from sync database
    - Verify batch 2 kept in sync database with retry_count incremented
    - Verify batch 3 not yet uploaded
    - _Requirements: 1.2, 5.1, 6.1_

  - [x] 12.5 Test 8-hour retry interval with indefinite retries
    - Create reading with retry_count indicating 8+ hours of retries
    - Attempt upload
    - Verify next retry scheduled for 8 hours later
    - Verify reading kept in sync database indefinitely
    - Verify reading never marked as failed
    - _Requirements: 5.4, 5.5, 5.7_

  - [x] 12.6 Test connectivity restoration resets retry interval
    - Create reading with high retry_count (in 8-hour interval)
    - Mock connectivity loss
    - Restore connectivity
    - Verify retry interval resets to exponential backoff (2 minutes)
    - Verify reading uploaded successfully on next retry
    - _Requirements: 5.6_

  - [x] 12.7 Test scheduled uploads with manual triggers
    - Start upload manager with 5-minute interval
    - Trigger manual upload at 2 minutes
    - Verify manual upload completes
    - Verify next scheduled upload at 5 minutes (not 7 minutes)
    - _Requirements: 9.1, 9.2, 10.1, 10.5_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property tests
  - Run all integration tests
  - Verify no regressions in existing functionality
  - Ask the user if questions arise

- [x] 14. Create frontend meter reading upload status card
  - [x] 14.1 Create MeterReadingUploadCard component
    - Display meter reading upload status
    - Show queue size (unsynchronized readings count)
    - Show total uploaded count
    - Show last upload time
    - Show last upload status (success/failure)
    - Show next scheduled upload time
    - Show connectivity status
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 14.2 Add upload operation log display
    - Show recent upload operations with timestamps
    - Show success/failure status for each operation
    - Show error messages for failed operations
    - Display in chronological order (newest first)
    - _Requirements: 11.8_

  - [x] 14.3 Add "Retry Upload" button
    - Button triggers manual upload operation
    - Show loading indicator while upload is in progress
    - Disable button while upload is in progress
    - Show success/error message after upload completes
    - _Requirements: 11.9, 11.10, 11.11_

  - [x] 14.4 Implement auto-refresh of metrics
    - Fetch upload status every 30 seconds
    - Update card display with new metrics
    - Update upload log with new operations
    - _Requirements: 11.12_

  - [x] 14.5 Add API endpoint to get upload status and log
    - GET /api/sync/meter-reading-upload/status
    - Returns UploadStatus with queue size, totals, times
    - GET /api/sync/meter-reading-upload/log
    - Returns recent upload operations
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [x] 14.6 Add API endpoint to trigger manual upload
    - POST /api/sync/meter-reading-upload/trigger
    - Calls uploadManager.triggerUpload()
    - Returns upload status
    - _Requirements: 11.9_

  - [ ]* 14.7 Write property test for frontend metrics accuracy
    - **Property 9: Frontend Card Displays Accurate Metrics**
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6, 11.7**

  - [ ]* 14.8 Write property test for frontend auto-refresh
    - **Property 10: Frontend Card Auto-Refreshes Metrics**
    - **Validates: Requirements 11.12**

- [x] 15. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property tests
  - Run all integration tests
  - Verify frontend card displays correctly
  - Verify retry button works
  - Verify auto-refresh works
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Most core functionality is already implemented in MeterReadingUploadManager
- Focus on verification and testing rather than implementation
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Frontend tasks include creating the meter reading upload status card with metrics, log, and retry button
- **CRITICAL:** Uploads happen in batches of 50 readings at a time
- **CRITICAL:** Batches are uploaded sequentially (one at a time)
- **CRITICAL:** Data is NEVER marked as failed - it remains in sync database indefinitely for manual intervention
- **CRITICAL:** Retry delays are in MINUTES with exponential backoff, capped at 8 hours (480 minutes)
- **CRITICAL:** After reaching 8-hour cap, retries continue every 8 hours indefinitely
- **CRITICAL:** When connectivity is restored, retry interval resets to exponential backoff starting at 2 minutes
- **CRITICAL:** No maximum retry count - retries continue indefinitely

</content>
</invoke>

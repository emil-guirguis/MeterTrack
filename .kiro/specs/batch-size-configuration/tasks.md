# Implementation Plan: Batch Size Configuration for Meter Reading Sync

## Overview

This implementation adds configurable batch sizes for meter reading synchronization by extending the tenant table with batch size columns, integrating with the existing tenant cache, and updating sync managers to use these settings. Additionally, the sync status flag will be properly updated after successful remote uploads.

## Tasks

- [x] 1. Add batch size columns to tenant table migration
  - Create migration file to add download_batch_size and upload_batch_size columns to tenant table
  - Set default values (download_batch_size=1000, upload_batch_size=100)
  - Ensure migration is idempotent (use IF NOT EXISTS)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Update SyncDatabase interface and implementation
  - Add getTenantBatchConfig() method to SyncDatabase interface
  - Add markReadingsAsSynchronized() method to SyncDatabase interface
  - Implement getTenantBatchConfig() to query tenant table batch size columns
  - Implement markReadingsAsSynchronized() to update is_synchronized and sync_status in single query
  - _Requirements: 2.1, 6.1, 6.2, 6.5_

- [ ]* 2.1 Write property test for batch size configuration retrieval
  - **Property 1: Batch Size Configuration Persistence**
  - **Validates: Requirements 1.1, 2.1**

- [x] 3. Update SyncManager to use tenant batch sizes
  - Modify SyncManager.initialize() to load batch sizes from tenant cache
  - Store downloadBatchSize and uploadBatchSize as instance variables
  - Update downloadReadings() to use downloadBatchSize for API calls
  - Update downloadReadings() to use uploadBatchSize for batch insertion
  - Log loaded batch sizes at initialization
  - _Requirements: 2.1, 2.3, 3.2_

- [ ]* 3.1 Write property test for SyncManager batch size loading
  - **Property 2: Batch Size Defaults Applied**
  - **Validates: Requirements 1.2, 2.2**

- [x] 4. Update MeterReadingUploadManager to use tenant batch sizes
  - Modify MeterReadingUploadManager.uploadReadings() to load batch sizes from tenant cache
  - Store uploadBatchSize as instance variable
  - Update getUnsynchronizedReadings() call to use uploadBatchSize
  - Update batch upload loop to use uploadBatchSize for splitting
  - _Requirements: 3.1, 3.3_

- [ ]* 4.1 Write property test for upload batch size usage
  - **Property 5: Batch Operations Use Configured Sizes**
  - **Validates: Requirements 3.1, 3.2**

- [x] 5. Implement sync status update after successful upload
  - Modify MeterReadingUploadManager.uploadBatch() to call markReadingsAsSynchronized() after successful upload
  - Pass reading IDs and tenant ID to markReadingsAsSynchronized()
  - Ensure update only happens on successful upload (not on failure)
  - Log count of updated readings
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 5.1 Write property test for sync status update
  - **Property 3: Readings Marked as Synchronized After Upload**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 5.2 Write property test for failed upload handling
  - **Property 4: Failed Uploads Do Not Update Sync Status**
  - **Validates: Requirements 6.3**

- [x] 6. Update reading batch insertion to use configured batch size
  - Modify SyncManager.downloadReadings() to split readings into batches of uploadBatchSize
  - Ensure batch insertion respects configured size
  - Log batch count and total records inserted
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 6.1 Write property test for batch splitting
  - **Property 6: Sync Status Update Atomicity**
  - **Validates: Requirements 6.5**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests with minimum 100 iterations
  - Verify no SQL errors in console
  - Ask the user if questions arise

- [ ] 8. Integration testing
  - Test end-to-end sync flow with custom batch sizes
  - Verify readings are uploaded in correct batch sizes
  - Verify sync status is updated after upload
  - Verify batch sizes are loaded from tenant cache
  - Monitor SQL activity to confirm reduction in queries
  - _Requirements: 3.3, 5.4, 6.1, 6.2_

- [ ] 9. Final checkpoint - Verify batch size optimization
  - Confirm SQL activity is reduced compared to baseline
  - Verify all readings are synchronized after upload
  - Verify batch sizes can be configured per tenant
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The existing tenant cache will be used for batch size storage
- Default batch sizes: download=1000, upload=100

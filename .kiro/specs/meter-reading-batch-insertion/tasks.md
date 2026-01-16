# Implementation Plan: Meter Reading Batch Insertion

## Overview

This implementation plan breaks down the meter reading batch insertion feature into discrete, manageable coding tasks. The feature extends the existing `ReadingBatcher` class to support the complete lifecycle: validating readings, generating optimized batch INSERT statements, executing them with transaction support, handling errors and retries, and providing comprehensive metrics.

## Tasks

- [x] 1. Add validation types and interfaces to bacnet-collection/types.ts
  - Add `ValidationResult` interface with valid, invalid, skipped counts
  - Add `ValidationError` interface with reading index and error messages
  - Add `BatchInsertionResult` interface with insertion metrics
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 2. Enhance ReadingBatcher with validation methods
  - [x] 2.1 Add `validateReadings()` method to validate all pending readings
    - Check meter_id is not null
    - Check timestamp is valid Date and not in future
    - Check value is valid number (not null, NaN, or non-numeric)
    - Check data_point (field_name) is not empty
    - Collect all validation errors
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 2.2 Write property test for validation logic
    - **Property 4: Invalid Readings Are Excluded**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

  - [x] 2.3 Add `getValidationErrors()` method to retrieve validation errors
    - Return array of ValidationError objects
    - _Requirements: 6.5, 6.6_

  - [ ]* 2.4 Write unit tests for validation methods
    - Test null meter_id rejection
    - Test invalid timestamp rejection
    - Test invalid value rejection
    - Test empty field_name rejection
    - Test valid reading acceptance
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Enhance ReadingBatcher with batch generation and execution
  - [x] 3.1 Refactor `flushBatch()` to use validation before insertion
    - Call `validateReadings()` before generating INSERT
    - Skip invalid readings from insertion
    - Log validation errors
    - _Requirements: 6.5, 4.1, 4.2_

  - [x] 3.2 Implement batch splitting logic for readings > 100
    - Split readings into batches of 100 or fewer
    - Generate separate INSERT statement for each batch
    - _Requirements: 3.5, 3.6_

  - [ ]* 3.3 Write property test for batch splitting
    - **Property 8: Batch Size Optimization**
    - **Validates: Requirements 3.5, 3.6**

  - [x] 3.4 Implement retry logic with exponential backoff
    - Retry failed batches up to 3 times
    - Wait 1 second before retry 2
    - Wait 2 seconds before retry 3
    - Log retry attempts
    - _Requirements: 4.5, 4.6_

  - [ ]* 3.5 Write property test for retry logic
    - **Property 7: Retry Logic Respects Maximum Attempts**
    - **Validates: Requirements 4.5, 4.6**

- [x] 4. Enhance ReadingBatcher with metrics tracking
  - [x] 4.1 Add metrics collection during batch insertion
    - Track total readings processed
    - Track successfully inserted count
    - Track failed count
    - Track skipped count (validation failures)
    - Track retry attempts
    - Capture timestamp of operation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 4.2 Implement `getInsertionMetrics()` method
    - Return BatchInsertionResult with all metrics
    - Include error messages from failed batches
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 4.3 Write property test for metrics accuracy
    - **Property 6: Insertion Metrics Are Accurate**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [x] 5. Enhance ReadingBatcher with transaction management
  - [x] 5.1 Ensure each batch executes within its own transaction
    - BEGIN transaction before batch INSERT
    - COMMIT on success
    - ROLLBACK on error
    - Log transaction status
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 5.2 Write property test for transaction atomicity
    - **Property 5: Batch Insertion Is Atomic**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 6. Implement field_name mapping in ReadingBatcher
  - [ ] 6.1 Verify data_point field contains field_name from register
    - Ensure PendingReading.data_point is set to register field_name
    - Log field_name mapping for each reading
    - _Requirements: 2.1, 2.2, 2.3, 5.5_

  - [ ]* 6.2 Write property test for field_name mapping
    - **Property 2: Field Names Map to Correct Columns**
    - **Validates: Requirements 2.1, 2.2, 2.3, 5.5**

- [x] 7. Implement default values in batch INSERT
  - [x] 7.1 Ensure is_synchronized defaults to false for all readings
    - Add is_synchronized=false to INSERT statement
    - Verify all inserted readings have is_synchronized=false
    - _Requirements: 3.3, 5.3_

  - [x] 7.2 Ensure retry_count defaults to 0 for all readings
    - Add retry_count=0 to INSERT statement
    - Verify all inserted readings have retry_count=0
    - _Requirements: 3.4, 5.4_

  - [ ]* 7.3 Write property test for default values
    - **Property 3: Default Values Are Applied Consistently**
    - **Validates: Requirements 3.3, 3.4, 5.3, 5.4**

- [x] 8. Implement reading cache management
  - [x] 8.1 Ensure readings are accumulated in memory during collection
    - Verify cache grows without database operations
    - Verify all readings are available after collection cycle
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 8.2 Implement cache clearing after successful insertion
    - Clear batch after successful flush
    - Maintain cache state for failed batches
    - _Requirements: 1.5_

  - [ ]* 8.3 Write property test for cache accumulation
    - **Property 1: All Valid Readings Are Inserted**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [x] 9. Checkpoint - Ensure all unit and property tests pass
  - Run all unit tests for validation, batch generation, metrics
  - Run all property tests for correctness properties
  - Verify no regressions in existing functionality
  - _Requirements: All_

- [x] 10. Integration testing
  - [x] 10.1 Test end-to-end collection → caching → insertion flow
    - Collect readings from multiple meters
    - Verify all readings cached correctly
    - Verify batch insertion succeeds
    - Verify metrics are accurate
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 4.1, 4.2, 7.1, 7.2, 7.3_

  - [x] 10.2 Test error recovery and retry scenarios
    - Mock database failure
    - Verify retry logic executes
    - Verify batch succeeds after retries
    - _Requirements: 4.4, 4.5, 4.6_

  - [x] 10.3 Test validation error handling
    - Include invalid readings in batch
    - Verify invalid readings skipped
    - Verify valid readings inserted
    - Verify validation errors logged
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Run complete test suite
  - Verify all properties hold
  - Verify all integration tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- All code changes should maintain backward compatibility with existing meter collection

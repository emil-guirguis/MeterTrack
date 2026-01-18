# Implementation Plan: Sync Batch Upload Transaction Abort Error Fix

## Overview

This implementation plan addresses the PostgreSQL error 25P02 "transaction is aborted" that occurs when inserting meter readings in a batch. The root cause is that when one INSERT fails, PostgreSQL marks the entire transaction as aborted, preventing subsequent queries from executing. The solution is to use savepoints for individual inserts, so that one failure doesn't abort the entire transaction.

## Tasks

- [ ] 1. Implement savepoint-based transaction handling in sync route
  - [ ] 1.1 Modify batch upload loop to use savepoints
    - For each reading, create a savepoint before insert
    - On error, rollback to savepoint (not entire transaction)
    - On success, release savepoint
    - Continue to next reading
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 1.2 Add meter validation before insert
    - Query meter table to verify meter exists
    - Check that meter belongs to the tenant
    - Skip reading if meter not found
    - Log warning for missing meter
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 1.3 Improve error handling and logging
    - Log error code and message for each failure
    - Log meter_id and data_point for context
    - Include error details in response
    - Track inserted, skipped, and error counts
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 1.4 Ensure response format is consistent
    - Return success flag
    - Return inserted count
    - Return skipped count
    - Return errors array with details
    - Return descriptive message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2. Test savepoint-based transaction handling
  - [ ] 2.1 Test batch upload with all valid readings
    - Create batch with 5 valid readings
    - Execute batch upload
    - Verify all 5 readings inserted
    - Verify response shows 5 inserted, 0 skipped
    - _Requirements: 1.5, 2.4, 2.5_

  - [ ] 2.2 Test batch upload with all invalid readings
    - Create batch with 5 readings for non-existent meters
    - Execute batch upload
    - Verify 0 readings inserted
    - Verify response shows 0 inserted, 5 skipped
    - Verify error details for each reading
    - _Requirements: 1.1, 1.2, 3.1, 3.2_

  - [ ] 2.3 Test batch upload with mixed valid/invalid readings
    - Create batch with 3 valid and 2 invalid readings
    - Execute batch upload
    - Verify 3 readings inserted
    - Verify 2 readings skipped
    - Verify error details for skipped readings
    - _Requirements: 1.5, 2.4, 2.5, 3.1, 3.2_

  - [ ] 2.4 Test batch upload with constraint violations
    - Create batch with readings that violate constraints
    - Execute batch upload
    - Verify transaction not aborted
    - Verify valid readings still inserted
    - Verify error details include constraint information
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.5 Test batch upload response format
    - Execute batch upload
    - Verify response has success flag
    - Verify response has inserted count
    - Verify response has skipped count
    - Verify response has errors array
    - Verify response has descriptive message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3. Checkpoint - Verify transaction handling works
  - Verify savepoints prevent transaction abort
  - Verify meter validation prevents constraint violations
  - Verify error information is accurate
  - Verify response format is consistent
  - Ask the user if questions arise

- [ ]* 4. Write property tests for batch upload
  - [ ]* 4.1 Write property test for savepoint rollback doesn't abort transaction
    - **Property 1: Savepoint Rollback Doesn't Abort Transaction**
    - **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3**

  - [ ]* 4.2 Write property test for all valid readings are inserted
    - **Property 2: All Valid Readings Are Inserted**
    - **Validates: Requirements 1.5, 2.4, 2.5**

  - [ ]* 4.3 Write property test for meter validation prevents constraint violations
    - **Property 3: Meter Validation Prevents Constraint Violations**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [ ]* 4.4 Write property test for error information is accurate
    - **Property 4: Error Information Is Accurate**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 4.5 Write property test for response format is consistent
    - **Property 5: Response Format Is Consistent**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ] 5. Integration testing
  - [ ] 5.1 Test end-to-end batch upload with successful completion
    - Create 10 valid readings
    - Execute batch upload
    - Verify all 10 inserted
    - Verify readings appear in database
    - Verify response is correct
    - _Requirements: 1.5, 2.4, 2.5_

  - [ ] 5.2 Test batch upload with partial failures
    - Create 10 readings (5 valid, 5 invalid)
    - Execute batch upload
    - Verify 5 inserted, 5 skipped
    - Verify valid readings in database
    - Verify error details for invalid readings
    - _Requirements: 1.1, 1.2, 1.5, 3.1, 3.2_

  - [ ] 5.3 Test batch upload with all failures
    - Create 10 readings for non-existent meters
    - Execute batch upload
    - Verify 0 inserted, 10 skipped
    - Verify error details for all readings
    - Verify transaction committed (no abort)
    - _Requirements: 1.1, 1.2, 3.1, 3.2_

  - [ ] 5.4 Test multiple batch uploads in sequence
    - Execute 3 batch uploads sequentially
    - Each with mixed valid/invalid readings
    - Verify all valid readings inserted
    - Verify no transaction abort errors
    - Verify response format consistent
    - _Requirements: 1.1, 1.2, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 5.5 Test batch upload with large number of readings
    - Create batch with 1000 readings
    - Execute batch upload
    - Verify performance is acceptable
    - Verify all valid readings inserted
    - Verify response format correct
    - _Requirements: 1.5, 2.4, 2.5_

- [ ] 6. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property tests
  - Run all integration tests
  - Verify no transaction abort errors
  - Verify meter readings upload successfully
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- The root cause is PostgreSQL transaction abort on first error
- The solution is to use savepoints for individual inserts
- Meter validation prevents constraint violations
- Error handling must be comprehensive and informative
- Response format must be consistent for client compatibility
- All changes are in `client/backend/src/routes/sync.js`
- **CRITICAL:** Use savepoints to prevent transaction abort
- **CRITICAL:** Validate meter exists before insert
- **CRITICAL:** Continue processing after individual failures
- **CRITICAL:** Return detailed error information
- **CRITICAL:** Commit transaction even if some inserts fail


# Implementation Plan: Device Register Upsert Syntax Error Fix

## Overview

This implementation plan addresses the duplicate column definition in device_register entity metadata that causes PostgreSQL syntax errors during upsert operations. The fix involves correcting the metadata, validating the change, and adding tests to prevent regression.

## Tasks

- [x] 1. Fix Device Register Entity Metadata
  - Update the device_register columns array to remove the duplicate device_id entry
  - Change from `['device_id', 'device_id', 'register_id']` to `['device_id', 'register_id']`
  - Verify the metadata matches the actual database schema
  - _Requirements: 1.1, 2.1_

- [ ]* 1.1 Write unit test for metadata validation
  - **Property 1: Metadata Column Uniqueness**
  - **Validates: Requirements 1.1, 2.1**
  - Test that device_register metadata has exactly 2 columns with no duplicates
  - Test that all entity metadata has no duplicate columns

- [ ] 2. Validate Upsert Query Generation
  - Review the upsertEntity function to ensure it generates correct SQL
  - Verify the ON CONFLICT clause uses the correct primary key columns
  - Verify the UPDATE SET clause excludes primary key columns
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 2.1 Write unit test for query generation
  - **Property 2: Upsert Query Validity**
  - **Validates: Requirements 2.3, 2.4**
  - Test that generated INSERT statement has correct column count
  - Test that generated ON CONFLICT clause is correct
  - Test that generated UPDATE SET clause is correct

- [ ] 3. Test Device Register Upsert Operation
  - Create a test device_register entity
  - Execute an upsert operation
  - Verify the operation completes without SQL errors
  - Verify the record is inserted/updated correctly
  - _Requirements: 1.3, 1.4, 3.1_

- [ ]* 3.1 Write property test for upsert round trip
  - **Property 3: Upsert Round Trip**
  - **Validates: Requirements 1.4, 3.1, 3.2**
  - Generate random device_register entities
  - Upsert them to the database
  - Query them back
  - Verify the returned data matches the input

- [ ]* 3.2 Write property test for conflict resolution
  - **Property 4: Conflict Resolution**
  - **Validates: Requirements 3.3**
  - Generate random device_register entities
  - Upsert them twice
  - Verify no duplicate records are created
  - Verify the second upsert updates the existing record

- [ ] 4. Verify Device Register Sync Operations
  - Run the device_register sync operation
  - Verify it completes without errors
  - Verify the sync result reports correct insert/update/delete counts
  - Verify synced data matches remote data
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Verify no regressions in other sync operations
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The core fix is a one-line change to the entity metadata
- All other tasks involve validation and testing to ensure correctness
- Property-based tests will run 100+ iterations to verify correctness across many inputs

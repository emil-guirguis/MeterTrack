# Implementation Plan: Device Register Upsert No Rows Returned

## Overview

Fix the device_register sync operation by correcting the composite primary key definition and ensuring consistent key usage throughout the sync logic. The fix involves updating entity metadata and sync logic to use only (device_id, register_id) as the business key.

## Tasks

- [ ] 1. Fix device_register entity metadata
  - Update ENTITY_METADATA in entities.ts to use correct composite key
  - Change primaryKey from ['device_register_id', 'device_id', 'register_id'] to ['device_id', 'register_id']
  - Update compositeKey to match
  - _Requirements: 1.1, 1.2_

- [ ]* 1.1 Write unit test for device_register metadata
  - Verify primaryKey is ['device_id', 'register_id']
  - Verify compositeKey is ['device_id', 'register_id']
  - Verify device_register_id is in columns list
  - _Requirements: 1.1, 1.2_

- [ ] 2. Fix composite key building in sync-device.ts
  - Update insert operation to use ['device_id', 'register_id'] for composite key
  - Update update operation to use ['device_id', 'register_id'] for composite key
  - Ensure consistency with delete operation (already correct)
  - _Requirements: 2.1, 2.2_

- [ ]* 2.1 Write unit test for composite key consistency
  - Test that all operations use same composite key format
  - Verify buildCompositeKeyString produces consistent results
  - _Requirements: 2.1, 2.2_

- [ ] 3. Verify upsert returns row
  - Ensure upsertEntity function receives RETURNING clause results
  - Verify error handling for zero-row returns
  - _Requirements: 3.1, 3.3_

- [ ]* 3.1 Write property test for upsert returns row
  - **Property 1: Upsert Returns Row**
  - **Validates: Requirements 3.1, 3.3**
  - Generate random device_register entities
  - Upsert each and verify RETURNING returns one row

- [ ]* 3.2 Write property test for conflict detection
  - **Property 3: Conflict Detection Uses Business Key**
  - **Validates: Requirements 1.1, 1.2**
  - Generate two entities with same (device_id, register_id)
  - Verify only one row exists after both upserts

- [ ] 4. Checkpoint - Verify all changes
  - Ensure metadata is correct
  - Ensure sync logic is consistent
  - Ensure upsert returns rows
  - Run manual sync test to verify device_register sync works

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The fix is straightforward: correct the composite key definition
- All changes are in two files: entities.ts and sync-device.ts
- No database schema changes needed (the table structure is correct)


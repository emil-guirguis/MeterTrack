# Implementation Plan: Sync Device Register and Register Tables

## Overview

This implementation plan breaks down the feature into discrete coding tasks that build incrementally. The approach creates a generic sync framework first, then integrates it into the meter-sync-agent to sync registers and device_register tables.

## Tasks

- [x] 1. Create Entity Metadata and Types
  - Define EntityMetadata interface for describing entity sync configuration
  - Create entity definitions for Meter, Register, and Device_Register
  - Add RegisterEntity and DeviceRegisterEntity types to entities.ts
  - _Requirements: 3b.1, 3b.4_

- [x] 2. Implement Generic Remote Query Function
  - Create getRemoteEntities function that queries remote database based on entity type
  - Support tenant_id filtering for tenant-scoped entities
  - Support custom query templates for complex entities
  - _Requirements: 3b.3, 1.1, 2.1_

- [ ]* 2.1 Write property test for remote query function
  - **Property 7: No Remote Database Modification**
  - **Validates: Requirements 1.2, 2.2**

- [x] 3. Implement Generic Local Query Function
  - Create getLocalEntities function that queries sync database based on entity type
  - Support filtering by primary key
  - _Requirements: 3b.3_

- [x] 4. Implement Generic Upsert Function
  - Create upsertEntity function that inserts or updates entities in sync database
  - Generate SQL dynamically based on entity metadata
  - Support composite keys
  - Handle ON CONFLICT clauses appropriately
  - _Requirements: 3b.1, 3b.5_

- [ ]* 4.1 Write property test for upsert function
  - **Property 1: Register Sync Idempotence**
  - **Validates: Requirements 1.1, 1.3, 1.4**

- [x] 5. Implement Generic Delete Function
  - Create deleteEntity function that deletes entities from sync database
  - Support composite keys
  - _Requirements: 3b.2_

- [ ]* 5.1 Write property test for delete function
  - **Property 3: Register Deletion Consistency**
  - **Validates: Requirements 1.5**

- [x] 6. Implement Register Sync Logic
  - Create syncRegisters function that orchestrates register synchronization
  - Query remote registers filtered by tenant_id
  - Query local registers
  - Identify inserts, updates, and deletes using composite key comparison
  - Call generic functions for each operation
  - Track and return counts
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

- [ ]* 6.1 Write property test for register sync
  - **Property 6: Tenant Isolation for Registers**
  - **Validates: Requirements 1.6**

- [x] 7. Implement Device Register Sync Logic
  - Create syncDeviceRegisters function that orchestrates device_register synchronization
  - Query remote device_register associations (no tenant filtering)
  - Query local device_register associations
  - Identify inserts, updates, and deletes using composite key comparison
  - Validate referential integrity before inserting
  - Call generic functions for each operation
  - Track and return counts
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ]* 7.1 Write property test for device_register sync
  - **Property 2: Device Register Referential Integrity**
  - **Validates: Requirements 2.6**

- [ ]* 7.2 Write property test for device_register deletion
  - **Property 4: Device Register Deletion Consistency**
  - **Validates: Requirements 2.5**

- [x] 8. Refactor MeterSyncAgent to Use Generic Functions
  - Update performSync to use generic sync functions for meters
  - Replace meter-specific upsert/delete logic with generic functions
  - Maintain existing meter sync behavior
  - _Requirements: 3b.6_

- [ ]* 8.1 Write unit tests for refactored meter sync
  - Verify meter sync still works correctly with generic functions
  - _Requirements: 3b.6_

- [x] 9. Integrate Register and Device Register Syncing into performSync
  - Add syncRegisters call after meter sync
  - Add syncDeviceRegisters call after register sync
  - Maintain sync ordering (meters → registers → device_register)
  - Aggregate results from all three sync operations
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_

- [ ]* 9.1 Write property test for sync result accuracy
  - **Property 5: Sync Result Accuracy**
  - **Validates: Requirements 4.3, 4.4, 4.6**

- [x] 10. Implement Error Handling and Logging
  - Add try-catch blocks around each sync operation
  - Log errors with entity type and details
  - Continue to next sync operation if one fails
  - Return comprehensive error information in result
  - _Requirements: 4.5, 5.4, 5.5_

- [x] 11. Update SyncDatabase Interface
  - Add methods for querying registers and device_register associations
  - Add methods for upserting and deleting registers
  - Add methods for upserting and deleting device_register associations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 12. Implement SyncDatabase Methods
  - Implement getRegisters method in data-sync.ts
  - Implement getDeviceRegisters method in data-sync.ts
  - Implement upsertRegister method in data-sync.ts
  - Implement deleteRegister method in data-sync.ts
  - Implement upsertDeviceRegister method in data-sync.ts
  - Implement deleteDeviceRegister method in data-sync.ts
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 13. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Verify no regressions in existing meter sync functionality
  - Ask the user if questions arise

- [ ]* 14. Write integration tests
  - Test full sync cycle with all three entity types
  - Test sync ordering is maintained
  - Test error recovery and continuation
  - Test with large datasets
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Run all tests (unit, property-based, integration)
  - Verify sync results are accurate
  - Verify no remote database modifications
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Generic functions should be well-documented for future extensibility
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases


# Requirements: Device Register Upsert No Rows Returned

## Introduction

The device_register sync operation is failing with "Upsert failed: No rows returned for device_register". This occurs because the composite primary key definition is incorrect, causing the ON CONFLICT clause in the upsert query to fail silently (DO NOTHING) instead of performing the insert.

## Glossary

- **device_register**: Junction table linking devices to registers
- **Composite Key**: Multiple columns that together uniquely identify a row
- **ON CONFLICT**: PostgreSQL clause that handles duplicate key violations
- **device_register_id**: Auto-generated primary key (not part of the business key)
- **device_id, register_id**: The actual business composite key

## Requirements

### Requirement 1: Fix Device Register Composite Key Definition

**User Story:** As a sync system, I want the device_register table to have the correct composite key definition, so that upsert operations work correctly.

#### Acceptance Criteria

1. WHEN the device_register entity metadata is defined, THE system SHALL use only ['device_id', 'register_id'] as the composite key
2. WHEN the device_register entity metadata is defined, THE system SHALL NOT include 'device_register_id' in the composite key
3. WHEN the device_register entity metadata is defined, THE system SHALL keep 'device_register_id' in the columns list for SELECT operations

### Requirement 2: Ensure Consistent Composite Key Usage in Sync Logic

**User Story:** As a sync system, I want composite key building to be consistent across all operations, so that insert, update, and delete operations all use the same key.

#### Acceptance Criteria

1. WHEN building composite keys for device_register lookups, THE system SHALL use ['device_id', 'register_id'] consistently
2. WHEN comparing remote and local device_register associations, THE system SHALL use the same composite key format for all operations (insert, update, delete)
3. WHEN upserting a device_register, THE system SHALL return at least one row from the RETURNING clause

### Requirement 3: Validate Upsert Returns Data

**User Story:** As a sync system, I want upsert operations to return the inserted/updated row, so that I can verify the operation succeeded.

#### Acceptance Criteria

1. WHEN an upsert operation completes, THE system SHALL receive at least one row in the result set
2. IF an upsert returns zero rows, THE system SHALL throw an error indicating the upsert failed
3. WHEN a device_register is upserted with DO NOTHING (no changes), THE system SHALL still return the existing row


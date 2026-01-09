# Requirements Document: Sync Device Register and Register Tables

## Introduction

The meter-sync-agent currently synchronizes only meter and meter_element data from the remote Client System database to the local Sync database. This feature extends the sync agent to also synchronize the `device_register` junction table and the `register` table, ensuring that device-to-register associations and register configurations are kept in sync across systems.

## Glossary

- **Sync Database**: Local PostgreSQL database that stores synchronized data from the remote Client System
- **Remote Database**: Client System PostgreSQL database that is the source of truth for all data
- **device_register**: Junction table that associates devices with registers (many-to-many relationship)
- **register**: Table containing register configurations (Modbus register definitions)
- **Tenant ID**: Identifier for the tenant/organization, used to filter data by tenant
- **Composite Key**: Combination of multiple fields used to uniquely identify a record
- **Upsert**: Insert or update operation that inserts if record doesn't exist, updates if it does

## Requirements

### Requirement 1: Sync Register Table (Read-Only from Remote)

**User Story:** As a system administrator, I want the register table to be synchronized from the remote database to the sync database, so that register configurations are always up-to-date.

#### Acceptance Criteria

1. WHEN the meter sync agent performs a sync operation, THE Sync Agent SHALL query the remote database for all registers (READ-ONLY)
2. THE Sync Agent SHALL NEVER modify the remote database
3. WHEN registers exist in the remote database but not in the sync database, THE Sync Agent SHALL insert them into the sync database
4. WHEN registers exist in both databases with different values, THE Sync Agent SHALL update the sync database records with remote values
5. WHEN registers exist in the sync database but not in the remote database, THE Sync Agent SHALL delete them from the sync database
6. THE Sync Agent SHALL filter registers by tenant_id to ensure data isolation

### Requirement 2: Sync Device Register Junction Table (Read-Only from Remote)

**User Story:** As a system administrator, I want device-to-register associations to be synchronized from the remote database to the sync database, so that device register mappings remain consistent.

#### Acceptance Criteria

1. WHEN the meter sync agent performs a sync operation, THE Sync Agent SHALL query the remote database for all device_register associations (READ-ONLY)
2. THE Sync Agent SHALL NEVER modify the remote database
3. WHEN device_register associations exist in the remote database but not in the sync database, THE Sync Agent SHALL insert them into the sync database
4. WHEN device_register associations exist in both databases with different values, THE Sync Agent SHALL update the sync database records with remote values
5. WHEN device_register associations exist in the sync database but not in the remote database, THE Sync Agent SHALL delete them from the sync database
6. THE Sync Agent SHALL maintain referential integrity by ensuring associated devices and registers exist before inserting device_register records
7. THE Sync Agent SHALL sync all device_register associations without tenant_id filtering (devices are not tenant-scoped)

### Requirement 3: Extend SyncDatabase Interface

**User Story:** As a developer, I want the SyncDatabase interface to include methods for syncing registers and device_register associations, so that the sync agent can use a consistent interface.

#### Acceptance Criteria

1. THE SyncDatabase interface SHALL include methods for upserting registers
2. THE SyncDatabase interface SHALL include methods for deleting registers
3. THE SyncDatabase interface SHALL include methods for upserting device_register associations
4. THE SyncDatabase interface SHALL include methods for deleting device_register associations
5. THE SyncDatabase interface SHALL include methods for querying registers and device_register associations

### Requirement 3b: Create Generic Sync Functions

**User Story:** As a developer, I want generic, reusable sync functions that work with any entity type, so that future tables can be synced using the same pattern without code duplication.

#### Acceptance Criteria

1. THE Sync Agent SHALL have a generic upsert function that accepts an entity type and entity data
2. THE Sync Agent SHALL have a generic delete function that accepts an entity type and entity identifiers
3. THE Sync Agent SHALL have a generic query function that accepts an entity type and returns all records
4. THE generic functions SHALL generate appropriate SQL based on the entity type
5. THE generic functions SHALL support composite keys for entities that require them
6. THE Meter Sync Agent SHALL be refactored to use these generic functions instead of meter-specific logic
7. THE generic functions SHALL be reusable for registers, device_register, and future entity types

### Requirement 4: Integrate Register and Device Register Syncing into performSync

**User Story:** As a system administrator, I want register and device_register data to be synced as part of the regular meter sync operation, so that all related data stays synchronized.

#### Acceptance Criteria

1. WHEN performSync is called, THE Sync Agent SHALL sync registers after syncing meters using the generic sync functions
2. WHEN performSync is called, THE Sync Agent SHALL sync device_register associations after syncing registers using the generic sync functions
3. WHEN syncing registers, THE Sync Agent SHALL log the number of registers inserted, updated, and deleted
4. WHEN syncing device_register associations, THE Sync Agent SHALL log the number of associations inserted, updated, and deleted
5. WHEN any sync operation fails, THE Sync Agent SHALL log the error and continue with the next sync operation
6. THE Sync Agent SHALL return a comprehensive sync result including counts for all three entity types (meters, registers, device_register)

### Requirement 5: Handle Sync Ordering and Dependencies

**User Story:** As a developer, I want the sync operations to be ordered correctly to maintain data integrity, so that foreign key constraints are not violated.

#### Acceptance Criteria

1. WHEN syncing, THE Sync Agent SHALL sync meters first (they have no dependencies on registers)
2. WHEN syncing, THE Sync Agent SHALL sync registers second (they have no dependencies on meters)
3. WHEN syncing, THE Sync Agent SHALL sync device_register associations last (they depend on both devices and registers)
4. WHEN a device_register association references a non-existent device or register, THE Sync Agent SHALL skip that association and log a warning
5. WHEN a device_register association is skipped due to missing references, THE Sync Agent SHALL continue processing other associations


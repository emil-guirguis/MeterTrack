# Requirements Document: Device Register Composite Key Validation

## Introduction

The `device_register` table is a junction table with a composite primary key consisting of `device_id` and `register_id`. Currently, the validation logic in the sync process incorrectly attempts to validate the existence of a `device_register_id` column that doesn't exist. The validation needs to be enhanced to support composite key validation.

## Glossary

- **Composite Key**: A primary key consisting of multiple columns (device_id, register_id)
- **Junction Table**: A table that represents a many-to-many relationship between two entities
- **Referential Integrity**: The constraint that foreign key values must reference existing entities
- **Sync Process**: The operation that synchronizes device_register associations from remote to local database

## Requirements

### Requirement 1: Support Composite Key Validation

**User Story:** As a sync operator, I want the validation system to check for composite key existence, so that referential integrity is properly maintained for junction tables.

#### Acceptance Criteria

1. WHEN validating a composite key entity, THE validation function SHALL accept multiple column names and values
2. WHEN checking if a device_register association exists, THE validation function SHALL verify both device_id AND register_id exist in their respective tables
3. WHEN a device_register association references a non-existent device, THE sync process SHALL skip that association and log a warning
4. WHEN a device_register association references a non-existent register, THE sync process SHALL skip that association and log a warning
5. WHEN both device and register exist, THE sync process SHALL proceed with the insert/update operation

### Requirement 2: Maintain Backward Compatibility

**User Story:** As a developer, I want existing single-column validation calls to continue working, so that I don't need to update all validation calls at once.

#### Acceptance Criteria

1. WHEN calling validateEntityExists with a single column, THE function SHALL work as before
2. WHEN calling validateEntityExists with multiple columns, THE function SHALL validate all columns
3. THE function signature SHALL support both single and multiple column validation

### Requirement 3: Fix Device Register Sync Validation

**User Story:** As a sync operator, I want device_register associations to be validated correctly, so that only valid associations are synced.

#### Acceptance Criteria

1. WHEN syncing device_register inserts, THE process SHALL validate that both device_id and register_id exist
2. WHEN syncing device_register updates, THE process SHALL validate that both device_id and register_id exist
3. WHEN syncing device_register deletes, THE process SHALL not require validation (deletes are safe)
4. THE validation SHALL use the composite key validation function

# Requirements: Meter Table Unique Constraint Fix

## Introduction

The meter table upsert operation fails with "there is no unique or exclusion constraint matching the ON CONFLICT specification" error. The SQL uses `ON CONFLICT (id)` but the meter table has a unique constraint on the composite key `(id, meter_element_id)`, not on `id` alone. The upsert query must be updated to reference the correct composite constraint.

## Glossary

- **Meter**: A device that collects readings, identified by a unique ID
- **Meter Element**: A specific component or measurement point within a meter
- **Composite Key**: A unique constraint spanning multiple columns
- **ON CONFLICT**: PostgreSQL clause for handling duplicate key violations during INSERT
- **Upsert**: Combined INSERT or UPDATE operation
- **Sync Database**: Local PostgreSQL database storing meter configurations

## Requirements

### Requirement 1: Update Upsert Query to Use Composite Key

**User Story:** As a sync service, I want the upsert query to reference the correct composite constraint, so that ON CONFLICT works as intended.

#### Acceptance Criteria

1. WHEN upsertMeter is called, THE SQL query SHALL use `ON CONFLICT (id, meter_element_id)` instead of `ON CONFLICT (id)`
2. WHEN a conflict occurs on the composite key, THE existing row SHALL be updated with new values
3. WHEN the upsert completes successfully, THE query SHALL return the affected row
4. WHEN meter_element_id is null, THE upsert SHALL still work correctly

### Requirement 2: Fix Data-Sync Implementation

**User Story:** As a developer, I want the data-sync.ts file to use the correct ON CONFLICT clause, so that meter upsert operations succeed.

#### Acceptance Criteria

1. WHEN the upsertMeter method in data-sync.ts is executed, THE SQL query SHALL reference the composite key constraint
2. WHEN the query is updated, THE existing meter records SHALL continue to work
3. WHEN new meters are upserted, THE operation SHALL succeed without constraint errors

### Requirement 3: Handle Null meter_element_id Values

**User Story:** As a sync service, I want to handle meters that may not have an element ID, so that all meters can be stored correctly.

#### Acceptance Criteria

1. WHEN a meter has a null meter_element_id, THE meter SHALL still be storable in the table
2. WHEN upserting a meter with null meter_element_id, THE operation SHALL work correctly
3. WHEN multiple meters have null meter_element_id, THE table SHALL allow them (nulls are not considered equal in unique constraints)

### Requirement 4: Verify Upsert Success

**User Story:** As a sync service, I want to verify that upsert operations complete successfully, so that I can confirm meters are synchronized.

#### Acceptance Criteria

1. WHEN upsertMeter completes without error, THE meter data SHALL be persisted to the database
2. WHEN the same meter is upserted again, THE existing row SHALL be updated, not duplicated
3. WHEN upsert fails, THE error message SHALL clearly indicate the constraint violation

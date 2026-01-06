# Requirements Document: Meter ID Type Mismatch Fix

## Introduction

The sync system has a type safety issue where `MeterEntity.meter_id` is defined as a `number` in the TypeScript interface, but data from the database and API is being passed as strings. This causes type mismatches during upsert operations and can lead to runtime errors or data corruption. The fix requires standardizing the type definition and ensuring proper type conversion throughout the data flow.

## Glossary

- **MeterEntity**: TypeScript interface representing a meter record with properties like meter_id, name, ip, port, etc.
- **meter_id**: Unique identifier for a meter, currently defined as `number` but received as `string` from database queries
- **Type Mismatch**: Situation where a value's actual type (string) differs from its declared type (number)
- **Upsert Operation**: INSERT or UPDATE operation that creates or updates a meter record
- **Data Flow**: Path that meter data takes from remote database → local sync database → API calls

## Requirements

### Requirement 1: Standardize Meter ID Type Definition

**User Story:** As a developer, I want the meter_id type to be consistent throughout the system, so that I can avoid type mismatches and runtime errors.

#### Acceptance Criteria

1. THE MeterEntity interface SHALL define meter_id as a string type
2. WHEN meter data is queried from the database, THE meter_id SHALL be treated as a string
3. WHEN meter data is passed to upsert operations, THE meter_id SHALL remain a string without forced conversion
4. THE type definition SHALL match the actual data type received from database queries

### Requirement 2: Fix Type Conversions in Meter Sync Agent

**User Story:** As a developer, I want the meter sync agent to properly handle meter_id as a string, so that data is correctly synchronized between databases.

#### Acceptance Criteria

1. WHEN the meter sync agent retrieves meters from the remote database, THE meter_id SHALL be treated as a string
2. WHEN creating composite keys for meter lookup, THE meter_id SHALL be converted to string if needed
3. WHEN passing meter data to upsertMeter, THE meter_id SHALL be a string type
4. WHEN comparing local and remote meters, THE meter_id comparison SHALL work correctly with string types

### Requirement 3: Fix Type Conversions in Upsert Operation

**User Story:** As a developer, I want the upsert operation to correctly handle string meter_ids, so that meters are properly inserted or updated in the database.

#### Acceptance Criteria

1. WHEN upsertMeter receives a meter with string meter_id, THE operation SHALL execute without type errors
2. WHEN preparing SQL parameters for upsert, THE meter_id parameter SHALL be passed as-is without conversion
3. WHEN the upsert completes, THE meter record SHALL be correctly stored with the string meter_id
4. WHEN logging upsert operations, THE meter_id SHALL be displayed as a string in logs

### Requirement 4: Ensure Type Safety in Related Operations

**User Story:** As a developer, I want all meter operations to use consistent types, so that the entire sync system is type-safe.

#### Acceptance Criteria

1. WHEN deleting a meter via deleteSyncMeter, THE meterId parameter SHALL accept string type
2. WHEN querying meters via getMeterById, THE id parameter SHALL accept string type
3. WHEN updating meter last reading, THE externalId parameter SHALL accept string type
4. WHEN creating meter reading records, THE meter_id reference SHALL be a string type


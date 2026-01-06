# Requirements Document: Remove Duplicate Filter Interfaces

## Introduction

The system currently has hardcoded filter interfaces in the frontend stores that duplicate filter definitions already present in the backend schemas. Each model (Contact, Meter, Device, etc.) has a `*Filters` interface in its store that doesn't match the actual filterable fields defined in the schema. This creates maintenance burden and inconsistency—when the schema changes, the frontend filters must be manually updated.

The solution is to remove all hardcoded filter interfaces and generate them dynamically from the schema, making the schema the single source of truth for what fields are filterable.

## Glossary

- **Schema**: The backend data structure definition that includes field metadata (type, filterable status, enum values)
- **Filterable Field**: A field marked with `filterable: ['true']` or `filterable: ['main']` in the schema
- **Filter Interface**: TypeScript interface defining the shape of filter parameters (e.g., `ContactFilters`)
- **Hardcoded Filters**: Filter interfaces manually defined in frontend stores with static field names
- **Dynamic Filters**: Filter interfaces generated at runtime from schema definitions
- **Single Source of Truth**: The backend schema as the authoritative definition of what fields are filterable

## Requirements

### Requirement 1: Identify All Duplicate Filter Interfaces

**User Story:** As a developer, I want to identify all hardcoded filter interfaces in the codebase, so that I can systematically remove them.

#### Acceptance Criteria

1. WHEN scanning the frontend codebase, THE System SHALL identify all `*Filters` interfaces defined in store files
2. WHEN a filter interface is found, THE System SHALL compare it against the corresponding backend schema
3. WHEN comparing, THE System SHALL determine which fields in the interface don't exist in the schema
4. WHEN the comparison is complete, THE System SHALL document all mismatches and duplicates
5. WHEN documentation is complete, THE System SHALL list all models affected (Contact, Meter, Device, Location, etc.)

### Requirement 2: Remove Hardcoded ContactFilters Interface

**User Story:** As a developer, I want to remove the hardcoded `ContactFilters` interface from the contact store, so that filters are generated from the schema.

#### Acceptance Criteria

1. WHEN the contact store is loaded, THE System SHALL NOT define a hardcoded `ContactFilters` interface
2. WHEN filters are needed, THE System SHALL fetch the Contact schema from the backend
3. WHEN the schema is fetched, THE System SHALL extract all fields with `filterable: ['true']` or `filterable: ['main']`
4. WHEN filters are extracted, THE System SHALL generate a dynamic filter interface matching the schema fields
5. WHEN the API is called, THE System SHALL use only the schema-defined filterable fields in query parameters

### Requirement 3: Remove Hardcoded MeterFilters Interface

**User Story:** As a developer, I want to remove the hardcoded `MeterFilters` interface from the meter store, so that filters are generated from the schema.

#### Acceptance Criteria

1. WHEN the meter store is loaded, THE System SHALL NOT define a hardcoded `MeterFilters` interface
2. WHEN filters are needed, THE System SHALL fetch the Meter schema from the backend
3. WHEN the schema is fetched, THE System SHALL extract all fields with `filterable: ['true']` or `filterable: ['main']`
4. WHEN filters are extracted, THE System SHALL generate a dynamic filter interface matching the schema fields
5. WHEN the API is called, THE System SHALL use only the schema-defined filterable fields in query parameters

### Requirement 4: Create Schema-Based Filter Generation Utility

**User Story:** As a developer, I want a reusable utility to generate filter interfaces from any schema, so that I don't duplicate this logic across stores.

#### Acceptance Criteria

1. WHEN a schema is provided to the utility, THE System SHALL extract all filterable fields
2. WHEN extracting fields, THE System SHALL identify fields with `filterable: ['true']` or `filterable: ['main']`
3. WHEN a field has `enumValues`, THE System SHALL include those values in the filter definition
4. WHEN a field is of type `BOOLEAN`, THE System SHALL generate a select filter with true/false options
5. WHEN the utility completes, THE System SHALL return a typed filter interface definition

### Requirement 5: Update All Store Implementations

**User Story:** As a developer, I want all entity stores to use schema-based filters instead of hardcoded interfaces, so that the system is consistent.

#### Acceptance Criteria

1. WHEN a store is initialized, THE System SHALL fetch the corresponding schema
2. WHEN the schema is fetched, THE System SHALL generate filters dynamically
3. WHEN filters are generated, THE System SHALL use them for all API requests
4. WHEN the schema changes, THE System SHALL automatically regenerate filters
5. WHEN all stores are updated, THE System SHALL have no hardcoded filter interfaces remaining

### Requirement 6: Ensure Backward Compatibility

**User Story:** As a developer, I want the filter changes to not break existing functionality, so that the system continues to work correctly.

#### Acceptance Criteria

1. WHEN filters are applied, THE System SHALL return the same results as before
2. WHEN the API receives filter parameters, THE System SHALL correctly parse and apply them
3. WHEN multiple filters are combined, THE System SHALL use AND logic as before
4. WHEN empty filters are provided, THE System SHALL ignore them as before
5. WHEN existing tests run, THE System SHALL pass without modification


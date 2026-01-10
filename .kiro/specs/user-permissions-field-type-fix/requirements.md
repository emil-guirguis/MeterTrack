# Requirements Document: User Permissions Field Type Fix

## Introduction

The User model's permissions field is causing database validation errors during update operations. The field is defined as `FieldTypes.ARRAY` in the schema but is stored as a PostgreSQL ARRAY type in the database. When the update endpoint receives permissions as a JSON string or nested object (which is the correct format for complex permissions), the type validation fails because the schema expects an array.

This fix ensures that permissions are properly handled throughout the application lifecycle: creation, retrieval, update, and serialization.

## Glossary

- **Permissions**: Access control rules stored as either a flat array of strings (e.g., `['user:create', 'meter:read']`) or a nested object (e.g., `{ user: { create: true }, meter: { read: true } }`)
- **Flat Array Format**: Permissions as a simple array of permission strings
- **Nested Object Format**: Permissions as a hierarchical object with modules and actions
- **JSON String Storage**: Permissions serialized as a JSON string in the database
- **PostgreSQL ARRAY**: Native PostgreSQL array type for storing text values
- **Field Type Validation**: The process of checking that field values match their declared types before database operations
- **Schema Definition**: The metadata that describes entity fields, their types, and validation rules

## Requirements

### Requirement 1: Fix Permissions Field Type Definition

**User Story:** As a developer, I want the permissions field type to match the actual database storage format, so that update operations don't fail with type validation errors.

#### Acceptance Criteria

1. WHEN the User schema is loaded, THE permissions field type SHALL be defined as `FieldTypes.JSON` instead of `FieldTypes.ARRAY`
2. WHEN permissions are stored in the database, THE permissions column SHALL accept both flat array format and nested object format
3. WHEN permissions are retrieved from the database, THE permissions value SHALL be properly deserialized based on its storage format
4. WHEN the type validator checks the permissions field, THE validator SHALL accept JSON strings, objects, and arrays as valid types

### Requirement 2: Ensure Permissions Serialization on Update

**User Story:** As a developer, I want permissions to be properly serialized when updating a user, so that the database receives the correct format.

#### Acceptance Criteria

1. WHEN a user update includes permissions as a nested object, THE update endpoint SHALL serialize it to a JSON string before database storage
2. WHEN a user update includes permissions as a flat array, THE update endpoint SHALL convert it to the appropriate storage format
3. WHEN permissions are updated, THE update operation SHALL validate the permissions structure before database storage
4. WHEN the update completes successfully, THE permissions SHALL be retrievable in both flat array and nested object formats

### Requirement 3: Validate Permissions Structure

**User Story:** As a developer, I want permissions to be validated for correct structure, so that invalid permissions don't corrupt the database.

#### Acceptance Criteria

1. WHEN permissions are provided as a nested object, THE validator SHALL ensure all values are boolean
2. WHEN permissions are provided as a flat array, THE validator SHALL ensure all elements are strings in the format "module:action"
3. IF permissions fail validation, THE update operation SHALL return a descriptive error message
4. WHEN permissions are empty or null, THE system SHALL handle them gracefully without errors

### Requirement 4: Maintain Backward Compatibility

**User Story:** As a developer, I want existing permissions data to continue working, so that no data migration is required.

#### Acceptance Criteria

1. WHEN retrieving a user with existing permissions, THE system SHALL correctly parse permissions regardless of their storage format
2. WHEN a user has permissions stored as a PostgreSQL array, THE system SHALL convert them to the nested object format for API responses
3. WHEN a user has permissions stored as a JSON string, THE system SHALL parse and return them correctly
4. WHEN permissions are retrieved, THE getPermissionsAsNestedObject() method SHALL return a valid nested object in all cases

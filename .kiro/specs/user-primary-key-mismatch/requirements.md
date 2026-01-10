# Requirements: User Primary Key Mismatch Fix

## Introduction

The UserWithSchema model has an incorrect database field mapping for the primary key. The schema defines the `id` field with `dbField: 'users_id'`, but the actual database column is `id`. This mismatch causes queries to fail with "column users.users_id does not exist" errors when attempting to fetch user data, which cascades to break dependent features like the contact module schema loading.

## Glossary

- **UserWithSchema**: The User model class that defines the schema for the users table
- **dbField**: The mapping between the schema field name and the actual database column name
- **Primary Key**: The unique identifier column for a table (in this case, `id`)
- **Schema Definition**: The declarative definition of entity fields, form tabs, and relationships

## Requirements

### Requirement 1: Fix User Primary Key Database Field Mapping

**User Story:** As a developer, I want the UserWithSchema model to correctly map the primary key field to the database column, so that user queries execute successfully without column mismatch errors.

#### Acceptance Criteria

1. WHEN the UserWithSchema model is loaded, THE schema definition SHALL map the `id` field's `dbField` property to `'id'` (not `'users_id'`)
2. WHEN a query is executed against the users table, THE system SHALL successfully access the `id` column without errors
3. WHEN the schema endpoint is called for any entity, THE user verification step SHALL complete successfully without "column users.id does not exist" errors
4. WHEN the contact module is opened, THE schema loader SHALL successfully fetch the contact schema without 500 errors

### Requirement 2: Verify All Entity Field Database Mappings

**User Story:** As a developer, I want to ensure all entity field mappings in UserWithSchema are correct, so that the model works reliably with the database schema.

#### Acceptance Criteria

1. WHEN the UserWithSchema schema is reviewed, THE `passwordHash` field's `dbField` SHALL be verified to match the actual database column name
2. WHEN the UserWithSchema schema is reviewed, THE `createdAt` field's `dbField` SHALL be verified to match the actual database column name
3. WHEN the UserWithSchema schema is reviewed, THE `updatedAt` field's `dbField` SHALL be verified to match the actual database column name
4. WHEN the UserWithSchema schema is reviewed, THE `lastLogin` field's `dbField` SHALL be verified to match the actual database column name
5. WHEN the UserWithSchema schema is reviewed, THE `passwordChangedAt` field's `dbField` SHALL be verified to match the actual database column name
6. WHEN the UserWithSchema schema is reviewed, THE `failedLoginAttempts` field's `dbField` SHALL be verified to match the actual database column name
7. WHEN the UserWithSchema schema is reviewed, THE `lockedUntil` field's `dbField` SHALL be verified to match the actual database column name

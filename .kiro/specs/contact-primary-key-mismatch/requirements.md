# Requirements Document: Contact Primary Key Mismatch Fix

## Introduction

As part of a system-wide refactor, all table primary keys were renamed from `id` to `{tablename}_id` (e.g., `contact_id`, `user_id`, `device_id`). The Contact model's `primaryKey` property still returns `'id'` instead of `'contact_id'`, causing UPDATE operations to fail with "column contact.id does not exist" errors. This fix aligns the Contact model with the new naming convention used across all tables.

## Glossary

- **Primary Key**: The unique identifier column for a table (in this case, should be `contact_id`)
- **Schema Definition**: The field metadata that defines how a model maps to database columns
- **ORM**: Object-Relational Mapping - the framework that translates model operations to SQL
- **Entity Field**: System-managed fields like ID and tenant_id that are not part of the form schema

## Requirements

### Requirement 1: Fix ORM Helper to Use dbField for Primary Key

**User Story:** As a developer, I want the ORM helpers to use the `dbField` property when constructing SQL statements, so that primary key columns with different names work correctly.

#### Acceptance Criteria

1. WHEN the ORM builds a WHERE clause for the primary key, THE helper SHALL look up the field definition and use its `dbField` property instead of the field name
2. WHEN an UPDATE operation is performed on a Contact, THE WHERE clause SHALL use 'contact_id' (from dbField) instead of 'id'
3. WHEN the Contact schema is defined, THE entityFields SHALL have a field named 'id' with dbField: 'contact_id' for the primary key
4. WHEN a Contact record is updated via the API, THE operation SHALL succeed without "column contact.id does not exist" errors

### Requirement 2: Ensure Consistency with Other Models

**User Story:** As a developer, I want the Contact model to follow the same primary key pattern as other models in the system, so that the codebase is consistent.

#### Acceptance Criteria

1. WHEN reviewing other models (User, Device, Meter, Location, etc.), THE Contact model SHALL follow the same `{tablename}_id` primary key naming convention
2. WHEN the Contact model is used in the ORM, THE primaryKey property SHALL return 'contact_id' to match the system-wide refactor
3. WHEN the Contact model is compared with other models, THE primary key pattern SHALL be identical across all entities

### Requirement 3: Validate Contact Update Operations

**User Story:** As a user, I want to be able to update contact information without encountering database errors, so that the contact management feature works reliably.

#### Acceptance Criteria

1. WHEN a contact is updated via the PUT /api/contacts/:id endpoint, THE operation SHALL complete successfully
2. WHEN contact data is persisted to the database, THE updated values SHALL be correctly stored and retrievable
3. WHEN multiple contacts are updated, EACH update operation SHALL work independently without affecting others

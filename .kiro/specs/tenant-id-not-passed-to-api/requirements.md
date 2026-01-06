# Requirements: Tenant ID Not Passed to API

## Introduction

When creating a new contact, the `tenant_id` is not being passed to the backend API, causing foreign key constraint violations. The backend correctly attempts to extract `tenant_id` from the authenticated user, but the user object loaded from the database doesn't have the `tenant_id` field properly mapped.

## Glossary

- **tenant_id**: Database column that stores the tenant identifier for multi-tenant isolation
- **tenantId**: JavaScript property name (camelCase) that maps to the `tenant_id` database column
- **User Model**: The User entity that stores authentication and authorization information
- **Deserialization**: The process of converting database rows to JavaScript objects
- **Field Mapping**: The mapping between database column names (snake_case) and JavaScript property names (camelCase)

## Requirements

### Requirement 1: User Object Contains Tenant ID

**User Story:** As a backend service, I want the User object loaded from the database to include the tenant_id field, so that I can use it to enforce multi-tenant isolation.

#### Acceptance Criteria

1. WHEN a user is loaded from the database via User.findById(), THE User object SHALL contain a tenant_id property with the correct value
2. WHEN a user is loaded from the database via User.findByEmail(), THE User object SHALL contain a tenant_id property with the correct value
3. WHEN a user is loaded from the database via User.findAll(), EACH User object in the result SHALL contain a tenant_id property with the correct value
4. THE tenant_id property SHALL be accessible as both `user.tenant_id` and `user.tenantId` for backward compatibility

### Requirement 2: Field Deserialization Maps Database Columns to Properties

**User Story:** As a model framework, I want database columns to be correctly mapped to their corresponding JavaScript properties during deserialization, so that camelCase properties are properly populated from snake_case database columns.

#### Acceptance Criteria

1. WHEN a database row is deserialized, THE deserializeRow function SHALL map database column names to their corresponding field property names using the field metadata
2. WHEN a field has a dbField property that differs from its name property, THE deserialized object SHALL use the name property as the key
3. FOR ALL fields with dbField mappings, THE deserialized object SHALL contain the property using the name property, not the dbField property
4. THE deserialization process SHALL preserve the field metadata's name-to-dbField mapping for all entity fields

### Requirement 3: Contact Creation Receives Tenant ID from Authenticated User

**User Story:** As a contact creation endpoint, I want to automatically include the tenant_id from the authenticated user, so that all contacts are properly associated with the correct tenant.

#### Acceptance Criteria

1. WHEN a contact is created via POST /contacts, THE authenticated user's tenant_id SHALL be automatically included in the contact data
2. WHEN the authenticated user object contains tenant_id, THE contact creation SHALL use that value for the contact's tenant_id field
3. IF the authenticated user does not have a tenant_id, THE contact creation SHALL return a 400 error with a descriptive message
4. THE tenant_id SHALL NOT be modifiable by the client - it SHALL always come from the authenticated user


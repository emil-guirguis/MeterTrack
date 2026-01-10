# Design: User Primary Key Mismatch Fix

## Overview

The UserWithSchema model contains an incorrect database field mapping for the primary key. The `id` field is mapped to `dbField: 'users_id'`, but the actual database column is `id`. This causes all queries involving user lookups to fail with "column users.id does not exist" errors.

The fix involves:
1. Correcting the `id` field's `dbField` mapping from `'users_id'` to `'id'`
2. Verifying all other entity field mappings are correct
3. Testing that user queries work correctly after the fix

## Architecture

The UserWithSchema model uses a declarative schema system where:
- **Schema Definition**: Defines the structure of the entity, including field mappings
- **Entity Fields**: System-managed fields like `id`, `createdAt`, `updatedAt`
- **Database Field Mapping**: The `dbField` property maps schema field names to actual database columns

The issue is in the entity fields section where the primary key mapping is incorrect.

## Components and Interfaces

### UserWithSchema Model
- **Location**: `client/backend/src/models/UserWithSchema.js`
- **Responsibility**: Define the User entity schema with correct database field mappings
- **Key Method**: `static get schema()` - Returns the schema definition

### Schema Definition System
- **Location**: `framework/backend/api/base/SchemaDefinition.js`
- **Responsibility**: Provides the `field()` function for defining schema fields with database mappings

## Data Models

### User Entity Fields (Current - INCORRECT)
```javascript
entityFields: {
    id: field({
        name: 'id',
        type: FieldTypes.NUMBER,
        default: null,
        readOnly: true,
        label: 'ID',
        dbField: 'users_id',  // ← WRONG: Should be 'id'
    }),
    // ... other fields
}
```

### User Entity Fields (Corrected)
```javascript
entityFields: {
    id: field({
        name: 'id',
        type: FieldTypes.NUMBER,
        default: null,
        readOnly: true,
        label: 'ID',
        dbField: 'id',  // ← CORRECT
    }),
    // ... other fields
}
```

### Database Schema (users table)
```sql
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL,
    name NVARCHAR(100),
    email NVARCHAR(254),
    password NVARCHAR(200),
    active BIT DEFAULT 1,
    role NVARCHAR(20),
    permissions NVARCHAR(MAX),
    passwordhash NVARCHAR(200),
    created_at DATETIME,
    updated_at DATETIME,
    last_login_at DATETIME,
    password_changed_at DATETIME,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME,
    password_reset_token NVARCHAR(200),
    password_reset_expires_at DATETIME,
    -- ... other columns
)
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Primary Key Field Mapping Correctness
*For any* user query operation, the schema's `id` field `dbField` mapping SHALL be `'id'` (matching the actual database column name), ensuring queries execute without column mismatch errors.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Entity Field Database Mappings Consistency
*For any* entity field in the UserWithSchema model, the `dbField` property SHALL correspond to an actual column in the users table, ensuring all field mappings are valid.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

### Property 3: Schema Endpoint User Verification Success
*For any* schema endpoint request, the user verification step SHALL complete successfully without "column users.id does not exist" errors, ensuring dependent features can load schemas.

**Validates: Requirements 1.3, 1.4**

## Error Handling

### Current Error Behavior
- **Error**: "Failed to verify user: column users.id does not exist"
- **Location**: Schema endpoint verification step
- **Impact**: All schema requests fail, blocking UI module loading

### Error Resolution
After fixing the primary key mapping:
- User verification queries will execute successfully
- Schema endpoints will return valid schema definitions
- Dependent modules (contacts, devices, etc.) will load correctly

## Testing Strategy

### Unit Tests
- Verify the UserWithSchema schema definition has correct `dbField` mappings
- Test that the schema can be loaded without errors
- Test that entity fields are properly initialized from schema

### Property-Based Tests
- **Property 1**: For any user query, verify the primary key field mapping is correct
- **Property 2**: For any entity field, verify the dbField mapping corresponds to a valid database column
- **Property 3**: For any schema endpoint request, verify user verification completes successfully

### Integration Tests
- Test that user queries execute successfully after the fix
- Test that the schema endpoint returns valid schemas
- Test that the contact module can load schemas without errors

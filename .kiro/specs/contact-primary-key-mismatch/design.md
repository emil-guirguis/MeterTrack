# Design Document: Contact Primary Key Mismatch Fix

## Overview

As part of a system-wide refactor, all table primary keys were renamed from `id` to `{tablename}_id`. The Contact model correctly defines the primary key field as `id` with `dbField: 'contact_id'` in the schema, but the ORM helpers don't use the `dbField` property when constructing SQL statements. This causes UPDATE operations to fail with "column contact.id does not exist" errors.

The fix involves updating the ORM helpers to look up the field definition and use its `dbField` property when building WHERE clauses and other SQL statements.

## Architecture

### Current State (Broken)
```
Contact.primaryKey = 'id'  // Declared in model
entityFields.id.dbField = 'contact_id'  // Mapping exists but not used
Database column = 'contact_id'  // Actual column
```

When UPDATE is called:
1. BaseModel.update() gets primaryKey = 'id'
2. buildUpdateSQL() creates WHERE clause: `WHERE id = $1`  // Uses field name, not dbField
3. SQL fails: "column contact.id does not exist"

### Target State (Fixed)
```
Contact.primaryKey = 'id'  // Declared in model
entityFields.id.dbField = 'contact_id'  // Mapping is used by helpers
Database column = 'contact_id'  // Actual column
```

When UPDATE is called:
1. BaseModel.update() gets primaryKey = 'id'
2. buildUpdateSQL() looks up field definition and finds dbField = 'contact_id'
3. buildUpdateSQL() creates WHERE clause: `WHERE contact_id = $1`  // Uses dbField
4. SQL succeeds

## Components and Interfaces

## Components and Interfaces

### ORM Helper Changes
- **File**: `framework/backend/shared/utils/modelHelpers.js`
- **Functions to Update**:
  - `buildUpdateSQL()` - Use dbField when building WHERE clause for primary key
  - `buildWhereClause()` - Use dbField when constructing WHERE conditions
  - `buildDeleteSQL()` - Use dbField when building WHERE clause for primary key
- **Impact**: All models will correctly use dbField for column names in SQL statements

### Contact Model (No Changes Needed)
- **File**: `client/backend/src/models/ContactWithSchema.js`
- **Status**: Already correctly defined with `id` field and `dbField: 'contact_id'`
- **Purpose**: Provides the mapping for form rendering and API responses

## Data Models

### Contact Table Schema
```sql
CREATE TABLE contact (
  contact_id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenant(id),
  name VARCHAR(100) NOT NULL,
  company VARCHAR(200),
  role VARCHAR(100),
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(50),
  street VARCHAR(200),
  street2 VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(100),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Field Mapping
- Property name `id` → Database column `contact_id`
- Property name `contact_id` → Database column `contact_id`
- All other properties map directly to their database columns

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Primary Key Consistency
*For any* Contact model instance, the primaryKey property SHALL return the correct database column name that exists in the contact table.

**Validates: Requirements 1.1, 1.2**

### Property 2: Update Operation Success
*For any* valid Contact record, performing an UPDATE operation with modified data SHALL succeed without database errors and return the updated record.

**Validates: Requirements 1.4, 3.1**

### Property 3: Field Mapping Correctness
*For any* Contact instance, the mapping between property names and database column names SHALL be consistent and correct, allowing the ORM to construct valid SQL queries.

**Validates: Requirements 1.2, 2.1**

### Property 4: Multi-Record Update Independence
*For any* set of Contact records, updating one record SHALL not affect other records, and each update operation SHALL complete independently.

**Validates: Requirements 3.3**

## Error Handling

### Database Column Not Found
- **Current Error**: "column contact.id does not exist"
- **Root Cause**: WHERE clause uses wrong column name
- **Fix**: Use correct primary key column name in WHERE clause
- **Prevention**: Ensure primaryKey property matches actual database column

### Primary Key Mismatch
- **Detection**: Compare primaryKey property with entityFields definition
- **Resolution**: Update primaryKey to match database schema
- **Validation**: Run UPDATE operations to verify success

## Testing Strategy

### Unit Tests
- Test that Contact.primaryKey returns 'contact_id'
- Test that Contact instances can be created and updated
- Test that the schema field mapping is correct
- Test error cases (invalid data, missing required fields)

### Property-Based Tests
- **Property 1**: For all Contact instances, primaryKey SHALL be 'contact_id'
- **Property 2**: For all valid Contact updates, the operation SHALL succeed
- **Property 3**: For all Contact field mappings, dbField SHALL match database columns
- **Property 4**: For all Contact records, updates SHALL be independent

### Integration Tests
- Test PUT /api/contacts/:id endpoint with valid data
- Test that updated data is persisted correctly
- Test that multiple concurrent updates work correctly
- Test that tenant_id filtering works during updates

### Manual Testing
- Update a contact via the UI
- Verify the update succeeds without errors
- Verify the updated data appears in the contact list
- Verify other contacts are not affected

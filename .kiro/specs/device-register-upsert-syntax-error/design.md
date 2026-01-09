# Design Document: Device Register Upsert Syntax Error Fix

## Overview

The device_register entity metadata contains a duplicate column definition that causes the upsert query builder to generate invalid SQL. This design addresses the root cause by correcting the metadata and validating the query generation logic.

## Architecture

The sync system uses a generic upsert function that:
1. Reads entity metadata (table name, primary keys, columns)
2. Builds an INSERT statement with the provided columns
3. Adds an ON CONFLICT clause based on primary keys
4. Adds an UPDATE SET clause for non-key columns
5. Adds a RETURNING clause to retrieve the result

The bug occurs in step 1: the device_register metadata defines columns as `['device_id', 'device_id', 'register_id']` instead of `['device_id', 'register_id']`.

## Components and Interfaces

### Entity Metadata Structure

```typescript
interface EntityMetadata {
  tableName: string;                    // e.g., 'device_register'
  primaryKey: string | string[];        // e.g., ['device_id', 'register_id']
  columns: string[];                    // e.g., ['device_id', 'register_id']
  compositeKey?: string[];              // For composite keys
  tenantFiltered?: boolean;             // Whether to filter by tenant_id
  remoteQuery?: string;                 // Custom remote query template
}
```

### Upsert Query Generation

The upsert function generates SQL like:

```sql
INSERT INTO device_register (device_id, register_id)
VALUES ($1, $2)
ON CONFLICT (device_id, register_id) DO UPDATE SET
RETURNING *
```

With the duplicate column bug, it generates:

```sql
INSERT INTO device_register (device_id, device_id, register_id)
VALUES ($1, $2, $3)
ON CONFLICT (device_id, register_id) DO UPDATE SET
RETURNING *
```

This is invalid because:
1. Column `device_id` is listed twice in the INSERT clause
2. The VALUES clause has 3 placeholders but only 2 unique columns
3. The ON CONFLICT clause references columns that appear multiple times

## Data Models

### Device Register Entity

```typescript
interface DeviceRegisterEntity {
  device_id: number;      // Foreign key to device table
  register_id: number;    // Foreign key to register table
}
```

### Composite Primary Key

The device_register table uses a composite primary key: `(device_id, register_id)`

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Metadata Column Uniqueness

*For any* entity metadata definition, the columns array SHALL contain no duplicate column names.

**Validates: Requirements 1.1, 2.1**

### Property 2: Upsert Query Validity

*For any* entity and upsert operation, the generated SQL query SHALL be syntactically valid PostgreSQL and execute without errors.

**Validates: Requirements 1.3, 2.4**

### Property 3: Upsert Round Trip

*For any* device_register entity, upserting it to the database and then querying it back SHALL return an equivalent record.

**Validates: Requirements 1.4, 3.1, 3.2**

### Property 4: Conflict Resolution

*For any* device_register entity that already exists in the database, upserting it again SHALL update the existing record without creating duplicates.

**Validates: Requirements 3.3**

## Error Handling

### Query Syntax Errors

If the generated SQL is invalid:
- The execQuery function catches the error
- Logs the error with the query and parameters
- Throws an error with context about which entity type failed
- The sync operation catches this and reports it in the sync result

### Referential Integrity

Before upserting device_register:
- Validate that the referenced device exists
- Validate that the referenced register exists
- Skip the upsert if either reference is missing
- Log a warning about the skipped record

## Testing Strategy

### Unit Tests

1. **Metadata Validation Test**: Verify device_register metadata has correct columns
2. **Query Generation Test**: Verify upsert query is generated correctly
3. **Duplicate Detection Test**: Verify no duplicate columns in any entity metadata
4. **Composite Key Test**: Verify ON CONFLICT clause uses correct columns

### Property-Based Tests

1. **Property 1 (Metadata Uniqueness)**: Generate random entity metadata and verify no duplicate columns
2. **Property 2 (Query Validity)**: Generate random device_register entities and verify upsert queries are valid
3. **Property 3 (Round Trip)**: Generate random device_register entities, upsert them, query them back, and verify equivalence
4. **Property 4 (Conflict Resolution)**: Generate random device_register entities, upsert twice, and verify no duplicates

### Integration Tests

1. **Sync Operation Test**: Run full device_register sync and verify success
2. **Error Recovery Test**: Verify sync continues if some records fail
3. **Data Integrity Test**: Verify synced data matches remote data

## Implementation Notes

- The fix is a simple one-line change to the entity metadata
- No changes needed to the upsert function itself
- Existing tests should pass after the fix
- New tests should be added to prevent regression

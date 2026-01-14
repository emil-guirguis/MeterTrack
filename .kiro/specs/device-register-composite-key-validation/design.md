# Design Document: Device Register Composite Key Validation

## Overview

This design enhances the entity validation system to support composite key validation while maintaining backward compatibility with existing single-column validation. The primary goal is to correctly validate referential integrity for the `device_register` junction table, which uses a composite primary key of (device_id, register_id).

## Architecture

The validation system consists of two layers:

1. **Validation Layer** (`entity-validation.ts`): Provides generic validation functions that support both single and composite keys
2. **Sync Layer** (`sync-device.ts`): Uses the validation functions to ensure referential integrity during sync operations

## Components and Interfaces

### Enhanced validateEntityExists Function

**Purpose**: Validate entity existence with support for both single and composite keys

**Signature**:
```typescript
export async function validateEntityExists(
  pool: Pool,
  tableName: string,
  entityId: number | Record<string, number>,
  columnName?: string
): Promise<boolean>
```

**Parameters**:
- `pool`: Database connection pool
- `tableName`: Name of the table to check
- `entityId`: Either a single ID (number) or an object with column-value pairs for composite keys
- `columnName`: Optional column name for single-column validation (defaults to `{tableName}_id`)

**Behavior**:
- If `entityId` is a number: Uses single-column validation (backward compatible)
- If `entityId` is an object: Uses composite key validation with all provided columns

**Examples**:
```typescript
// Single column (backward compatible)
await validateEntityExists(pool, 'device', 123);

// Composite key
await validateEntityExists(pool, 'device_register', { device_id: 123, register_id: 456 });
```

### New validateCompositeKeyExists Function

**Purpose**: Explicitly validate composite key existence

**Signature**:
```typescript
export async function validateCompositeKeyExists(
  pool: Pool,
  tableName: string,
  keyColumns: Record<string, number>
): Promise<boolean>
```

**Parameters**:
- `pool`: Database connection pool
- `tableName`: Name of the table to check
- `keyColumns`: Object with column names as keys and values to match

**Example**:
```typescript
const exists = await validateCompositeKeyExists(pool, 'device_register', {
  device_id: 123,
  register_id: 456
});
```

## Data Models

### Device Register Association

```typescript
interface DeviceRegisterAssociation {
  device_id: number;
  register_id: number;
  created_at: string;
  updated_at: string;
}
```

### Validation Result

```typescript
interface ValidationResult {
  exists: boolean;
  reason?: string;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Single Column Validation Backward Compatibility

*For any* table with a standard `{tableName}_id` primary key and any valid entity ID, calling `validateEntityExists` with a number should return true if and only if that entity exists in the table.

**Validates: Requirements 1.1, 2.1**

### Property 2: Composite Key Validation Correctness

*For any* composite key (device_id, register_id) pair, `validateCompositeKeyExists` should return true if and only if a row exists in device_register with both those exact values.

**Validates: Requirements 1.2, 3.1**

### Property 3: Referential Integrity for Device References

*For any* device_register association being inserted or updated, if the device_id does not exist in the device table, the sync process should skip that association and log a warning.

**Validates: Requirements 1.3, 3.2**

### Property 4: Referential Integrity for Register References

*For any* device_register association being inserted or updated, if the register_id does not exist in the register table, the sync process should skip that association and log a warning.

**Validates: Requirements 1.4, 3.2**

### Property 5: Valid Associations Are Synced

*For any* device_register association where both device_id and register_id exist in their respective tables, the sync process should successfully insert or update that association.

**Validates: Requirements 1.5, 3.3**

## Error Handling

1. **Database Connection Errors**: Caught and logged, validation returns false
2. **Invalid Composite Key Objects**: Validated before query execution
3. **Missing Referenced Entities**: Logged as warnings, associations skipped
4. **SQL Injection Prevention**: All parameters use parameterized queries

## Testing Strategy

### Unit Tests

- Test single-column validation with existing and non-existing entities
- Test composite key validation with various column combinations
- Test error handling for database connection failures
- Test backward compatibility of existing validation calls

### Property-Based Tests

- **Property 1**: Generate random entity IDs and verify single-column validation matches database state
- **Property 2**: Generate random composite keys and verify they match database state
- **Property 3**: Generate device_register associations with invalid device_ids and verify they're skipped
- **Property 4**: Generate device_register associations with invalid register_ids and verify they're skipped
- **Property 5**: Generate valid device_register associations and verify they're synced successfully

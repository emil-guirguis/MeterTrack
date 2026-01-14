# Design: Device Register Upsert No Rows Returned

## Overview

The device_register sync operation fails because the composite primary key definition includes `device_register_id`, which is an auto-generated ID. This causes the ON CONFLICT clause to use the wrong columns, resulting in DO NOTHING being executed when it should perform an insert. The fix involves correcting the entity metadata and ensuring consistent composite key usage throughout the sync logic.

## Architecture

The sync system uses a generic upsert function that:
1. Reads entity metadata to determine the primary key
2. Builds an INSERT...ON CONFLICT query
3. Uses the primary key columns in the ON CONFLICT clause
4. Returns the inserted/updated row via RETURNING *

The issue occurs at step 2 when the metadata specifies the wrong primary key columns.

## Components and Interfaces

### Entity Metadata (entities.ts)

**Current (Incorrect):**
```typescript
device_register: {
  tableName: 'device_register',
  primaryKey: ['device_register_id', 'device_id', 'register_id'],  // ← WRONG
  columns: ['device_register_id','device_id', 'register_id'],
  compositeKey: ['device_register_id', 'device_id', 'register_id'],
  tenantFiltered: false,
}
```

**Corrected:**
```typescript
device_register: {
  tableName: 'device_register',
  primaryKey: ['device_id', 'register_id'],  // ← CORRECT: Only business key
  columns: ['device_register_id','device_id', 'register_id'],
  compositeKey: ['device_id', 'register_id'],
  tenantFiltered: false,
}
```

### Sync Logic (sync-device.ts)

The sync logic must use consistent composite key building:

**For Deletes (Already Correct):**
```typescript
const compositeKey = buildCompositeKeyString(['device_id', 'register_id'], localAssociation);
```

**For Inserts and Updates (Must Be Fixed):**
```typescript
// Current (WRONG):
const compositeKey = buildCompositeKeyString(['device_register_id','device_id', 'register_id'], remoteAssociation);

// Should be:
const compositeKey = buildCompositeKeyString(['device_id', 'register_id'], remoteAssociation);
```

### Upsert Query Generation

When the metadata is corrected, the upsert function will generate:

```sql
INSERT INTO device_register (device_register_id, device_id, register_id)
VALUES ($1, $2, $3)
ON CONFLICT (device_id, register_id) DO UPDATE SET
  device_register_id = EXCLUDED.device_register_id
RETURNING *
```

This ensures:
- The conflict detection uses the correct business key
- The upsert performs an insert when the key doesn't exist
- The RETURNING clause returns the row (fixing the "no rows returned" error)

## Data Models

### device_register Table Structure

```
device_register {
  device_register_id: number (auto-generated PK, not part of business key)
  device_id: number (FK to device, part of business key)
  register_id: number (FK to register, part of business key)
}
```

**Business Key:** (device_id, register_id)
**Database PK:** device_register_id

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Upsert Returns Row

*For any* device_register entity, upserting it into the sync database should return at least one row from the RETURNING clause.

**Validates: Requirements 3.1, 3.3**

### Property 2: Composite Key Consistency

*For any* device_register association, the composite key used for lookups should be consistent across insert, update, and delete operations.

**Validates: Requirements 2.1, 2.2**

### Property 3: Conflict Detection Uses Business Key

*For any* device_register with the same (device_id, register_id) pair, upserting should detect the conflict and update the existing row rather than inserting a duplicate.

**Validates: Requirements 1.1, 1.2**

## Error Handling

**Current Error:** "Upsert failed: No rows returned for device_register"

**Root Cause:** The ON CONFLICT clause uses (device_register_id, device_id, register_id) but the actual unique constraint is on (device_id, register_id). When a row with the same device_id and register_id exists but different device_register_id, the conflict is not detected, and DO NOTHING is executed, returning zero rows.

**Fix:** Use the correct composite key in the ON CONFLICT clause.

## Testing Strategy

### Unit Tests

1. Test that entity metadata for device_register has correct primaryKey
2. Test that composite key building uses only ['device_id', 'register_id']
3. Test that upsert returns a row for new device_register associations
4. Test that upsert returns a row for existing device_register associations (update case)

### Property-Based Tests

1. **Property 1: Upsert Returns Row**
   - Generate random device_register entities
   - Upsert each into the database
   - Verify RETURNING clause returns exactly one row
   - Tag: Feature: device-register-upsert-no-rows-returned, Property 1: Upsert Returns Row

2. **Property 2: Composite Key Consistency**
   - Generate random device_register associations
   - Build composite keys using the same columns for all operations
   - Verify consistency across insert, update, delete
   - Tag: Feature: device-register-upsert-no-rows-returned, Property 2: Composite Key Consistency

3. **Property 3: Conflict Detection Uses Business Key**
   - Generate two device_register entities with same (device_id, register_id)
   - Upsert first entity
   - Upsert second entity
   - Verify only one row exists in database (update, not insert)
   - Tag: Feature: device-register-upsert-no-rows-returned, Property 3: Conflict Detection Uses Business Key


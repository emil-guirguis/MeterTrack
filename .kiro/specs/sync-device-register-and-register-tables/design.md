# Design Document: Sync Device Register and Register Tables

## Overview

This design extends the meter-sync-agent to synchronize register and device_register tables from the remote Client System database to the local Sync database. The key architectural decision is to create generic, reusable sync functions that work with any entity type, eliminating code duplication and making the system extensible for future tables.

The sync flow follows a strict ordering to maintain referential integrity:
1. **Meters** (no dependencies)
2. **Registers** (no dependencies)
3. **Device_Register** (depends on devices and registers)

## Architecture

### Generic Sync Pattern

Instead of writing entity-specific sync logic, we create a generic sync framework that:
- Accepts entity metadata (table name, columns, keys, filters)
- Generates appropriate SQL for insert/update/delete operations
- Handles composite keys
- Supports tenant_id filtering where applicable
- Provides consistent logging and error handling

### Entity Metadata Structure

Each entity type is defined with metadata that describes:
- Table name
- Primary key column(s)
- Columns to sync
- Composite key columns (if any)
- Tenant filtering (if applicable)
- Query filters for remote database

### Components and Interfaces

#### 1. Entity Metadata Interface

```typescript
interface EntityMetadata {
  tableName: string;
  primaryKey: string | string[];  // Single or composite key
  columns: string[];              // Columns to sync
  compositeKey?: string[];        // For composite keys
  tenantFiltered?: boolean;        // Whether to filter by tenant_id
  remoteQuery?: string;            // Custom remote query template
}
```

#### 2. Generic Sync Functions

**getRemoteEntities(entityType: string, tenantId?: number): Promise<any[]>**
- Queries remote database for all entities of a given type
- Applies tenant_id filter if applicable
- Returns array of entity records

**getLocalEntities(entityType: string): Promise<any[]>**
- Queries sync database for all entities of a given type
- Returns array of entity records

**upsertEntity(entityType: string, entity: any): Promise<void>**
- Inserts or updates entity in sync database
- Generates appropriate SQL based on entity metadata
- Handles composite keys
- Logs operation

**deleteEntity(entityType: string, primaryKey: any): Promise<void>**
- Deletes entity from sync database
- Handles composite keys
- Logs operation

#### 3. Entity Definitions

**Meter Entity**
```typescript
{
  tableName: 'meter',
  primaryKey: ['id', 'meter_element_id'],  // Composite key
  columns: ['id', 'device_id', 'name', 'active', 'ip', 'port', 'meter_element_id', 'element'],
  compositeKey: ['id', 'meter_element_id'],
  tenantFiltered: true
}
```

**Register Entity**
```typescript
{
  tableName: 'register',
  primaryKey: 'id',
  columns: ['id', 'name', 'register', 'unit', 'field_name'],
  tenantFiltered: true
}
```

**Device_Register Entity**
```typescript
{
  tableName: 'device_register',
  primaryKey: ['device_id', 'register_id'],  // Composite key
  columns: ['id', 'device_id', 'register_id', 'created_at', 'updated_at'],
  compositeKey: ['device_id', 'register_id'],
  tenantFiltered: false  // Devices are not tenant-scoped
}
```

#### 4. Sync Result Interface

```typescript
interface SyncResult {
  success: boolean;
  meters: { inserted: number; updated: number; deleted: number };
  registers: { inserted: number; updated: number; deleted: number };
  deviceRegisters: { inserted: number; updated: number; deleted: number };
  error?: string;
  timestamp: Date;
}
```

## Data Models

### Register Entity

```typescript
interface RegisterEntity {
  id: number;
  name: string;
  register: number;
  unit: string;
  field_name: string;
}
```

### Device Register Entity

```typescript
interface DeviceRegisterEntity {
  id: number;
  device_id: number;
  register_id: number;
  created_at: Date;
  updated_at: Date;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Register Sync Idempotence

*For any* set of registers in the remote database, running the sync operation twice should result in the same state in the sync database as running it once.

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Device Register Referential Integrity

*For any* device_register association in the sync database, the associated device and register must exist in the sync database.

**Validates: Requirements 2.6**

### Property 3: Register Deletion Consistency

*For any* register that exists in the sync database but not in the remote database, after sync completes, that register should be deleted from the sync database.

**Validates: Requirements 1.5**

### Property 4: Device Register Deletion Consistency

*For any* device_register association that exists in the sync database but not in the remote database, after sync completes, that association should be deleted from the sync database.

**Validates: Requirements 2.5**

### Property 5: Sync Result Accuracy

*For any* sync operation, the returned counts (inserted, updated, deleted) for each entity type should match the actual changes made to the sync database.

**Validates: Requirements 4.3, 4.4, 4.6**

### Property 6: Tenant Isolation for Registers

*For any* register sync operation, only registers belonging to the specified tenant_id should be synced to the sync database.

**Validates: Requirements 1.6**

### Property 7: No Remote Database Modification

*For any* sync operation, the remote database should remain unchanged after the operation completes.

**Validates: Requirements 1.2, 2.2**

## Error Handling

### Sync Operation Failures

- If register sync fails, log error and continue to device_register sync
- If device_register sync fails, log error and complete sync operation
- Return comprehensive error information in sync result

### Referential Integrity Violations

- If device_register references non-existent device or register, skip that association
- Log warning with association details
- Continue processing remaining associations

### Database Connection Errors

- Retry failed queries up to 3 times with exponential backoff
- Log detailed error information
- Return failure status with error message

## Testing Strategy

### Unit Tests

- Test generic sync functions with mock data
- Test entity metadata validation
- Test SQL generation for different entity types
- Test composite key handling
- Test tenant_id filtering logic
- Test error handling and retry logic

### Property-Based Tests

- **Property 1**: Verify idempotence by running sync twice and comparing results
- **Property 2**: Generate random device_register associations and verify referential integrity
- **Property 3**: Verify deleted registers are removed from sync database
- **Property 4**: Verify deleted device_register associations are removed from sync database
- **Property 5**: Verify sync result counts match actual database changes
- **Property 6**: Verify only tenant-scoped registers are synced
- **Property 7**: Verify remote database is never modified

### Integration Tests

- Test full sync cycle with all three entity types
- Test sync ordering (meters → registers → device_register)
- Test error recovery and continuation
- Test with large datasets
- Test with composite keys

## Implementation Notes

1. **Generic SQL Generation**: Use parameterized queries to prevent SQL injection
2. **Composite Key Handling**: Support both single and composite primary keys
3. **Tenant Filtering**: Apply tenant_id filter only to tenant-scoped entities
4. **Logging**: Log all operations with entity type, counts, and timing
5. **Performance**: Use batch operations where possible for large datasets
6. **Extensibility**: Entity metadata should be easily configurable for new tables


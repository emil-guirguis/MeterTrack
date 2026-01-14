# Design Document: Meter Element-Specific Reading

## Overview

This design implements element-specific meter reading by:

1. Caching the register table at MCP server startup
2. Calculating element-specific register numbers (A=base, B=1xxxx, C=2xxxx, etc.)
3. Reading only device-configured registers from BACnet
4. Storing readings using field_name from the register table

## Architecture

```
MCP Server Startup
    ↓
Load & Cache Register Table (register_id, name, register, unit, field_name)
    ↓
MeterCollector.collectMeterData(meter)
    ↓
Get device_id from CachedMeter
    ↓
Query device_register → register (get configured registers for device)
    ↓
Calculate element-specific register numbers
    ↓
BACnetClient.readMultipleProperties(calculated registers)
    ↓
Map BACnet values to field_names from cached registers
    ↓
Store in meter_reading table using field_name as column
```

## Components and Interfaces

### 1. Register Cache

**New Component: RegisterCache**
- Loads all registers at MCP server startup
- Stores: register_id, name, register (number), unit, field_name
- Provides fast lookup by register number
- Singleton instance shared across application

```typescript
export class RegisterCache {
  private registers: Map<number, RegisterEntity> = new Map();
  
  async initialize(syncDatabase: SyncDatabase): Promise<void>
  getRegister(registerId: number): RegisterEntity | null
  getRegisterByNumber(registerNumber: number): RegisterEntity | null
  getAllRegisters(): RegisterEntity[]
}
```

### 2. Element-Specific Register Number Calculation

**Function: calculateElementRegisterNumber(baseRegister: number, element: string): number**

Logic:
- Element A (or position 0): return baseRegister as-is (e.g., 1100)
- Element B (or position 1): prepend "1" (e.g., 11100)
- Element C (or position 2): prepend "2" (e.g., 21100)
- Element D (or position 3): prepend "3" (e.g., 31100)
- General: prepend (elementPosition) where A=0, B=1, C=2, etc.

```typescript
function calculateElementRegisterNumber(baseRegister: number, element: string): number {
  const elementPosition = element.charCodeAt(0) - 'A'.charCodeAt(0);
  if (elementPosition === 0) return baseRegister;
  return parseInt(`${elementPosition}${baseRegister}`);
}
```

### 3. MeterCollector Enhancement

**Updated collectMeterData() flow:**
1. Get meter from cache (includes device_id and element)
2. Query device_register table for device_id
3. Join with register table to get register details
4. For each register:
   - Calculate element-specific register number
   - Create BACnetDataPoint with calculated register number
5. Call BACnetClient.readMultipleProperties()
6. For each reading returned:
   - Map register number back to register
   - Get field_name from cached register
   - Store reading with field_name

### 4. MeterReading Interface

**Updated MeterReading:**
```typescript
export interface MeterReading {
  timestamp: Date;
  meterId: string;
  deviceId: number;
  deviceIP: string;
  dataPoint: string;        // Now: field_name from register
  value: number;
  unit?: string;
  quality: 'good' | 'estimated' | 'questionable';
  source: string;
  registerNumber?: number;  // NEW: The BACnet register number read
  fieldName?: string;       // NEW: The field_name for meter_reading table
}
```

### 5. Data Storage

**storeReading() enhancement:**
- Use fieldName to determine which column to store value in
- Store: meter_id, timestamp, value, unit, fieldName (as data_point)

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Register Number Calculation

**For any** base register number and element letter, the calculated element-specific register number SHALL follow the formula: element A uses base, B prepends "1", C prepends "2", etc.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 2: Register Cache Consistency

**For any** register loaded into the cache at startup, when queried during collection, the register SHALL return the same register_id, name, register number, unit, and field_name.

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 3: Device Register Filtering

**For any** device with configured registers in device_register table, when collecting data, the system SHALL only read registers that are configured for that device.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 4: Field Name Mapping

**For any** BACnet reading obtained, when stored in meter_reading table, the field_name from the corresponding register SHALL be used as the data_point column value.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

## Cache Invalidation and Refresh

### Cache Reload Triggers

The system monitors remote-to-local sync operations and reloads affected caches:

1. **Register Table Modified**: Reload RegisterCache
2. **Meter Table Modified**: Reload MeterCache
3. **Device_Register Table Modified**: Reload MeterCache (since device_register affects meter collection)

### Cache Reload Flow

```
Remote-to-Local Sync Completes
    ↓
Check sync result for modified tables
    ↓
If register table modified → RegisterCache.reload()
If meter table modified → MeterCache.reload()
If device_register modified → MeterCache.reload()
    ↓
Log cache reload events
    ↓
Continue collection with updated caches
```

### Error Handling

- If cache reload fails, log error but do not stop collection
- Collection continues with previous cache state
- Next sync cycle will attempt reload again
- Errors are logged for monitoring/debugging

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

## Error Handling

1. **Missing Element Field**: If a meter has no element specified, the system should:
   - Log a debug message
   - Continue collection without element filtering
   - Store readings with null/empty element field

2. **Element Mismatch**: If element information is inconsistent:
   - Log a warning
   - Use the most recent element configuration
   - Continue collection

3. **Database Errors**: If storing element information fails:
   - Log the error
   - Retry with exponential backoff
   - Fall back to storing without element if necessary

## Testing Strategy

### Unit Tests

1. **MeterCache Element Loading**
   - Test that element field is loaded from database
   - Test handling of null/empty element values
   - Test cache retrieval includes element

2. **MeterReading Element Field**
   - Test MeterReading creation with element
   - Test MeterReading creation without element
   - Test element field serialization

3. **MeterCollector Element Usage**
   - Test that collector retrieves element from cache
   - Test that element is passed to readings
   - Test handling of missing element

4. **Database Storage**
   - Test storing readings with element
   - Test retrieving readings with element
   - Test filtering by element

### Property-Based Tests

1. **Property 1: Element Information Preservation**
   - Generate random meters with elements
   - Collect readings
   - Verify element is present in MeterReading

2. **Property 2: Element Consistency in Storage**
   - Generate random readings with elements
   - Store and retrieve from database
   - Verify element unchanged

3. **Property 3: Element-Based Filtering**
   - Generate multiple readings with different elements
   - Query by specific element
   - Verify only matching elements returned

4. **Property 4: Element Graceful Handling**
   - Generate meters without elements
   - Collect readings
   - Verify no errors and readings stored

## Implementation Notes

1. **Backward Compatibility**: Ensure existing meters without elements continue to work
2. **Database Schema**: Verify meter_reading table has element field or add it if needed
3. **Query Performance**: Consider indexing element field for efficient filtering
4. **Logging**: Add detailed logging for element-related operations for debugging


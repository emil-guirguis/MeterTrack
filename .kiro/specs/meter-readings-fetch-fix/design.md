# Design Document: Meter Readings Fetch Fix

## Overview

The meter readings fetch endpoint fails with a 500 error due to a critical schema mismatch. The MeterReadingsWithSchema model defines 100+ fields that don't exist in the actual database, causing field access failures during mapping. The actual database schema is minimal and correct with only 9 columns: meter_reading_id, tenant_id, meter_id, reading_timestamp, data_point, value, unit, created_at, updated_at.

The fix involves three coordinated changes:
1. Update MeterReadingsWithSchema to only define fields that exist in the database
2. Simplify toFrontendReading mapper to safely handle only existing fields
3. Add comprehensive error handling and logging throughout the endpoint

## Architecture

### Current Problem Flow
```
Frontend Request → Endpoint → MeterReading.findAll() 
  → Model tries to access 100+ non-existent fields 
  → Field access fails → 500 error
```

### Fixed Flow
```
Frontend Request → Endpoint with error handling
  → MeterReading.findAll() with correct schema
  → toFrontendReading mapper (safe field access)
  → Response with proper format
  → Frontend processes successfully
```

## Components and Interfaces

### 1. MeterReadingsWithSchema Model

**Current Issue**: Defines fields like `phaseAVoltage`, `phaseBVoltage`, `totalActivePower`, etc. that don't exist in the database.

**Fix**: Redefine schema to match actual database columns only:
- `meter_reading_id` (SERIAL PRIMARY KEY)
- `tenant_id` (INTEGER, foreign key)
- `meter_id` (INTEGER, foreign key)
- `reading_timestamp` (TIMESTAMP)
- `data_point` (VARCHAR)
- `value` (NUMERIC)
- `unit` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Schema Definition Structure**:
```javascript
static get schema() {
  return defineSchema({
    entityName: 'MeterReadings',
    tableName: 'meter_reading',
    formFields: {
      // Only these 9 fields
      meter_reading_id: field({ type: FieldTypes.NUMBER, ... }),
      tenant_id: field({ type: FieldTypes.NUMBER, ... }),
      meter_id: field({ type: FieldTypes.NUMBER, ... }),
      reading_timestamp: field({ type: FieldTypes.DATE, ... }),
      data_point: field({ type: FieldTypes.STRING, ... }),
      value: field({ type: FieldTypes.NUMBER, ... }),
      unit: field({ type: FieldTypes.STRING, ... }),
      created_at: field({ type: FieldTypes.DATE, ... }),
      updated_at: field({ type: FieldTypes.DATE, ... })
    }
  });
}
```

### 2. toFrontendReading Mapper Function

**Current Issue**: Tries to map fields like `pg.phase_a_voltage`, `pg.total_active_power` that don't exist, causing undefined access.

**Fix**: Simplify to only map fields that exist in the database:

```javascript
function toFrontendReading(pg) {
  return {
    // Core identifiers
    id: pg.meter_reading_id,
    meterId: pg.meter_id,
    tenantId: pg.tenant_id,
    
    // Reading data
    timestamp: pg.reading_timestamp,
    dataPoint: pg.data_point,
    value: pg.value,
    unit: pg.unit,
    
    // Metadata
    createdAt: pg.created_at,
    updatedAt: pg.updated_at
  };
}
```

**Key Changes**:
- Remove all non-existent field mappings
- Use safe property access (no fallback chains to non-existent fields)
- Return only fields that actually exist in the database
- Ensure all returned fields are serializable

### 3. Endpoint Error Handling

**Current Issue**: Errors during field mapping are not caught, causing unhandled 500 errors.

**Fix**: Add try-catch blocks with detailed logging:

```javascript
router.get('/', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId || req.user?.tenant_id;
    if (!userTenantId) {
      console.warn('[MeterReadings] Missing tenant context');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: tenant context required'
      });
    }

    // Query with tenant filtering
    const result = await MeterReading.findAll({
      where: { /* filters */ },
      tenantId: userTenantId,
      limit: pageSize,
      offset: skip
    });

    // Map with error handling
    const pageItems = result.rows.map(row => {
      try {
        return toFrontendReading(row);
      } catch (mapError) {
        console.error('[MeterReadings] Mapping error for row:', {
          rowId: row?.meter_reading_id,
          error: mapError.message
        });
        throw mapError;
      }
    });

    res.json({
      success: true,
      data: {
        items: pageItems,
        total: result.pagination?.total || pageItems.length,
        page: numericPage,
        pageSize: numericPageSize,
        totalPages: Math.ceil(total / numericPageSize) || 1,
        hasMore: skip + pageItems.length < total
      }
    });
  } catch (error) {
    console.error('[MeterReadings] Endpoint error:', {
      tenantId: req.user?.tenantId,
      query: req.query,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});
```

### 4. Tenant Filtering

**Current Implementation**: Already filters by tenant_id in queries.

**Verification Points**:
- All queries include `WHERE tenant_id = $1` with user's tenant ID
- Responses only include readings belonging to user's tenant
- Unauthorized access attempts return 403 Forbidden

## Data Models

### MeterReading Database Record
```
{
  meter_reading_id: number,      // Primary key
  tenant_id: number,              // Foreign key to tenant
  meter_id: number,               // Foreign key to meter
  reading_timestamp: Date,        // When the reading was taken
  data_point: string,             // Type of measurement (e.g., "energy", "voltage")
  value: number,                  // The actual reading value
  unit: string,                   // Unit of measurement (e.g., "kWh", "V")
  created_at: Date,               // Record creation time
  updated_at: Date                // Record update time
}
```

### Frontend Response Format
```
{
  success: boolean,
  data: {
    items: [
      {
        id: number,
        meterId: number,
        tenantId: number,
        timestamp: Date,
        dataPoint: string,
        value: number,
        unit: string,
        createdAt: Date,
        updatedAt: Date
      }
    ],
    total: number,
    page: number,
    pageSize: number,
    totalPages: number,
    hasMore: boolean
  }
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Acceptance Criteria Testing Prework

1.1 WHEN the MeterReadingsWithSchema model is loaded, THE model SHALL only define fields that exist in the meter_reading table
  - Thoughts: This is a structural requirement about the model definition. We can verify this by checking that the schema only includes the 9 actual database columns and no others.
  - Testable: yes - property

1.2 WHEN the model schema is compared to the database, THE defined fields SHALL match the actual columns
  - Thoughts: This is verifying that the model's field definitions match the database schema. We can generate random field names and verify only the 9 actual columns are defined.
  - Testable: yes - property

1.3 WHEN a field is accessed that doesn't exist in the database, THE system SHALL not attempt to map it
  - Thoughts: This is testing that the mapper function doesn't try to access non-existent fields. We can test this by passing records with only the 9 actual fields and verifying no errors occur.
  - Testable: yes - property

1.4 WHEN the model is initialized with database data, THE initialization SHALL succeed without errors
  - Thoughts: This is testing that initialization works with valid data. We can create random valid meter reading records and verify initialization succeeds.
  - Testable: yes - property

2.1 WHEN a database record is passed to toFrontendReading, THE function SHALL only map fields that exist in the database
  - Thoughts: This is testing that the mapper only accesses the 9 actual fields. We can generate random records with only these fields and verify the output contains only mapped fields.
  - Testable: yes - property

2.2 WHEN a field doesn't exist in the database record, THE function SHALL return null for that field instead of attempting to access it
  - Thoughts: This is testing error handling in the mapper. We can pass records with missing fields and verify the function returns null instead of throwing errors.
  - Testable: yes - property

2.3 WHEN the function processes a valid meter reading, THE returned object SHALL contain all expected frontend fields
  - Thoughts: This is testing that the mapper returns all required fields. We can generate valid records and verify the output has all expected fields (id, meterId, timestamp, etc.).
  - Testable: yes - property

2.4 WHEN the function processes a meter reading, THE returned object SHALL be serializable to JSON without errors
  - Thoughts: This is testing that the output can be JSON serialized. We can generate records, map them, and verify JSON.stringify() succeeds.
  - Testable: yes - property

3.1 WHEN the meter readings endpoint encounters an error, THE endpoint SHALL log the error with context
  - Thoughts: This is testing logging behavior. We can trigger errors and verify logs contain tenant ID, query params, and error message.
  - Testable: yes - property

3.2 WHEN a database query fails, THE endpoint SHALL return a 500 error with a descriptive message
  - Thoughts: This is testing error response format. We can mock a database failure and verify the response has status 500 and a message.
  - Testable: yes - property

3.3 WHEN field mapping fails, THE error message SHALL indicate which field caused the failure
  - Thoughts: This is testing error message quality. We can trigger mapping errors and verify the error message includes field information.
  - Testable: yes - property

3.4 WHEN the endpoint succeeds, THE response SHALL include success status and data in a consistent format
  - Thoughts: This is testing response format consistency. We can make successful requests and verify all responses have success flag and data structure.
  - Testable: yes - property

4.1 WHEN a user requests meter readings, THE query SHALL filter by the user's tenant ID
  - Thoughts: This is testing tenant filtering. We can generate requests from different tenants and verify each only gets their own readings.
  - Testable: yes - property

4.2 WHEN a meter reading is retrieved, THE reading's tenant_id SHALL match the requesting user's tenant ID
  - Thoughts: This is testing data isolation. We can retrieve readings and verify tenant_id matches the requesting user's tenant.
  - Testable: yes - property

4.3 WHEN a user attempts to access a reading from another tenant, THE system SHALL return a 403 Forbidden error
  - Thoughts: This is testing access control. We can attempt cross-tenant access and verify 403 response.
  - Testable: yes - property

4.4 WHEN the tenant context is missing, THE endpoint SHALL return a 401 Unauthorized error
  - Thoughts: This is testing authentication. We can make requests without tenant context and verify 401 response.
  - Testable: yes - property

5.1 WHEN the frontend receives a meter readings response, THE response SHALL have a success flag and data array
  - Thoughts: This is testing response structure. We can make requests and verify response has success and data fields.
  - Testable: yes - property

5.2 WHEN the response contains meter readings, EACH reading SHALL have id, meterId, timestamp, and value fields
  - Thoughts: This is testing that all required fields are present. We can verify each reading in the response has these fields.
  - Testable: yes - property

5.3 WHEN the response contains pagination info, THE pagination SHALL include total, page, pageSize, totalPages, and hasMore
  - Thoughts: This is testing pagination structure. We can verify the response includes all pagination fields.
  - Testable: yes - property

5.4 WHEN the frontend processes the response, THE store SHALL be able to update without errors
  - Thoughts: This is testing that the response format is compatible with the frontend store. We can verify the response can be processed without errors.
  - Testable: yes - property

### Property Reflection

After reviewing all testable criteria, I've identified that many properties are testing similar aspects:
- Properties 1.1, 1.2, 1.3, 1.4 all test schema correctness - can be combined into one comprehensive property
- Properties 2.1, 2.2, 2.3, 2.4 all test mapper function correctness - can be combined into one comprehensive property
- Properties 3.1, 3.2, 3.3, 3.4 all test error handling - can be combined into one comprehensive property
- Properties 4.1, 4.2, 4.3, 4.4 all test tenant filtering - can be combined into one comprehensive property
- Properties 5.1, 5.2, 5.3, 5.4 all test response format - can be combined into one comprehensive property

### Correctness Properties

Property 1: Schema Definition Correctness
*For any* MeterReadingsWithSchema model instance, the schema SHALL only define the 9 actual database columns (meter_reading_id, tenant_id, meter_id, reading_timestamp, data_point, value, unit, created_at, updated_at) and no others, and initialization with valid database records SHALL succeed without errors.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

Property 2: Mapper Function Correctness
*For any* valid meter reading database record containing only the 9 actual columns, the toFrontendReading function SHALL map all fields correctly, return null for any missing fields, include all expected frontend fields (id, meterId, tenantId, timestamp, dataPoint, value, unit, createdAt, updatedAt), and produce output that is JSON serializable without errors.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 3: Error Handling and Logging
*For any* error condition (database failure, mapping failure, missing tenant context), the endpoint SHALL return an appropriate HTTP status code (401, 403, or 500), include a descriptive error message, and log the error with context including tenant ID, query parameters, and error details.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 4: Tenant Data Isolation
*For any* user request, the endpoint SHALL filter results by the requesting user's tenant ID, return only readings belonging to that tenant, reject cross-tenant access attempts with 403 Forbidden, and reject requests without tenant context with 401 Unauthorized.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

Property 5: Response Format Consistency
*For any* successful meter readings request, the response SHALL include a success flag set to true, a data object containing an items array with meter readings, pagination information (total, page, pageSize, totalPages, hasMore), and each reading SHALL have all required fields (id, meterId, timestamp, value, unit) and be processable by the frontend store without errors.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

## Error Handling

### Error Scenarios

1. **Missing Tenant Context** (401 Unauthorized)
   - User request without tenant ID
   - Log: `[MeterReadings] Missing tenant context for user`
   - Response: `{ success: false, message: 'Unauthorized: tenant context required' }`

2. **Database Query Failure** (500 Internal Server Error)
   - Database connection error
   - Invalid query syntax
   - Log: `[MeterReadings] Database query failed: {error message}`
   - Response: `{ success: false, message: 'Failed to fetch meter readings', error: {message} }`

3. **Field Mapping Failure** (500 Internal Server Error)
   - Unexpected field type
   - Serialization error
   - Log: `[MeterReadings] Mapping error for row {id}: {error message}`
   - Response: `{ success: false, message: 'Failed to fetch meter readings', error: {message} }`

4. **Cross-Tenant Access Attempt** (403 Forbidden)
   - User tries to access reading from different tenant
   - Log: `[MeterReadings] Cross-tenant access attempt: user_tenant={id}, reading_tenant={id}`
   - Response: `{ success: false, message: 'Forbidden: reading does not belong to your tenant' }`

### Logging Strategy

All errors include:
- Timestamp (automatic from logger)
- Tenant ID (for audit trail)
- User ID (if available)
- Query parameters (for debugging)
- Error message and stack trace (in development only)

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **Schema Definition Tests**
   - Verify schema contains exactly 9 fields
   - Verify field types match database types
   - Verify no extra fields are defined

2. **Mapper Function Tests**
   - Test with complete valid record
   - Test with missing optional fields
   - Test with null values
   - Test JSON serialization
   - Test field name transformations (reading_timestamp → timestamp)

3. **Endpoint Tests**
   - Test successful request with valid tenant
   - Test missing tenant context (401)
   - Test cross-tenant access (403)
   - Test database error handling (500)
   - Test pagination parameters
   - Test filtering by meterId

4. **Error Handling Tests**
   - Test error logging includes context
   - Test error response format
   - Test error messages don't expose sensitive data in production

### Property-Based Tests

Property-based tests verify universal properties across many generated inputs:

1. **Property 1: Schema Definition Correctness**
   - Generate random field names
   - Verify only 9 actual fields are in schema
   - Generate random valid records
   - Verify initialization succeeds

2. **Property 2: Mapper Function Correctness**
   - Generate random valid meter reading records
   - Apply toFrontendReading mapper
   - Verify all expected fields present
   - Verify JSON serialization succeeds
   - Verify no undefined values in output

3. **Property 3: Error Handling and Logging**
   - Generate various error conditions
   - Verify appropriate status codes returned
   - Verify error messages are descriptive
   - Verify logs contain required context

4. **Property 4: Tenant Data Isolation**
   - Generate requests from multiple tenants
   - Verify each tenant only gets their readings
   - Verify cross-tenant access rejected
   - Verify missing tenant context rejected

5. **Property 5: Response Format Consistency**
   - Generate various valid requests
   - Verify response structure consistent
   - Verify all required fields present
   - Verify pagination info correct
   - Verify frontend can process response

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with: `Feature: meter-readings-fetch-fix, Property {number}: {property_text}`
- Unit tests focus on specific examples and edge cases
- Property tests focus on universal correctness across all inputs

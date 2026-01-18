# Design Document: Sync Batch Upload Transaction Abort Error Fix

## Overview

The sync batch upload endpoint is failing with PostgreSQL error 25P02 "transaction is aborted" when inserting meter readings. The root cause is that when one INSERT query fails inside a transaction, PostgreSQL marks the entire transaction as aborted, and all subsequent queries fail. The solution is to use savepoints for individual inserts, so that one failure doesn't abort the entire transaction.

## Root Cause Analysis

### Problem: Transaction Abort on First Error

**Current Flow:**
```
BEGIN TRANSACTION
  INSERT reading 1 → FAILS (constraint violation)
  Transaction marked as ABORTED
  INSERT reading 2 → FAILS (transaction is aborted)
  INSERT reading 3 → FAILS (transaction is aborted)
ROLLBACK (entire transaction)
```

**Result:** All readings fail, even though some might have been valid.

### Why This Happens

In PostgreSQL, when a query fails inside a transaction:
1. The query fails
2. The transaction is marked as "aborted"
3. All subsequent queries in that transaction fail with error 25P02
4. You must ROLLBACK to exit the aborted state

The current code catches the error but tries to continue executing queries, which all fail because the transaction is aborted.

## Solution: Use Savepoints

### New Flow with Savepoints

```
BEGIN TRANSACTION
  SAVEPOINT sp_1
    INSERT reading 1 → FAILS (constraint violation)
    ROLLBACK TO sp_1 (only this savepoint, not the transaction)
  SAVEPOINT sp_2
    INSERT reading 2 → SUCCESS
    RELEASE sp_2
  SAVEPOINT sp_3
    INSERT reading 3 → SUCCESS
    RELEASE sp_3
COMMIT TRANSACTION
```

**Result:** Readings 2 and 3 are inserted, reading 1 is skipped with error logged.

## Architecture

### Batch Upload Flow

```
POST /api/sync/readings/batch
    ↓
Authenticate with API key
    ↓
Validate tenant_id
    ↓
BEGIN TRANSACTION
    ↓
For each reading:
    ├─ SAVEPOINT sp_N
    ├─ Validate meter exists
    ├─ INSERT meter_reading
    ├─ If success: RELEASE sp_N, increment insertedCount
    ├─ If error: ROLLBACK TO sp_N, log error, increment skippedCount
    └─ Continue to next reading
    ↓
COMMIT TRANSACTION
    ↓
Return response with counts and errors
```

## Components and Interfaces

### 1. Sync Batch Upload Endpoint

**Location:** `client/backend/src/routes/sync.js`

**Endpoint:** `POST /api/sync/readings/batch`

**Request:**
```json
{
  "readings": [
    {
      "meter_id": "1",
      "timestamp": "2026-01-18T03:32:00.052Z",
      "data_point": "meter_reading",
      "value": 10.0339,
      "unit": "kWh"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "recordsProcessed": 2,
  "message": "Batch upload completed: 2 inserted, 1 skipped",
  "inserted": 2,
  "skipped": 1,
  "errors": [
    {
      "meter_id": "999",
      "data_point": "meter_reading",
      "error": "Foreign key violation",
      "code": "23503"
    }
  ]
}
```

### 2. Database Transaction with Savepoints

**Location:** `client/backend/src/config/database.js`

**New Method:**
```typescript
async transactionWithSavepoints(callback) {
  const client = await this.getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

**Usage in Sync Route:**
```typescript
const result = await db.transaction(async (client) => {
  let insertedCount = 0;
  let skippedCount = 0;
  const insertErrors = [];

  for (let i = 0; i < readings.length; i++) {
    const reading = readings[i];
    const savepointName = `sp_${i}`;
    
    try {
      // Create savepoint
      await client.query(`SAVEPOINT ${savepointName}`);
      
      // Validate meter exists
      const meterCheck = await client.query(
        'SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2',
        [reading.meter_id, tenantId]
      );
      
      if (meterCheck.rows.length === 0) {
        throw new Error(`Meter ${reading.meter_id} not found`);
      }
      
      // Insert reading
      const insertResult = await client.query(
        'INSERT INTO meter_reading (tenant_id, meter_id, timestamp, data_point, value, unit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING meter_reading_id',
        [tenantId, reading.meter_id, reading.timestamp, reading.data_point, reading.value, reading.unit || null]
      );
      
      // Release savepoint
      await client.query(`RELEASE SAVEPOINT ${savepointName}`);
      insertedCount++;
      
    } catch (error) {
      // Rollback to savepoint
      await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = error instanceof Error ? error.code : '';
      
      insertErrors.push({
        meter_id: reading.meter_id,
        data_point: reading.data_point,
        error: errorMessage,
        code: errorCode
      });
      
      skippedCount++;
    }
  }
  
  return { insertedCount, skippedCount, insertErrors };
});
```

## Data Models

### Meter Reading Insert

**Table:** `meter_reading`

**Columns:**
- `meter_reading_id`: SERIAL PRIMARY KEY
- `tenant_id`: INTEGER (FOREIGN KEY to tenant)
- `meter_id`: VARCHAR(255) (FOREIGN KEY to meter)
- `timestamp`: TIMESTAMP
- `data_point`: VARCHAR(255)
- `value`: NUMERIC
- `unit`: VARCHAR(50)

**Constraints:**
- Foreign key: `meter_id` must exist in `meter` table
- Foreign key: `tenant_id` must exist in `tenant` table

## Correctness Properties

### Property 1: Savepoint Rollback Doesn't Abort Transaction

**For any** batch of meter readings where one insert fails, the transaction should not be aborted, and subsequent inserts should succeed.

**Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3**

### Property 2: All Valid Readings Are Inserted

**For any** batch of meter readings with mixed valid and invalid readings, all valid readings should be inserted and all invalid readings should be skipped.

**Validates: Requirements 1.5, 2.4, 2.5**

### Property 3: Meter Validation Prevents Constraint Violations

**For any** meter reading with a non-existent meter_id, the insert should be skipped before attempting the database insert.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 4: Error Information Is Accurate

**For any** failed insert, the error information returned should include the meter_id, data_point, error message, and error code.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 5: Response Format Is Consistent

**For any** batch upload, the response should include success flag, inserted count, skipped count, and errors array.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

## Error Handling

### Scenario: Meter Not Found

**Before Fix:**
```
INSERT meter_reading → FAILS (foreign key violation)
Transaction marked as ABORTED
Next INSERT → FAILS (transaction is aborted)
Error: 25P02 "transaction is aborted"
```

**After Fix:**
```
SAVEPOINT sp_1
  SELECT meter → No rows found
  Throw error "Meter not found"
ROLLBACK TO sp_1
Log error, increment skippedCount
SAVEPOINT sp_2
  Next reading → Proceeds normally
```

### Scenario: Constraint Violation

**Before Fix:**
```
INSERT → FAILS (unique constraint)
Transaction marked as ABORTED
Error: 25P02 "transaction is aborted"
```

**After Fix:**
```
SAVEPOINT sp_1
  INSERT → FAILS (unique constraint)
ROLLBACK TO sp_1
Log error with constraint details
Continue to next reading
```

## Testing Strategy

### Unit Tests

**Test Coverage:**
- Batch upload with all valid readings
- Batch upload with all invalid readings
- Batch upload with mixed valid/invalid readings
- Batch upload with missing meters
- Batch upload with constraint violations
- Error response format

**Example Tests:**
- `test_batch_upload_all_valid_readings`
- `test_batch_upload_all_invalid_readings`
- `test_batch_upload_mixed_valid_invalid`
- `test_batch_upload_missing_meter`
- `test_batch_upload_constraint_violation`
- `test_batch_upload_response_format`

### Property-Based Tests

**Property 1: Savepoint Rollback Doesn't Abort Transaction**
- Generate batch with random valid/invalid readings
- Execute batch upload
- Verify all valid readings inserted
- Verify transaction committed successfully

**Property 2: All Valid Readings Are Inserted**
- Generate batch with known valid readings
- Execute batch upload
- Query database to verify all inserted
- Verify count matches

**Property 3: Meter Validation Prevents Constraint Violations**
- Generate batch with non-existent meter_ids
- Execute batch upload
- Verify no constraint violation errors
- Verify readings skipped with "meter not found" error

**Property 4: Error Information Is Accurate**
- Generate batch with invalid readings
- Execute batch upload
- Verify error array contains all failed readings
- Verify error details are accurate

**Property 5: Response Format Is Consistent**
- Execute batch upload
- Verify response has success, inserted, skipped, errors fields
- Verify counts are accurate
- Verify message is descriptive

### Integration Tests

- End-to-end batch upload with successful completion
- Batch upload with partial failures
- Batch upload with all failures
- Multiple batch uploads in sequence
- Batch upload with large number of readings

## Implementation Notes

### Savepoint Naming

Use a simple naming scheme: `sp_0`, `sp_1`, `sp_2`, etc. based on the reading index.

### Meter Validation

Before inserting, check if the meter exists:
```sql
SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2
```

This prevents foreign key constraint violations.

### Error Logging

Log each error with:
- Meter ID
- Data point
- Error message
- Error code
- Timestamp

### Response Format

Always return:
- `success`: boolean
- `recordsProcessed`: number (inserted count)
- `inserted`: number
- `skipped`: number
- `errors`: array of error objects
- `message`: descriptive message

## Performance Considerations

- Savepoints have minimal overhead
- Meter validation adds one query per reading (can be optimized with batch validation)
- Transaction commit is atomic for all successful inserts
- No N+1 queries if meter validation is batched

## Security Considerations

- Tenant isolation: All queries filtered by tenant_id
- No SQL injection: All parameters are parameterized
- Error messages don't leak sensitive data
- Proper transaction handling prevents data corruption


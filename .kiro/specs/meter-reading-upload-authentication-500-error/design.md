# Design Document: Meter Reading Upload Authentication 500 Error Fix

## Overview

The meter reading upload manager was receiving a 500 "Authentication error" when attempting to upload meter readings to the remote client API. The root cause was a database query error in the `authenticateSyncServer` middleware function. The query was selecting from a non-existent column `id` instead of the correct column `tenant_id` in the tenant table.

## Root Cause Analysis

### Issue 1: Incorrect Column Name in authenticateSyncServer

**Location:** `client/backend/src/middleware/auth.js` line 227

**Problem:**
```javascript
// WRONG - column "id" does not exist
const result = await db.query(
  'SELECT id as tenant_id FROM tenant WHERE api_key = $1 AND active = true',
  [apiKey]
);
```

**Root Cause:** The tenant table's primary key is `tenant_id`, not `id`. The TenantWithSchema model defines:
```javascript
static get primaryKey() {
  return 'id';  // This is the logical primary key name
}
// But the actual database column is:
dbField: 'tenant_id'  // The physical database column
```

**Impact:** When the sync system attempts to authenticate using an API key, the query fails with "column 'id' does not exist", resulting in a 500 error being returned to the upload manager.

### Issue 2: Incorrect Column Name in getSiteIdFromApiKey

**Location:** `client/backend/src/middleware/auth.js` line 195

**Problem:**
```javascript
// WRONG - returns undefined because column is tenant_id, not id
return result.rows[0].id;
```

**Also Wrong:** The query was checking `is_active` instead of `active`:
```javascript
// WRONG - column is "active", not "is_active"
'SELECT tenant_id FROM tenant WHERE api_key = $1 AND is_active = true'
```

## Solution

### Fix 1: Correct authenticateSyncServer Query

**Change:**
```javascript
// CORRECT - use the actual database column name
const result = await db.query(
  'SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true',
  [apiKey]
);
```

**Why:** The tenant table has a column named `tenant_id` (not `id`), and the active status column is `active` (not `is_active`).

### Fix 2: Correct getSiteIdFromApiKey Query and Return Value

**Change:**
```javascript
// CORRECT - use actual column names
const result = await db.query(
  'SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true',
  [apiKey]
);

if (result.rows.length === 0) {
  return null;
}

// CORRECT - return the actual column value
return result.rows[0].tenant_id;
```

## Architecture

### Authentication Flow for Sync System

```
Sync System (MeterReadingUploadManager)
    ↓
Send API Request with X-API-Key header
    ↓
Client Backend (authenticateSyncServer middleware)
    ↓
Query tenant table: SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true
    ↓
If found: Attach tenant_id to request, call next()
    ↓
If not found: Return 401 Unauthorized
    ↓
If error: Return 500 with error details
    ↓
API Endpoint Handler (now has req.tenantId set)
    ↓
Process request with tenant context
```

## Components and Interfaces

### 1. authenticateSyncServer Middleware

**Location:** `client/backend/src/middleware/auth.js`

**Responsibility:** Authenticate sync system requests using API key

**Flow:**
1. Extract X-API-Key header from request
2. Query tenant table for matching API key
3. Verify tenant is active
4. Attach tenant_id to request object
5. Call next() to proceed to handler

**Error Handling:**
- 401: No API key provided
- 401: Invalid API key or tenant not active
- 500: Database query error (now fixed)

### 2. getSiteIdFromApiKey Function

**Location:** `client/backend/src/middleware/auth.js`

**Responsibility:** Look up tenant ID from API key

**Returns:** tenant_id or null if not found

**Used By:** Other parts of the system that need to get tenant context from API key

## Data Models

### Tenant Table Schema

```sql
CREATE TABLE tenant (
  tenant_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);
```

**Key Columns:**
- `tenant_id`: Primary key (not `id`)
- `api_key`: API key for sync system authentication
- `active`: Boolean flag for tenant status (not `is_active`)

## Correctness Properties

### Property 1: API Key Authentication Returns Correct Tenant ID

**For any** valid API key in the tenant table with active=true, the authenticateSyncServer middleware should extract the correct tenant_id and attach it to the request.

**Validates: Requirements 1.1, 2.1, 2.2, 2.3**

### Property 2: Invalid API Key Returns 401

**For any** invalid or missing API key, the authenticateSyncServer middleware should return a 401 Unauthorized response without attempting to process the request.

**Validates: Requirements 1.2, 1.3**

### Property 3: Inactive Tenant Returns 401

**For any** API key belonging to an inactive tenant (active=false), the authenticateSyncServer middleware should return a 401 Unauthorized response.

**Validates: Requirements 1.1**

### Property 4: Database Query Uses Correct Column Names

**For any** query to the tenant table, the query should use the correct column names (tenant_id, active) that actually exist in the database schema.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: getSiteIdFromApiKey Returns Correct Tenant ID

**For any** valid API key, the getSiteIdFromApiKey function should return the correct tenant_id value from the database.

**Validates: Requirements 2.1, 2.2**

## Error Handling

### Scenario: Invalid Column Name in Query

**Before Fix:**
```
Query: SELECT id as tenant_id FROM tenant WHERE api_key = $1 AND active = true
Error: column "id" does not exist
Response: 500 Internal Server Error
```

**After Fix:**
```
Query: SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true
Result: Returns tenant_id value
Response: 200 OK (request proceeds to handler)
```

### Scenario: Invalid API Key

**Handling:**
```
Query: SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true
Result: No rows returned
Response: 401 Unauthorized with message "Invalid API key"
```

### Scenario: Inactive Tenant

**Handling:**
```
Query: SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true
Result: No rows returned (because active=false)
Response: 401 Unauthorized with message "Invalid API key"
```

## Testing Strategy

### Unit Tests

**Test Coverage:**
- authenticateSyncServer with valid API key
- authenticateSyncServer with invalid API key
- authenticateSyncServer with missing API key
- authenticateSyncServer with inactive tenant
- getSiteIdFromApiKey with valid API key
- getSiteIdFromApiKey with invalid API key

**Example Tests:**
- `test_authenticateSyncServer_valid_api_key_returns_tenant_id`
- `test_authenticateSyncServer_invalid_api_key_returns_401`
- `test_authenticateSyncServer_missing_api_key_returns_401`
- `test_authenticateSyncServer_inactive_tenant_returns_401`
- `test_getSiteIdFromApiKey_valid_returns_tenant_id`
- `test_getSiteIdFromApiKey_invalid_returns_null`

### Property-Based Tests

**Property 1: API Key Authentication Returns Correct Tenant ID**
- Generate random valid API keys
- Query database to verify tenant_id returned
- Verify tenant_id matches database record

**Property 2: Invalid API Key Returns 401**
- Generate random invalid API keys
- Verify 401 response returned
- Verify no tenant_id attached to request

**Property 3: Inactive Tenant Returns 401**
- Create tenant with active=false
- Attempt authentication with its API key
- Verify 401 response returned

**Property 4: Database Query Uses Correct Column Names**
- Execute query with correct column names
- Verify no "column does not exist" errors
- Verify results returned correctly

**Property 5: getSiteIdFromApiKey Returns Correct Tenant ID**
- Generate random valid API keys
- Call getSiteIdFromApiKey
- Verify returned tenant_id matches database

### Integration Tests

- End-to-end meter reading upload with correct authentication
- Upload fails with invalid API key
- Upload fails with inactive tenant
- Multiple uploads with same API key

## Implementation Notes

### Column Name Mapping

The TenantWithSchema model uses a logical primary key name `id` but maps it to the physical database column `tenant_id`:

```javascript
// Logical name
static get primaryKey() {
  return 'id';
}

// Physical database column
entityFields: {
  id: field({
    name: 'tenant_id',
    dbField: 'tenant_id',
  })
}
```

When writing raw SQL queries, always use the physical database column names (`tenant_id`, not `id`).

### Active Status Column

The tenant table uses `active` (boolean), not `is_active`. Always use `active` in queries.

### API Key Header

The sync system sends the API key in the `X-API-Key` header. The middleware extracts it with:
```javascript
const apiKey = req.headers['x-api-key'];
```

## Security Considerations

- API keys are stored in the tenant table (should be hashed in production)
- API key validation happens before any request processing
- Invalid/inactive tenants are rejected with 401 (not 500)
- Error messages don't leak sensitive information
- Tenant context is properly isolated per request

## Performance Considerations

- Single database query per authentication
- Query uses indexed column (api_key should be indexed)
- No N+1 queries
- Minimal overhead for authentication


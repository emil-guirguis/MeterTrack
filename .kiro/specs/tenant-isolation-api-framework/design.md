# Design Document: Tenant Isolation in API Framework

## Overview

The tenant isolation system is a framework-level feature that automatically enforces data isolation between tenants. When a user logs in, their tenant_id is extracted from the user record and stored in the request context. This tenant_id is then automatically applied to all database queries, ensuring that:

1. Users can only access data belonging to their tenant
2. All queries are automatically filtered by tenant_id without manual intervention
3. Accidental cross-tenant data access is prevented at the framework level
4. The system maintains backward compatibility with existing routes

The implementation consists of three main components:
- **Tenant Context Middleware**: Extracts and manages tenant information from JWT tokens
- **Query Filter Middleware**: Automatically applies tenant_id filters to database queries
- **Tenant Utilities**: Helper functions for accessing and verifying tenant context in route handlers

## Architecture

### Request Flow

```
User Login
    ↓
Extract tenant_id from user record
    ↓
Include tenant_id in JWT token payload
    ↓
Authenticated Request arrives
    ↓
Tenant Context Middleware extracts tenant_id from JWT
    ↓
Store tenant_id in req.context.tenant
    ↓
Route Handler executes
    ↓
Database Query is made
    ↓
Query Filter Middleware intercepts query
    ↓
Automatically append WHERE tenant_id = ? filter
    ↓
Execute filtered query
    ↓
Return tenant-specific results
```

### Middleware Stack

The tenant isolation system integrates into the Express middleware stack:

1. **Authentication Middleware** (existing): Validates JWT token
2. **Tenant Context Middleware** (new): Extracts tenant_id from token and stores in context
3. **Route Handler**: Executes business logic
4. **Database Layer**: Queries are intercepted and filtered by tenant_id

## Components and Interfaces

### 1. Tenant Context Middleware

**File**: `framework/backend/api/middleware/tenantContext.js`

Responsible for extracting tenant_id from the JWT token and storing it in the request context.

```javascript
// Usage in server setup
app.use(requireAuth);  // Existing auth middleware
app.use(tenantContext); // New tenant context middleware
```

**Functionality**:
- Extracts tenant_id from `req.auth.user.tenant_id`
- Stores in `req.context.tenant = { id: tenant_id }`
- Validates that tenant_id exists for authenticated requests
- Rejects requests without valid tenant context

### 2. Query Filter Middleware

**File**: `framework/backend/api/middleware/queryFilter.js`

Intercepts database queries and automatically applies tenant_id filters.

**Functionality**:
- Hooks into the database query execution layer
- Detects query type (SELECT, INSERT, UPDATE, DELETE)
- For SELECT: Appends `WHERE tenant_id = ?` or `AND tenant_id = ?`
- For INSERT: Adds `tenant_id` to the INSERT clause
- For UPDATE/DELETE: Appends `WHERE tenant_id = ?` or `AND tenant_id = ?`
- Logs all query modifications for audit purposes

### 3. Tenant Utilities

**File**: `framework/backend/api/utils/tenantUtils.js`

Provides helper functions for accessing and verifying tenant context.

**Key Functions**:

```javascript
// Get current tenant ID from request context
getTenantId(req) -> string | null

// Verify that a resource belongs to the current tenant
verifyTenantOwnership(req, resourceId, model) -> Promise<boolean>

// Get full tenant context
getTenantContext(req) -> { id: string, metadata?: object }

// Safely inject tenant_id into raw SQL queries
injectTenantFilter(query, tenantId) -> string
```

### 4. Enhanced BaseService

**File**: `framework/backend/api/base/BaseService.js` (modified)

The existing BaseService is enhanced to automatically include tenant_id in all queries.

**Changes**:
- Constructor accepts optional `tenantIdField` parameter (defaults to 'tenant_id')
- `findAll()` automatically adds tenant_id to WHERE clause
- `findOne()` automatically adds tenant_id to WHERE clause
- `create()` automatically includes tenant_id in INSERT
- `update()` automatically adds tenant_id to WHERE clause
- `delete()` automatically adds tenant_id to WHERE clause

### 5. Enhanced BaseController

**File**: `framework/backend/api/base/BaseController.js` (modified)

The existing BaseController is enhanced to provide tenant context to route handlers.

**Changes**:
- Adds `getTenantId()` method to controller instance
- Adds `verifyTenantOwnership()` method to controller instance
- Passes tenant context to service methods automatically
- Validates tenant context before executing operations

## Data Models

### Request Context Structure

```javascript
req.context = {
  auth: {
    user: {
      id: string,
      email: string,
      tenant_id: string,
      // ... other user fields
    },
    token: string
  },
  tenant: {
    id: string,
    // Additional tenant metadata can be added here
  }
}
```

### JWT Token Payload

```javascript
{
  userId: string,
  tenant_id: string,
  email: string,
  // ... other user fields
}
```

### Database Query Modification

**Original Query**:
```sql
SELECT * FROM users WHERE email = 'user@example.com'
```

**Modified Query**:
```sql
SELECT * FROM users WHERE email = 'user@example.com' AND tenant_id = 'tenant-123'
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. 
Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Tenant ID Extraction on Login
*For any* successful user login, the system SHALL extract the user's tenant_id from the user record and include it in the JWT token payload.

**Validates: Requirements 1.1, 1.2**

### Property 2: Tenant Context Restoration
*For any* authenticated request with a valid JWT token, the system SHALL extract the tenant_id from the token and restore it in the request context.

**Validates: Requirements 1.3**

### Property 3: Query Filtering Consistency
*For any* database query executed through the API framework, the system SHALL automatically apply a WHERE clause filtering by tenant_id, ensuring only tenant-specific data is returned.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Insert Tenant ID Injection
*For any* INSERT query executed through the API framework, the system SHALL automatically include the tenant_id value in the INSERT clause.

**Validates: Requirements 2.4**

### Property 5: Update and Delete Tenant Filtering
*For any* UPDATE or DELETE query executed through the API framework, the system SHALL apply a WHERE clause filtering by tenant_id to ensure only the tenant's own records are modified or deleted.

**Validates: Requirements 2.5**

### Property 6: Tenant Context Availability
*For any* route handler execution, the system SHALL provide getTenantId() and verifyTenantOwnership() methods that allow consistent access to tenant context.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Unauthenticated Request Rejection
*For any* request without valid authentication or tenant context, the system SHALL reject the request with a 401 Unauthorized response.

**Validates: Requirements 1.4, 3.4**

### Property 8: Query Execution Prevention Without Tenant Context
*For any* database query attempted without a valid tenant context, the system SHALL prevent the query from executing and log a security warning.

**Validates: Requirements 4.1**

### Property 9: Cross-Tenant Access Prevention
*For any* attempt to access another tenant's data, the system SHALL return a 403 Forbidden response and log the incident.

**Validates: Requirements 4.2, 4.4**

### Property 10: Backward Compatibility
*For any* existing route that uses BaseController or BaseService, the system SHALL automatically apply tenant isolation without requiring code changes.

**Validates: Requirements 5.1**

## Error Handling

### Tenant Context Errors

1. **Missing Tenant ID**: When tenant_id is not found in JWT token
   - Response: 401 Unauthorized
   - Message: "Tenant context not found"
   - Log: Security warning with user ID and timestamp

2. **Invalid Tenant ID**: When tenant_id format is invalid
   - Response: 400 Bad Request
   - Message: "Invalid tenant context"
   - Log: Error with details

3. **Cross-Tenant Access**: When user attempts to access another tenant's resource
   - Response: 403 Forbidden
   - Message: "Access denied"
   - Log: Security incident with user ID, resource ID, and timestamp

### Query Execution Errors

1. **Query Without Tenant Context**: When query is executed without tenant context
   - Response: 500 Internal Server Error
   - Message: "Query execution failed"
   - Log: Critical security warning

2. **Query Modification Failure**: When automatic tenant_id injection fails
   - Response: 500 Internal Server Error
   - Message: "Query processing failed"
   - Log: Error with query details (sanitized)

## Testing Strategy

### Unit Testing

Unit tests verify specific components in isolation:

- **Tenant Context Middleware**: Test extraction of tenant_id from JWT tokens
- **Query Filter Middleware**: Test query modification for different SQL types
- **Tenant Utilities**: Test getTenantId(), verifyTenantOwnership(), and injectTenantFilter()
- **Enhanced BaseService**: Test that CRUD operations include tenant_id filters
- **Enhanced BaseController**: Test that tenant context is available to handlers

### Property-Based Testing

Property-based tests verify universal properties that should hold across all inputs:

- **Property 1**: For any user login, tenant_id is extracted and included in JWT
- **Property 2**: For any authenticated request, tenant_id is restored in context
- **Property 3**: For any SELECT query, tenant_id filter is applied
- **Property 4**: For any INSERT query, tenant_id is included
- **Property 5**: For any UPDATE/DELETE query, tenant_id filter is applied
- **Property 6**: For any route handler, getTenantId() returns correct tenant_id
- **Property 7**: For any unauthenticated request, 401 response is returned
- **Property 8**: For any query without tenant context, execution is prevented
- **Property 9**: For any cross-tenant access attempt, 403 response is returned
- **Property 10**: For any existing route using BaseService, tenant isolation works automatically

### Integration Testing

Integration tests verify the complete flow:

- Login flow: User logs in → tenant_id extracted → JWT created
- Query flow: Request arrives → tenant context restored → query filtered
- Error flow: Invalid tenant context → appropriate error response
- Backward compatibility: Existing routes work without modification


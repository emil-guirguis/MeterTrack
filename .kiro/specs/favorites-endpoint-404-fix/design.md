# Design Document: Favorites Endpoint 404 Fix

## Overview

The favorites endpoint is currently returning a 404 error due to duplicate middleware application. The `authenticateToken` middleware is applied both at the route handler level (in `favorites.js`) and globally at the server level (in `server.js`). This causes Express to fail routing the request properly.

The fix involves removing the `authenticateToken` middleware from the individual route handlers in `favorites.js`, since the middleware is already applied globally when the route is registered in `server.js`.

## Architecture

### Current (Broken) Flow
```
Request → Global authenticateToken (server.js) → Route Handler authenticateToken (favorites.js) → Handler Logic
                                                    ↑
                                                    Double middleware causes 404
```

### Fixed Flow
```
Request → Global authenticateToken (server.js) → Route Handler Logic
```

### Middleware Application Pattern

The application uses a consistent pattern for protected routes:
```javascript
app.use('/api/route', authenticateToken, setTenantContext, routeHandler);
```

This pattern applies middleware globally before the route handler is invoked. Individual route handlers should NOT re-apply the same middleware.

## Components and Interfaces

### Affected Files

1. **client/backend/src/routes/favorites.js**
   - Contains three route handlers: GET, POST, DELETE
   - Each handler currently has `authenticateToken` middleware applied
   - Middleware needs to be removed from all three handlers

2. **client/backend/src/server.js**
   - Line 560: `app.use('/api/favorites', authenticateToken, setTenantContext, favoritesRoutes);`
   - Already applies `authenticateToken` globally
   - No changes needed

### Route Handlers

**GET /api/favorites**
- Current: `router.get('/', authenticateToken, async (req, res) => { ... })`
- Fixed: `router.get('/', async (req, res) => { ... })`
- Accepts query params: `id1` (tenant_id), `id2` (user_id)
- Returns array of favorite records

**POST /api/favorites**
- Current: `router.post('/', authenticateToken, async (req, res) => { ... })`
- Fixed: `router.post('/', async (req, res) => { ... })`
- Accepts body: `{ id1, id2, id3, id4 }`
- Returns created favorite record

**DELETE /api/favorites**
- Current: `router.delete('/', authenticateToken, async (req, res) => { ... })`
- Fixed: `router.delete('/', async (req, res) => { ... })`
- Accepts query params: `id1`, `id2`, `id3`, `id4`
- Returns deleted favorite record

## Data Models

No changes to data models. The favorites table structure remains:
```
favorite {
  favorite_id: integer (primary key)
  id1: integer (tenant_id)
  id2: integer (user_id)
  id3: integer (entity_id)
  id4: integer (sub-entity_id, default 0)
  created_at: timestamp
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Authenticated Requests Succeed
*For any* valid authenticated request to the favorites endpoint with required query parameters, the request should return a 200 status code and not a 404 error.

**Validates: Requirements 1.4, 2.1**

### Property 2: Unauthenticated Requests Are Rejected
*For any* request to the favorites endpoint without valid authentication credentials, the request should return a 401 status code (not 404).

**Validates: Requirements 3.1, 3.2**

### Property 3: Invalid Token Requests Are Rejected
*For any* request to the favorites endpoint with an invalid or expired token, the request should return a 401 status code (not 404).

**Validates: Requirements 3.3, 3.4**

### Property 4: Middleware Applied Exactly Once
*For any* request to the favorites endpoint, the authentication middleware should be applied exactly once, resulting in proper request routing and response handling.

**Validates: Requirements 1.1, 1.3**

## Error Handling

### 400 Bad Request
- Missing required query parameters (`id1`, `id2`)
- Missing required body fields (`id1`, `id2`, `id3`)

### 401 Unauthorized
- Missing authentication token
- Invalid or expired token
- Handled by global `authenticateToken` middleware

### 404 Not Found
- Favorite record not found (DELETE operation)
- Should NOT occur for valid authenticated requests

### 409 Conflict
- Attempting to create a favorite that already exists (POST operation)

### 500 Internal Server Error
- Database connection errors
- Query execution errors

## Testing Strategy

### Unit Tests
- Test each route handler with valid and invalid inputs
- Test parameter validation (missing required fields)
- Test database error handling
- Test response formats and status codes

### Property-Based Tests
- **Property 1**: Generate random authenticated requests and verify 200 responses
- **Property 2**: Generate requests without tokens and verify 401 responses
- **Property 3**: Generate requests with invalid tokens and verify 401 responses
- **Property 4**: Verify middleware is applied exactly once by checking request flow

### Integration Tests
- Test the complete request flow from frontend to backend
- Verify SidebarMetersSection component can load favorites
- Test with real database connections

### Test Configuration
- Minimum 100 iterations per property test
- Each test tagged with property reference
- Tag format: `Feature: favorites-endpoint-404-fix, Property {number}: {property_text}`

# UPDATE Endpoints - Tenant ID Protection & Centralized Error Handling

## Status: COMPLETE ✓

All UPDATE endpoints for multi-tenant models now properly protect `tenant_id` from being changed or accessed by unauthorized users, with centralized error handling.

## Changes Applied

### 1. Centralized Error Handler Middleware
**File:** `client/backend/src/middleware/errorHandler.js` (NEW)

- ✓ Created `asyncHandler()` wrapper for route handlers
- ✓ Centralized `handleError()` function for consistent error formatting
- ✓ Extracts and returns full database error details (error.detail, error.code, error.hint)
- ✓ Handles all PostgreSQL error codes (23505, 23503, 23502, 42703, 42P01, 22P02, 23514, 08000, etc.)
- ✓ Returns appropriate HTTP status codes based on error type
- ✓ Logs full error context for debugging

### 2. Route Files Updated

All route files now import and use the centralized error handler:

#### **contacts.js**
- ✓ Imports `asyncHandler` from errorHandler middleware
- ✓ POST endpoint wrapped with `asyncHandler`
- ✓ PUT endpoint wrapped with `asyncHandler`
- ✓ Removed individual try-catch blocks
- ✓ Removed duplicate error logging

#### **location.js**
- ✓ Imports `asyncHandler` from errorHandler middleware
- ✓ PUT endpoint wrapped with `asyncHandler`
- ✓ Removed individual try-catch blocks
- ✓ Removed duplicate error logging

#### **meters.js**
- ✓ Imports `asyncHandler` from errorHandler middleware
- ✓ PUT endpoint wrapped with `asyncHandler`
- ✓ Removed individual try-catch blocks
- ✓ Removed duplicate error logging

#### **users.js**
- ✓ Imports `asyncHandler` from errorHandler middleware
- ✓ PUT endpoint wrapped with `asyncHandler`
- ✓ Removed individual try-catch blocks
- ✓ Removed duplicate error logging

#### **device.js**
- ✓ Imports `asyncHandler` from errorHandler middleware
- ✓ PUT endpoint wrapped with `asyncHandler`
- ✓ Removed individual try-catch blocks
- ✓ Removed duplicate error logging

## Error Handling Pattern

All route handlers now follow this pattern:

```javascript
router.put('/:id', requirePermission('entity:update'), asyncHandler(async (req, res) => {
  // Find entity
  const entity = await Entity.findById(req.params.id);
  if (!entity) {
    return res.status(404).json({ success: false, message: 'Entity not found' });
  }
  
  // Validate tenant_id ownership
  const userTenantId = req.user?.tenant_id || req.user?.tenantId;
  if (entity.tenant_id !== userTenantId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this entity'
    });
  }
  
  // Remove tenant_id from update data
  const updateData = { ...req.body };
  delete updateData.tenant_id;
  delete updateData.tenantId;
  
  // Update entity
  await entity.update(updateData);
  
  res.json({ success: true, data: entity });
  // Errors automatically caught and formatted by asyncHandler
}));
```

## Error Response Format

All errors now return consistent format with full database details:

```json
{
  "success": false,
  "message": "Foreign key constraint violation",
  "error": "Key (tenant_id)=(0) is not present in table \"tenant\"",
  "detail": "Failing row contains (1, 'John', 'john@example.com', '555-1234', true, null, null, null, null, null, null, null, 2024-01-02 10:30:00, 2024-01-02 10:30:00, 0).",
  "code": "23503",
  "errorType": "ForeignKeyError"
}
```

## Benefits

1. **Single Source of Truth**: All error handling in one place
2. **Consistent Formatting**: All errors return same structure
3. **Full Database Details**: Clients get complete error information for debugging
4. **Reduced Code Duplication**: No more try-catch blocks in every route
5. **Easier Maintenance**: Changes to error handling apply everywhere
6. **Better Logging**: Centralized logging with consistent format

## PostgreSQL Error Codes Handled

- `23505` - Unique constraint violation
- `23503` - Foreign key constraint violation
- `23502` - Not null constraint violation
- `42703` - Undefined column
- `42P01` - Undefined table
- `22P02` - Type conversion error
- `23514` - Check constraint violation
- `08000`, `08003`, `08006` - Connection errors

## Files Modified

- `client/backend/src/middleware/errorHandler.js` (NEW)
- `client/backend/src/routes/contacts.js`
- `client/backend/src/routes/location.js`
- `client/backend/src/routes/meters.js`
- `client/backend/src/routes/users.js`
- `client/backend/src/routes/device.js`

## Previous Implementation

- CREATE endpoints: Already implemented with tenant_id validation
- UPDATE endpoints: Now have tenant_id protection + centralized error handling
- Schema-based defaults: Already implemented in SchemaDefinition.js

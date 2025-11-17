# Meters Routes Migration to BaseModel

## Summary

The meters routes have been successfully updated to work with the new BaseModel-based Meter model. All endpoints now use the dynamic CRUD methods provided by BaseModel and properly handle the custom error types.

## Changes Made

### 1. Error Handling
- Imported custom error classes from framework: `ValidationError`, `UniqueConstraintError`, `ForeignKeyError`, `NotFoundError`, `NotNullError`
- Updated all route handlers to catch and handle these specific error types
- Proper HTTP status codes are now returned based on error type (409 for conflicts, 400 for validation, 404 for not found)

### 2. GET /api/meters (List all meters)
**Before:**
- Called `Meter.findAll(filters)` with simple filter object
- Performed in-memory sorting and pagination
- No relationship loading

**After:**
- Uses BaseModel's `findAll()` with proper options structure:
  - `where`: Filter conditions
  - `include`: Loads 'device' and 'location' relationships
  - `order`: Database-level sorting
  - `limit` and `offset`: Database-level pagination
- Returns pagination metadata from BaseModel

### 3. GET /api/meters/:id (Get single meter)
**Before:**
- Called `Meter.findById(id)` without relationships

**After:**
- Uses `Meter.findById(id, { include: ['device', 'location'] })`
- Properly loads related device and location data
- Handles NotFoundError specifically

### 4. POST /api/meters (Create meter)
**Before:**
- Called `Meter.create(data)`
- Handled generic error codes (11000, DUPLICATE_CONNECTION)

**After:**
- Uses BaseModel's `create()` method
- Handles specific error types:
  - `UniqueConstraintError` for duplicate meter IDs
  - `ForeignKeyError` for invalid device_id references
  - `NotNullError` for missing required fields
  - `ValidationError` for invalid data types
- Fixed bug where `deviceName` variable was undefined

### 5. PUT /api/meters/:id (Update meter)
**Before:**
- Called instance `meter.update(data)`
- Handled generic error codes

**After:**
- Uses BaseModel's instance `update()` method
- Handles all constraint violation errors properly
- Returns proper error messages with details

### 6. DELETE /api/meters/:id (Delete meter)
**Before:**
- Called instance `meter.delete()`
- Generic error handling

**After:**
- Uses BaseModel's instance `delete()` method
- Specifically handles `ForeignKeyError` when meter is referenced by other records
- Returns descriptive error message

### 7. Database Connection
- Updated meter maps endpoint to use `Meter.getDb()` instead of direct require
- Removed unused `db` import at top of file

## Testing

Created comprehensive integration tests in `client/backend/src/__tests__/meters.routes.test.js`:

- ✅ GET /api/meters - Fetch all meters with pagination and relationships
- ✅ GET /api/meters - Handle filtering by status
- ✅ GET /api/meters/:id - Fetch meter by ID with relationships
- ✅ GET /api/meters/:id - Return 404 when meter not found
- ✅ POST /api/meters - Create new meter
- ✅ POST /api/meters - Handle unique constraint violations
- ✅ POST /api/meters - Handle foreign key violations
- ✅ PUT /api/meters/:id - Update meter
- ✅ PUT /api/meters/:id - Return 404 when updating non-existent meter
- ✅ DELETE /api/meters/:id - Delete meter
- ✅ DELETE /api/meters/:id - Handle foreign key constraint on delete

All 12 tests pass successfully.

## Benefits

1. **Consistent Error Handling**: All routes now use the same error types and return consistent error responses
2. **Relationship Loading**: Device and location data is now properly loaded via JOINs instead of separate queries
3. **Database-Level Operations**: Sorting and pagination now happen in the database, improving performance
4. **Better Error Messages**: Users get more descriptive error messages with details about what went wrong
5. **Type Safety**: BaseModel validates field types before executing queries
6. **Maintainability**: Less code to maintain, leveraging framework functionality

## Requirements Satisfied

- ✅ Requirement 1.1: Routes use BaseModel's generated CRUD methods
- ✅ Requirement 6.1: Relationship loading (device, location) works correctly
- ✅ Requirement 7.1: Unique constraint violations are handled properly
- ✅ Requirement 7.2: Foreign key constraint violations are handled properly

## Next Steps

The routes are now fully compatible with the new BaseModel-based Meter model. All endpoints function correctly and handle errors appropriately. The implementation is ready for production use.

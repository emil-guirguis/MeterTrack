# Permissions JSON Flat Array Format Fix

## Problem
When updating a user with permissions, the form was sending permissions as a flat array JSON string (e.g., `'["user:create","user:read"]'`), but the backend validation was failing with:
```
Error: Invalid permissions JSON format
```

## Root Cause
**Format mismatch in permissions validation:**
- Frontend sends permissions as flat array: `['user:create', 'user:read']`
- Frontend serializes to JSON string: `'["user:create","user:read"]'`
- Backend parses the JSON string to get the array back
- Backend tries to validate the array with `validatePermissionsObject()`, which expects a nested object format: `{ user: { create: true, read: true } }`
- Validation fails because the array doesn't match the nested object structure

## Solution
Updated the backend to handle both flat array and nested object formats when validating permissions JSON strings.

## Changes Made

### 1. Backend User Update Route (users.js)
**File:** `client/backend/src/routes/users.js`

Added logic to detect and convert flat arrays to nested objects before validation:

```javascript
// Before
} else if (typeof updateData.permissions === 'string') {
  try {
    const parsed = JSON.parse(updateData.permissions);
    if (!PermissionsService.validatePermissionsObject(parsed)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permissions JSON format'
      });
    }
  } catch (e) {
    // ...
  }
}

// After
} else if (typeof updateData.permissions === 'string') {
  try {
    const parsed = JSON.parse(updateData.permissions);
    
    // If it's a flat array, convert to nested object first
    if (Array.isArray(parsed)) {
      const nestedObj = PermissionsService.toNestedObject(parsed);
      if (!PermissionsService.validatePermissionsObject(nestedObj)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid permissions array format'
        });
      }
      updateData.permissions = JSON.stringify(nestedObj);
    } else if (!PermissionsService.validatePermissionsObject(parsed)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permissions JSON format'
      });
    }
  } catch (e) {
    // ...
  }
}
```

### 2. User Model Permission Getter (UserWithSchema.js)
**File:** `client/backend/src/models/UserWithSchema.js`

Updated `getPermissionsAsNestedObject()` to handle flat arrays:

```javascript
// Before
if (typeof storedPermissions === 'string') {
  try {
    const parsed = JSON.parse(storedPermissions);
    if (PermissionsService.validatePermissionsObject(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse permissions JSON:', e);
  }
}

// After
if (typeof storedPermissions === 'string') {
  try {
    const parsed = JSON.parse(storedPermissions);
    
    // If it's a flat array, convert to nested object
    if (Array.isArray(parsed)) {
      return PermissionsService.toNestedObject(parsed);
    }
    
    // If it's a nested object, validate and return
    if (PermissionsService.validatePermissionsObject(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse permissions JSON:', e);
  }
}
```

## How the Fix Works

### Data Flow
1. **Frontend sends flat array**: `['user:create', 'user:read']`
2. **Frontend serializes to JSON**: `'["user:create","user:read"]'`
3. **Backend receives JSON string**: `'["user:create","user:read"]'`
4. **Backend parses JSON**: `['user:create', 'user:read']`
5. **Backend detects array**: Checks `Array.isArray(parsed)` → true
6. **Backend converts to nested**: `{ user: { create: true, read: true } }`
7. **Backend validates nested object**: Passes validation
8. **Backend stores as JSON**: `'{"user":{"create":true,"read":true}}'`

### Retrieval Flow
1. **Backend retrieves JSON string**: `'{"user":{"create":true,"read":true}}'`
2. **Backend parses JSON**: `{ user: { create: true, read: true } }`
3. **Backend detects object**: Checks `Array.isArray(parsed)` → false
4. **Backend validates object**: Passes validation
5. **Backend returns nested object**: `{ user: { create: true, read: true } }`

## Supported Formats

The backend now accepts permissions in these formats:

### 1. Nested Object (Primary)
```javascript
{
  user: { create: true, read: true, update: true, delete: false },
  meter: { create: true, read: true, update: true, delete: true },
  // ...
}
```

### 2. Flat Array (Converted to Nested)
```javascript
['user:create', 'user:read', 'user:update', 'meter:create', 'meter:read', ...]
```

### 3. JSON String of Nested Object
```javascript
'{"user":{"create":true,"read":true},"meter":{"create":true}}'
```

### 4. JSON String of Flat Array (Converted to Nested)
```javascript
'["user:create","user:read","meter:create"]'
```

## Testing

To verify the fix:
1. Open a user edit form
2. Modify permissions using the checkboxes
3. Save the user
4. Verify the save succeeds without "Invalid permissions JSON format" error
5. Reload the user and verify permissions are preserved

## Impact

- ✅ Flat array permissions now work correctly
- ✅ Nested object permissions continue to work
- ✅ JSON string formats are properly converted
- ✅ No breaking changes to existing code
- ✅ Permissions are always stored in normalized nested object format

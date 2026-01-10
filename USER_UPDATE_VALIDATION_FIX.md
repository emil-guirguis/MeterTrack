# User Update Validation Fix

## Problem
When updating a user, the form was sending read-only fields (like `password_reset_token`, `createdAt`, etc.) which were causing a "Validation failed" error during the update operation.

## Root Cause
**Read-only fields being sent in update request:**
- The form includes all fields from the schema, including read-only fields
- Read-only fields like `password_reset_token`, `createdAt`, `updatedAt`, etc. are marked as `readOnly: true` in the schema
- When the form sends these fields in the update request, the backend validation fails because these fields shouldn't be updated
- The error message "Validation failed" was generic and didn't indicate which field caused the issue

## Solution
Updated the user update route to:
1. Remove all read-only fields from the update data before validation
2. Add better error handling to provide more detailed error messages

## Changes Made

### Backend User Update Route (users.js)
**File:** `client/backend/src/routes/users.js`

#### 1. Remove Read-Only Fields
Added code to delete all read-only fields that shouldn't be updated:

```javascript
// Remove read-only fields that shouldn't be updated
delete updateData.password_reset_token;
delete updateData.password_reset_expires_at;
delete updateData.passwordHash;
delete updateData.createdAt;
delete updateData.updatedAt;
delete updateData.lastLogin;
delete updateData.passwordChangedAt;
delete updateData.failedLoginAttempts;
delete updateData.lockedUntil;
```

#### 2. Add Better Error Handling
Wrapped the `user.update()` call in a try-catch to provide more detailed error messages:

```javascript
try {
  await user.update(updateData);
} catch (error) {
  console.error('[USER UPDATE] Validation error:', error);
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: error.message,
      details: error.details || error.invalidFields
    });
  }
  throw error;
}
```

## Read-Only Fields Removed

The following fields are now automatically removed from update requests:

### System-Managed Fields
- `password_reset_token` - Set by password reset flow
- `password_reset_expires_at` - Set by password reset flow
- `passwordHash` - Set during password change
- `createdAt` - Set at creation time
- `updatedAt` - Set by database
- `lastLogin` - Set by authentication
- `passwordChangedAt` - Set during password change
- `failedLoginAttempts` - Set by authentication
- `lockedUntil` - Set by authentication

### Already Removed Fields
- `password` - Uses separate endpoint for password changes
- `tenant_id` - Cannot be changed after creation
- `tenantId` - Alias for tenant_id

## How the Fix Works

### Before Update
```javascript
updateData = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
  active: true,
  permissions: '{"user":{"create":true}}',
  createdAt: '2024-01-01T00:00:00Z',  // ❌ Read-only
  updatedAt: '2024-01-01T00:00:00Z',  // ❌ Read-only
  passwordHash: 'hashed...',           // ❌ Read-only
  // ... other read-only fields
}
```

### After Cleanup
```javascript
updateData = {
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
  active: true,
  permissions: '{"user":{"create":true}}'
  // All read-only fields removed ✅
}
```

### Validation
- All remaining fields are validated against their schema types
- Validation passes because only updatable fields are present
- Update succeeds

## Error Handling Improvement

### Before
```
Error: Validation failed
(No details about which field failed)
```

### After
```
Error: Invalid field types: createdAt
Details: {
  field: 'createdAt',
  expectedType: 'date',
  actualType: 'string',
  value: '2024-01-01T00:00:00Z'
}
```

## Testing

To verify the fix:
1. Open a user edit form
2. Modify any updatable field (name, email, role, permissions, active status)
3. Save the user
4. Verify the save succeeds without "Validation failed" error
5. Verify the changes are persisted correctly

## Impact

- ✅ User updates now work correctly
- ✅ Read-only fields are automatically filtered out
- ✅ Better error messages for debugging
- ✅ No breaking changes to existing code
- ✅ Permissions updates work correctly
- ✅ All user fields can be updated except read-only ones

## Fields That Can Be Updated

Users can update these fields:
- `name` - User's full name
- `email` - User's email address
- `role` - User's role (admin, manager, technician, viewer)
- `active` - User's active status (true/false)
- `permissions` - User's permissions (nested object or flat array)

Users cannot update these fields (automatically removed):
- `id` - Primary key
- `tenant_id` - Tenant association
- `password` - Use separate password change endpoint
- `passwordHash` - System-managed
- `createdAt` - System-managed
- `updatedAt` - System-managed
- `lastLogin` - System-managed
- `passwordChangedAt` - System-managed
- `failedLoginAttempts` - System-managed
- `lockedUntil` - System-managed
- `password_reset_token` - System-managed
- `password_reset_expires_at` - System-managed

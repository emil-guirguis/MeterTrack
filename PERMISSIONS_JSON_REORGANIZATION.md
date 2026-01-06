# Permissions JSON Reorganization

## Overview
Reorganized the user permissions JSON structure in `PermissionsService.js` for better readability, maintainability, and UI display.

## Changes Made

### 1. Enhanced ROLE_PERMISSIONS Structure
**Before:** Flat, hard-to-read permission definitions
```javascript
admin: {
  user: { create: true, read: true, update: true, delete: true },
  meter: { create: true, read: true, update: true, delete: true },
  // ... more modules
}
```

**After:** Well-commented, organized by role with clear intent
```javascript
admin: {
  // Full access to all user management
  user: { create: true, read: true, update: true, delete: true },
  // Full access to all meter operations
  meter: { create: true, read: true, update: true, delete: true },
  // ... more modules with explanatory comments
}
```

### 2. New Helper Methods

#### `formatPermissionsForUI(permissionsObj)`
Formats permissions for better UI display with grouped modules and human-readable labels.

**Returns:**
```javascript
[
  {
    module: 'user',
    label: 'User Management',
    permissions: [
      { action: 'create', label: 'Create', allowed: true },
      { action: 'read', label: 'Read', allowed: true },
      { action: 'update', label: 'Update', allowed: true },
      { action: 'delete', label: 'Delete', allowed: true }
    ]
  },
  {
    module: 'meter',
    label: 'Meter Management',
    permissions: [...]
  },
  // ... more modules
]
```

#### `getPermissionsSummary(role)`
Provides a human-readable summary of what a role can do.

**Returns:**
```javascript
{
  role: 'admin',
  totalPermissions: 28,
  byModule: {
    user: { count: 4, permissions: ['user:create', 'user:read', 'user:update', 'user:delete'] },
    meter: { count: 4, permissions: ['meter:create', 'meter:read', 'meter:update', 'meter:delete'] },
    // ... more modules
  }
}
```

## Benefits

1. **Improved Readability**: Comments explain the intent of each role's permissions
2. **Better UI Display**: `formatPermissionsForUI()` provides structured data for organized permission checkboxes
3. **Easier Maintenance**: Clear module grouping makes it simple to add/modify permissions
4. **Human-Readable Summaries**: `getPermissionsSummary()` helps understand role capabilities at a glance
5. **Consistent Labeling**: Module and action labels are centralized and reusable

## Usage Examples

### In Backend Routes
```javascript
const PermissionsService = require('../services/PermissionsService');

// Get formatted permissions for UI
const user = await User.findById(userId);
const userPerms = user.getPermissionsAsNestedObject();
const formattedPerms = PermissionsService.formatPermissionsForUI(userPerms);

// Send to frontend for organized display
res.json({ permissions: formattedPerms });
```

### In Frontend Components
```typescript
// Receive formatted permissions from backend
const { permissions } = await fetchUserPermissions();

// Render organized permission groups
permissions.forEach(group => {
  console.log(`${group.label}:`);
  group.permissions.forEach(perm => {
    console.log(`  ☑ ${perm.label}: ${perm.allowed}`);
  });
});
```

## Role Permissions Summary

| Role | User | Meter | Device | Location | Contact | Template | Settings |
|------|------|-------|--------|----------|---------|----------|----------|
| Admin | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | RU |
| Manager | CRU | CRUD | CRUD | CRUD | CRUD | CRUD | RU |
| Technician | R | CRUD | CRUD | R | R | R | R |
| Viewer | R | R | R | R | R | R | R |

*Legend: C=Create, R=Read, U=Update, D=Delete*

## Files Modified
- `client/backend/src/services/PermissionsService.js`

## Next Steps
1. Update frontend permission display component to use `formatPermissionsForUI()`
2. Add API endpoint to return formatted permissions for UI
3. Update permission checkboxes to display in organized groups instead of flat list

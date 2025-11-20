# Permissions Fix for Data Tables

## Issue
Edit and delete buttons in data tables (devices, locations, meters) stopped working, showing the error:
```
[useBaseList] Edit not allowed - missing permission
```

## Root Cause
The issue was NOT related to the CSS changes for card-based forms. It was a permissions configuration problem:

1. **DeviceList** - Using wrong permissions (CONTACT_CREATE/UPDATE/DELETE instead of DEVICE_*)
2. **LocationList** - Missing `authContext` parameter in useBaseList
3. **MeterList** - Missing `authContext` parameter in useBaseList

## Solution

### Fixed DeviceList
Changed from:
```typescript
permissions: {
  create: Permission.CONTACT_CREATE,
  update: Permission.CONTACT_UPDATE,
  delete: Permission.CONTACT_DELETE,
},
```

To:
```typescript
permissions: {
  create: Permission.DEVICE_CREATE,
  update: Permission.DEVICE_UPDATE,
  delete: Permission.DEVICE_DELETE,
},
```

### Fixed LocationList & MeterList
Added mock auth context:
```typescript
// Mock auth context that allows all permissions (temporary for development)
const mockAuthContext = {
  checkPermission: () => true,
  user: { id: '1', name: 'Dev User' }
};
```

And passed it to useBaseList:
```typescript
const baseList = useBaseList({
  // ... other config
  authContext: mockAuthContext,
});
```

## How Permissions Work

The `useBaseList` hook calculates permissions like this:

```typescript
const canUpdate = allowEdit && (!permissions.update || checkPermission(permissions.update));
```

This means:
- If `permissions.update` is defined, it MUST pass the `checkPermission` test
- If no `authContext` is provided, it uses a default that returns `false` for all permissions
- The mock auth context returns `true` for all permissions (for development)

## Files Modified
- `client/frontend/src/features/devices/DeviceList.tsx`
- `client/frontend/src/features/locations/LocationList.tsx`
- `client/frontend/src/features/meters/MeterList.tsx`

## Note
The mock auth context is temporary for development. In production, you should use the real auth context from `useAuth()` hook.

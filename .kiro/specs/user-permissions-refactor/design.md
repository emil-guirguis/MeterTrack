# Design Document: User Permissions Refactor

## Overview

This design refactors the scattered, hardcoded permissions logic into a centralized, modular architecture. The PermissionsService will serve as the single source of truth for role-to-permission mappings, eliminating code duplication and enabling consistent permission management across all authentication endpoints and user creation flows.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Login/Refresh/Verify Endpoints                             │
│         ↓                                                     │
│  PermissionsService.getPermissionsByRole(role)              │
│         ↓                                                     │
│  Returns: { module: { action: boolean } }                   │
│         ↓                                                     │
│  Convert to flat array for response                         │
│         ↓                                                     │
│  Return to client                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    User Creation Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  POST /users with role                                      │
│         ↓                                                     │
│  PermissionsService.getPermissionsByRole(role)              │
│         ↓                                                     │
│  Auto-generate permissions JSON                             │
│         ↓                                                     │
│  Store in user.permissions field                            │
│         ↓                                                     │
│  User created with permissions                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PermissionsService

**Location:** `client/backend/src/services/PermissionsService.js`

**Responsibilities:**
- Define role-to-permission mappings
- Generate permission objects by role
- Convert between nested object and flat array formats
- Validate permission object structure

**Public Methods:**

```javascript
/**
 * Get permissions object for a given role
 * @param {string} role - User role (admin, manager, technician, viewer)
 * @returns {Object} Nested permissions object { module: { action: boolean } }
 */
getPermissionsByRole(role)

/**
 * Convert nested permissions object to flat array format
 * @param {Object} permissionsObj - Nested permissions object
 * @returns {Array<string>} Flat array of permissions (e.g., ['user:create', 'meter:read'])
 */
toFlatArray(permissionsObj)

/**
 * Convert flat array format to nested permissions object
 * @param {Array<string>} flatArray - Flat array of permissions
 * @returns {Object} Nested permissions object
 */
toNestedObject(flatArray)

/**
 * Validate permissions object structure
 * @param {Object} permissionsObj - Permissions object to validate
 * @returns {boolean} True if valid, false otherwise
 */
validatePermissionsObject(permissionsObj)

/**
 * Get all available modules
 * @returns {Array<string>} List of module names
 */
getAvailableModules()

/**
 * Get all available actions for a module
 * @param {string} module - Module name
 * @returns {Array<string>} List of action names
 */
getAvailableActions(module)
```

**Role-to-Permission Mappings:**

- **Admin**: Full CRUD on all modules (user, meter, device, location, contact, template) + read/update on settings
- **Manager**: Create/read/update on user, location, contact, meter, device, template + read/update on settings (no delete)
- **Technician**: Read on user, location, contact, template, settings + full CRUD on meter and device
- **Viewer**: Read-only on all modules

### 2. Updated User Model

**Changes to UserWithSchema.js:**
- Permissions field type remains ARRAY but will store JSON string representation
- Add validation for permissions structure
- Add helper method to get permissions as nested object

### 3. Updated Authentication Routes

**Changes to auth.js:**
- Import PermissionsService
- Replace hardcoded role mappings with service calls
- Maintain backward compatibility with flat array format in responses
- Ensure consistent permission retrieval across login, refresh, and verify endpoints

**Changes to users.js:**
- Import PermissionsService
- Auto-generate permissions when creating users
- Store permissions as nested JSON object in database
- Validate permissions structure on update

## Data Models

### Permissions Object Structure

```javascript
{
  "user": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "meter": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "device": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "location": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "contact": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "template": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "settings": {
    "read": boolean,
    "update": boolean
  }
}
```

### Database Storage

- **Column:** `users.permissions`
- **Type:** JSON (stored as text/string in database)
- **Format:** Nested object as shown above
- **Retrieval:** Parsed from JSON string to object in application

### Flat Array Format (for API responses)

```javascript
[
  "user:create",
  "user:read",
  "user:update",
  "user:delete",
  "meter:create",
  // ... etc
]
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. 
Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Service Defines All Role Mappings

*For any* role (admin, manager, technician, viewer), calling `getPermissionsByRole(role)` should return a nested object with all required modules and actions present.

**Validates: Requirements 1.1**

### Property 2: User Creation Auto-Generates Permissions

*For any* user created with a role, the user's permissions should match exactly what `getPermissionsByRole(role)` returns for that role.

**Validates: Requirements 1.2, 2.1**

### Property 3: Permissions Storage Round Trip

*For any* user with permissions, storing the user to the database and retrieving it should result in permissions that parse back to an equivalent nested object structure.

**Validates: Requirements 1.3, 2.4**

### Property 4: Service is Source of Truth

*For any* user, calling the login endpoint should return permissions that match what `getPermissionsByRole(user.role)` returns from the service, regardless of what's stored in the database.

**Validates: Requirements 1.4, 3.1**

### Property 5: Admin Role Has Full Permissions

*For any* admin user, the permissions object should contain create, read, update, delete for all modules (user, meter, device, location, contact, template) and read, update for settings.

**Validates: Requirements 2.2**

### Property 6: Viewer Role Has Read-Only Permissions

*For any* viewer user, the permissions object should contain only read permissions for all modules (user, meter, device, location, contact, template) and read for settings, with no create, update, or delete permissions.

**Validates: Requirements 2.3**

### Property 7: Flat Array Conversion Consistency

*For any* permissions object, converting to flat array and back to nested object should produce an equivalent permissions object.

**Validates: Requirements 4.2**

### Property 8: Permissions Validation

*For any* permissions object generated by the service, calling `validatePermissionsObject()` should return true.

**Validates: Requirements 4.3**

### Property 9: Endpoint Permission Consistency

*For any* authenticated user, calling login, refresh, and verify endpoints should all return the same permissions (in flat array format).

**Validates: Requirements 3.1, 3.2, 3.3, 4.4**

### Property 10: Bootstrap Uses Service

*For any* bootstrap operation creating the first admin user, the resulting user's permissions should match what `getPermissionsByRole('admin')` returns from the service.

**Validates: Requirements 3.4**

## Error Handling

### Permission Validation Errors

- **Invalid Role**: If a role is not recognized (not admin, manager, technician, viewer), default to viewer permissions
- **Malformed Permissions Object**: If stored permissions cannot be parsed as JSON, fall back to role-based permissions
- **Missing Modules**: If a permissions object is missing expected modules, treat missing modules as having no permissions

### Service Initialization

- **Service Load Failure**: If PermissionsService fails to load, the application should fail fast with a clear error message
- **Role Mapping Corruption**: If role mappings are corrupted, log error and use hardcoded fallback mappings

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:
- Service correctly returns permissions for each role
- Flat array conversion works correctly
- Permission validation catches malformed objects
- Bootstrap creates admin with correct permissions
- User creation auto-generates permissions

### Property-Based Testing

Property-based tests will verify universal properties across many inputs:
- For all roles, service returns valid nested objects
- For all users with a role, permissions match service output
- For all permissions objects, round-trip conversion preserves structure
- For all authenticated users, endpoints return consistent permissions
- For all permission objects, validation passes

**Testing Framework:** Vitest with fast-check for property-based testing

**Configuration:** Minimum 100 iterations per property test to ensure comprehensive coverage

**Test Annotation Format:** Each property-based test will be tagged with:
```javascript
/**
 * **Feature: user-permissions-refactor, Property {number}: {property_text}**
 * **Validates: Requirements {requirement_numbers}**
 */
```

### Test Organization

- Unit tests co-located with source files using `.test.js` suffix
- Property tests in dedicated test files for each component
- Integration tests verify end-to-end flows (user creation → login → verify)


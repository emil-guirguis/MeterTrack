# Design Document: User Permissions Checkboxes Display

## Overview

The User form needs to display permissions as checkboxes organized by module. The UserForm component already has a custom field renderer (`renderCustomField`) that handles permissions display, but the permissions field is being excluded from the form via the `excludeFields` prop. The fix involves removing 'permissions' from the exclude list for edit operations and ensuring the custom renderer is properly invoked.

## Architecture

The solution uses the existing architecture:
- **UserForm Component**: React component that wraps BaseForm
- **BaseForm Component**: Framework component that renders forms based on schema
- **Custom Field Renderer**: UserForm's `renderCustomField` function handles permissions display
- **Schema Definition**: UserWithSchema defines permissions as a JSON field
- **PermissionsService**: Backend service that validates and converts permission formats

## Components and Interfaces

### UserForm Component Changes

**Current Issue:**
```typescript
excludeFields={user?.users_id ? ['passwordHash', 'lastLogin', 'password', 'permissions'] : ['passwordHash', 'lastLogin', 'permissions']}
```

The permissions field is excluded for both create and edit operations.

**Solution:**
- For edit operations (when `user?.users_id` exists): Remove 'permissions' from the exclude list
- For create operations (new user): Keep 'permissions' excluded initially, or include it with empty state
- The `renderCustomField` function will handle rendering when permissions is not excluded

### Permission Rendering Logic

The `renderCustomField` function:
1. Checks if the field name is 'permissions'
2. Groups permissions by module using `groupPermissionsByModule()`
3. Renders Material-UI Paper components for each module group
4. Renders checkboxes for each permission within the group
5. Handles checkbox state changes by updating the form value

### Data Models

**Permissions Storage Format:**
- Backend stores as JSONB: `{ module: { action: boolean } }`
- Frontend receives as flat array: `['user:create', 'meter:read']`
- Form converts between formats as needed

**Permission Structure:**
```typescript
type PermissionFlat = string[]; // ['user:create', 'meter:read']
type PermissionNested = {
  [module: string]: {
    [action: string]: boolean
  }
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Permissions Display Consistency
*For any* user with existing permissions, when the form is loaded, all previously selected permissions SHALL be displayed as checked checkboxes.
**Validates: Requirements 1.2, 1.3**

### Property 2: Permissions Persistence
*For any* set of permission changes made in the form, when the form is submitted and reloaded, the same permissions SHALL be displayed as checked.
**Validates: Requirements 2.1, 2.3**

### Property 3: Permission Format Conversion
*For any* flat array of permissions received from the backend, the form SHALL correctly identify which checkboxes should be checked based on the permission strings.
**Validates: Requirements 1.1, 1.4**

### Property 4: Empty Permissions Handling
*For any* user with no permissions (empty array or null), the form SHALL display all checkboxes in an unchecked state without errors.
**Validates: Requirements 1.3, 3.2**

## Error Handling

1. **Invalid Permission Format**: If permissions cannot be parsed, log a warning and display all checkboxes unchecked
2. **Missing Permissions Field**: If the permissions field is not in the schema, the custom renderer returns null and BaseForm handles it
3. **Validation Errors**: If backend validation fails, display error message in the form
4. **Null/Undefined Permissions**: Handle gracefully by treating as empty array

## Testing Strategy

### Unit Tests
- Test `renderCustomField` function with various permission states
- Test permission grouping logic
- Test checkbox state management
- Test permission format conversion

### Property-Based Tests
- **Property 1**: Generate random users with random permissions, verify display consistency
- **Property 2**: Generate random permission changes, verify persistence after save
- **Property 3**: Generate random flat arrays, verify correct checkbox mapping
- **Property 4**: Test with empty/null permissions, verify no errors

### Integration Tests
- Test full form submission with permission changes
- Test form reload after saving permissions
- Test new user creation with permissions
- Test permission updates for existing users

</content>
</invoke>
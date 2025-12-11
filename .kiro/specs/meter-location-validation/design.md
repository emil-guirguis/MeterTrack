# Design Document: Meter Location Validation

## Overview

This design implements location dropdown population in the meter form. The location_id field in the Meter schema is configured with `validate: true` and `validationFields: ['name']`, which indicates that the location dropdown should display location names. The frontend form will fetch locations and populate the dropdown with location names as selectable options.

## Architecture

The location dropdown population operates at the frontend form layer:

1. **Schema Layer**: Meter schema specifies `location_id` field with `validate: true` and `validationFields: ['name']`
2. **Frontend Form Layer**: BaseForm renders location_id field and uses useValidationFieldOptions hook to fetch location options
3. **API Layer**: Existing `/api/location` endpoint provides location data

### Data Flow

```
User logs in
    ↓
Auth service fetches user's tenant_id
    ↓
Auth service fetches locations for tenant from /api/location?filter.tenant_id=<tenant_id>
    ↓
Locations stored in memory cache with tenant_id as key
    ↓
Auth context updated with cached locations
    ↓
User navigates to meter form
    ↓
BaseForm detects location_id field with validate: true
    ↓
useValidationFieldOptions hook retrieves locations from auth context cache
    ↓
Dropdown populated with location names (no API call needed)
    ↓
User selects location by name
    ↓
location_id is set to selected location's ID
    ↓
On logout: cache is cleared
    ↓
On login to different tenant: cache is replaced with new tenant's locations
```

## Components and Interfaces

### Frontend Components

#### 1. Auth Context Enhancement
- **Location**: `client/frontend/src/contexts/AuthContext.tsx`
- **Enhancement**:
  - On successful login, fetch locations for user's tenant
  - Store locations in auth context state
  - Provide `getLocationsByTenant(tenantId)` method
  - Clear locations on logout
  - Update locations when tenant changes

#### 2. Auth Service Enhancement
- **Location**: `client/frontend/src/services/authService.ts`
- **Enhancement**:
  - After successful login, fetch locations from `/api/location?filter.tenant_id=<tenant_id>`
  - Return locations along with auth token
  - Handle location fetch errors gracefully (don't block login)

#### 3. BaseForm Field Rendering
- **Component**: BaseForm in `framework/frontend/components/form/BaseForm.tsx`
- **Logic**:
  - Detects fields with `validate: true` property
  - Renders as dropdown/select field instead of text input
  - Retrieves location options from auth context cache
  - No API calls needed (data already loaded at login)

#### 4. useValidationFieldOptions Hook (Enhanced)
- **Location**: `framework/frontend/components/form/hooks/useValidationFieldOptions.ts`
- **Current Behavior**:
  - Fetches schema for related entity (e.g., 'location' from 'location_id')
  - Identifies validation field from schema (field with `validate: true`)
  - Fetches all entities and maps to options
- **Enhancements**:
  - Retrieve locations from auth context instead of API
  - Validate locations belong to current tenant
  - Map location ID to location name correctly
  - Handle case when locations not yet loaded in auth context

#### 5. Meter Form Component
- **Location**: `client/frontend/src/features/meters/MeterForm.tsx`
- **Current**: Uses BaseForm with schemaName="meter"
- **No Changes Needed**: BaseForm will automatically handle location_id dropdown

## Data Models

### Meter Schema (Existing)
```javascript
location_id: field({
  type: FieldTypes.NUMBER,
  default: null,
  required: false,
  label: 'Location',
  dbField: 'location_id',
  min: 1,
  showOn: ['form'],
  validate: true,
  validationFields: ['name'],  // Display location name in dropdown
})
```

### Location Schema (Existing)
```javascript
formFields: {
  name: field({
    type: FieldTypes.STRING,
    default: '',
    required: true,
    label: 'Name',
    dbField: 'name',
    maxLength: 200,
  }),
  // ... other fields
}
```

### Dropdown Option Format
```javascript
{
  id: 1,
  label: 'Main Office'  // Location name
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Tenant-Filtered Location Dropdown
*For any* meter form load with a specific tenant_id, the location_id dropdown SHALL contain only locations belonging to that tenant, with no locations from other tenants included.

**Reasoning**: Requirement 1.1 specifies that location names should be displayed in the dropdown. This must be filtered by tenant to ensure data isolation. We can generate random sets of locations from multiple tenants and verify that only the current tenant's locations appear in the dropdown.

**Validates: Requirements 1.1, 1.2**

### Property 2: Location Names Displayed
*For any* location in the dropdown, the location's name field SHALL be displayed as the selectable label.

**Reasoning**: Requirement 1.2 requires that location names are shown. We can generate random locations and verify that the name field is correctly mapped to the dropdown label.

**Validates: Requirements 1.1, 1.2**

### Property 3: Location ID Mapping
*For any* location selected from the dropdown, the location_id field SHALL be set to the ID of the selected location.

**Reasoning**: Requirement 1.3 requires that selecting a location sets the correct location_id. This is a universal property that should hold for all selections. We can generate random location selections and verify that the correct ID is set.

**Validates: Requirements 1.3**

### Property 4: Current Location Pre-selection
*For any* meter form in edit mode with an existing location_id, the dropdown SHALL pre-select the current location by name.

**Reasoning**: Requirement 1.4 specifies that the current location should be pre-selected in edit mode. This is a universal property that should hold for all edit operations. We can generate random meters with locations and verify that the correct location is pre-selected.

**Validates: Requirements 1.4**

### Property 5: Empty Location List Handling
*For any* meter form when no locations exist for the current tenant, the location_id dropdown SHALL be empty or disabled, indicating no locations are available.

**Reasoning**: Requirement 1.5 specifies handling the edge case when no locations are available. This is a specific edge case that requires appropriate handling. We can test that when no locations exist, the dropdown is empty or disabled.

**Validates: Requirements 1.5**

### Property 6: Locations Loaded at Login
*For any* user login, locations for the user's tenant SHALL be fetched and stored in auth context cache during the login process.

**Reasoning**: Loading locations at login ensures they are available immediately when forms are opened. We can verify that after login, locations are present in auth context without requiring additional API calls.

**Validates: Requirements 1.1, 1.2**

### Property 7: Cache Cleared on Logout
*For any* user logout, the in-memory location cache in auth context SHALL be cleared, and no locations SHALL be available until the next login.

**Reasoning**: When the user logs out, cached locations must be cleared for security and to prevent stale data. We can verify that cache is cleared on logout.

**Validates: Requirements 1.1, 1.2**

## Error Handling

### Frontend Error Scenarios

1. **Location Fetch Failed**
   - Display error message: "Failed to load locations"
   - Show in useValidationFieldOptions hook error state
   - Allow user to retry

2. **No Locations Available**
   - Dropdown displays as empty
   - No error message (expected state)
   - User can still submit form without location_id if field is optional

3. **Schema Fetch Failed**
   - Display error: "Failed to load location schema"
   - Fallback to fetching all locations without schema validation

## Testing Strategy

### Unit Tests

- Test useValidationFieldOptions hook with various location datasets
- Test location name mapping to dropdown options
- Test empty location list handling
- Test location pre-selection in edit mode
- Test location ID to name mapping

### Property-Based Tests

**Property 1: Tenant-Filtered Location Dropdown**
- Generate random sets of locations from multiple tenants
- Test that dropdown contains only current tenant's locations
- Test that other tenants' locations are excluded
- Minimum 100 iterations

**Property 2: Location Names Displayed**
- Generate random locations with various names
- Test that dropdown displays location names correctly
- Test that location names match the name field from schema
- Minimum 100 iterations

**Property 3: Location ID Mapping**
- Generate random location selections from dropdown
- Test that selecting a location sets the correct location_id
- Test that location_id matches the selected location's ID
- Minimum 100 iterations

**Property 4: Current Location Pre-selection**
- Generate random meters with existing locations
- Test that the current location is pre-selected in edit mode
- Test that the pre-selected location name matches the current location
- Minimum 100 iterations

**Property 5: Empty Location List Handling**
- Test form behavior when no locations exist for tenant
- Test that dropdown is empty or disabled
- Test that form can still be submitted without location_id if optional
- Minimum 100 iterations

**Property 6: Locations Loaded at Login**
- Generate user login with various tenant_ids
- Test that locations are fetched during login
- Test that locations are stored in auth context
- Test that locations are available immediately after login
- Minimum 100 iterations

**Property 7: Cache Cleared on Logout**
- Generate user logout
- Test that locations are cleared from auth context
- Test that no locations are available after logout
- Test that locations are not accessible to next user until they login
- Minimum 100 iterations

### Integration Tests

- Test meter form loads with location dropdown populated
- Test location selection updates location_id field
- Test meter creation with selected location
- Test meter edit with location pre-selection
- Test location dropdown updates when locations change
- Test error handling when location fetch fails

### Test Framework

- **Frontend**: Vitest with React Testing Library
- **Property-Based Testing**: fast-check

### Test Configuration

- Minimum 100 iterations per property-based test
- Each test tagged with property number and requirement reference
- Tests should validate real location data fetching
- Tests should not mock the location API unless testing error scenarios

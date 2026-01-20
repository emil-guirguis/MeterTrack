# Design Document: Dashboard Meter/Element Validation

## Overview

This design adds validation for meter and meter element selection in the dashboard card form. When a user selects a meter, the available meter elements are filtered to show only those belonging to that meter. Both frontend and backend validation ensure data integrity and prevent invalid configurations.

## Architecture

The implementation follows a layered approach:

1. **Frontend Service Layer**: `dashboardService` provides methods to fetch meters and meter elements
2. **Frontend Component Layer**: `DashboardCardModal` handles form state, validation, and user interaction
3. **Backend API Layer**: New endpoints provide meter and element data filtered by tenant
4. **Backend Model Layer**: Existing `Meter` and `MeterElement` models handle database queries

## Components and Interfaces

### Frontend Service Methods

```typescript
// Add to dashboardService.ts
async getMetersByTenant(): Promise<Array<{ id: number; name: string }>>
async getMeterElementsByMeter(meterId: number): Promise<Array<{ id: number; name: string; meter_id: number }>>
```

### Backend API Endpoints

```
GET /api/dashboard/meters
  - Returns all meters for the authenticated user's tenant
  - Response: { success: boolean; data: Array<{ id: number; name: string }> }

GET /api/dashboard/meters/:meterId/elements
  - Returns all meter elements for a specific meter
  - Response: { success: boolean; data: Array<{ id: number; name: string; meter_id: number }> }
```

### Frontend Form State

The `DashboardCardModal` component maintains:
- `selectedMeterId`: Currently selected meter ID
- `selectedMeterElementId`: Currently selected meter element ID
- `availableMeters`: List of meters for the user's tenant
- `availableMeterElements`: List of meter elements filtered by selected meter
- `errors`: Validation error messages

### Data Models

**Meter** (existing):
- `id`: Primary key
- `name`: Meter name
- `tenant_id`: Tenant ownership
- `serial_number`: Unique identifier

**MeterElement** (existing):
- `id`: Primary key
- `meter_id`: Foreign key to Meter
- `name`: Element name
- `element`: Element designation (A, B, C, etc.)
- `tenant_id`: Tenant ownership

## Data Models

The design leverages existing models:

- **Meter**: Represents a physical/logical device with `id`, `name`, `tenant_id`, `serial_number`
- **MeterElement**: Represents a measurement point with `id`, `meter_id`, `name`, `element`, `tenant_id`

The relationship is: One Meter has Many MeterElements (1:N)

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Valid Meter Selection Acceptance

*For any* valid meter ID that exists in the database and belongs to the user's tenant, when selected in the form, the system should accept it without validation errors.

**Validates: Requirements 1.2**

### Property 2: Invalid Meter Submission Rejection

*For any* invalid meter ID (non-existent or not belonging to tenant), when the form is submitted with that meter selected, the system should reject the submission.

**Validates: Requirements 1.4**

### Property 3: Meter Element Filtering by Meter

*For any* meter ID selected in the form, the returned meter elements should be filtered such that all elements have `meter_id` equal to the selected meter ID.

**Validates: Requirements 2.1**

### Property 4: Meter Element Relationship Validation

*For any* meter element ID selected in the form, if the element's `meter_id` does not match the selected meter ID, the system should reject the form submission.

**Validates: Requirements 2.2, 2.4**

## Error Handling

**Frontend Validation Errors**:
- "Meter is required" - When no meter is selected
- "Meter element is required" - When no meter element is selected
- "Selected meter element does not belong to the selected meter" - When relationship is invalid

**Backend Validation Errors**:
- 400 Bad Request with message "Meter not found" - When meter_id doesn't exist
- 400 Bad Request with message "Meter element not found" - When meter_element_id doesn't exist
- 400 Bad Request with message "Meter element does not belong to selected meter" - When relationship is invalid
- 403 Forbidden with message "You do not have permission to access this meter" - When meter doesn't belong to tenant
- 403 Forbidden with message "You do not have permission to access this meter element" - When element doesn't belong to tenant

## Testing Strategy

### Unit Tests

**Frontend Component Tests**:
- Test that meters are loaded on form open
- Test that meter elements are filtered when meter is selected
- Test that validation errors display correctly
- Test that form submission is blocked with validation errors
- Test that error messages clear when user corrects selections

**Backend Endpoint Tests**:
- Test that GET /api/dashboard/meters returns only tenant's meters
- Test that GET /api/dashboard/meters/:meterId/elements returns only elements for that meter
- Test that endpoints return 403 when accessing other tenant's resources
- Test that endpoints return 404 when resource doesn't exist

### Property-Based Tests

**Property 1 Test**: Generate random valid meter IDs from the database and verify form accepts them

**Property 2 Test**: Generate random meter IDs and verify returned elements all have matching meter_id

**Property 3 Test**: Generate random meter-element pairs and verify validation correctly identifies mismatches

**Property 4 Test**: Generate random form submissions with valid/invalid data and verify submission behavior matches validation rules

## Implementation Notes

1. **Tenant Isolation**: All queries must filter by `tenant_id` from the authenticated user
2. **Caching**: Consider caching meter lists since they change infrequently
3. **Error Recovery**: If meter elements fail to load, show error message and allow retry
4. **Backward Compatibility**: Existing dashboard cards should continue to work
5. **Performance**: Meter element filtering should happen client-side after initial load to avoid excessive API calls

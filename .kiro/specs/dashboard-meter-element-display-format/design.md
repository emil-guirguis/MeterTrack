# Design Document: Dashboard Meter Element Display Format

## Overview

This design updates the dashboard card form to display meter elements in a more user-friendly format showing both the element letter and description (e.g., "A - Phase A"), sorted alphabetically by element letter. Changes are minimal and focused on the backend API response and frontend display logic.

## Architecture

The implementation follows a layered approach with minimal changes:

1. **Backend API Layer**: Update the `/api/dashboard/meters/:meterId/elements` endpoint to return both `element` and `name` fields, sorted by `element`
2. **Frontend Service Layer**: Update `dashboardService.getMeterElementsByMeter()` to handle the new response format
3. **Frontend Component Layer**: Update `DashboardCardModal` to format and display elements as "LETTER - DESCRIPTION"

## Components and Interfaces

### Backend API Endpoint

```
GET /api/dashboard/meters/:meterId/elements
  - Returns all meter elements for a specific meter
  - Response: { 
      success: boolean; 
      data: Array<{ 
        id: number; 
        element: string;      // NEW: Element letter (A, B, C, etc.)
        name: string;         // Element description
        meter_id: number 
      }> 
    }
  - Elements sorted by `element` field in ascending order
```

### Frontend Service Interface

```typescript
// dashboardService.ts
async getMeterElementsByMeter(meterId: number): Promise<Array<{
  id: number;
  element: string;      // NEW: Element letter
  name: string;         // Element description
  meter_id: number;
}>>
```

### Frontend Component State

The `DashboardCardModal` component maintains:
- `meterElements`: Array of meter elements with `id`, `element`, `name`, `meter_id`
- Display format: `${element} - ${name}` (e.g., "A - Phase A")

## Data Models

**MeterElement** (existing):
- `id`: Primary key
- `element`: Element letter designation (A, B, C, etc.)
- `name`: Element description (Phase A, Phase B, Total, etc.)
- `meter_id`: Foreign key to Meter
- `tenant_id`: Tenant ownership

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Meter Elements Sorted by Letter

*For any* meter ID, when the backend returns meter elements, all elements should be sorted in ascending alphabetical order by their `element` field (A before B before C, etc.).

**Validates: Requirements 1.2, 2.2**

### Property 2: Element Letter and Description Present

*For any* meter element returned by the backend, the response should include both the `element` field (letter) and `name` field (description) for display purposes.

**Validates: Requirements 1.1, 2.1**

### Property 3: Frontend Display Format Correct

*For any* meter element displayed in the dropdown, the format should be "LETTER - DESCRIPTION" where LETTER is the `element` field and DESCRIPTION is the `name` field.

**Validates: Requirements 1.1**

### Property 4: Selection Stores Correct ID

*For any* meter element selected by the user, the form should store the correct `id` value regardless of the display format.

**Validates: Requirements 1.3, 1.4**

## Error Handling

**Backend Errors**:
- 400 Bad Request: Invalid meter ID format
- 404 Not Found: Meter does not exist
- 403 Forbidden: User does not have permission to access this meter

**Frontend Errors**:
- Display error message if meter elements fail to load
- Disable meter element dropdown if no elements are available
- Show validation error if meter element is not selected

## Testing Strategy

### Unit Tests

**Backend Endpoint Tests**:
- Test that elements are returned with both `element` and `name` fields
- Test that elements are sorted by `element` field in ascending order
- Test that only elements for the specified meter are returned
- Test that only elements for the user's tenant are returned
- Test error cases (invalid meter ID, non-existent meter, permission denied)

**Frontend Component Tests**:
- Test that meter elements are displayed in "LETTER - DESCRIPTION" format
- Test that elements are sorted correctly in the dropdown
- Test that selecting an element stores the correct ID
- Test that form submission validates the selected element correctly

### Property-Based Tests

**Property 1 Test**: Generate random meter IDs with multiple elements and verify all returned elements are sorted by `element` field

**Property 2 Test**: Generate random meter elements and verify each has both `element` and `name` fields

**Property 3 Test**: Generate random meter elements and verify frontend displays them in "LETTER - DESCRIPTION" format

**Property 4 Test**: Generate random meter element selections and verify the form stores the correct ID value

## Implementation Notes

1. **Backward Compatibility**: The change adds a new field (`element`) to the response but doesn't remove existing fields, so existing code should continue to work
2. **Sorting**: Backend sorting by `element` ensures consistent ordering across all clients
3. **Display Format**: Frontend formatting keeps the display logic separate from data storage
4. **Validation**: Existing validation logic remains unchanged; only the display format changes


# Design Document: Meter Elements Inline Grid

## Overview

This design refactors the Meter Elements management interface to use a schema-based model and the framework's EditableDataGrid component. The new implementation provides inline editing, optimistic UI updates, and a consistent user experience aligned with other entity management interfaces like device registers.

## Architecture

### Component Structure

```
MeterForm
  └── ElementsGrid (refactored)
      ├── EditableDataGrid (framework component)
      ├── Local state for unsaved rows
      └── API integration for CRUD operations
```

### Data Flow

1. **Load**: ElementsGrid fetches existing elements from `/meters/:meterId/elements`
2. **Add**: User clicks add button → blank row inserted at top of grid
3. **Edit**: User edits cell → immediate UI update → API call on blur
4. **Delete**: User clicks delete → confirmation → API call → row removed
5. **Save**: Each cell change triggers individual API update

## Components and Interfaces

### MeterElementsWithSchema Model (Backend)

```javascript
class MeterElement extends BaseModel {
  static get tableName() { return 'meter_element'; }
  static get primaryKey() { return 'id'; }
  static get schema() { /* schema definition */ }
}
```

**Schema Fields:**
- `id`: number (primary key)
- `meter_id`: number (foreign key)
- `name`: string (required, max 255, editable: true)
- `status`: enum ['active', 'inactive'] (default: 'active', editable: false, read-only)
- `element`: string (required, max 255, editable: true)
- `created_at`: timestamp (auto, read-only)
- `updated_at`: timestamp (auto, read-only)

### ElementsGrid Component (Frontend)

**Props:**
```typescript
interface ElementsGridProps {
  meterId: number;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}
```

**State:**
- `elements`: MeterElement[] - persisted elements from server
- `unsavedRow`: Partial<MeterElement> | null - new blank row being edited
- `loading`: boolean - initial load state
- `error`: string | null - error message
- `savingRowId`: number | null - which row is currently saving

**Key Methods:**
- `loadElements()`: Fetch all elements for meter
- `handleAddElement()`: Insert blank row at top
- `handleCellChange()`: Update cell and persist to API
- `handleDeleteElement()`: Remove element with confirmation
- `handleSaveUnsavedRow()`: Persist new row to backend

### EditableDataGrid Integration

**Columns Configuration:**

Columns are derived from the MeterElementsWithSchema definition. The schema specifies which fields are editable:

```typescript
const columns: GridColumn[] = [
  { key: 'name', label: 'Name', editable: true, type: 'text' },
  { key: 'status', label: 'Status', editable: false, type: 'text' }, // Read-only, configured in schema
  { key: 'element', label: 'Element', editable: true, type: 'text' },
];
```

**Grid Data Transformation:**
- Unsaved row appears first in grid data
- Existing elements follow
- Grid row indices map to data array indices
- Column editability determined by schema field configuration

## Data Models

### MeterElement Entity

```typescript
interface MeterElement {
  id: number;
  meter_id: number;
  name: string;
  status: 'active' | 'inactive';
  element: string;
  created_at?: string;
  updated_at?: string;
}
```

### Unsaved Row Representation

```typescript
interface UnsavedMeterElement {
  name: string;
  status: 'active' | 'inactive';
  element: string;
  // No id, created_at, updated_at until saved
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Grid Renders with Existing Elements

*For any* meter with existing elements, when the ElementsGrid component mounts, the EditableDataGrid should render with all elements from the API response displayed in the grid.

**Validates: Requirements 1.1**

### Property 2: Unsaved Row Appears First

*For any* meter with existing elements, when a user clicks the add button, a blank row should appear at index 0 in the grid, and all existing elements should shift down by one index.

**Validates: Requirements 1.2**

### Property 3: Cell Changes Update UI Immediately

*For any* meter element cell, when a user edits the cell value, the UI should reflect the new value immediately before any API call completes.

**Validates: Requirements 1.3**

### Property 4: Cell Changes Persist to Backend

*For any* meter element, when a user edits a cell and commits the change (blur or Enter), the system should make an API call to persist the change with the correct payload.

**Validates: Requirements 1.4**

### Property 5: Delete Removes Element

*For any* meter element, when a user confirms deletion, the element should be removed from the grid and an API call should delete it from the backend.

**Validates: Requirements 1.5**

### Property 6: Schema Endpoint Returns Valid Schema

*For any* request to the meter element schema endpoint, the system should return a schema definition containing all required field metadata including field names, types, and validation rules.

**Validates: Requirements 2.2**

### Property 7: Schema Validation Enforces Constraints

*For any* meter element data, when validated against the MeterElementsWithSchema definition, the system should reject data missing required fields and accept data that satisfies all constraints.

**Validates: Requirements 2.3, 2.4**

### Property 8: Loading Indicator Displays During Fetch

*For any* data loading operation, the system should display a loading indicator and disable the add button until the fetch completes.

**Validates: Requirements 3.1**

### Property 9: Error State Displays with Retry

*For any* failed API operation, the system should display an error message with a retry button that re-attempts the operation.

**Validates: Requirements 3.2**

## Error Handling

### API Errors

- **Network Error**: Display error message with retry button
- **Validation Error**: Display field-specific error messages
- **Not Found**: Display "Meter not found" and disable grid
- **Unauthorized**: Redirect to login

### UI Error States

- Invalid cell input: Show validation error on cell
- Failed save: Revert cell to previous value, show error
- Failed delete: Keep row in grid, show error

## Testing Strategy

### Unit Tests

- Test ElementsGrid component mounting and data loading
- Test unsaved row insertion at top of grid
- Test cell change handlers and API calls
- Test delete confirmation and removal
- Test error state rendering and retry functionality

### Property-Based Tests

**Property 1: Unsaved Row Position**
- Generate random meter IDs and element counts
- Verify unsaved row always appears at index 0
- Verify existing elements maintain relative order

**Property 2: Cell Persistence**
- Generate random element data and field values
- Verify API call is made with correct payload
- Verify UI updates with new value

**Property 3: Delete Operation**
- Generate random element IDs
- Verify element removed from grid after delete
- Verify API delete endpoint called with correct ID

**Property 4: Schema Validation**
- Generate random element data
- Verify validation against schema constraints
- Verify required fields are enforced

**Property 5: Loading State**
- Verify loading indicator displays during fetch
- Verify add button disabled during loading
- Verify loading clears after fetch completes

**Property 6: Error Handling**
- Simulate API errors
- Verify error message displays
- Verify retry button re-attempts operation

### Testing Framework

- **Unit Tests**: Vitest with React Testing Library
- **Property-Based Tests**: fast-check
- **Minimum Iterations**: 100 per property test
- **Test Configuration**: Each property test tagged with format `**Feature: meter-elements-inline-grid, Property {N}: {description}**`

## Implementation Notes

1. **Unsaved Row Handling**: Store unsaved row separately in state, prepend to grid data array
2. **Optimistic Updates**: Update UI immediately, revert on API error
3. **Schema Integration**: Fetch schema from backend, use for validation and field metadata
4. **Consistency**: Follow same patterns as RegistersGrid implementation
5. **Accessibility**: Ensure keyboard navigation works in grid cells

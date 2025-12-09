# Design Document: JSON Grid Editor Component

## Overview

The JSON Grid Editor is a React component that transforms JSON array data into an editable grid. It auto-detects columns from the JSON structure and provides inline editing, row addition, and row deletion capabilities. The component integrates seamlessly with form systems and maintains state throughout the form lifecycle.

## Architecture

The component follows a container/presentational pattern:
- **Container**: Manages state, handles data transformations, and coordinates with parent forms
- **Presentational**: Renders the grid UI and handles user interactions
- **Hooks**: Custom hooks for column detection, row management, and state synchronization

## Components and Interfaces

### JsonGridEditor Component

```typescript
interface JsonGridEditorProps {
  data: Record<string, any>[];
  onChange: (updatedData: Record<string, any>[]) => void;
  onRowAdd?: () => void;
  onRowDelete?: (rowIndex: number) => void;
  readOnly?: boolean;
}

interface GridRow {
  id: string;
  data: Record<string, any>;
  index: number;
}

interface GridColumn {
  key: string;
  label: string;
}
```

### Key Functions

- `detectColumns(data)`: Extracts unique keys from JSON array and converts snake_case to Title Case labels
- `formatColumnLabel(key)`: Converts snake_case keys to readable labels (e.g., "first_name" → "First Name")
- `createEmptyRow(columns)`: Creates new row with all column keys initialized to empty strings
- `updateCell(rowIndex, columnKey, value)`: Updates a single cell value
- `deleteRow(rowIndex)`: Removes row from array
- `handleCellChange(rowIndex, columnKey, value)`: Coordinates cell updates and callbacks

## Data Models

```typescript
// Input data structure
type JsonGridData = Record<string, any>[];

// Example:
[
  { name: "John", email: "john@example.com", age: "30" },
  { name: "Jane", email: "jane@example.com", age: "28" }
]

// Detected columns (with formatted labels):
[
  { key: "first_name", label: "First Name" },
  { key: "email_address", label: "Email Address" },
  { key: "age", label: "Age" }
]
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Column Detection Completeness
*For any* JSON array of objects, the detected columns should include all unique property keys present in the data.
**Validates: Requirements 1.1**

### Property 2: Row Rendering Accuracy
*For any* JSON array, all rows and their values should be rendered in the grid exactly as they appear in the source data.
**Validates: Requirements 1.2**

### Property 3: Cell Edit Persistence
*For any* cell edit operation, the underlying JSON object should be updated and the grid display should reflect the change immediately.
**Validates: Requirements 1.4**

### Property 4: New Row Structure
*For any* add row operation, the new row should contain all detected column keys initialized to empty strings.
**Validates: Requirements 2.1**

### Property 5: Array Growth on Add
*For any* JSON array, adding a row should increase the array length by exactly one and append the new row to the end.
**Validates: Requirements 2.2**

### Property 6: Row Deletion from Array
*For any* row deletion, the row should be removed from the JSON array and the array length should decrease by one.
**Validates: Requirements 3.1**

### Property 7: Grid Display Update on Delete
*For any* deleted row, it should no longer appear in the grid display.
**Validates: Requirements 3.2**

### Property 8: onChange Callback on Delete
*For any* row deletion, the onChange callback should be called with the updated JSON array.
**Validates: Requirements 3.3**

### Property 9: Form Integration State Persistence
*For any* sequence of grid edits and form interactions, the grid state should persist unchanged until explicitly modified.
**Validates: Requirements 4.2**

### Property 10: Form Reset Restoration
*For any* form reset operation, the grid should return to its initial JSON state.
**Validates: Requirements 4.3**

### Property 11: Reusability with Different Structures
*For any* JSON array structure, the component should render and function correctly without modification.
**Validates: Requirements 5.1, 5.2**

### Property 12: onChange Callback Accuracy
*For any* data modification (edit, add, delete), the onChange callback should be called with the complete updated JSON array.
**Validates: Requirements 5.3**

## Error Handling

- Invalid JSON input: Component should handle gracefully and render empty grid
- Missing columns in new rows: Automatically initialize with empty strings
- Null/undefined values: Display as empty strings in grid
- Type coercion: All cell values treated as strings for editing

## Testing Strategy

### Unit Testing
- Column detection with various JSON structures
- Row creation with correct structure
- Cell update logic
- Row deletion logic
- State management and callbacks

### Property-Based Testing
- Generate random JSON arrays and verify column detection
- Generate random edits and verify state updates
- Generate random add/delete sequences and verify array integrity
- Verify callbacks fire with correct data for all operations

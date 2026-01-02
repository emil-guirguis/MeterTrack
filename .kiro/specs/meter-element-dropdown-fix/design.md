# Design Document: Meter Element Dropdown Selection Fix

## Overview

The issue occurs in the `EditableDataGrid` component when handling dropdown (Select) field changes. When a user selects a value from the dropdown, the component calls `handleCellSave()` immediately, but the state synchronization between the Select component's onChange handler and the cell display is not working correctly. The selected value is not being displayed in the cell after the dropdown closes.

## Root Cause Analysis

The problem is in the `EditableDataGrid.tsx` component's Select field onChange handler:

```typescript
onChange={(e) => {
  console.log('🔍 Select changed:', e.target.value);
  const newValue = e.target.value;
  handleCellChange(newValue);
  // Immediately save the value when selected from dropdown
  handleCellSave(newValue);
}}
```

When `handleCellSave(newValue)` is called with a value override, the component exits editing mode and clears the `editValue` state. However, the parent component (`ElementsGrid`) may not be updating its state correctly, or the timing of state updates may cause the cell to display an empty value.

## Architecture

### Component Hierarchy

```
ElementsGrid (parent)
  ├── Manages: elements[], unsavedRow, schema
  ├── Callbacks: onCellChange, onCellBlur
  └── EditableDataGrid (child)
      ├── Manages: editingCell, editValue
      ├── Handles: cell editing, dropdown selection
      └── Calls parent callbacks on value changes
```

### Data Flow for Dropdown Selection

1. User clicks on element cell → `handleCellClick()` sets `editingCell` and `editValue`
2. Select component renders with current `editValue`
3. User selects option → Select's `onChange` fires
4. `handleCellChange()` updates `editValue` state
5. `handleCellSave(newValue)` is called with the selected value
6. `onCellChange` callback is invoked with the new value
7. `onCellBlur` callback is invoked to trigger auto-save
8. `editingCell` is cleared, exiting edit mode
9. Cell should display the new value from parent state

## Components and Interfaces

### EditableDataGrid Component

**Key State:**
- `editingCell`: Tracks which cell is currently being edited
- `editValue`: Stores the current edit value

**Key Methods:**
- `handleCellClick()`: Enters edit mode for a cell
- `handleCellChange()`: Updates the edit value
- `handleCellSave()`: Saves the cell value and exits edit mode
- `handleCellCancel()`: Cancels editing without saving

**Select Field Rendering:**
```typescript
{column.type === 'select' && column.options ? (
  <Select
    autoFocus
    value={editValue}
    onChange={(e) => {
      const newValue = e.target.value;
      handleCellChange(newValue);
      handleCellSave(newValue);
    }}
    // ... other props
  >
    {column.options.map((option) => (
      <MenuItem key={option} value={option}>
        {option}
      </MenuItem>
    ))}
  </Select>
) : (
  // TextField for text input
)}
```

### ElementsGrid Component

**Key State:**
- `elements[]`: Array of saved meter elements
- `unsavedRow`: Current unsaved row being edited
- `schema`: Field definitions and options

**Key Methods:**
- `handleCellChange()`: Updates element state and stores pending changes
- `onCellBlur()`: Triggers auto-save when cell loses focus

## Data Models

### MeterElement
```typescript
interface MeterElement {
  id: number;
  meter_id: number;
  name: string;
  element: string;
  created_at?: string;
  updated_at?: string;
}
```

### UnsavedMeterElement
```typescript
interface UnsavedMeterElement {
  name: string;
  element: string;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Dropdown Selection Updates Cell Display

**For any** dropdown field in the EditableDataGrid, when a user selects a value from the dropdown, the cell should display the selected value after the dropdown closes.

**Validates: Requirements 1.2, 1.3**

### Property 2: Dropdown Selection Triggers Callbacks

**For any** dropdown field selection, both the `onCellChange` and `onCellBlur` callbacks should be invoked with the selected value.

**Validates: Requirements 1.4, 1.5**

### Property 3: Dropdown Selection Works for Unsaved Rows

**For any** unsaved row with a dropdown field, selecting a value should update the unsaved row state and display the selected value in the cell.

**Validates: Requirements 2.1, 2.3**

### Property 4: Dropdown Selection Works for Saved Rows

**For any** saved row with a dropdown field, selecting a value should update the element state and display the selected value in the cell.

**Validates: Requirements 2.2, 2.3**

### Property 5: Dropdown Selection Enables Auto-Save

**For any** dropdown selection in a new row with all required fields populated, the row should be automatically saved to the backend.

**Validates: Requirements 3.1, 3.3**

## Error Handling

1. **Invalid Selection**: If a user somehow selects an invalid value, the parent component's validation will catch it
2. **Backend Save Failure**: If auto-save fails, the error will be displayed in the error alert
3. **State Sync Issues**: If parent state doesn't update, the cell will display the old value until the next render

## Testing Strategy

### Unit Tests

- Test that Select component renders with correct options
- Test that onChange handler is called with correct value
- Test that handleCellSave is called immediately after selection
- Test that editingCell state is cleared after selection
- Test that callbacks are invoked with correct parameters

### Property-Based Tests

- **Property 1**: For any valid element option, selecting it should result in the cell displaying that value
- **Property 2**: For any dropdown selection, both callbacks should be invoked
- **Property 3**: For any unsaved row, dropdown selection should update the unsaved row state
- **Property 4**: For any saved row, dropdown selection should update the element state
- **Property 5**: For any new row with all required fields, dropdown selection should trigger auto-save

## Implementation Notes

The fix involves ensuring that:

1. The Select component's onChange handler correctly updates the edit value
2. The handleCellSave function properly exits edit mode
3. The parent component's onCellChange callback correctly updates its state
4. The parent component's onCellBlur callback is invoked to trigger auto-save
5. The cell re-renders with the new value from parent state

The key is to ensure that after `handleCellSave()` is called, the parent component updates its state, which causes the EditableDataGrid to re-render with the new value, which then displays in the cell.

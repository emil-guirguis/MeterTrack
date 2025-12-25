# Design Document - Device Registers Tab

## Overview

The Device Registers Tab adds a new "Registers" tab to the Device Form that displays an editable datalist grid of registers associated with a device. The grid supports inline editing, adding new registers, and deleting existing registers. The implementation integrates with the existing form structure using the `useFormTabs` hook and creates new API endpoints for managing device registers.

## Architecture

### Component Hierarchy

```
DeviceForm
├── Tab Navigation (using useFormTabs)
│   ├── Basic Tab
│   ├── Registers Tab (NEW)
│   └── Other Tabs
└── Tab Content
    ├── BaseForm (for Basic tab)
    └── RegistersGrid (NEW - extends EditableDataGrid)
        └── EditableDataGrid (Framework Component)
            ├── GridHeader
            │   ├── Add Register Button
            │   └── Loading/Error States
            ├── GridTable
            │   ├── Column Headers (number, name, unit, field_name, actions)
            │   └── GridRows
            │       ├── EditableCell (inline editing with form focus color)
            │       └── DeleteButton
            └── ConfirmationDialog (for delete)
```

### Data Flow

```
DeviceForm (activeTab state)
    ↓
useFormTabs (organizes tabs)
    ↓
RegistersGrid (renders when activeTab === 'Registers')
    ↓
API Calls
├── GET /api/devices/:deviceId/registers (load registers)
├── POST /api/devices/:deviceId/registers (add register)
├── PUT /api/devices/:deviceId/registers/:registerId (update register)
└── DELETE /api/devices/:deviceId/registers/:registerId (delete register)
```

## Components and Interfaces

### 1. EditableDataGrid Component (Framework)

**Purpose:** Reusable framework component for displaying and managing editable data grids using Material-UI Table

**Location:** `framework/frontend/components/datagrid/EditableDataGrid.tsx`

**Built with:** Material-UI Table, TextField, Button, IconButton, Alert, CircularProgress

**Props:**
```typescript
interface EditableDataGridProps {
  data: Record<string, any>[];
  columns: GridColumn[];
  onRowAdd?: () => void;
  onRowDelete?: (rowId: number) => void;
  onCellChange?: (rowId: number, column: string, value: any) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  addButtonLabel?: string;
}

interface GridColumn {
  key: string;
  label: string;
  editable?: boolean;
  type?: 'text' | 'number' | 'select';
  width?: string;
}
```

**Material-UI Components Used:**
- `TableContainer` - Wrapper for responsive table
- `Table` - Main table component
- `TableHead` - Table header section
- `TableBody` - Table body section
- `TableRow` - Table row
- `TableCell` - Table cell
- `TextField` - Inline edit input field
- `Button` - Add button
- `IconButton` - Delete button
- `DeleteIcon` - Delete icon
- `Alert` - Error message display
- `CircularProgress` - Loading indicator
- `Box` - Layout container

### 2. RegistersGrid Component (Device Feature)

**Purpose:** Device-specific component that extends EditableDataGrid for managing device registers

**Inheritance:** Extends `EditableDataGrid` from framework

**Props:**
```typescript
interface RegistersGridProps {
  deviceId: number;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}
```

**State:**
```typescript
{
  registers: Register[];
  loading: boolean;
  error: string | null;
  selectedRegisterForDelete: Register | null;
  showDeleteConfirm: boolean;
}
```

**Key Methods:**
- `loadRegisters()` - Fetch registers from API
- `handleCellChange(rowId, column, value)` - Handle cell value changes (inherited from EditableDataGrid)
- `handleSaveCell(rowId, column, value)` - Save cell to backend
- `handleAddRegister()` - Show add register modal
- `handleDeleteClick(register)` - Show delete confirmation
- `handleDeleteConfirm()` - Delete register from backend
- `handleRetry()` - Retry loading registers

**Columns Configuration:**
```typescript
const columns: GridColumn[] = [
  { key: 'number', label: 'Number', editable: true, type: 'text' },
  { key: 'name', label: 'Name', editable: true, type: 'text' },
  { key: 'unit', label: 'Unit', editable: true, type: 'text' },
  { key: 'field_name', label: 'Field Name', editable: true, type: 'text' },
  { key: 'actions', label: 'Actions', editable: false, type: 'actions' }
];
```

### 3. EditableDataGrid Component (Framework)

**Purpose:** Reusable framework component for displaying and managing editable data grids

**Location:** `framework/frontend/components/datagrid/EditableDataGrid.tsx`

**Features:**
- Click to edit cells
- Escape to cancel edit
- Enter to save edit
- Focus color matches form field focus color
- Visual feedback on hover
- Delete button per row
- Add button in header
- Loading and error states
- Empty state message
- Pagination support

**Key Methods:**
- `handleCellClick(rowId, column)` - Enter edit mode
- `handleCellChange(value)` - Update edit value
- `handleCellSave()` - Trigger save callback
- `handleCellCancel()` - Cancel edit
- `handleAddClick()` - Trigger add callback
- `handleDeleteClick(rowId)` - Trigger delete callback

### 4. AddRegisterModal Component

**Purpose:** Modal for selecting and adding a new register to the device

**Props:**
```typescript
interface AddRegisterModalProps {
  deviceId: number;
  existingRegisterIds: number[];
  onAdd: (register: Register) => void;
  onClose: () => void;
}
```

**Features:**
- Fetch available registers
- Filter out already-associated registers
- Select register from dropdown
- Confirm to add

### 5. DeleteConfirmDialog Component

**Purpose:** Confirmation dialog for deleting a register

**Props:**
```typescript
interface DeleteConfirmDialogProps {
  register: Register;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}
```

## Data Models

### Register Interface

```typescript
interface Register {
  id: number;
  number: string;
  name: string;
  unit: string;
  field_name: string;
  tenant_id: number;
}
```

### DeviceRegister Interface

```typescript
interface DeviceRegister {
  id: number;
  device_id: number;
  register_id: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  register?: Register; // Joined register data
}
```

### API Response Types

```typescript
interface GetRegistersResponse {
  success: boolean;
  data: DeviceRegister[];
}

interface AddRegisterResponse {
  success: boolean;
  data: DeviceRegister;
}

interface UpdateRegisterResponse {
  success: boolean;
  data: DeviceRegister;
}

interface DeleteRegisterResponse {
  success: boolean;
  message: string;
}
```

## Error Handling

### Error States

1. **Load Error** - Display error message with retry button
2. **Save Error** - Display inline error message, keep cell in edit mode
3. **Delete Error** - Display error in confirmation dialog, keep row in grid
4. **Add Error** - Display error in modal, allow retry

### Error Messages

- "Failed to load registers. Please try again."
- "Failed to save register. Please try again."
- "Failed to delete register. Please try again."
- "Failed to add register. Please try again."

## Testing Strategy

### Unit Tests

- EditableCell component behavior
- Cell edit/save/cancel logic
- Delete confirmation logic
- Modal open/close logic

### Property-Based Tests

- **Property 1: Register Grid Consistency** - For any set of registers, the grid should display all registers with correct values
- **Property 2: Edit Round Trip** - For any register value, editing and saving should preserve the value
- **Property 3: Add/Delete Idempotence** - Adding then deleting a register should return to original state
- **Property 4: Cell Focus Color** - When a cell has focus, it should have the same color as form field focus

### Integration Tests

- Load registers on tab switch
- Add register flow
- Edit register flow
- Delete register flow
- Error handling and retry

## Styling

### CSS Classes

```css
.registers-grid { }
.registers-grid__header { }
.registers-grid__add-button { }
.registers-grid__table { }
.registers-grid__row { }
.registers-grid__cell { }
.registers-grid__cell--editable { }
.registers-grid__cell--editing { }
.registers-grid__cell--focused { }
.registers-grid__cell--error { }
.registers-grid__delete-button { }
.registers-grid__loading { }
.registers-grid__error { }
.registers-grid__empty { }
```

### Focus Color

The editable cell focus color should match the form field focus color. This is typically defined in the form CSS:

```css
.registers-grid__cell--focused {
  border-color: var(--form-focus-color, #0066cc);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}
```

## API Endpoints

### GET /api/devices/:deviceId/registers

**Purpose:** Fetch all registers for a device

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_id": 123,
      "register_id": 456,
      "tenant_id": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "register": {
        "id": 456,
        "number": "1.0.0",
        "name": "Total Energy",
        "unit": "kWh",
        "field_name": "total_energy",
        "tenant_id": 1
      }
    }
  ]
}
```

### POST /api/devices/:deviceId/registers

**Purpose:** Add a register to a device

**Request:**
```json
{
  "register_id": 456
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "device_id": 123,
    "register_id": 456,
    "tenant_id": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/devices/:deviceId/registers/:registerId

**Purpose:** Update a register association (for future use)

**Request:**
```json
{
  "field_name": "new_value"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

### DELETE /api/devices/:deviceId/registers/:registerId

**Purpose:** Remove a register from a device

**Response:**
```json
{
  "success": true,
  "message": "Register removed successfully"
}
```

## Integration with DeviceForm

### Tab Configuration

Add to DeviceWithSchema.js formGrouping:

```typescript
formGrouping: {
  tabName: 'Registers',
  tabOrder: 2,
  sectionName: 'Device Registers',
  sectionOrder: 1,
}
```

### DeviceForm Changes

1. Import RegistersGrid component
2. Add conditional rendering for Registers tab
3. Pass deviceId to RegistersGrid
4. Handle error/success callbacks

```typescript
{activeTab === 'Registers' && device?.id && (
  <RegistersGrid
    deviceId={device.id}
    onError={(error) => console.error(error)}
    onSuccess={(message) => console.log(message)}
  />
)}
```

## Performance Considerations

1. **Lazy Loading** - Load registers only when Registers tab is active
2. **Pagination** - Support pagination for devices with many registers
3. **Caching** - Cache register list to avoid unnecessary API calls
4. **Debouncing** - Debounce save operations to prevent rapid API calls

## Security Considerations

1. **Tenant Isolation** - Ensure registers are filtered by tenant_id
2. **Permission Checks** - Validate user has permission to manage device registers
3. **Input Validation** - Validate all user inputs before sending to API
4. **CSRF Protection** - Include CSRF token in POST/PUT/DELETE requests

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Register Grid Consistency

*For any* device with registers, the grid should display all registers with their correct values (number, name, unit, field_name).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Edit Round Trip

*For any* register value in the grid, editing the value and saving should result in the same value being persisted and displayed.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 3: Add/Delete Idempotence

*For any* device and register, adding a register then deleting it should return the device to its original state (register not in grid).

**Validates: Requirements 4.3, 4.4, 5.3, 5.4**

### Property 4: Cell Focus Color Consistency

*For any* editable cell with focus, the cell should display the same focus color as form field focus states.

**Validates: Requirements 3.2, 3.3**

### Property 5: Delete Prevention for Duplicates

*For any* device and register already associated with the device, attempting to add the same register again should be prevented.

**Validates: Requirements 4.5**

### Property 6: Error State Preservation

*For any* failed operation (save, delete, add), the grid should preserve the original state and display an error message.

**Validates: Requirements 3.5, 5.5**

## Future Enhancements

1. **Bulk Operations** - Select multiple registers and perform bulk actions
2. **Register Filtering** - Filter registers by type, unit, or name
3. **Register Search** - Search for registers by name or number
4. **Register History** - View history of register changes
5. **Register Validation** - Validate register values against constraints
6. **Export/Import** - Export registers to CSV or import from file


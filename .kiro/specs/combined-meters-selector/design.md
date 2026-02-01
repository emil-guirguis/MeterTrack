# Design Document: Combined Meters Selector

## Overview

The Combined Meters Selector is a dual-list component that enables users to select and manage physical meters for combination into a virtual meter. The component integrates into the meter form as a tab that replaces the "Elements" tab when a virtual meter is selected. It provides search, double-click, and drag-and-drop interactions for intuitive meter selection, with all selections persisted to a new `meter_virtual` database table.

## Architecture

### Component Hierarchy

```
MeterForm
├── TabContainer
│   ├── ElementsTab (shown for physical meters)
│   └── CombinedMetersTab (shown for virtual meters, disabled until parent meter is saved)
│       ├── SearchBox
│       └── DualListSelector
│           ├── AvailableList
│           │   └── MeterListItem (draggable)
│           └── SelectedList
│               └── MeterListItem (draggable)
```

### Data Flow

1. **Load Phase**: When a virtual meter form loads, the component is disabled until the parent meter is saved. Once the parent meter is saved, the component fetches available meters from `getMeterElements` API and previously selected meters from `meter_virtual` table
2. **Interaction Phase**: User interacts with lists (search, double-click, drag-drop, delete). Each interaction triggers an immediate save to the database
3. **Real-time Save Phase**: When a meter is added or removed, the component automatically saves the change to `meter_virtual` table via API
4. **Reload Phase**: On page reload, previously saved selections are restored from database

## Components and Interfaces

### CombinedMetersTab Component

**Props:**
```typescript
interface CombinedMetersTabProps {
  meterId: string;
  isVirtual: boolean;
  isParentSaved: boolean; // Tab is disabled until parent meter is saved
  onMetersChange: (selectedMeters: Meter[]) => void;
  onError: (error: Error) => void;
}
```

**State:**
```typescript
interface CombinedMetersTabState {
  availableMeters: Meter[];
  selectedMeters: Meter[];
  searchQuery: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}
```

**Behavior:**
- Tab is disabled until parent meter is saved
- When first meter is selected, parent meter is auto-saved if not already saved
- Each meter addition/removal triggers immediate save to database
- Real-time persistence with visual feedback

### SearchBox Component

**Props:**
```typescript
interface SearchBoxProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}
```

Provides real-time filtering of both available and selected meters as user types.

### DualListSelector Component

**Props:**
```typescript
interface DualListSelectorProps {
  availableItems: Meter[];
  selectedItems: Meter[];
  onItemMove: (item: Meter, direction: 'left' | 'right') => void;
  onItemsReorder?: (items: Meter[], side: 'left' | 'right') => void;
  searchQuery: string;
  emptyStateMessage: string;
}
```

**Features:**
- Left list: Available meters (filtered by search)
- Right list: Selected meters (filtered by search)
- Double-click to move items between lists
- Drag-and-drop support with visual feedback
- Delete key to remove from right list
- Keyboard navigation (Tab, Arrow keys)

### MeterListItem Component

**Props:**
```typescript
interface MeterListItemProps {
  meter: Meter;
  isDragging?: boolean;
  onDoubleClick: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: (e: DragEvent) => void;
}
```

Displays meter name and identifier in consistent format with favorites display.

## Data Models

### Meter Interface

```typescript
interface Meter {
  id: string;
  name: string;
  identifier: string;
  type: 'physical' | 'virtual';
  // Additional fields from API
}
```

### Virtual Meter Configuration

```typescript
interface VirtualMeterConfig {
  meterId: string;
  selectedMeterIds: string[];
  selectedMeterElementIds: string[];
}
```

### Database Schema: meter_virtual Table

```sql
CREATE TABLE IF NOT EXISTS public.meter_virtual (
    meter_virtual_id integer NOT NULL DEFAULT nextval('meter_virtual_meter_virtual_id_seq'::regclass),
    meter_id bigint NOT NULL,
    selected_meter_id bigint NOT NULL,
    select_meter_element_id bigint NOT NULL,
    CONSTRAINT meter_virtual_pkey PRIMARY KEY (meter_virtual_id, meter_id, selected_meter_id, select_meter_element_id)
);

ALTER TABLE public.meter_virtual OWNER to postgres;
GRANT ALL ON TABLE public.meter_virtual TO anon;
GRANT ALL ON TABLE public.meter_virtual TO authenticated;
GRANT ALL ON TABLE public.meter_virtual TO postgres;
GRANT ALL ON TABLE public.meter_virtual TO service_role;
```

### API Endpoints

**GET /api/meters/elements** (getMeterElements)
- Returns available physical meters and elements
- Used by: favorites, meter readings sidebar, combined meters selector
- Response format:
```json
{
  "data": [
    {
      "id": "meter_123",
      "name": "Main Meter",
      "identifier": "MM-001",
      "type": "physical"
    }
  ]
}
```

**GET /api/meters/:meterId/virtual-config**
- Returns previously selected meters for a virtual meter
- Response format:
```json
{
  "meterId": "virtual_456",
  "selectedMeters": [
    {
      "id": "meter_123",
      "name": "Main Meter",
      "identifier": "MM-001"
    }
  ]
}
```

**POST /api/meters/:meterId/virtual-config**
- Saves selected meters for a virtual meter
- Request body:
```json
{
  "selectedMeterIds": ["meter_123", "meter_124"],
  "selectedMeterElementIds": ["element_001", "element_002"]
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Search filters both lists

*For any* search query and any meter list, when the search query is applied, both the available and selected lists should only display meters whose name or identifier contains the search query (case-insensitive).

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 2: Selected meters excluded from available list

*For any* meter that is in the selected list, that meter should not appear in the available list, regardless of search query.

**Validates: Requirements 3.4, 4.3**

### Property 3: Double-click moves items between lists

*For any* meter in the available list, double-clicking it should move it to the selected list and remove it from the available list. Conversely, double-clicking a meter in the selected list should move it back to the available list.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 4: Drag-and-drop moves items between lists

*For any* meter, dragging it from one list and dropping it into the other list should move it to the target list and remove it from the source list, with both lists updating immediately.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 5: Delete key removes from selected list

*For any* meter in the selected list, pressing the Delete key while the meter is focused should remove it from the selected list and add it back to the available list.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 6: Search state persists during operations

*For any* active search query, when a meter is moved between lists (via double-click, drag-drop, or delete), the search query should remain active and the lists should continue to be filtered by that query.

**Validates: Requirements 5.4**

### Property 7: Selected meters persist to database

*For any* virtual meter with a set of selected meters, after saving, reloading the page should restore the exact same set of selected meters in the right list.

**Validates: Requirements 4.2, 8.1, 8.4, 11.2, 11.3, 11.4**

### Property 8: API response contains required fields

*For any* meter returned from the getMeterElements API, the response should include at minimum: id, name, and identifier fields, formatted consistently with the favorites display.

**Validates: Requirements 3.2, 12.4**

### Property 9: Keyboard navigation works for all interactive elements

*For any* interactive element in the component (list items, search box, buttons), Tab key should navigate to the next element, Shift+Tab should navigate to the previous element, and Enter key should activate the focused element.

**Validates: Requirements 9.4**

### Property 10: Available meters loaded from API on component mount

*For any* virtual meter form, when the CombinedMetersTab component mounts, the getMeterElements API should be called exactly once to populate the available meters list.

**Validates: Requirements 1.4, 12.1, 12.3**

## Error Handling

### API Failures

**Scenario**: getMeterElements API fails
- Display error message: "Failed to load available meters. Please try again."
- Provide retry button
- Disable component until retry succeeds

**Scenario**: Real-time save operation fails
- Display error message with specific error details
- Revert the UI change that triggered the save
- Keep the previous state in memory
- Provide retry button
- Allow user to try the operation again

### Data Validation

**Scenario**: Duplicate selections
- Prevent adding the same meter twice
- Silently ignore duplicate drag-drop attempts

**Scenario**: Invalid meter data
- Filter out meters with missing required fields (id, name, identifier)
- Log warning for debugging

### Empty States

**Scenario**: No available meters
- Display: "No physical meters available"
- Disable selection until meters are available

**Scenario**: No selected meters
- Display: "No meters selected. Double-click or drag meters from the left to add them."

### Tab Disabled State

**Scenario**: Parent meter not yet saved
- Display tab as disabled/grayed out
- Show tooltip: "Save the meter first to configure combined meters"
- When first meter is selected, auto-save parent meter and enable tab

## Testing Strategy

### Unit Tests

Unit tests verify specific examples, edge cases, and error conditions:

1. **Search functionality**
   - Search with empty query returns all meters
   - Search with partial match filters correctly
   - Search is case-insensitive
   - Search works on both name and identifier fields

2. **List operations**
   - Double-click moves item from left to right and triggers save
   - Double-click moves item from right to left and triggers save
   - Drag-drop moves item between lists and triggers save
   - Delete key removes item from right list and triggers save
   - Cannot add duplicate items

3. **Real-time persistence**
   - Each meter addition triggers API save
   - Each meter removal triggers API save
   - Save failures revert UI changes
   - Save failures show error message with retry option

4. **Tab state management**
   - Tab is disabled until parent meter is saved
   - Tab becomes enabled after parent meter is saved
   - First meter selection auto-saves parent meter if needed

5. **Empty states**
   - Empty available list shows appropriate message
   - Empty selected list shows appropriate message
   - No results search shows appropriate message

6. **API integration**
   - getMeterElements is called on component mount
   - Virtual meter config is loaded on component mount
   - Each meter operation calls correct API endpoint
   - Error handling displays appropriate messages

7. **Keyboard navigation**
   - Tab navigates through all interactive elements
   - Enter activates focused list item and triggers save
   - Delete removes focused item from selected list and triggers save

### Property-Based Tests

Property-based tests verify universal properties across many generated inputs:

1. **Property 1: Search filters both lists**
   - Generate random meter lists and search queries
   - Verify all results match search criteria
   - Minimum 100 iterations

2. **Property 2: Selected meters excluded from available list**
   - Generate random meter selections
   - Verify no selected meter appears in available list
   - Minimum 100 iterations

3. **Property 3: Double-click moves items between lists**
   - Generate random meter lists and selections
   - Simulate double-click operations
   - Verify list state changes correctly
   - Minimum 100 iterations

4. **Property 4: Drag-and-drop moves items between lists**
   - Generate random meter lists and drag-drop operations
   - Verify items move to correct list
   - Verify both lists update immediately
   - Minimum 100 iterations

5. **Property 5: Delete key removes from selected list**
   - Generate random selected meter lists
   - Simulate delete key press
   - Verify item removed from selected and added to available
   - Minimum 100 iterations

6. **Property 6: Search state persists during operations**
   - Generate random meter lists and search queries
   - Perform operations while search is active
   - Verify search remains active and filters are applied
   - Minimum 100 iterations

7. **Property 7: Selected meters persist to database**
   - Generate random meter selections
   - Save to database
   - Reload and verify selections match
   - Minimum 100 iterations

8. **Property 8: API response contains required fields**
   - Generate random API responses
   - Verify all responses contain required fields
   - Verify format matches favorites display
   - Minimum 100 iterations

9. **Property 9: Keyboard navigation works for all interactive elements**
   - Generate random component states
   - Simulate keyboard navigation
   - Verify all elements are reachable via Tab
   - Verify Enter activates elements
   - Minimum 100 iterations

10. **Property 10: Available meters loaded from API on component mount**
    - Mount component multiple times
    - Verify API is called exactly once per mount
    - Verify available list is populated correctly
    - Minimum 100 iterations

### Testing Configuration

- Use React Testing Library for component tests
- Use Jest for unit tests
- Use fast-check or similar for property-based tests
- Each property test runs minimum 100 iterations
- Tag format: `Feature: combined-meters-selector, Property N: [property_text]`
- All tests should be automated and run in CI/CD pipeline

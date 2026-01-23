# Design Document: Sidebar Favorites with Meter Readings

## Overview

The Sidebar Favorites with Meter Readings feature enhances the sidebar navigation to provide users with quick access to frequently used meters and elements. The design implements a hierarchical structure with a dedicated favorites section at the top, followed by all active meters. Users can expand meters to view their elements, mark items as favorites using a star icon, and click elements to view detailed meter readings in a data grid. The feature persists user preferences (favorites and expanded state) across page refreshes using local storage and the favorites service.

## Architecture

The feature follows a component-based architecture with clear separation of concerns:

```
SidebarMetersSection (Container)
├── FavoritesSection (Presentational)
│   └── FavoriteItem[] (Presentational)
├── AllActiveMetersSection (Presentational)
│   └── MeterItem[] (Container)
│       ├── StarIcon (Presentational)
│       └── MeterElementItem[] (Presentational)
│           ├── StarIcon (Presentational)
│           └── ReadingsGrid (Container)
└── ReadingsGridPanel (Container)
    └── EditableDataGrid (Framework Component)
```

**Data Flow**:
1. SidebarMetersSection loads meters and favorites on mount
2. User interactions (star click, meter expand, element click) trigger state updates
3. State changes trigger service calls (favorites, readings)
4. Services persist data and return updated state
5. Components re-render with updated data

## Components and Interfaces

### SidebarMetersSection (Container Component)

**Responsibilities**:
- Fetch and manage meters, favorites, and expanded state
- Coordinate between child components
- Handle readings grid visibility

**Props**:
```typescript
interface SidebarMetersSectionProps {
  onMeterSelect?: (meterId: string) => void;
}
```

**State**:
```typescript
interface SidebarMetersSectionState {
  meters: Meter[];
  favorites: Favorite[];
  expandedMeters: Set<string>;
  selectedElement: Element | null;
  readings: MeterReading[];
  loading: boolean;
  error: string | null;
}
```

**Key Methods**:
- `loadMeters()`: Fetch all active meters from metersService
- `loadFavorites()`: Fetch all favorites from favoritesService
- `loadExpandedState()`: Restore expanded meters from local storage
- `toggleMeter(meterId)`: Expand/collapse meter and persist state
- `toggleFavorite(itemId, itemType)`: Add/remove favorite and persist
- `selectElement(element)`: Load readings for element
- `closeReadingsGrid()`: Hide readings grid and return to meter list

### FavoritesSection (Presentational Component)

**Responsibilities**:
- Display favorited meters and elements
- Show empty state message

**Props**:
```typescript
interface FavoritesSectionProps {
  favorites: Favorite[];
  onStarClick: (itemId: string, itemType: 'meter' | 'element') => void;
  onMeterClick: (meterId: string) => void;
  onElementClick: (element: Element) => void;
}
```

**Rendering Logic**:
- If favorites is empty, display "No favorites yet"
- Otherwise, render each favorite with appropriate icon and name
- Favorites maintain insertion order

### AllActiveMetersSection (Presentational Component)

**Responsibilities**:
- Display all active meters
- Manage meter expansion and element display

**Props**:
```typescript
interface AllActiveMetersSectionProps {
  meters: Meter[];
  expandedMeters: Set<string>;
  favorites: Favorite[];
  onMeterToggle: (meterId: string) => void;
  onStarClick: (itemId: string, itemType: 'meter' | 'element') => void;
  onElementClick: (element: Element) => void;
}
```

### MeterItem (Container Component)

**Responsibilities**:
- Display meter with star icon and expansion control
- Show elements when expanded

**Props**:
```typescript
interface MeterItemProps {
  meter: Meter;
  isExpanded: boolean;
  isFavorite: boolean;
  elements: Element[];
  onToggle: (meterId: string) => void;
  onStarClick: (meterId: string) => void;
  onElementClick: (element: Element) => void;
}
```

### MeterElementItem (Presentational Component)

**Responsibilities**:
- Display element with star icon
- Format element name as "element-element_name"

**Props**:
```typescript
interface MeterElementItemProps {
  element: Element;
  isFavorite: boolean;
  onStarClick: (elementId: string) => void;
  onClick: (element: Element) => void;
}
```

### ReadingsGridPanel (Container Component)

**Responsibilities**:
- Display meter readings in a data grid
- Show context (meter name, element name)
- Handle loading and error states

**Props**:
```typescript
interface ReadingsGridPanelProps {
  element: Element;
  meter: Meter;
  readings: MeterReading[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}
```

**Columns**:
- Timestamp: ISO 8601 formatted date/time
- Value: Numeric reading value
- Unit: Measurement unit (e.g., kWh, m³)

## Data Models

### Meter
```typescript
interface Meter {
  id: string;
  name: string;
  active: boolean;
  elements: Element[];
}
```

### Element
```typescript
interface Element {
  id: string;
  meterId: string;
  name: string;
}
```

### Favorite
```typescript
interface Favorite {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'meter' | 'element';
  createdAt: Date;
}
```

### MeterReading
```typescript
interface MeterReading {
  id: string;
  elementId: string;
  timestamp: Date;
  value: number;
  unit: string;
}
```

### ExpandedState (Local Storage)
```typescript
interface ExpandedState {
  expandedMeters: string[];
  lastUpdated: Date;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Favorites Display Completeness
*For any* set of favorited meters and elements, all favorites should appear in the Favorites section when the sidebar loads.
**Validates: Requirements 1.3, 6.4**

### Property 2: Favorites Maintain Insertion Order
*For any* sequence of items marked as favorites, the Favorites section should display them in the order they were favorited.
**Validates: Requirements 1.4**

### Property 3: Favorite Removal Completeness
*For any* favorite item, when it is removed from favorites, it should no longer appear in the Favorites section.
**Validates: Requirements 1.5, 3.3**

### Property 4: Active Meters Display Completeness
*For any* set of active meters, all active meters should appear in the All Active Meters section.
**Validates: Requirements 2.2**

### Property 5: Inactive Meters Exclusion
*For any* meter that becomes inactive, it should be removed from the All Active Meters section.
**Validates: Requirements 2.3**

### Property 6: Meter Display Consistency
*For any* meter displayed in the sidebar, it should have both a name and a star icon visible.
**Validates: Requirements 2.4**

### Property 7: Star Icon Toggle State
*For any* meter or element, clicking the outline star should fill it and mark the item as favorite, and clicking the filled star should outline it and remove the item from favorites.
**Validates: Requirements 3.2, 3.3**

### Property 8: Favorite Persistence to Database
*For any* item marked as favorite, a corresponding record should exist in the favorites table.
**Validates: Requirements 3.4, 6.3**

### Property 9: Favorite Deletion from Database
*For any* favorite item removed, the corresponding record should be deleted from the favorites table.
**Validates: Requirements 3.5, 6.3**

### Property 10: Meter Expansion Display
*For any* meter, when clicked, it should expand and display all its elements indented below.
**Validates: Requirements 4.1**

### Property 11: Element Name Formatting
*For any* element displayed in the sidebar, its name should be formatted as "element-element_name".
**Validates: Requirements 4.2, 8.1, 8.3**

### Property 12: Meter Collapse Toggle
*For any* expanded meter, clicking it again should collapse it and hide its elements.
**Validates: Requirements 4.3**

### Property 13: Expanded State Visual Indicator
*For any* expanded meter, a visual indicator (chevron icon) should be displayed showing the expanded state.
**Validates: Requirements 4.4**

### Property 14: Expanded State Persistence
*For any* meter expanded by the user, when the sidebar reloads, that meter should remain expanded.
**Validates: Requirements 4.5, 6.1, 6.2**

### Property 15: Readings Grid Display Completeness
*For any* element clicked, all meter readings for that element should be fetched and displayed in the data grid.
**Validates: Requirements 5.1, 5.2**

### Property 16: Readings Grid Context Display
*For any* readings grid displayed, the element name and meter name should be shown as context.
**Validates: Requirements 5.3, 8.2**

### Property 17: Readings Grid Close Navigation
*For any* open readings grid, clicking the close button should hide the grid and return to the meter list.
**Validates: Requirements 5.4**

### Property 18: Readings Data Formatting
*For any* meter readings displayed, they should be formatted using the dataGridIntegration utility with columns for timestamp, value, and unit.
**Validates: Requirements 5.5**

### Property 19: Loading Indicator Display
*For any* data fetch operation (meters or readings), a loading indicator should be displayed while data is being fetched.
**Validates: Requirements 7.1, 7.2**

### Property 20: Error Message Display
*For any* failed data fetch operation, an error message should be displayed to the user.
**Validates: Requirements 7.3, 7.4**

### Property 21: Error Recovery Option
*For any* error state, a retry button should be available to allow the user to retry the failed operation.
**Validates: Requirements 7.5**

### Property 22: Expanded State Reset on Storage Clear
*When* local storage is cleared, the sidebar should reset to the default state with no expanded meters.
**Validates: Requirements 6.5**

## Error Handling

**Meter Loading Errors**:
- Display error message: "Failed to load meters. Please try again."
- Provide retry button that re-calls metersService.getActiveMeters()
- Log error to console for debugging

**Readings Loading Errors**:
- Display error message in readings grid: "Failed to load readings. Please try again."
- Provide retry button that re-calls meterReadingService.getReadings()
- Log error to console for debugging

**Favorite Operation Errors**:
- Display toast notification: "Failed to update favorite. Please try again."
- Revert UI state to previous state
- Provide retry option

**Local Storage Errors**:
- If local storage is unavailable, continue without persistence
- Log warning to console
- Expanded state will not persist across page refreshes

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions:

1. **Favorites Section Tests**:
   - Empty favorites displays "No favorites yet" message
   - Favorites display in insertion order
   - Clicking star on favorite removes it from Favorites section

2. **All Active Meters Tests**:
   - All active meters are displayed
   - Inactive meters are not displayed
   - Each meter displays name and star icon

3. **Meter Expansion Tests**:
   - Clicking meter expands it and shows elements
   - Clicking expanded meter collapses it
   - Expanded meter displays chevron icon
   - Elements are indented below meter

4. **Element Display Tests**:
   - Element names are formatted as "element-element_name"
   - Elements display star icon
   - Clicking element opens readings grid

5. **Readings Grid Tests**:
   - Readings grid displays with correct columns (timestamp, value, unit)
   - Element name and meter name are shown as context
   - Close button hides grid and returns to meter list
   - Loading indicator displays while fetching
   - Error message displays on fetch failure
   - Retry button is available on error

6. **State Persistence Tests**:
   - Expanded meters are saved to local storage
   - Expanded meters are restored from local storage on reload
   - Favorites are saved to database
   - Favorites are loaded from database on reload
   - Local storage clear resets expanded state

### Property-Based Testing

Property-based tests verify universal properties across all inputs using randomization:

1. **Property 1: Favorites Display Completeness** - Generate random favorites, verify all appear in Favorites section
2. **Property 2: Favorites Maintain Insertion Order** - Add favorites in sequence, verify order is maintained
3. **Property 3: Favorite Removal Completeness** - Add favorite, remove it, verify it's gone
4. **Property 4: Active Meters Display Completeness** - Generate random active meters, verify all appear
5. **Property 5: Inactive Meters Exclusion** - Mark meter inactive, verify it's removed
6. **Property 6: Meter Display Consistency** - Verify all meters have name and star icon
7. **Property 7: Star Icon Toggle State** - Click star, verify state changes correctly
8. **Property 8: Favorite Persistence to Database** - Mark favorite, verify database record exists
9. **Property 9: Favorite Deletion from Database** - Remove favorite, verify database record is deleted
10. **Property 10: Meter Expansion Display** - Click meter, verify elements appear indented
11. **Property 11: Element Name Formatting** - Verify all elements follow "element-element_name" format
12. **Property 12: Meter Collapse Toggle** - Expand meter, click again, verify it collapses
13. **Property 13: Expanded State Visual Indicator** - Verify expanded meters display chevron
14. **Property 14: Expanded State Persistence** - Expand meter, reload, verify it's still expanded
15. **Property 15: Readings Grid Display Completeness** - Click element, verify all readings appear
16. **Property 16: Readings Grid Context Display** - Verify element and meter names are shown
17. **Property 17: Readings Grid Close Navigation** - Close grid, verify meter list is shown
18. **Property 18: Readings Data Formatting** - Verify readings have timestamp, value, unit columns
19. **Property 19: Loading Indicator Display** - Verify loading indicator appears during fetch
20. **Property 20: Error Message Display** - Simulate error, verify message appears
21. **Property 21: Error Recovery Option** - Verify retry button is available on error
22. **Property 22: Expanded State Reset on Storage Clear** - Clear storage, verify no expanded meters

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: sidebar-favorites-meter-readings, Property N: [property_text]`
- Use fast-check or similar library for property generation
- Generate random meters, elements, favorites, and readings

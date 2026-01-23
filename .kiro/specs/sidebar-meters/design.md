# Design Document: Sidebar Meters Section

## Overview

The Sidebar Meters Section is a new navigation component that displays all meters and meter elements in a hierarchical tree structure. Users can expand/collapse meters to view their elements, click to view readings in a data grid, and mark items as favorites for quick access. The feature integrates with the existing data grid schema and persists user preferences to the database.

## Architecture

### Component Hierarchy

```
SidebarMetersSection (Container)
├── MetersList (List Container)
│   ├── FavoriteMeterItem (Meter - Favorite)
│   │   └── MeterElementsList (Collapsible)
│   │       ├── FavoriteMeterElementItem
│   │       └── MeterElementItem
│   └── MeterItem (Meter - Non-Favorite)
│       └── MeterElementsList (Collapsible)
│           ├── MeterElementItem
│           └── MeterElementItem
└── FavoritesManager (Service)
```

### Data Flow

1. **Sidebar Load**: Component fetches all meters for current tenant
2. **Favorites Load**: Fetch user's favorites from database
3. **Merge & Sort**: Combine meters with favorite status, sort with favorites first
4. **Render Tree**: Display hierarchical structure with expand/collapse
5. **User Interaction**: Click meter/element → Load readings → Update data grid
6. **Favorite Toggle**: Click favorite button → Update database → Reorder list

## Components and Interfaces

### SidebarMetersSection Component

**Purpose**: Main container component that manages the sidebar section

**Props**:
- `tenantId: string` - Current tenant identifier
- `userId: string` - Current user identifier
- `onMeterSelect: (meterId: string) => void` - Callback when meter is selected
- `onMeterElementSelect: (meterId: string, elementId: string) => void` - Callback when element is selected

**State**:
- `meters: Meter[]` - List of all meters for tenant
- `favorites: Favorite[]` - User's favorite items
- `expandedMeters: Set<string>` - Set of expanded meter IDs
- `selectedItem: {type: 'meter' | 'element', meterId: string, elementId?: string}` - Currently selected item
- `loading: boolean` - Loading state

**Methods**:
- `loadMeters()` - Fetch meters from API
- `loadFavorites()` - Fetch user's favorites from API
- `toggleMeterExpanded(meterId: string)` - Toggle meter expansion
- `selectMeter(meterId: string)` - Select meter and trigger callback
- `selectMeterElement(meterId: string, elementId: string)` - Select element and trigger callback
- `toggleFavorite(meterId: string, elementId?: string)` - Toggle favorite status

### MeterItem Component

**Purpose**: Renders a single meter with expand/collapse and favorite toggle

**Props**:
- `meter: Meter` - Meter data
- `isFavorite: boolean` - Whether meter is favorited
- `isExpanded: boolean` - Whether meter is expanded
- `isSelected: boolean` - Whether meter is currently selected
- `onExpand: () => void` - Callback to toggle expansion
- `onSelect: () => void` - Callback when meter is clicked
- `onFavoriteToggle: () => void` - Callback when favorite button is clicked

**Renders**:
- Favorite indicator (star icon if favorited)
- Meter name
- Expand/collapse arrow
- Favorite toggle button (on hover)
- Child MeterElementsList if expanded

### MeterElementItem Component

**Purpose**: Renders a single meter element

**Props**:
- `element: MeterElement` - Element data
- `meterId: string` - Parent meter ID
- `isFavorite: boolean` - Whether element is favorited
- `isSelected: boolean` - Whether element is currently selected
- `onSelect: () => void` - Callback when element is clicked
- `onFavoriteToggle: () => void` - Callback when favorite button is clicked

**Renders**:
- Favorite indicator (star icon if favorited)
- Element name
- Favorite toggle button (on hover)

### FavoritesService

**Purpose**: Manages favorite operations and database persistence

**Methods**:
- `getFavorites(tenantId: string, userId: string): Promise<Favorite[]>` - Fetch user's favorites
- `addFavorite(tenantId: string, userId: string, meterId: string, elementId?: string): Promise<Favorite>` - Add favorite
- `removeFavorite(tenantId: string, userId: string, meterId: string, elementId?: string): Promise<void>` - Remove favorite
- `isFavorite(favorites: Favorite[], meterId: string, elementId?: string): boolean` - Check if item is favorited

### MetersService

**Purpose**: Manages meter data operations

**Methods**:
- `getMetersForTenant(tenantId: string): Promise<Meter[]>` - Fetch all meters for tenant
- `getMeterElements(meterId: string): Promise<MeterElement[]>` - Fetch elements for a meter
- `getMeterReadings(meterId: string, limit?: number): Promise<MeterReading[]>` - Fetch readings for meter
- `getMeterElementReadings(meterId: string, elementId: string, limit?: number): Promise<MeterReading[]>` - Fetch readings for element

## Data Models

### Meter

```typescript
interface Meter {
  id: string
  tenantId: string
  name: string
  description?: string
  createdDate: Date
  updatedDate: Date
}
```

### MeterElement

```typescript
interface MeterElement {
  id: string
  meterId: string
  name: string
  description?: string
  createdDate: Date
  updatedDate: Date
}
```

### Favorite

```typescript
interface Favorite {
  favorite_id: number
  tenant_id: number
  users_id: number
  meter_id: number
  meter_element_id: number // 0 for meter-only favorites
}
```

**Note**: The favorites table already exists in the database with the schema above. The `meter_element_id` field is set to 0 when favoriting a meter without a specific element.

### MeterReading

```typescript
interface MeterReading {
  id: string
  meterId: string
  meterElementId?: string
  value: number
  unit: string
  createdDate: Date
  // Additional fields from existing schema
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: All Tenant Meters Displayed

*For any* tenant, when the sidebar loads, all meters belonging to that tenant should be displayed in the sidebar.

**Validates: Requirements 1.1, 6.1**

### Property 2: Meter Elements Appear When Expanded

*For any* meter with associated elements, when the meter is expanded, all meter elements for that meter should be displayed as child nodes.

**Validates: Requirements 1.2**

### Property 3: Favorites Appear First in List

*For any* list of meters and meter elements, all favorited items should appear before non-favorited items in the rendered list.

**Validates: Requirements 1.3, 5.1, 5.2**

### Property 4: Session State Persistence

*For any* meter that is expanded during a session, the expanded state should be maintained when navigating to other parts of the application and returning to the sidebar.

**Validates: Requirements 1.4**

### Property 5: Selection Highlighting

*For any* meter or meter element that is clicked, the item should display visual highlighting to indicate it is selected.

**Validates: Requirements 1.5**

### Property 6: Meter Readings Sorted Descending

*For any* meter or meter element, when its readings are displayed in the data grid, the readings should be sorted by created_date in descending order (newest first).

**Validates: Requirements 2.1, 2.2**

### Property 7: Grid Updates on Selection Change

*For any* selection change from one meter/element to another, the data grid should update to display the readings for the newly selected item.

**Validates: Requirements 2.4**

### Property 8: Loading Indicator Displayed

*For any* data grid load operation, a loading indicator should be displayed until the readings are fully loaded.

**Validates: Requirements 2.5**

### Property 9: Favorite Toggle Button Appears on Hover

*For any* meter or meter element in the sidebar, when the user hovers over the item, a favorite toggle button should become visible.

**Validates: Requirements 3.1**

### Property 10: Favorite Toggle Moves Item to Top

*For any* non-favorited meter or meter element, when the favorite toggle button is clicked, the item should be marked as favorite and immediately move to the top of its list.

**Validates: Requirements 3.2, 5.3**

### Property 11: Unfavorite Removes from Top

*For any* favorited meter or meter element, when the favorite toggle button is clicked again, the item should be unmarked as favorite and return to its original position in the list.

**Validates: Requirements 3.3, 5.3**

### Property 12: Favorites Persist Across Sessions

*For any* meter or meter element marked as favorite, when the sidebar is refreshed or the user logs out and back in, the item should still be marked as favorite.

**Validates: Requirements 3.4, 4.3**

### Property 13: Favorite Record Created in Database

*For any* meter or meter element marked as favorite, a record should be created in the database with the correct Tenant_ID, Meter_ID, Meter_Element_ID (nullable for meters), and User_ID.

**Validates: Requirements 3.5, 4.1**

### Property 14: Favorite Record Deleted from Database

*For any* favorited meter or meter element that is unfavorited, the corresponding record should be deleted from the database.

**Validates: Requirements 4.2**

### Property 15: Tenant Isolation in Favorites Query

*For any* user in a tenant, when favorites are queried, only favorites belonging to that user and tenant should be returned.

**Validates: Requirements 4.3, 4.5, 6.2**

### Property 16: Tenant Validation on Favorite Creation

*For any* attempt to favorite a meter or element, the system should validate that the meter belongs to the current tenant before persisting the favorite.

**Validates: Requirements 4.4, 6.4**

### Property 17: Favorite Visual Indicator

*For any* favorited meter or meter element, a visual indicator (such as a star icon) should be displayed to show favorite status.

**Validates: Requirements 5.4**

### Property 18: Tenant Isolation in Sidebar Display

*For any* tenant, when the sidebar loads, only meters belonging to that tenant should be displayed.

**Validates: Requirements 6.1**

### Property 19: Tenant Switch Refreshes Sidebar

*For any* user switching from one tenant to another, the sidebar should refresh and display only meters from the new tenant.

**Validates: Requirements 6.3**

### Property 20: Cross-Tenant Access Prevention

*For any* attempt to access a meter from a different tenant, the system should prevent access and display an error message.

**Validates: Requirements 6.5**

## Error Handling

### Scenarios

1. **Meter Load Failure**: If fetching meters fails, display error message and retry button
2. **Favorite Operation Failure**: If favorite toggle fails, revert UI state and show error toast
3. **Readings Load Failure**: If fetching readings fails, display error in data grid
4. **Tenant Validation Failure**: If favorite validation fails, prevent operation and show error
5. **Cross-Tenant Access**: If user attempts to access meter from different tenant, show access denied error

### Error Messages

- "Failed to load meters. Please try again."
- "Failed to update favorite. Please try again."
- "Failed to load readings. Please try again."
- "You do not have access to this meter."
- "An unexpected error occurred. Please refresh the page."

## Testing Strategy

### Unit Tests

Unit tests verify specific examples, edge cases, and error conditions:

- Verify meter list renders with correct structure
- Verify favorite toggle button appears on hover
- Verify expand/collapse functionality works
- Verify selection highlighting applies correctly
- Verify error messages display on failures
- Verify tenant isolation prevents cross-tenant access
- Verify loading indicators appear and disappear

### Property-Based Tests

Property-based tests verify universal properties across all inputs:

- **Property 1**: Generate random meters for a tenant, verify all appear in sidebar
- **Property 3**: Generate mixed favorite/non-favorite items, verify favorites appear first
- **Property 6**: Generate readings with random dates, verify sorted descending
- **Property 12**: Mark favorites, refresh, verify persistence
- **Property 13**: Mark favorite, query database, verify record exists with correct fields
- **Property 15**: Create favorites for different users/tenants, verify isolation
- **Property 18**: Create meters for different tenants, verify only current tenant's meters display
- **Property 20**: Attempt to access meter from different tenant, verify access denied

### Test Configuration

- Minimum 100 iterations per property-based test
- Each property test tagged with: **Feature: sidebar-meters, Property {number}: {property_text}**
- Unit tests focus on UI interactions and error conditions
- Property tests focus on data consistency and business logic

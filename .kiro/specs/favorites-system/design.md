# Design Document: Favorites UI Implementation

## Overview

The Favorites UI Implementation adds interactive star icons to meter elements in the sidebar and displays a dedicated Favorites section. The design leverages existing favorites API endpoints and database table (which includes user_id for user-specific favorites). The implementation focuses on the frontend layer: rendering star icons, handling click events, managing UI state, and synchronizing the Favorites section with user interactions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SidebarMetersSection                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FavoritesSection                                    │   │
│  │  ├─ Favorite Item 1 [★ filled] [element-power]      │   │
│  │  ├─ Favorite Item 2 [★ filled] [element-energy]     │   │
│  │  └─ "No favorites yet" (empty state)                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AllActiveMetersSection                              │   │
│  │  ├─ Meter 1 [▼]                                      │   │
│  │  │  ├─ element-power [★ filled]                      │   │
│  │  │  └─ element-energy [☆ outlined]                   │   │
│  │  └─ Meter 2 [▶]                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │ Star click event                   │ Element click
         │ Element click                      │
         ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│  ├─ Track favorite status per element (user-specific)       │
│  ├─ Handle star icon state updates                          │
│  └─ Sync UI state with API responses                        │
└─────────────────────────────────────────────────────────────┘
         │
         │ API calls (with user_id)
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Existing API Layer                        │
│  ├─ GET /api/favorites (fetch user's favorites)             │
│  ├─ POST /api/favorites (add favorite for user)             │
│  └─ DELETE /api/favorites (remove favorite for user)        │
└─────────────────────────────────────────────────────────────┘
         │
         │ Database operations
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Existing Database                         │
│  ├─ favorite table (tenant_id, users_id, id1=meter_id, id2=meter_element_id, id3, id4, table_name)     │
│  └─ Unique constraint on (tenant_id, users_id, id1, id2)    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. StarIcon Component

```typescript
interface StarIconProps {
  id1: string;  // meter_id
  id2: string;  // meter_element_id
  is_favorited: boolean;
  is_loading: boolean;
  on_click: (e: ClickEvent) => Promise<void>;
}

interface StarIconState {
  is_favorited: boolean;
  is_loading: boolean;
  error: string | null;
}
```

**Responsibilities**:
- Render filled star if is_favorited is true
- Render outlined star if is_favorited is false
- Show loading spinner during operation
- Handle click events with proper event propagation (stop propagation to prevent element click)

### 2. MeterElementItem Component

```typescript
interface MeterElementItemProps {
  id1: string;  // meter_id
  id2: string;  // meter_element_id
  element_name: string;
  is_favorited: boolean;
  on_star_click: (id1: string, id2: string) => Promise<void>;
  on_element_click: (id1: string, id2: string) => void;
}
```

**Responsibilities**:
- Display element name formatted as "element-element_name"
- Render StarIcon component
- Handle element click to display meter readings grid
- Handle star icon click to toggle favorite status

### 3. FavoritesSection Component

```typescript
interface FavoritesSectionProps {
  favorites: Favorite[];
  on_star_click: (id1: string, id2: string) => Promise<void>;
  on_item_click: (id1: string, id2: string) => void;
}

interface Favorite {
  id1: string;  // meter_id
  id2: string;  // meter_element_id
  meter_name: string;
  element_name: string;
  tenant_id: string;
  users_id: string;
}
```

**Responsibilities**:
- Display "Favorites" header
- Show empty state message when no favorites
- Render each favorite item with meter name and element name
- Handle star icon clicks to remove favorites
- Handle item clicks to display meter readings grid

### 4. SidebarMetersSection Component (Updated)

```typescript
interface SidebarMetersSectionState {
  meters: Meter[];
  favorites: Map<string, Favorite>;  // Key: "id1:id2"
  tenant_id: string;
  users_id: string;
  loading: boolean;
  error: string | null;
}
```

**Key Methods**:
- `load_favorites()`: Fetch all favorites for logged-in user from API
- `toggle_favorite(id1, id2)`: Add or remove favorite via API
- `is_favorited(id1, id2)`: Check if element is in user's favorites
- `on_element_click(id1, id2)`: Display meter readings grid

## Data Models

### Favorite Record (from existing table)

```typescript
type Favorite = {
  tenant_id: string;
  users_id: string;
  id1: string;  // meter_id
  id2: string;  // meter_element_id
  id3: string | null;
  id4: string | null;
  table_name: "meter";
  created_at: Date;
};
```

### UI Favorite Display

```typescript
type FavoriteDisplay = {
  id1: string;  // meter_id
  id2: string;  // meter_element_id
  meter_name: string;
  element_name: string;
  tenant_id: string;
  users_id: string;
};
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

Before writing the correctness properties, I need to analyze the acceptance criteria for testability. Let me use the prework tool to formalize this analysis.


### Correctness Properties

Based on the acceptance criteria analysis, here are the key properties that must hold for the system:

**Property 1: Star Icon Reflects Favorite Status**
*For any* meter element displayed in the sidebar, the Star_Icon state (filled or outlined) SHALL match the element's favorite status in the user's favorites list.
**Validates: Requirements 1.2, 1.3, 1.5**

**Property 2: Favorites Load on Sidebar Init**
*For any* sidebar initialization, the system SHALL retrieve all favorites for the logged-in user from the favorites API.
**Validates: Requirements 1.4**

**Property 3: Star Click Triggers API Call**
*For any* star icon click on an unfavorited element, the system SHALL call the favorites API to add the item as a favorite for the logged-in user.
**Validates: Requirements 2.1**

**Property 4: UI Updates After Add**
*For any* successful favorite addition, the Star_Icon SHALL immediately transition to filled state without requiring a page refresh.
**Validates: Requirements 2.2**

**Property 5: Star Click Triggers Delete**
*For any* star icon click on a favorited element, the system SHALL call the favorites API to remove the item from the logged-in user's favorites.
**Validates: Requirements 2.3**

**Property 6: UI Updates After Remove**
*For any* successful favorite removal, the Star_Icon SHALL immediately transition to outlined state without requiring a page refresh.
**Validates: Requirements 2.4**

**Property 7: Loading State During Operation**
*For any* star icon click, while the operation is in progress, the Star_Icon SHALL display a loading state.
**Validates: Requirements 2.5**

**Property 8: Element Click Displays Grid**
*For any* meter element click (not on the star icon), the system SHALL display the meter reading data grid for that element.
**Validates: Requirements 2.6, 5.3**

**Property 9: Favorites Section Displays All User Favorites**
*For any* set of user favorites, all favorites SHALL appear in the Favorites section when the sidebar loads.
**Validates: Requirements 4.2**

**Property 10: Favorites Section Updates on Add**
*For any* favorite added by the user, the Favorites section SHALL update to include the newly favorited item immediately.
**Validates: Requirements 4.4, 6.1**

**Property 11: Favorites Section Updates on Remove**
*For any* favorite removed by the user, the Favorites section SHALL update to remove the unfavorited item immediately.
**Validates: Requirements 4.5, 6.2**

**Property 12: Favorite Item Display Format**
*For any* favorited meter element displayed in the Favorites section, the element name SHALL be formatted as "element-element_name" and both meter name and element name SHALL be visible.
**Validates: Requirements 5.1, 5.2**

**Property 13: Star Icon Updates in Meter Section**
*For any* favorite added or removed from the Favorites section, the corresponding star icon in the meter elements section SHALL update immediately to reflect the new favorite status.
**Validates: Requirements 6.3, 6.4**

## Error Handling

The system implements comprehensive error handling for favorite operations:

1. **Add Favorite Failures**: When adding a favorite fails:
   - Display user-friendly error message
   - Keep star icon in outlined state
   - Provide retry option
   - Log error details for debugging

2. **Remove Favorite Failures**: When removing a favorite fails:
   - Display user-friendly error message
   - Keep star icon in filled state
   - Provide retry option
   - Log error details for debugging

3. **Load Favorites Failures**: When loading favorites on sidebar initialization fails:
   - Display error notification
   - Assume no favorites (safe default)
   - Allow user to retry

4. **Network Errors**: When API calls fail:
   - Implement retry logic
   - Display temporary error state
   - Revert UI state if operation ultimately fails

## Testing Strategy

### Unit Testing

Unit tests verify specific examples and edge cases:

1. **Star Icon Component Tests**: Test star icon rendering with different favorite states
2. **MeterElementItem Tests**: Test element display and click handling
3. **FavoritesSection Tests**: Test empty state and favorite item rendering
4. **Error Handling Tests**: Test error messages and UI state preservation on failures

### Property-Based Testing

Property-based tests verify universal properties across all inputs:

1. **Star Icon State Property**: Generate random elements and verify star icon state matches favorite status
2. **Favorites Load Property**: Generate random favorites and verify all are loaded on init
3. **Add/Remove Round Trip**: Generate random elements, add as favorite, remove, verify state returns to original
4. **Favorites Section Completeness**: Generate random favorites and verify all appear in Favorites section
5. **Real-time Sync Property**: Generate random add/remove operations and verify UI updates immediately

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with feature name and property number
- Tag format: `Feature: favorites-system, Property {number}: {property_text}`
- Both unit and property tests required for comprehensive coverage

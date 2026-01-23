# Design Document: Meter Readings Grid Loading

## Overview

This design addresses the meter readings grid loading issue by establishing a clear data flow from meter element selection through to grid display. The solution ensures that when a user clicks a meter element in the sidebar, the selected meter and element information flows through the context system to the grid, which then fetches and displays the appropriate readings.

The key insight is that the current implementation has the data flow partially in place but lacks proper synchronization between context updates and data fetching. The fix involves:

1. **Synchronizing context updates with navigation** - Ensure context is updated before navigation occurs
2. **Triggering data fetch on context changes** - Make the store respond to context changes
3. **Filtering data based on context** - Apply client-side filtering to match selected meter/element
4. **Preventing unnecessary re-renders** - Use proper memoization and dependency management

## Architecture

### Data Flow Diagram

```
User clicks meter element in sidebar
    ↓
SidebarMetersSection.onMeterElementSelect()
    ↓
AppLayoutWrapper updates MeterSelectionContext
    ↓
AppLayoutWrapper navigates to /meter-readings
    ↓
MeterReadingManagementPage mounts
    ↓
MeterReadingManagementPage fetches all readings
    ↓
MeterReadingList reads from context
    ↓
MeterReadingList filters data based on selectedMeter/selectedElement
    ↓
Grid displays filtered readings
```

### Component Interaction

```
AppLayoutWrapper
├── MeterSelectionContext (provides selectedMeter, selectedElement)
├── SidebarMetersSection (updates context on meter element click)
└── MeterReadingManagementPage
    └── MeterReadingList
        ├── Reads from MeterSelectionContext
        ├── Reads from useMeterReadings store
        └── Filters and displays data
```

## Components and Interfaces

### 1. MeterSelectionContext

The context stores the currently selected meter and element. No changes needed to the interface, but the usage pattern is critical.

```typescript
interface MeterSelectionContextType {
  selectedMeter: string | null;
  selectedElement: string | null;
  setSelectedMeter: (meterId: string | null) => void;
  setSelectedElement: (elementId: string | null) => void;
  clearSelection: () => void;
}
```

### 2. MeterReadingManagementPage

Fetches readings on mount and re-fetches when selection changes.

### 3. MeterReadingList

Filters fetched readings based on selected meter/element from context.

### 4. AppLayoutWrapper

Updates context synchronously before navigation.

### 5. MeterReadingsStore

Supports fetching all readings with optional filtering.

## Data Models

### MeterReading

```typescript
interface MeterReading {
  tenantid: string;
  id: string;
  meterId: string;
  meterElementId?: string;
  timestamp: string | Date;
  kWh?: number | null;
  kW?: number | null;
  V?: number | null;
  A?: number | null;
  quality?: 'good' | 'estimated' | 'questionable' | null;
  [key: string]: any;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.


### Property 1: Selected Meter Persists Through Navigation

*For any* meter element selection in the sidebar, after navigation to the meter readings page, the selected meter and element should be available in the MeterSelectionContext.

**Validates: Requirements 1.2, 1.4**

### Property 2: Page Title Reflects Selected Meter

*For any* selected meter and element, the MeterReadingManagementPage title should display the selected meter ID and element ID.

**Validates: Requirements 1.3**

### Property 3: Grid Filters by Selected Meter

*For any* set of meter readings and any selected meter, the grid should only display readings where the meterId matches the selected meter.

**Validates: Requirements 2.1, 2.3, 3.1**

### Property 4: Grid Filters by Selected Element

*For any* set of meter readings, selected meter, and selected element, the grid should only display readings where both meterId and meterElementId match the selected values.

**Validates: Requirements 2.1, 2.3, 3.1**

### Property 5: Empty State When No Meter Selected

*For any* meter readings page load without a selected meter, the grid should display an empty state message indicating no meter is selected.

**Validates: Requirements 2.4, 3.3**

### Property 6: Loading State During Data Fetch

*For any* meter element selection that triggers a data fetch, the grid should display a loading indicator while data is being fetched.

**Validates: Requirements 2.5**

### Property 7: Context Changes Trigger Re-fetch

*For any* change to the selected meter or element in MeterSelectionContext, the grid should re-fetch data with the new filter values.

**Validates: Requirements 3.2**

### Property 8: Context Persists Across Navigation

*For any* selected meter and element, navigating away and returning to the meter readings page should preserve the selection in context.

**Validates: Requirements 3.4**

### Property 9: TenantId Included in API Requests

*For any* API request to fetch meter readings, the request should include the tenantId parameter.

**Validates: Requirements 5.1, 5.2**

### Property 10: Returned Data Belongs to Correct Tenant

*For any* API response containing meter readings, all returned readings should have a tenantId matching the current user's tenant.

**Validates: Requirements 5.4**

### Property 11: Error Message on API Failure

*For any* failed API request, the grid should display an error message with details about the failure.

**Validates: Requirements 6.1**

### Property 12: Retry Option Available on Error

*For any* error state in the grid, a retry button should be available to re-attempt the data fetch.

**Validates: Requirements 6.4**

### Property 13: Sidebar State Preserved on Navigation

*For any* navigation from sidebar to meter readings page, the expanded/collapsed state of meter sections should be preserved when returning to the sidebar.

**Validates: Requirements 4.4**

## Error Handling

### API Request Failures

**Scenario**: API request to fetch meter readings fails

**Handling**:
1. Store captures error in state
2. Grid displays error message with failure details
3. Retry button is provided to re-attempt fetch
4. User can navigate back to sidebar and try again

### Missing TenantId

**Scenario**: TenantId is not available in user context

**Handling**:
1. API request is prevented
2. Error message is displayed: "Unable to load meter readings - tenant information missing"
3. User is prompted to log out and log back in

### Invalid Meter Selection

**Scenario**: Selected meter no longer exists or user lacks permissions

**Handling**:
1. API returns 404 or 403 error
2. Grid displays appropriate message
3. Selection is cleared from context
4. User is prompted to select a different meter

### No Readings Found

**Scenario**: Selected meter/element has no readings

**Handling**:
1. API returns empty array
2. Grid displays empty state message
3. No error is shown (this is normal operation)

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **Context Updates**: Verify that setSelectedMeter and setSelectedElement update context correctly
2. **Navigation**: Verify that clicking a meter element triggers navigation to /meter-readings
3. **Empty State**: Verify that empty state message is shown when no meter is selected
4. **Error Display**: Verify that error messages are displayed when API fails
5. **Retry Functionality**: Verify that retry button re-attempts the fetch

### Property-Based Tests

Property-based tests verify universal properties across all inputs:

1. **Property 1**: Selected meter persists through navigation
2. **Property 3**: Grid filters by selected meter (for all meter readings)
3. **Property 4**: Grid filters by selected element (for all meter readings)
4. **Property 7**: Context changes trigger re-fetch
5. **Property 9**: TenantId included in all API requests
6. **Property 10**: All returned data belongs to correct tenant
7. **Property 12**: Retry option available on error

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with feature name and property number
- Tag format: `Feature: meter-readings-grid-loading, Property N: [property description]`
- Mock API responses to test various scenarios
- Use React Testing Library for component tests
- Use fast-check or similar for property-based testing

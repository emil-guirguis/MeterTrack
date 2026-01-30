# Design Document: Reports Module Multiple Render Fix

## Overview

The Reports module experiences excessive re-renders when navigating to the Reports page due to the initialization effect in the `useBaseList` hook running multiple times. The root cause is that the effect depends on `memoizedFilterDefinitions`, which changes frequently even though the actual filter definitions haven't changed semantically.

The fix involves restructuring the initialization effect to depend only on values that truly indicate a fresh mount (using a ref-based approach or a separate initialization flag), rather than depending on `memoizedFilterDefinitions`. This ensures the initialization logic runs exactly once per component mount, preventing unnecessary API calls and render cycles.

## Architecture

### Current Problem

The current implementation has this initialization effect:

```typescript
useEffect(() => {
  const hasActiveFilter = memoizedFilterDefinitions.some(f => f.key === 'active');
  
  if (Object.keys(filters).length > 0) {
    return;
  }
  
  if (hasActiveFilter) {
    const defaultFilters = { active: 'true' };
    setFiltersState(defaultFilters);
    
    if (store.setFilters) {
      store.setFilters(defaultFilters);
    }
    if (store.fetchItems) {
      (store.fetchItems as any)({ _bypassCache: true });
    }
  } else {
    if (store.fetchItems) {
      store.fetchItems();
    }
  }
}, [memoizedFilterDefinitions]);
```

**Problem**: The dependency array includes `memoizedFilterDefinitions`, which changes whenever the parent component re-renders, even if the actual filter definitions haven't changed. This causes the effect to run repeatedly.

### Solution Approach

Use a ref-based initialization flag to track whether the hook has already been initialized. This approach:

1. Maintains the same initialization logic
2. Ensures it runs only once per component mount
3. Doesn't depend on `memoizedFilterDefinitions` in the dependency array
4. Allows re-initialization when the component is unmounted and remounted
5. Preserves all existing behavior for filter application

### Implementation Strategy

1. Create a `useRef` to track initialization state
2. Move the initialization logic into an effect with an empty dependency array
3. Check the ref to ensure initialization runs only once
4. Keep the existing filter application effect unchanged
5. Ensure the ref is properly scoped to each component instance

## Components and Interfaces

### Modified useBaseList Hook

**Key Changes**:
- Add `initializationRef` using `useRef(false)` to track if initialization has occurred
- Create a new initialization effect with empty dependency array `[]`
- Inside the effect, check `initializationRef.current` before running initialization
- Set `initializationRef.current = true` after initialization completes
- Keep the existing filter application effect unchanged

**Effect Structure**:

```typescript
// Initialization effect - runs once per mount
useEffect(() => {
  if (initializationRef.current) {
    return; // Already initialized
  }
  
  initializationRef.current = true;
  
  // Initialization logic here
  const hasActiveFilter = memoizedFilterDefinitions.some(f => f.key === 'active');
  
  if (Object.keys(filters).length > 0) {
    return;
  }
  
  if (hasActiveFilter) {
    const defaultFilters = { active: 'true' };
    setFiltersState(defaultFilters);
    
    if (store.setFilters) {
      store.setFilters(defaultFilters);
    }
    if (store.fetchItems) {
      (store.fetchItems as any)({ _bypassCache: true });
    }
  } else {
    if (store.fetchItems) {
      store.fetchItems();
    }
  }
}, []); // Empty dependency array - runs once per mount

// Filter application effect - unchanged
useEffect(() => {
  // Existing filter application logic
}, [filters]);
```

### Behavior Preservation

- **Initialization**: Still runs once per component mount
- **Default Filter**: Still sets 'active' filter to 'true' if it exists
- **Filter Application**: Still responds to filter changes
- **Filter Clearing**: Still works as before
- **API Calls**: Still maintains the same pattern

## Data Models

No changes to data models. The fix is purely in the hook's effect management.

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Initialization Runs Exactly Once Per Mount

*For any* useBaseList hook instance, the initialization effect should execute exactly once when the component mounts, regardless of how many times the parent component re-renders or filterDefinitions change.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Re-initialization on Remount

*For any* useBaseList hook instance that is unmounted and then remounted, the initialization effect should run again exactly once on the new mount.

**Validates: Requirements 1.4**

### Property 3: Existing Filters Not Overridden

*For any* useBaseList hook instance initialized with filters already set in state, the initialization effect should not override those existing filters with the default 'active' filter.

**Validates: Requirements 1.5, 2.5**

### Property 4: Active Filter Set When Available

*For any* useBaseList hook instance where an 'active' filter exists in filterDefinitions, the initialization effect should set the default filter state to `{ active: 'true' }`.

**Validates: Requirements 2.1, 2.3, 2.4**

### Property 5: Fetch Without Filter When Active Filter Unavailable

*For any* useBaseList hook instance where an 'active' filter does not exist in filterDefinitions, the initialization effect should call `store.fetchItems()` without applying any default filter.

**Validates: Requirements 2.2**

### Property 6: Filter Changes Trigger Store Updates

*For any* filter state change after initialization, the system should call `store.setFilters()` with the updated filters and then call `store.fetchItems()` to fetch the filtered data.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Clear Filters Resets State

*For any* useBaseList hook instance, calling `clearFilters()` should reset the filter state to empty, reset the search query to empty, and call `store.fetchItems()` to fetch all items.

**Validates: Requirements 3.4**

### Property 8: API Call Pattern Consistency

*For any* useBaseList hook instance, the sequence of API calls should remain the same: initialization calls `store.fetchItems()` once, and subsequent filter changes call `store.setFilters()` followed by `store.fetchItems()`.

**Validates: Requirements 4.5**

## Error Handling

### Initialization Errors

- If `store.setFilters` is not available, the initialization will skip calling it but continue with `store.fetchItems()`
- If `store.fetchItems` is not available, the initialization will complete without fetching data
- No errors should be thrown during initialization

### Filter Application Errors

- Existing error handling for filter application remains unchanged
- If `store.setFilters` or `store.fetchItems` fail, the error is handled by the store

### Ref Management

- The `initializationRef` is automatically cleaned up when the component unmounts
- No manual cleanup is required

## Testing Strategy

### Unit Tests

Unit tests should verify specific examples and edge cases:

1. **Initialization with active filter**: Mount hook with active filter in definitions, verify initialization runs once and sets default filter
2. **Initialization without active filter**: Mount hook without active filter, verify initialization runs once and fetches all items
3. **Initialization with existing filters**: Mount hook with filters already set, verify initialization doesn't override them
4. **Filter change after initialization**: Change a filter after initialization, verify store methods are called correctly
5. **Clear filters**: Call clearFilters, verify state is reset and store methods are called
6. **Multiple parent re-renders**: Re-render parent multiple times, verify initialization doesn't run again
7. **Unmount and remount**: Unmount and remount component, verify initialization runs again

### Property-Based Tests

Property-based tests should verify universal properties across many generated inputs:

1. **Property 1 - Initialization Runs Once**: Generate random hook configurations, mount the hook, simulate parent re-renders, verify initialization code runs exactly once
2. **Property 2 - Re-initialization on Remount**: Generate random hook configurations, mount/unmount/remount, verify initialization runs exactly once per mount
3. **Property 3 - Existing Filters Not Overridden**: Generate random initial filters, mount hook, verify filters aren't changed by initialization
4. **Property 4 - Active Filter Set**: Generate random filterDefinitions with 'active' filter, mount hook, verify state contains `{ active: 'true' }`
5. **Property 5 - Fetch Without Filter**: Generate random filterDefinitions without 'active' filter, mount hook, verify fetchItems called without filters
6. **Property 6 - Filter Changes Trigger Updates**: Generate random filter changes, verify store methods called in correct sequence
7. **Property 7 - Clear Filters Resets State**: Generate random filter states, call clearFilters, verify state is empty
8. **Property 8 - API Call Pattern**: Generate random sequences of operations, verify API call pattern remains consistent

### Testing Configuration

- Minimum 100 iterations per property test
- Mock the store to track method calls
- Use React Testing Library for component mounting/unmounting
- Tag each test with: **Feature: reports-module-multiple-render-fix, Property {number}: {property_text}**

### Test Coverage

- All acceptance criteria should be covered by either unit tests or property tests
- Focus on the initialization effect behavior
- Verify no breaking changes to filter application
- Verify no breaking changes to other useBaseList functionality


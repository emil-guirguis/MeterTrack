# Design Document: Contact List Filters

## Overview

The contact list filters feature enables users to narrow down the contact list by selecting values for filterable fields. The system automatically generates filters from the contact schema, manages filter state in the frontend store, and applies filters through API requests to the backend.

The implementation spans three layers:
1. **Schema Layer**: Defines which fields are filterable via `enumValues` and `boolean` type indicators
2. **Frontend Layer**: Generates filter UI, manages filter state, and sends filters to the API
3. **Backend Layer**: Parses filter parameters and applies them to database queries

## Architecture

### Data Flow

```
User selects filter value
    ↓
Filter state updated in store (setFilter)
    ↓
useBaseList detects filter change
    ↓
Store calls setFilters() which resets pagination to page 1
    ↓
fetchItems() is called with current filters
    ↓
API request sent with filter parameters in query string
    ↓
Backend parses filters and applies to database query
    ↓
Filtered results returned to frontend
    ↓
Contact list re-renders with filtered data
```

### Component Interaction

```
ContactList
    ├── useBaseList hook
    │   ├── renderFilters() - generates filter UI
    │   ├── setFilter() - updates filter state
    │   └── clearFilters() - resets all filters
    │
    ├── useContactsEnhanced store
    │   ├── setFilters() - stores filter values
    │   ├── fetchItems() - fetches data with filters
    │   └── list.filters - current filter state
    │
    └── BaseList component
        └── renders filter controls
```

## Components and Interfaces

### Frontend Components

#### 1. Filter Generation (schemaColumnGenerator.ts)

**Current Implementation:**
- `generateFiltersFromSchema()` creates filter definitions from schema fields
- Only includes fields with `enumValues` or `boolean` type
- Only includes fields with `showOn: ['list']`

**Issues to Fix:**
- Filter definitions are created but not properly connected to the store
- Filter values need to be passed to the API

#### 2. Filter State Management (useBaseList.tsx)

**Current Implementation:**
- `filters` state stores current filter values as `Record<string, any>`
- `setFilter(key, value)` updates individual filter values
- `clearFilters()` resets all filters
- `renderFilters()` generates filter UI

**Issues to Fix:**
- Filters are set in store but not passed to API requests
- Need to ensure `fetchItems()` includes filters in query parameters

#### 3. Store Integration (createEntitySlice.ts)

**Current Implementation:**
- `list.filters` stores filter state
- `setFilters()` updates filter state and resets pagination
- `fetchItems()` accepts params but doesn't use stored filters

**Issues to Fix:**
- `fetchItems()` needs to pass `list.filters` to the API service
- API service needs to include filters in query string

### Backend Components

#### 1. Contact Routes (contacts.js)

**Current Implementation:**
- GET `/contacts` endpoint accepts `page`, `limit`, `search`, `active`, `role` parameters
- Only handles specific filter parameters

**Issues to Fix:**
- Need to handle dynamic filter parameters from the schema
- Need to properly parse and apply filters to database queries

#### 2. Filter Application Logic

**Current Implementation:**
- Builds `where` clause with hardcoded filter fields
- Only supports `search`, `active`, and `role` filters

**Issues to Fix:**
- Need to dynamically handle any filterable field from the schema
- Need to properly convert filter values (e.g., string "true" to boolean)

## Data Models

### Filter Definition (from schema)

```typescript
interface FilterDefinition {
  key: string;              // Field name
  label: string;            // Display label
  type: 'select' | 'text' | 'date';
  options?: Array<{
    label: string;
    value: string;
  }>;
  placeholder?: string;
  className?: string;
}
```

### Filter State

```typescript
interface FilterState {
  [key: string]: string | number | boolean | null;
}

// Example:
{
  role: 'Vendor',
  active: 'true'
}
```

### API Query Parameters

```
GET /api/contacts?page=1&limit=25&role=Vendor&active=true
```

## Error Handling

1. **Invalid Filter Values**: Backend should ignore invalid filter values
2. **Missing Filter Fields**: Backend should handle filters for non-existent fields gracefully
3. **Type Mismatches**: Frontend should convert filter values to appropriate types before sending
4. **API Errors**: Frontend should display error messages if filter request fails

## Testing Strategy

### Unit Tests

1. **Filter Generation**
   - Test that filters are generated only for fields with `enumValues` or `boolean` type
   - Test that filters include only fields with `showOn: ['list']`
   - Test that filter options are correctly extracted from schema

2. **Filter State Management**
   - Test that `setFilter()` updates filter state correctly
   - Test that `clearFilters()` resets all filters
   - Test that filter state persists across re-renders

3. **API Integration**
   - Test that filters are included in API request query string
   - Test that API correctly parses filter parameters
   - Test that API applies filters to database query

### Property-Based Tests

1. **Filter Application Consistency**
   - For any set of filters, applying them should return only contacts matching all filter criteria
   - For any contact, if it matches the filter criteria, it should appear in the filtered results

2. **Filter Idempotence**
   - Applying the same filter twice should return the same results
   - Clearing filters and re-applying them should return the same results

3. **Filter Combination**
   - For any two filters, applying them together should return a subset of applying either filter alone
   - The order of applying filters should not affect the results

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Filter Consistency

*For any* set of filter values and any contact in the database, if the contact matches all filter criteria, then the contact should appear in the filtered results.

**Validates: Requirements 3.2, 3.3, 4.3**

### Property 2: Filter Completeness

*For any* set of filter values, all returned contacts should match all applied filters (AND logic).

**Validates: Requirements 3.3, 4.3**

### Property 3: Empty Filter Handling

*For any* filter with an empty or null value, that filter should be ignored and not affect the results.

**Validates: Requirements 3.4**

### Property 4: Filter State Persistence

*For any* filter selection, changing the filter value should trigger a new API request with the updated filter parameters.

**Validates: Requirements 4.1, 4.2**

### Property 5: Filter UI Rendering

*For any* filterable field in the schema, a corresponding filter control should be rendered in the UI with the correct options.

**Validates: Requirements 5.1, 5.2, 5.3**


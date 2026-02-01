# AI Search Feature Fix - Design Document

## Overview

The AI search feature is currently broken despite having both frontend and backend implementations. The search bar appears in the header but returns no results even when devices exist in the database. This design document identifies the root causes and provides a comprehensive fix strategy.

### Current State Analysis

**Frontend (Header.tsx)**:
- Search bar with voice recognition is implemented
- Calls `/api/ai/search` endpoint with query
- Displays results in a dropdown
- Voice recognition setup is complete

**Backend (aiSearch.js)**:
- Route is registered in server.js
- Endpoint accepts POST requests with query parameter
- Performs keyword-based search on devices
- Returns results with relevance scoring

**Issues Identified**:

1. **Search Algorithm Bug**: The `performKeywordSearch` function filters out devices that have no readings (`if (deviceReadings.length === 0) { continue; }`). This causes devices without recent readings to be excluded from results, even if they match the search query.

2. **Token Retrieval Issue**: Frontend uses `localStorage.getItem('auth_token')` or `sessionStorage.getItem('auth_token')`, but the actual token key might be different or not set properly.

3. **Tenant Context**: The endpoint requires `req.tenantId` from middleware, but if authentication fails silently, this will be undefined.

4. **Empty Results Handling**: When no devices exist or all are filtered out, the endpoint returns an empty results array but doesn't provide helpful feedback.

5. **Relevance Scoring**: The scoring algorithm is too strict - it only includes devices with exact keyword matches, missing partial matches and semantic variations.

## Architecture

### Component Interaction Flow

```
User Input (Search Bar)
    ↓
Frontend: handleSearch()
    ↓
POST /api/ai/search
    ↓
Backend: Authenticate & Extract Tenant
    ↓
Query Devices & Meters
    ↓
performKeywordSearch()
    ↓
Return Results
    ↓
Frontend: Display Results
```

### Data Flow

1. **Frontend Search Initiation**:
   - User types in search bar or uses voice recognition
   - `handleSearch()` is called with query string
   - Authorization header is set with auth token
   - POST request sent to `/api/ai/search`

2. **Backend Processing**:
   - Middleware extracts tenant ID from JWT token
   - Query validates input and tenant context
   - Fetches all devices for tenant
   - Fetches all meters for tenant
   - Fetches recent readings (last 30 days)
   - Performs keyword search with scoring
   - Returns top results

3. **Frontend Display**:
   - Results are displayed in dropdown
   - Shows device name, type, location, status
   - Shows current consumption and last reading
   - Limits display to 5 results with "View all" option

## Components and Interfaces

### Frontend Search Handler

```typescript
interface SearchResult {
  id: string;
  name: string;
  type: 'device' | 'meter';
  location: string;
  currentConsumption: number;
  unit: string;
  status: string;
  relevanceScore: number;
  lastReading: {
    value: number;
    timestamp: string;
  };
}

interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    total: number;
    clarifications?: string[];
    executionTime: number;
  };
}
```

### Backend Search Algorithm

**Current Issues**:
- Filters out devices with no readings (too restrictive)
- Only matches exact keywords (too strict)
- Doesn't handle partial matches or variations

**Fixed Algorithm**:
1. Score each device based on keyword matches:
   - Exact name match: +10 points
   - Partial name match: +5 points
   - Type match: +3 points
   - Location match: +2 points
   - Status match: +1 point

2. Include all devices with score > 0 (not just those with readings)

3. For devices without readings, show placeholder data

4. Sort by relevance score descending

5. Apply pagination (limit and offset)

## Data Models

### Device Model
```javascript
{
  id: string,           // device_id from database
  tenantId: string,     // tenant_id
  name: string,         // Device name
  type: string,         // Device type (e.g., "meter", "sensor")
  location: string,     // Physical location
  status: string,       // Current status (active, inactive, error)
  metadata: object      // Additional device metadata
}
```

### Meter Model
```javascript
{
  id: string,           // meter_id
  tenantId: string,     // tenant_id
  deviceId: string,     // Associated device
  name: string,         // Meter name
  unit: string,         // Measurement unit (kWh, etc.)
  type: string          // Meter type
}
```

### Reading Model
```javascript
{
  meterId: string,      // meter_id
  value: number,        // Reading value
  timestamp: string,    // ISO timestamp
  quality: string       // Data quality indicator
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Search Results Relevance
*For any* search query and device database, all returned results should have a relevance score greater than 0 and be sorted in descending order by relevance score.

**Validates**: Search algorithm correctly scores and ranks results

### Property 2: Keyword Matching Consistency
*For any* device with a name containing the search query (case-insensitive), that device should appear in the search results if it has a relevance score > 0.

**Validates**: Search algorithm includes all matching devices

### Property 3: Partial Match Inclusion
*For any* search query, devices with partial keyword matches should be included in results with appropriate relevance scores.

**Validates**: Search algorithm handles partial matches

### Property 4: Device Without Readings Inclusion
*For any* device that matches the search query, that device should be included in results regardless of whether it has recent readings.

**Validates**: Search doesn't filter out valid results

### Property 5: Pagination Correctness
*For any* search query with limit and offset parameters, the returned results should respect the pagination boundaries and not exceed the specified limit.

**Validates**: Pagination works correctly

### Property 6: Tenant Isolation
*For any* search query from a tenant, only devices belonging to that tenant should be included in results.

**Validates**: Multi-tenant data isolation is maintained

### Property 7: Authentication Required
*For any* search request without valid authentication, the endpoint should return a 401 or 403 error.

**Validates**: Unauthorized access is prevented

## Error Handling

### Error Scenarios

1. **Missing Query Parameter**:
   - Status: 400
   - Error Code: `INVALID_QUERY`
   - Message: "Query is required and must be a non-empty string"

2. **Missing Tenant Context**:
   - Status: 400
   - Error Code: `MISSING_TENANT`
   - Message: "Tenant ID is required"

3. **Authentication Failure**:
   - Status: 401
   - Error Code: `UNAUTHORIZED`
   - Message: "Authentication token is invalid or expired"

4. **Database Query Error**:
   - Status: 500
   - Error Code: `INTERNAL_ERROR`
   - Message: "An error occurred while processing your search"
   - Details: (only in development mode)

5. **No Results Found**:
   - Status: 200
   - Response: Empty results array with total: 0
   - Message: "No devices or meters found matching your query"

## Testing Strategy

### Unit Tests

**Search Algorithm Tests**:
- Test exact name matching
- Test partial name matching
- Test type matching
- Test location matching
- Test status matching
- Test scoring calculation
- Test sorting by relevance
- Test pagination with limit and offset
- Test devices without readings are included
- Test empty query handling
- Test special characters in query

**Authentication Tests**:
- Test valid token acceptance
- Test invalid token rejection
- Test missing token rejection
- Test expired token rejection

**Tenant Isolation Tests**:
- Test devices from other tenants are excluded
- Test meters from other tenants are excluded
- Test readings from other tenants are excluded

### Property-Based Tests

**Property 1: Relevance Scoring**
- Generate random devices and search queries
- Verify all results have score > 0
- Verify results are sorted by score descending

**Property 2: Keyword Matching**
- Generate random devices with names
- Generate search queries that match device names
- Verify matching devices appear in results

**Property 3: Partial Matching**
- Generate random device names
- Generate partial search queries
- Verify devices with partial matches are included

**Property 4: No Filtering by Readings**
- Generate random devices without readings
- Search for those devices
- Verify they appear in results

**Property 5: Pagination**
- Generate random devices
- Test various limit and offset combinations
- Verify results respect pagination boundaries

**Property 6: Tenant Isolation**
- Generate devices for multiple tenants
- Search from each tenant
- Verify only that tenant's devices are returned

**Property 7: Authentication**
- Test with valid tokens
- Test with invalid tokens
- Test with missing tokens
- Verify appropriate error responses

### Integration Tests

**End-to-End Search Flow**:
1. Create test devices in database
2. Create test meters for devices
3. Create test readings for meters
4. Perform search from frontend
5. Verify results are displayed correctly
6. Verify voice search works
7. Verify pagination works
8. Verify no results message appears when appropriate

## Implementation Plan

### Phase 1: Fix Search Algorithm
1. Modify `performKeywordSearch()` to include devices without readings
2. Improve keyword matching to handle partial matches
3. Adjust scoring algorithm for better relevance
4. Add support for meter name matching

### Phase 2: Fix Authentication
1. Verify token retrieval in frontend
2. Verify token validation in backend
3. Add better error messages for auth failures
4. Test with different token storage methods

### Phase 3: Add Comprehensive Testing
1. Write unit tests for search algorithm
2. Write property-based tests for correctness
3. Write integration tests for end-to-end flow
4. Add error scenario tests

### Phase 4: Improve User Experience
1. Add loading state during search
2. Add error messages for failed searches
3. Add "no results" message with suggestions
4. Add search history or suggestions

## Known Limitations

1. **Keyword-Only Search**: Current implementation uses keyword matching, not semantic AI search. Full AI integration would require external service.

2. **No Fuzzy Matching**: Typos in search queries won't be handled. Fuzzy matching could be added later.

3. **No Search History**: Search history is not persisted. Could be added to improve UX.

4. **Limited Metadata Search**: Only searches device name, type, location, and status. Could be extended to search metadata fields.

## Success Criteria

- [ ] Search returns results for devices that match the query
- [ ] Search includes devices without recent readings
- [ ] Voice search works correctly
- [ ] Pagination works correctly
- [ ] No results message appears when appropriate
- [ ] Authentication errors are handled gracefully
- [ ] Tenant isolation is maintained
- [ ] All property-based tests pass
- [ ] All unit tests pass
- [ ] End-to-end integration tests pass

# Dashboard Cards Not Displaying - Design

## Overview

This design addresses the issue where dashboard records exist in the database but are not displaying when users log in. The investigation focuses on the complete data flow from database retrieval through frontend rendering, identifying potential breakpoints in the chain.

## Architecture

The dashboard display system consists of three main layers:

1. **Backend API Layer** (`/api/dashboard/cards`)
   - Authenticates user and checks permissions
   - Retrieves dashboard cards filtered by tenant_id
   - Returns paginated results with metadata

2. **Frontend Service Layer** (`dashboardService`)
   - Makes HTTP requests to the API
   - Handles response parsing and error handling
   - Provides data to React components

3. **Frontend UI Layer** (`DashboardPage` component)
   - Fetches cards on component mount
   - Manages card state and layout
   - Renders cards using framework components

## Components and Interfaces

### Backend Components

**Dashboard Model** (`DashboardWithSchema.js`)
- Extends BaseModel with schema definition
- Provides `getByTenant()` static method for tenant-specific queries
- Implements validation for dashboard card data

**Dashboard Routes** (`dashboard.js`)
- `GET /api/dashboard/cards` - Retrieves all cards for authenticated user's tenant
- Extracts tenant_id from `req.user.tenant_id`
- Passes tenant_id to `Dashboard.findAll()` options
- Logs query parameters and results

**BaseModel** (`BaseModel.js`)
- Implements `findAll()` method with automatic tenant filtering
- Checks for `tenant_id` field in model schema
- Applies tenant_id to WHERE clause if available
- Logs tenant filtering operations

### Frontend Components

**DashboardService** (`dashboardService.ts`)
- `getDashboardCards(params)` - Fetches cards from API
- Includes auth token in request headers
- Parses response and returns `DashboardCardResponse`

**DashboardPage** (`DashboardPage.tsx`)
- `fetchCards()` - Calls dashboardService.getDashboardCards()
- Updates `cards` state with returned data
- Calls `fetchCardData()` for each card to get aggregated data
- Renders cards using `ClientDashboardCard` wrapper

## Data Models

### Dashboard Card (Database)
```
{
  dashboard_id: number (PK)
  tenant_id: number (FK) - CRITICAL for filtering
  created_by_users_id: number (FK)
  meter_id: number (FK)
  meter_element_id: number (FK)
  card_name: string
  card_description: string
  selected_columns: JSONB
  time_frame_type: enum
  custom_start_date: date (optional)
  custom_end_date: date (optional)
  visualization_type: enum
  grouping_type: enum
  grid_x: number (optional)
  grid_y: number (optional)
  grid_w: number (optional)
  grid_h: number (optional)
  created_at: timestamp
  updated_at: timestamp
}
```

### API Response Structure
```
{
  success: boolean
  data: {
    items: DashboardCard[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}
```

## Potential Issues and Debugging Points

### Issue 1: Tenant ID Not Being Passed
**Symptom**: Cards exist in database but API returns empty list
**Root Cause**: `req.user.tenant_id` is undefined or null
**Debug Point**: Check if user object has tenant_id after authentication

### Issue 2: Tenant Filtering Not Applied
**Symptom**: Query returns results but they're filtered incorrectly
**Root Cause**: BaseModel.findAll() not applying tenant_id to WHERE clause
**Debug Point**: Check console logs for "TENANT FILTERING APPLIED" message

### Issue 3: Permission Check Failing
**Symptom**: API returns 403 Forbidden
**Root Cause**: User lacks 'dashboard:read' permission
**Debug Point**: Check user.permissions array includes 'dashboard:read'

### Issue 4: Frontend Not Receiving Data
**Symptom**: API returns data but frontend shows empty
**Root Cause**: Response parsing error or state not updating
**Debug Point**: Check browser console for API response and state updates

### Issue 5: Cards Exist But Wrong Tenant
**Symptom**: Cards in database but belong to different tenant
**Root Cause**: Data was created with wrong tenant_id
**Debug Point**: Query database directly to verify tenant_id values

## Error Handling

**API Error Responses**:
- 400: Missing or invalid tenant_id
- 403: Insufficient permissions (missing 'dashboard:read')
- 500: Database query error

**Frontend Error Handling**:
- Catches axios errors and displays user-friendly messages
- Logs full error details to console for debugging
- Displays error state in UI

## Testing Strategy

### Unit Tests

**Backend Tests**:
- Test Dashboard.findAll() with tenant_id filtering
- Test permission middleware with various permission states
- Test API response structure and pagination

**Frontend Tests**:
- Test dashboardService.getDashboardCards() with mock API
- Test DashboardPage.fetchCards() state updates
- Test error handling and display

### Property-Based Tests

**Property 1: Tenant Isolation**
- For any dashboard card, querying with a different tenant_id should not return that card
- Validates: Requirements 3.1, 3.3

**Property 2: Pagination Consistency**
- For any page number and limit, the returned items count should not exceed the limit
- Validates: Requirements 1.2

**Property 3: Response Structure**
- For any successful API response, the data object should contain items, total, page, pageSize, and totalPages
- Validates: Requirements 1.2

**Property 4: Empty Result Handling**
- For any tenant with no dashboard cards, the API should return an empty items array with pagination metadata
- Validates: Requirements 1.4

## Debugging Workflow

1. **Verify Database Data**
   - Query dashboard table directly
   - Check tenant_id values match authenticated user's tenant
   - Verify records exist and are not deleted

2. **Check Backend Logs**
   - Look for "TENANT FILTERING APPLIED" messages
   - Verify tenant_id is being passed to findAll()
   - Check for any database query errors

3. **Test API Endpoint**
   - Call `/api/dashboard/cards` directly with auth token
   - Verify response structure and data
   - Check HTTP status code

4. **Verify Frontend State**
   - Check browser console for API response
   - Verify cards state is being updated
   - Check for any React errors

5. **Check Permissions**
   - Verify user has 'dashboard:read' permission
   - Check user.permissions array in browser console
   - Verify permission middleware is not blocking request

## Implementation Notes

- All tenant filtering is automatic via BaseModel.findAll()
- Permission checks are enforced at route level
- Frontend service handles all API communication
- Error messages should be user-friendly but include technical details in logs
- Logging is critical for debugging - check console output at each step

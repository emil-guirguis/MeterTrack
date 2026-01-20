# Dashboard Cards Not Displaying - Debugging Tasks

## Overview

This task list provides a systematic approach to debugging why dashboard cards are not displaying. Each task focuses on verifying a specific part of the data flow.

## Tasks

- [x] 1. Verify Database Contains Dashboard Records
  - Query the dashboard table directly to confirm records exist
  - Check that records have valid tenant_id values
  - Verify records are not soft-deleted or marked as inactive
  - _Requirements: 2.1_

- [x] 2. Verify User Authentication and Tenant Assignment
  - Check that authenticated user has a valid tenant_id
  - Verify tenant_id is being set in req.user object
  - Log the tenant_id value in the dashboard route
  - _Requirements: 1.1, 3.1_

- [ ] 3. Test Backend API Endpoint Directly
  - Make a direct HTTP request to `/api/dashboard/cards` with auth token
  - Verify the response includes the expected dashboard cards
  - Check response structure matches API contract
  - Verify pagination metadata is present
  - _Requirements: 1.2, 1.3_

- [ ] 4. Verify Tenant Filtering in BaseModel
  - Check that BaseModel.findAll() is applying tenant_id to WHERE clause
  - Verify "TENANT FILTERING APPLIED" log message appears
  - Confirm tenant_id is included in the SQL query
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 5. Verify Permission Checks
  - Confirm user has 'dashboard:read' permission
  - Check that permission middleware is not blocking the request
  - Verify admin users bypass permission checks
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Test Frontend Service API Call
  - Add console logging to dashboardService.getDashboardCards()
  - Verify the API request is being made with correct headers
  - Check the API response is being received correctly
  - Verify response parsing is working
  - _Requirements: 5.1_

- [ ] 7. Verify Frontend State Management
  - Add console logging to DashboardPage.fetchCards()
  - Verify cards state is being updated with API response
  - Check that layout state is being initialized
  - Verify no errors occur during state updates
  - _Requirements: 5.2, 5.3_

- [ ] 8. Check Frontend Rendering Logic
  - Verify ClientDashboardCard component is being rendered
  - Check that cards array is not empty when rendering
  - Verify no React errors in browser console
  - Check that empty state message displays when appropriate
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 9. Verify Data Consistency Across Layers
  - Compare database records with API response
  - Compare API response with frontend state
  - Verify no data is being lost or transformed incorrectly
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 10. Checkpoint - Identify Root Cause
  - Review all debugging logs and findings
  - Identify which layer is failing (database, API, or frontend)
  - Document the specific issue and its cause
  - Ask the user for confirmation before proceeding to fix

## Debugging Checklist

### Database Level
- [ ] Dashboard table exists and has records
- [ ] Records have valid tenant_id values
- [ ] Records are not deleted or inactive
- [ ] Indexes are present for efficient querying

### API Level
- [ ] User is authenticated and has valid tenant_id
- [ ] Tenant_id is being extracted from req.user
- [ ] Tenant_id is being passed to Dashboard.findAll()
- [ ] BaseModel is applying tenant filtering
- [ ] Permission check is passing
- [ ] API response includes expected data

### Frontend Level
- [ ] dashboardService is making correct API request
- [ ] API response is being received and parsed
- [ ] Cards state is being updated
- [ ] Components are rendering with data
- [ ] No React errors in console

## Notes

- All debugging should be done with detailed console logging
- Check browser console (F12) for frontend errors
- Check server console for backend logs
- Verify tenant_id values match between database and authenticated user
- Permission checks are critical - verify 'dashboard:read' permission exists

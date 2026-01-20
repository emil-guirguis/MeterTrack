# Implementation Plan: Dashboard Meter/Element Validation

## Overview

This implementation adds meter and meter element validation to the dashboard card form. The work is organized into backend API endpoints, frontend service methods, and form component updates.

## Tasks

- [x] 1. Create backend API endpoints for meter and element lookup
  - [x] 1.1 Create GET /api/dashboard/meters endpoint
    - Returns all meters for the authenticated user's tenant
    - Filters by tenant_id from authenticated user
    - Returns array of { id, name }
    - _Requirements: 1.1, 5.1_

  - [x] 1.2 Create GET /api/dashboard/meters/:meterId/elements endpoint
    - Returns all meter elements for a specific meter
    - Validates meter belongs to user's tenant
    - Filters elements by meter_id
    - Returns array of { id, name, meter_id }
    - _Requirements: 2.1, 5.2_

  - [ ]* 1.3 Write unit tests for meter/element endpoints
    - Test that endpoints return only tenant's resources
    - Test that endpoints return 403 for unauthorized access
    - Test that endpoints return 404 for non-existent resources
    - _Requirements: 1.1, 2.1_

- [x] 2. Add service methods to fetch meters and elements
  - [x] 2.1 Add getMetersByTenant() method to dashboardService
    - Calls GET /api/dashboard/meters
    - Returns array of { id, name }
    - Handles errors and returns empty array on failure
    - _Requirements: 1.1_

  - [x] 2.2 Add getMeterElementsByMeter(meterId) method to dashboardService
    - Calls GET /api/dashboard/meters/:meterId/elements
    - Returns array of { id, name, meter_id }
    - Handles errors and returns empty array on failure
    - _Requirements: 2.1_

  - [ ]* 2.3 Write unit tests for service methods
    - Test that methods call correct endpoints
    - Test that methods handle API errors gracefully
    - Test that methods return data in expected format
    - _Requirements: 1.1, 2.1_

- [x] 3. Update DashboardCardModal form component
  - [x] 3.1 Load meters on form open
    - Call getMetersByTenant() when form opens
    - Display meters in dropdown selector
    - Show loading indicator while fetching
    - Display error message if fetch fails
    - _Requirements: 1.1_

  - [x] 3.2 Add meter selection change handler
    - When meter is selected, call getMeterElementsByMeter(meterId)
    - Filter meter elements to show only those for selected meter
    - Clear meter element selection when meter changes
    - Show loading indicator while fetching elements
    - _Requirements: 2.1_

  - [x] 3.3 Add meter validation
    - Validate that meter_id is selected before form submission
    - Display error "Meter is required" if not selected
    - Clear error when user selects a meter
    - _Requirements: 1.2, 1.3_

  - [x] 3.4 Add meter element validation
    - Validate that meter_element_id is selected before form submission
    - Validate that selected element belongs to selected meter
    - Display error "Meter element is required" if not selected
    - Display error "Selected meter element does not belong to the selected meter" if relationship is invalid
    - Clear errors when user corrects selection
    - _Requirements: 2.2, 2.3_

  - [ ]* 3.5 Write unit tests for form component
    - Test that meters are loaded on form open
    - Test that meter elements are filtered when meter is selected
    - Test that validation errors display correctly
    - Test that form submission is blocked with validation errors
    - Test that error messages clear when user corrects selections
    - _Requirements: 1.1, 2.1, 1.3, 2.3_

- [x] 4. Update backend dashboard card creation/update validation
  - [x] 4.1 Enhance POST /api/dashboard/cards validation
    - Validate meter_id exists and belongs to tenant
    - Validate meter_element_id exists and belongs to tenant
    - Validate meter_element_id belongs to meter_id
    - Return 400 with descriptive error if validation fails
    - _Requirements: 1.2, 2.2, 2.4_

  - [x] 4.2 Enhance PUT /api/dashboard/cards/:id validation
    - Validate meter_id if provided and different from current
    - Validate meter_element_id if provided and different from current
    - Validate meter_element_id belongs to meter_id
    - Return 400 with descriptive error if validation fails
    - _Requirements: 1.2, 2.2, 2.4_

  - [ ]* 4.3 Write unit tests for dashboard card validation
    - Test that invalid meter_id is rejected
    - Test that invalid meter_element_id is rejected
    - Test that mismatched meter-element relationship is rejected
    - Test that valid selections are accepted
    - _Requirements: 1.2, 2.2, 2.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure no console errors or warnings
  - Ask the user if questions arise

- [ ] 6. Write property-based tests
  - [ ] 6.1 Write property test for valid meter selection acceptance
    - **Property 1: Valid Meter Selection Acceptance**
    - Generate random valid meter IDs from database
    - Verify form accepts them without validation errors
    - _Requirements: 1.2_

  - [ ] 6.2 Write property test for invalid meter submission rejection
    - **Property 2: Invalid Meter Submission Rejection**
    - Generate random invalid meter IDs
    - Verify form submission is rejected
    - _Requirements: 1.4_

  - [ ] 6.3 Write property test for meter element filtering
    - **Property 3: Meter Element Filtering by Meter**
    - Generate random meter IDs
    - Verify all returned elements have matching meter_id
    - _Requirements: 2.1_

  - [ ] 6.4 Write property test for meter element relationship validation
    - **Property 4: Meter Element Relationship Validation**
    - Generate random meter-element pairs
    - Verify validation correctly identifies valid vs invalid relationships
    - _Requirements: 2.2, 2.4_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all property-based tests pass
  - Ensure all unit tests still pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

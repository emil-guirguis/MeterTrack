# Implementation Plan: Meter Location Validation

- [x] 1. Enhance auth service to fetch locations on login











  - Update `client/frontend/src/services/authService.ts`
  - After successful login, fetch locations from `/api/location?filter.tenant_id=<tenant_id>`
  - Return locations along with auth token and user data
  - Handle location fetch errors gracefully (don't block login)
  - _Requirements: 1.1, 1.2_

- [ ]* 1.1 Write property test for locations loaded at login
  - **Feature: meter-location-validation, Property 6: Locations Loaded at Login**
  - **Validates: Requirements 1.1, 1.2**



- [x] 2. Enhance auth context to store locations





  - Update `client/frontend/src/contexts/AuthContext.tsx`
  - Add locations state to auth context
  - Add `getLocationsByTenant(tenantId)` method
  - Store locations in context after login
  - Clear locations on logout
  - Update locations when tenant changes
  - _Requirements: 1.1, 1.2_

- [ ]* 2.1 Write property test for cache cleared on logout
  - **Feature: meter-location-validation, Property 7: Cache Cleared on Logout**
  - **Validates: Requirements 1.1, 1.2**



- [x] 3. Enhance useValidationFieldOptions hook to use auth context






  - Update `framework/frontend/components/form/hooks/useValidationFieldOptions.ts`
  - Retrieve locations from auth context instead of fetching from API
  - Extract tenant_id from auth context
  - Validate locations belong to current tenant
  - Map location ID to location name correctly
  - Handle case when locations not yet loaded in auth context
  - _Requirements: 1.1, 1.2_

- [ ]* 3.1 Write property test for tenant-filtered location dropdown
  - **Feature: meter-location-validation, Property 1: Tenant-Filtered Location Dropdown**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 3.2 Write property test for location names displayed
  - **Feature: meter-location-validation, Property 2: Location Names Displayed**

  - **Validates: Requirements 1.1, 1.2**


- [x] 4. Update BaseForm to render validation fields as dropdowns






  - Update `framework/frontend/components/form/BaseForm.tsx`
  - Detect fields with `validate: true` property
  - Render detected fields as select/dropdown instead of text input
  - Pass field options from useValidationFieldOptions hook to dropdown
  - Handle case when options are not yet available
  - _Requirements: 1.1, 1.2_

- [ ]* 4.1 Write unit test for dropdown rendering
  - Test that fields with validate: true render as dropdowns
  - Test that dropdown displays location options

  - Test that dropdown handles empty options
  - _Requirements: 1.1, 1.2_


- [x] 5. Implement location pre-selection in edit mode





  - Update BaseForm to detect when entity has existing location_id
  - Pre-select the location in dropdown based on location_id
  - Display location name for pre-selected location
  - _Requirements: 1.4_

- [x]* 5.1 Write property test for current location pre-selection

  - **Feature: meter-location-validation, Property 4: Current Location Pre-selection**
  - **Validates: Requirements 1.4**



- [x] 6. Handle empty location list








  - Update useValidationFieldOptions hook to handle empty location list
  - Render dropdown as empty when no locations available
  - Optionally disable dropdown when no locations available
  - _Requirements: 1.5_


- [x]* 6.1 Write property test for empty location list handling
  - **Feature: meter-location-validation, Property 5: Empty Location List Handling**
  - **Validates: Requirements 1.5**
  - Test file: `client/frontend/src/test/empty-location-list.test.ts`
  - Status: PASSED (5/5 tests passed)

- [x] 7. Implement location ID to name mapping







  - Update BaseForm to map location_id to location name for display
  - Ensure selected location_id is correctly stored in form data



  - Ensure location name is displayed in dropdown
  - _Requirements: 1.3_

- [ ]* 7.1 Write property test for location ID mapping
  - **Feature: meter-location-validation, Property 3: Location ID Mapping**
  - **Validates: Requirements 1.3**

- [x] 8. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Integration test - Meter form with location dropdown
  - Test meter form loads with location dropdown populated
  - Test location selection updates location_id field
  - Test meter creation with selected location
  - Test meter edit with location pre-selection
  - Test location dropdown displays correct locations for tenant
  - Test error handling when locations not available
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

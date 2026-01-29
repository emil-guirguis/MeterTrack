# Dashboard Meter Element Loading/Saving - Tasks

## Implementation Tasks

- [ ] 1. Fix Backend API Endpoint
  - [ ] 1.1 Remove duplicate endpoint definition (lines 1144-1200 in dashboard.js)
  - [ ] 1.2 Update response mapping to include `id` field
  - [ ] 1.3 Add console logging to verify response format
  - [ ] 1.4 Test endpoint returns correct format

- [ ] 2. Fix Frontend Form Initialization
  - [ ] 2.1 Remove `.toString()` conversion from meter_element_id initialization
  - [ ] 2.2 Keep meter_element_id as number throughout form lifecycle
  - [ ] 2.3 Verify form state maintains correct types

- [ ] 3. Fix Select Component Value Binding
  - [ ] 3.1 Update Select component value to convert to number when present
  - [ ] 3.2 Update MenuItem rendering to use `element.id`
  - [ ] 3.3 Ensure empty state is handled correctly

- [ ] 4. Fix Form Submission
  - [ ] 4.1 Ensure meter_element_id is sent as number to backend
  - [ ] 4.2 Handle null/empty case correctly
  - [ ] 4.3 Verify backend receives correct type

- [ ] 5. Fix Validation Logic
  - [ ] 5.1 Update validation to use `element.id` field
  - [ ] 5.2 Ensure numeric comparison in validation
  - [ ] 5.3 Test validation with various inputs

- [ ] 6. Test and Verify
  - [ ] 6.1 Create new dashboard card with meter element
  - [ ] 6.2 Edit existing dashboard card and verify meter element loads
  - [ ] 6.3 Verify meter element persists after save
  - [ ] 6.4 Check browser console for no errors/warnings
  - [ ] 6.5 Test with multiple meters and elements

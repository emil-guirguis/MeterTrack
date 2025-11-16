# Implementation Plan

- [x] 1. Update database schema and add foreign key constraint



  - Add location_id UUID column to meters table
  - Add foreign key constraint referencing location(id) with ON DELETE RESTRICT
  - Create index on location_id for query performance
  - _Requirements: 3.5_

- [ ] 2. Create data migration script for existing meters
  - Write migration script to map existing location_location text to location IDs
  - Attempt automatic matching by location name
  - Create "Unmapped Location" for meters that cannot be matched
  - Update all meters to have valid location_id values
  - _Requirements: 3.5_

- [ ] 3. Update Meter model to include location data
  - Add location_id field to Meter constructor
  - Update findAll query to LEFT JOIN with location table
  - Include location_name and location_city in SELECT
  - Update create method to accept and store location_id
  - Update update method to accept and validate location_id
  - _Requirements: 3.4, 3.5_

- [ ] 4. Add backend validation for location_id
  - Add location_id validation to POST /meters route
  - Validate location_id is not empty and is valid UUID format
  - Add custom validator to check location exists in database
  - Add custom validator to check location status is active
  - Return clear error messages for validation failures
  - Add same validation to PUT /meters/:id route
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 5. Update meter response format to include location details
  - Modify mapMeterToResponse to include location object with id, name, and city
  - Update GET /meters route response
  - Update GET /meters/:id route response
  - Update POST /meters route response
  - Update PUT /meters/:id route response
  - _Requirements: 3.4_

- [ ] 6. Update MeterForm component to use location dropdown
  - Import useLocation hook from locationStore
  - Fetch locations on component mount
  - Replace location text input with location_id dropdown
  - Filter dropdown to show only active locations
  - Display location name and city in dropdown options
  - Add validation to require location selection
  - Handle loading state while fetching locations
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [ ] 7. Add location availability handling in MeterForm
  - Show info banner when no locations are available
  - Add link to location management page
  - Show warning banner when meter references inactive/missing location in edit mode
  - Add retry button for location fetch errors
  - Disable form submission when locations are loading
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 8. Update CreateMeterRequest type definition
  - Change location field from string to location_id: string
  - Update Meter interface to include location_id
  - Update meter type to include location object with id, name, city
  - Ensure type consistency across frontend
  - _Requirements: 1.4, 1.5_

- [ ]* 9. Update meter list display to show location name
  - Update MeterList columns to display location name instead of free text
  - Add location city as secondary text
  - Handle cases where location is null or undefined
  - _Requirements: 1.5_

- [ ]* 10. Write tests for location validation
  - Test backend validation rejects invalid location IDs
  - Test backend validation rejects inactive locations
  - Test frontend form validation requires location selection
  - Test location dropdown filters to active locations only
  - Test warning display for orphaned location references
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4, 3.1, 3.2, 3.3_

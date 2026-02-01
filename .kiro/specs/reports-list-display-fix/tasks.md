# Implementation Plan: Reports List Display and Selection Features

## Overview

This implementation plan fixes the reports list column display issue and adds meter/element/register selection and HTML formatting support. The work is organized into focused tasks that build incrementally.

## Tasks

- [ ] 1. Fix ReportList Column Display Bug
  - [x] 1.1 Update ReportList.tsx to use reportColumns instead of baseList.columns
    - Replace `columns={baseList.columns}` with `columns={reportColumns}`
    - Verify columns are properly defined in the component
    - Test that columns display correctly in the UI
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.2 Write unit tests for ReportList column display
    - Test that all columns are rendered
    - Test that column data is properly populated
    - Test that columns are sortable
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.3 Write property test for ReportList columns
    - **Property 1: ReportList displays all columns**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [ ] 2. Update Report Schema with New Fields
  - [x] 2.1 Add meter_ids field to Report schema
    - Add field definition with type CUSTOM
    - Set default to empty array
    - Add to Meters & Elements tab
    - _Requirements: 5.1, 5.5_

  - [x] 2.2 Add element_ids field to Report schema
    - Add field definition with type CUSTOM
    - Set default to empty array
    - Add to Meters & Elements tab
    - _Requirements: 5.2, 5.5_

  - [x] 2.3 Add register_ids field to Report schema
    - Add field definition with type CUSTOM
    - Set default to empty array
    - Add to Registers tab
    - _Requirements: 5.3, 5.5_

  - [x] 2.4 Add html_format field to Report schema
    - Add field definition with type BOOLEAN
    - Set default to false
    - Add to Formatting tab
    - _Requirements: 5.4, 5.5_

  - [ ]* 2.5 Write unit tests for schema fields
    - Test that all new fields are present in schema
    - Test that field types are correct
    - Test that default values are set
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 3. Create MeterElementSelector Component
  - [x] 3.1 Create MeterElementSelector.tsx file
    - Implement component structure with meter and element lists
    - Implement meter selection toggle
    - Implement element loading when meters are selected
    - Implement element selection toggle
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.2 Add styling for MeterElementSelector
    - Create MeterElementSelector.css with proper layout
    - Style meter and element lists
    - Style checkboxes and labels
    - _Requirements: 6.1, 6.2_

  - [ ]* 3.3 Write unit tests for MeterElementSelector
    - Test meter selection toggle
    - Test element loading when meters change
    - Test element selection toggle
    - Test onChange callback
    - Test disabled state
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 3.4 Write property tests for MeterElementSelector
    - **Property 2: MeterElementSelector allows meter selection**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - **Property 3: MeterElementSelector updates form data**
    - **Validates: Requirements 6.3, 6.4, 6.5**

- [ ] 4. Create RegisterSelector Component
  - [x] 4.1 Create RegisterSelector.tsx file
    - Implement component structure with register list
    - Implement register selection toggle
    - Implement register loading on mount
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 4.2 Add styling for RegisterSelector
    - Create RegisterSelector.css with proper layout
    - Style register list
    - Style checkboxes and labels
    - _Requirements: 7.1, 7.2_

  - [ ]* 4.3 Write unit tests for RegisterSelector
    - Test register selection toggle
    - Test register loading on mount
    - Test onChange callback
    - Test disabled state
    - Test register display with name and description
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 4.4 Write property tests for RegisterSelector
    - **Property 4: RegisterSelector allows register selection**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - **Property 5: RegisterSelector updates form data**
    - **Validates: Requirements 7.3, 7.4, 7.5**

- [ ] 5. Integrate New Components into ReportForm
  - [x] 5.1 Update ReportForm.tsx with custom field renderers
    - Add custom field renderer for meter_ids and element_ids
    - Add custom field renderer for register_ids
    - Add custom field renderer for html_format (or let BaseForm render)
    - Verify all custom renderers are called correctly
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.2 Test ReportForm with new fields
    - Create a new report with all fields
    - Verify all custom fields render correctly
    - Verify form submission includes new fields
    - Verify form loading state works
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 5.3 Write unit tests for ReportForm integration
    - Test custom field renderers are called
    - Test form submission includes new fields
    - Test form loading state
    - Test form cancellation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 5.4 Write property tests for ReportForm
    - **Property 6: ReportForm renders all custom fields**
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - **Property 7: Form submission includes new fields**
    - **Validates: Requirements 8.4, 8.5**

- [ ] 6. Update Database Schema
  - [x] 6.1 Create migration to add new columns
    - Add meter_ids column (TEXT[] DEFAULT '{}')
    - Add element_ids column (TEXT[] DEFAULT '{}')
    - Add register_ids column (TEXT[] DEFAULT '{}')
    - Add html_format column (BOOLEAN DEFAULT false)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 6.2 Run migration
    - Execute migration script
    - Verify columns are created
    - Verify existing data is preserved
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Test Backward Compatibility
  - [x] 7.1 Load existing reports without new fields
    - Verify form handles missing fields gracefully
    - Verify default values are applied
    - Verify no errors are displayed
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 7.2 Edit existing reports
    - Load an old report
    - Verify new fields are empty/default
    - Modify and save the report
    - Verify new fields are saved
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 7.3 Write property tests for backward compatibility
    - **Property 8: Backward compatibility maintained**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [ ] 8. End-to-End Testing
  - [x] 8.1 Test create report with all new fields
    - Create a new report
    - Select meters and elements
    - Select registers
    - Enable HTML formatting
    - Verify report is created with all fields
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 8.2 Test edit report with new fields
    - Edit an existing report
    - Modify meter/element selection
    - Modify register selection
    - Toggle HTML formatting
    - Verify changes are saved
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 8.3 Test reports list displays correctly
    - Verify columns are displayed
    - Verify data is populated
    - Verify sorting works
    - Verify filtering works
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 8.4 Write integration tests for end-to-end flows
    - Test complete create/edit flows with new fields
    - Test list operations
    - Test backward compatibility
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 9.4_

- [ ] 9. Final Verification
  - [x] 9.1 Verify all tests pass
    - Run all unit tests
    - Run all property tests
    - Verify no console errors
    - _Requirements: All_

  - [x] 9.2 Verify UI/UX
    - Test form layout and styling
    - Test component responsiveness
    - Test accessibility
    - _Requirements: All_

  - [x] 9.3 Verify API integration
    - Test API calls for meters, elements, registers
    - Test form submission to API
    - Test error handling
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The column display fix (Task 1.1) is critical and should be done first
- New components follow existing framework patterns (DualListSelector, MeterSelectionContext)
- All new fields are optional for backward compatibility
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

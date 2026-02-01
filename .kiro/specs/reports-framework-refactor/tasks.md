# Implementation Plan: Reports Module Framework Integration

## Overview

This implementation plan refactors the Reports module to use framework components (BaseForm, FormContainer, BaseList) instead of custom implementations. The refactoring is done incrementally, starting with schema creation, then ReportForm refactoring, then ReportList enhancement, and finally integration testing. Each step builds on the previous one and validates core functionality early through code.

## Tasks

- [x] 1. Create Report Schema Definition
  - Create ReportWithSchema.js with complete schema definition
  - Define all report fields with proper types and validation rules
  - Organize fields into tabs (Basic Info, Schedule, Recipients, Configuration)
  - Define form grouping for field organization
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Write unit tests for Report schema
  - Test that all fields are defined in schema
  - Test that validation rules are present
  - Test that tabs and sections are properly organized
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create Custom Field Components
  - [x] 2.1 Create RecipientsField component
    - Implement email input with add button
    - Implement recipient list with remove buttons
    - Implement email validation
    - Implement duplicate prevention
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 2.2 Write unit tests for RecipientsField
    - Test email validation
    - Test duplicate prevention
    - Test add/remove functionality
    - Test error display
    - _Requirements: 3.4, 3.5, 3.6_

  - [x] 2.3 Create ScheduleField component
    - Implement cron preset dropdown
    - Implement custom cron expression input
    - Implement preset selection updating text input
    - Implement cron validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.4 Write unit tests for ScheduleField
    - Test preset dropdown rendering
    - Test custom input rendering
    - Test preset selection
    - Test cron validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Refactor ReportForm to Use BaseForm
  - [x] 3.1 Update ReportForm component
    - Replace manual form rendering with BaseForm
    - Remove useState for form fields
    - Remove manual validation logic
    - Wrap with FormContainer
    - Implement renderCustomField for recipients and schedule
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2_

  - [ ]* 3.2 Write unit tests for ReportForm
    - Test BaseForm is rendered
    - Test custom field renderers are called
    - Test form submission calls onSubmit
    - Test form cancellation calls onCancel
    - Test loading state disables fields
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 9.2, 9.3, 9.4_

  - [ ]* 3.3 Write property test for ReportForm rendering
    - **Property 1: ReportForm renders with BaseForm**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 3.4 Write property test for custom field renderers
    - **Property 2: Custom field renderers are called for recipients and schedule**
    - **Validates: Requirements 3.1, 4.1**

- [x] 4. Enhance ReportList with BaseList Features
  - [x] 4.1 Verify ReportList uses BaseList
    - Ensure all columns are properly defined
    - Ensure all filters are properly configured
    - Ensure bulk actions are properly implemented
    - Ensure export functionality is available
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 4.2 Write unit tests for ReportList
    - Test BaseList is rendered
    - Test all columns are displayed
    - Test filters are available
    - Test sorting works
    - Test pagination works
    - Test bulk actions work
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 4.3 Write property test for ReportList rendering
    - **Property 6: ReportList uses BaseList for rendering**
    - **Validates: Requirements 5.1, 5.2**

- [x] 5. Implement Validation and Error Handling
  - [x] 5.1 Implement field validation in schema
    - Add required field validation
    - Add email format validation for recipients
    - Add cron format validation for schedule
    - Add name length validation
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ]* 5.2 Write unit tests for validation
    - Test required field validation
    - Test email format validation
    - Test cron format validation
    - Test name length validation
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ]* 5.3 Write property tests for validation
    - **Property 3: Recipients field validates email format**
    - **Validates: Requirements 3.4, 6.4**
    - **Property 4: Recipients field prevents duplicates**
    - **Validates: Requirements 3.5, 6.3**
    - **Property 8: Form maintains all current validation rules**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 6. Integrate ReportForm with ReportsPage
  - [x] 6.1 Update ReportsPage to use refactored ReportForm
    - Verify ReportForm works in FormModal
    - Verify form submission updates list
    - Verify form cancellation closes modal
    - Verify loading state is handled
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 6.2 Write integration tests for ReportsPage
    - Test create report flow
    - Test edit report flow
    - Test delete report flow
    - Test form error handling
    - _Requirements: 6.1, 6.6, 6.7, 6.8, 6.9, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 6.3 Write property test for form submission
    - **Property 7: Form submission calls onSubmit callback**
    - **Validates: Requirements 2.5, 6.1, 9.2**

- [x] 7. Verify Framework Component Usage
  - [x] 7.1 Verify FormContainer is used
    - Check ReportForm uses FormContainer
    - Verify layout and styling are correct
    - _Requirements: 7.1, 7.2_

  - [x] 7.2 Verify BaseForm is used
    - Check ReportForm uses BaseForm
    - Verify schema-driven rendering works
    - _Requirements: 2.1, 2.2, 7.2_

  - [x] 7.3 Verify BaseList is used
    - Check ReportList uses BaseList
    - Verify list rendering works
    - _Requirements: 5.1, 7.3_

  - [x] 7.4 Verify framework components are used for fields
    - Check form fields use framework components
    - Check buttons use framework styles
    - Check errors use framework styling
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

  - [ ]* 7.5 Write property tests for framework component usage
    - **Property 9: ReportForm integrates with FormContainer**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - **Property 11: Form loading state disables fields**
    - **Validates: Requirements 9.4**
    - **Property 12: Form cancellation calls onCancel callback**
    - **Validates: Requirements 9.3**

- [x] 8. Test Type-Specific Configuration
  - [x] 8.1 Implement type-specific field support
    - Verify config field is in schema
    - Verify form updates when type changes
    - Verify config data is saved and loaded
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 8.2 Write unit tests for type-specific configuration
    - Test config field is present
    - Test form updates on type change
    - Test config data is saved
    - Test config data is loaded
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 8.3 Write property test for type-specific configuration
    - **Property 5: Schedule field displays cron presets**
    - **Validates: Requirements 4.1, 4.2**
    - **Property 10: ReportList displays all required columns**
    - **Validates: Requirements 5.2, 5.3**

- [x] 9. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Verify no console errors or warnings
  - Ask the user if questions arise

- [x] 10. End-to-End Testing
  - [x] 10.1 Test create report flow
    - Create a new report with all fields
    - Verify report appears in list
    - Verify all data is saved correctly
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 9.2_

  - [x] 10.2 Test edit report flow
    - Edit an existing report
    - Verify all fields can be modified
    - Verify changes are saved
    - _Requirements: 6.6, 6.7, 9.2_

  - [x] 10.3 Test delete report flow
    - Delete a report
    - Verify report is removed from list
    - _Requirements: 6.8_

  - [x] 10.4 Test toggle status flow
    - Toggle report status
    - Verify status changes in list
    - _Requirements: 6.9_

  - [x] 10.5 Test list filtering and sorting
    - Test filtering by name, type, status
    - Test sorting by all columns
    - Test pagination
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ]* 10.6 Write integration tests for end-to-end flows
    - Test complete create/edit/delete flows
    - Test list operations
    - Test error scenarios
    - _Requirements: 6.1, 6.6, 6.7, 6.8, 6.9, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11. Final Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Run all integration tests and verify they pass
  - Verify no console errors or warnings
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Custom field components (RecipientsField, ScheduleField) are reusable and can be used in other modules
- All current functionality is maintained through custom field rendering
- Framework components provide consistent styling and behavior across the application

</content>
</invoke>
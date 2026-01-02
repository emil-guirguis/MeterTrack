# Implementation Plan: Schema Structure Refactoring

## Overview

Refactor the schema definition structure to use hierarchical tab/section/field organization at the schema level instead of embedding formGrouping metadata in each field.

## Tasks

- [x] 1. Update SchemaDefinition with Helper Functions
  - Add `tab()` helper function to create tab definitions
  - Add `section()` helper function to create section definitions
  - Add `fieldRef()` helper function to create field references
  - Update TypeScript types for Tab, Section, FieldRef
  - Update SchemaDefinitionConfig interface to include optional formTabs
  - _Requirements: 1.1, 5.1, 5.2, 5.3_

- [ ]* 1.1 Write unit tests for tab() helper
  - Test tab creation with valid config
  - Test tab with multiple sections
  - Test tab order property
  - _Requirements: 1.1_

- [ ]* 1.2 Write unit tests for section() helper
  - Test section creation with valid config
  - Test section with multiple fields
  - Test section order property
  - _Requirements: 1.1_

- [ ]* 1.3 Write unit tests for fieldRef() helper
  - Test fieldRef creation with valid config
  - Test fieldRef order property
  - _Requirements: 1.1_

- [x] 2. Update useFormTabs Hook
  - Add formTabs parameter to hook signature
  - Implement processFormTabs() function to convert hierarchical structure
  - Update hook to use formTabs if provided, fall back to formGrouping
  - Ensure output structure matches existing format
  - _Requirements: 3.1, 6.1, 6.2, 6.3_

- [ ]* 2.1 Write unit tests for processFormTabs()
  - Test conversion of formTabs to flat structure
  - Test tab sorting by order
  - Test section sorting by order
  - Test field sorting by order
  - _Requirements: 6.1_

- [ ]* 2.2 Write unit tests for hook with formTabs
  - Test useFormTabs with formTabs structure
  - Test useFormTabs with formGrouping structure
  - Test useFormTabs with both (formTabs takes precedence)
  - _Requirements: 6.2, 6.3_

- [ ]* 2.3 Write property tests for tab organization
  - **Property 1: Tab ordering preserved**
  - For any formTabs array, tabs should be sorted by order in output
  - **Validates: Requirements 3.1**

- [ ]* 2.4 Write property tests for section organization
  - **Property 2: Section ordering preserved**
  - For any tab with sections, sections should be sorted by order in output
  - **Validates: Requirements 3.1**

- [ ]* 2.5 Write property tests for field organization
  - **Property 3: Field ordering preserved**
  - For any section with fields, fields should be sorted by order in output
  - **Validates: Requirements 3.1**

- [ ]* 2.6 Write property tests for backward compatibility
  - **Property 4: formGrouping and formTabs produce equivalent output**
  - For any schema with both formGrouping and formTabs, formTabs output should match formGrouping equivalent
  - **Validates: Requirements 4.1, 4.2, 4.3_

- [x] 3. Update BaseForm Component
  - Import formTabs from schema
  - Pass formTabs to useFormTabs hook
  - Verify form rendering works with new structure
  - _Requirements: 3.1_

- [ ]* 3.1 Write integration tests for BaseForm with formTabs
  - Test form renders with formTabs structure
  - Test all tabs display correctly
  - Test all sections display correctly
  - Test all fields display in correct sections
  - _Requirements: 3.1_

- [x] 4. Migrate Contact Schema to formTabs
  - Remove formGrouping from all Contact fields
  - Add formTabs structure to Contact schema
  - Organize fields into Contact, Address, Additional Info tabs
  - Test Contact form displays all tabs and fields correctly
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 4.1 Write integration tests for Contact form
  - Test Contact tab displays with all sections
  - Test Address tab displays with all fields
  - Test Additional Info tab displays with all fields
  - Test switching between tabs maintains form state
  - _Requirements: 2.1_

- [x] 5. Checkpoint - Verify Contact Schema Works
  - Ensure all tests pass
  - Manually test Contact form in browser
  - Verify all tabs and fields display correctly
  - Ask the user if questions arise

- [x] 6. Migrate Device Schema to formTabs
  - Remove formGrouping from all Device fields
  - Add formTabs structure to Device schema
  - Test Device form displays correctly
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 6.1 Write integration tests for Device form
  - Test General tab displays with all sections
  - Test Registers tab displays correctly
  - _Requirements: 2.1_

- [x] 7. Migrate User Schema to formTabs
  - Remove formGrouping from all User fields
  - Add formTabs structure to User schema
  - Test User form displays correctly
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 7.1 Write integration tests for User form
  - Test User tab displays with all sections
  - _Requirements: 2.1_

- [x] 8. Migrate Location Schema to formTabs
  - Remove formGrouping from all Location fields
  - Add formTabs structure to Location schema
  - Test Location form displays correctly
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 8.1 Write integration tests for Location form
  - Test Location tab displays with all sections
  - Test Address tab displays with all fields
  - Test Additional Info tab displays with all fields
  - _Requirements: 2.1_

- [x] 9. Migrate Meter Schema to formTabs
  - Remove formGrouping from all Meter fields
  - Add formTabs structure to Meter schema
  - Test Meter form displays correctly
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 9.1 Write integration tests for Meter form
  - Test Meter tab displays with all sections
  - Test Elements tab displays correctly
  - Test Additional Info tab displays with all fields
  - _Requirements: 2.1_

- [ ] 10. Checkpoint - Verify All Schemas Work
  - Ensure all tests pass
  - Manually test all forms in browser
  - Verify all tabs and fields display correctly
  - Ask the user if questions arise

- [ ] 11. Update Documentation
  - Add formTabs structure to schema documentation
  - Add migration guide for existing schemas
  - Add examples of new structure
  - Document helper functions (tab, section, fieldRef)
  - _Requirements: 1.1, 5.1_

- [ ] 12. Final Checkpoint - All Tests Pass
  - Ensure all unit tests pass
  - Ensure all integration tests pass
  - Ensure all property tests pass
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each schema migration should be tested thoroughly before moving to next
- Backward compatibility is maintained throughout
- formGrouping continues to work for existing schemas
- formTabs takes precedence if both are defined

# Implementation Plan: Standardize Form Inheritance Pattern

## Overview
Refactor all form modules to use BaseForm component and simplify list modules by extracting configuration. This eliminates code duplication and ensures consistency across the application.

---

## Phase 1: Form Refactoring

- [ ] 1.1 Refactor DeviceForm to use BaseForm
  - Remove useSchema, useEntityFormWithStore, and manual validation logic
  - Replace with BaseForm component
  - Define fieldSections for field organization
  - Implement renderCustomField for JsonGridEditor handling
  - Remove manual error handling and field rendering
  - _Requirements: 2.1, 3.1, 3.2, 3.3_

- [ ] 1.2 Refactor LocationForm to use BaseForm
  - Remove useSchema, useEntityFormWithStore, and manual validation logic
  - Replace with BaseForm component
  - Define fieldSections for field organization
  - Implement renderCustomField for custom fields
  - Remove manual error handling and field rendering
  - _Requirements: 2.2, 3.1, 3.2, 3.3_

- [ ] 1.3 Refactor UserForm to use BaseForm
  - Remove useSchema, useEntityFormWithStore, and manual validation logic
  - Replace with BaseForm component
  - Define fieldSections for field organization
  - Implement renderCustomField for password field handling
  - Remove manual error handling and field rendering
  - _Requirements: 2.3, 3.1, 3.2, 3.3_

- [ ] 1.4 Verify form functionality
  - Test DeviceForm create and update flows
  - Test LocationForm create and update flows
  - Test UserForm create and update flows
  - Verify field validation works correctly
  - Verify custom field rendering displays properly
  - Verify error messages display correctly
  - _Requirements: 2.4, 2.5_

---

## Phase 2: List Configuration Extraction

- [ ] 2.1 Standardize delete handlers across all lists
  - Create consistent delete handler pattern
  - Apply to MeterList, DeviceList, LocationList, ContactList, UserList
  - Ensure confirmation dialogs are consistent
  - _Requirements: 1.1, 1.2_

- [ ] 2.2 Simplify MeterList component
  - Extract inline configuration to meterConfig.ts
  - Remove duplicate useBaseList setup code
  - Reduce component to ~50 lines
  - _Requirements: 1.1, 1.2_

- [ ] 2.3 Simplify DeviceList component
  - Extract inline configuration to deviceConfig.ts
  - Remove duplicate useBaseList setup code
  - Reduce component to ~50 lines
  - _Requirements: 1.1, 1.2_

- [ ] 2.4 Simplify LocationList component
  - Extract inline configuration to locationConfig.ts
  - Remove duplicate useBaseList setup code
  - Reduce component to ~50 lines
  - _Requirements: 1.1, 1.2_

- [ ] 2.5 Simplify ContactList component
  - Extract inline configuration to contactConfig.ts
  - Remove duplicate useBaseList setup code
  - Reduce component to ~50 lines
  - _Requirements: 1.1, 1.2_

- [ ] 2.6 Simplify UserList component
  - Extract inline configuration to userConfig.ts
  - Remove duplicate useBaseList setup code
  - Reduce component to ~50 lines
  - _Requirements: 1.1, 1.2_

- [ ] 2.7 Verify list functionality
  - Test all lists render correctly
  - Test filtering and search work
  - Test pagination works
  - Test bulk actions work
  - Test export functionality works
  - Test delete handlers work
  - _Requirements: 1.1, 1.2_

---

## Phase 3: Final Verification

- [ ] 3.1 Verify code reduction metrics
  - Measure form code reduction (target: 60%+)
  - Measure list code reduction (target: 40%+)
  - Document metrics
  - _Requirements: 1.5_

- [ ] 3.2 Verify consistency across all modules
  - All forms follow BaseForm pattern
  - All lists follow DataList + useBaseList pattern
  - All configurations are in config files
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3.3 Manual testing of all features
  - Test form creation flows
  - Test form update flows
  - Test form validation
  - Test list display and filtering
  - Test list bulk actions
  - Test list export
  - Verify no breaking changes
  - _Requirements: 2.4, 2.5, 4.1, 4.2, 4.3_

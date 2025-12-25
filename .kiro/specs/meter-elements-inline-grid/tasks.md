# Implementation Plan

## Overview

This plan implements the meter elements inline grid feature by creating a schema-based backend model, refactoring the frontend component to use the framework's EditableDataGrid, and adding comprehensive tests.

---

- [x] 1. Create MeterElementsWithSchema Backend Model




  - Create `client/backend/src/models/MeterElementsWithSchema.js` following the pattern of other WithSchema models
  - Define schema with fields: id, meter_id, name, status (read-only), element, created_at, updated_at
  - Configure status field as read-only with default value 'active'
  - Configure name and element as required fields
  - Export schema for frontend consumption
  - _Requirements: 2.1, 2.2_






- [ ] 2. Add Schema Endpoint to Backend
  - Create GET `/api/meter-elements/schema` endpoint in meterElement.js routes
  - Return MeterElementsWithSchema.schema definition
  - Ensure endpoint is authenticated




  - _Requirements: 2.2_

- [ ]* 2.1 Write property test for schema endpoint
  - **Feature: meter-elements-inline-grid, Property 6: Schema Endpoint Returns Valid Schema**
  - **Validates: Requirements 2.2**

- [ ] 3. Refactor ElementsGrid Component

  - Update `client/frontend/src/features/meters/ElementsGrid.tsx` to use EditableDataGrid
  - Remove modal dialogs for add/edit operations
  - Implement unsaved row state that appears at top of grid
  - Fetch schema from backend and use for column configuration
  - Derive column editability from schema field configuration



  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 3.1 Write property test for grid rendering
  - **Feature: meter-elements-inline-grid, Property 1: Grid Renders with Existing Elements**
  - **Validates: Requirements 1.1**

- [ ]* 3.2 Write property test for unsaved row insertion
  - **Feature: meter-elements-inline-grid, Property 2: Unsaved Row Appears First**
  - **Validates: Requirements 1.2**

- [ ] 4. Implement Cell Change Handling

  - Implement `handleCellChange()` to update UI immediately (optimistic update)

  - Make API call to persist change on blur/Enter

  - Revert cell value on API error
  - Display error message on failed save
  - _Requirements: 1.3, 1.4_

- [x]* 4.1 Write property test for cell UI updates


  - **Feature: meter-elements-inline-grid, Property 3: Cell Changes Update UI Immediately**
  - **Validates: Requirements 1.3**





- [ ]* 4.2 Write property test for cell persistence
  - **Feature: meter-elements-inline-grid, Property 4: Cell Changes Persist to Backend**
  - **Validates: Requirements 1.4**

- [ ] 5. Implement Delete Functionality

  - Implement `handleDeleteElement()` with confirmation dialog



  - Remove element from grid on successful delete
  - Make API call to delete from backend
  - Display error message on failed delete
  - _Requirements: 1.5_

- [ ]* 5.1 Write property test for delete operation
  - **Feature: meter-elements-inline-grid, Property 5: Delete Removes Element**
  - **Validates: Requirements 1.5**

- [ ] 6. Implement Schema Validation

  - Add validation logic to check required fields before save
  - Validate field types against schema definition


  - Display validation errors on cells

  - Prevent save of invalid data
  - _Requirements: 2.3, 2.4_

- [ ]* 6.1 Write property test for schema validation
  - **Feature: meter-elements-inline-grid, Property 7: Schema Validation Enforces Constraints**
  - **Validates: Requirements 2.3, 2.4**

- [ ] 7. Implement Loading and Error States

  - Display loading indicator during initial data fetch
  - Disable add button while loading



  - Display error message with retry button on fetch failure




  - Implement retry functionality
  - _Requirements: 3.1, 3.2_

- [x]* 7.1 Write property test for loading state



  - **Feature: meter-elements-inline-grid, Property 8: Loading Indicator Displays During Fetch**
  - **Validates: Requirements 3.1**

- [ ]* 7.2 Write property test for error state
  - **Feature: meter-elements-inline-grid, Property 9: Error State Displays with Retry**
  - **Validates: Requirements 3.2**

- [ ] 8. Update MeterForm Integration

  - Ensure ElementsGrid is properly integrated in MeterForm
  - Verify tab switching works correctly
  - Test that meter ID is passed correctly to ElementsGrid
  - _Requirements: 1.1_

- [ ]* 8.1 Write unit tests for ElementsGrid component
  - Test component mounting and data loading
  - Test unsaved row insertion
  - Test cell editing and API calls
  - Test delete confirmation and removal
  - Test error state rendering
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Update CSS and Styling

  - Update `client/frontend/src/features/meters/ElementsGrid.css` for new grid layout
  - Ensure inline editing styles match framework standards
  - Add styles for unsaved row highlighting
  - Add styles for loading and error states
  - _Requirements: 1.1, 3.1, 3.2_

- [ ] 11. Final Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

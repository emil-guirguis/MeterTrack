# Implementation Plan: Meter Element Dropdown Selection Fix

## Overview

This implementation plan addresses the issue where dropdown selections in the ElementsGrid are not being displayed in cells after the dropdown closes. The fix involves ensuring proper state synchronization between the EditableDataGrid component and its parent ElementsGrid component, and verifying that callbacks are invoked correctly to trigger auto-save functionality.

## Tasks

- [ ] 1. Fix Select component onChange handler in EditableDataGrid
  - Ensure the Select component properly handles value changes
  - Verify that handleCellSave is called with the correct value
  - Ensure editingCell state is cleared after selection
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Verify parent component state updates in ElementsGrid
  - Ensure onCellChange callback correctly updates element state
  - Verify that unsaved row state is updated for new rows
  - Ensure pending changes are tracked correctly
  - _Requirements: 1.3, 2.1, 2.2_

- [ ] 3. Test dropdown selection for unsaved rows
  - Create a new row and select a dropdown value
  - Verify the value displays in the cell
  - Verify auto-save is triggered when all required fields are populated
  - _Requirements: 2.1, 3.1_

- [ ]* 3.1 Write property test for unsaved row dropdown selection
  - **Property 3: Dropdown Selection Works for Unsaved Rows**
  - **Validates: Requirements 2.1, 2.3**

- [ ] 4. Test dropdown selection for saved rows
  - Edit an existing row and select a dropdown value
  - Verify the value displays in the cell
  - Verify the change is saved to the backend
  - _Requirements: 2.2, 3.2_

- [ ]* 4.1 Write property test for saved row dropdown selection
  - **Property 4: Dropdown Selection Works for Saved Rows**
  - **Validates: Requirements 2.2, 2.3**

- [ ] 5. Verify callback invocation
  - Ensure onCellChange is called with the selected value
  - Ensure onCellBlur is called to trigger auto-save
  - Verify callbacks are called in the correct order
  - _Requirements: 1.4, 1.5_

- [ ]* 5.1 Write property test for callback invocation
  - **Property 2: Dropdown Selection Triggers Callbacks**
  - **Validates: Requirements 1.4, 1.5**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The fix focuses on state synchronization between parent and child components
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

# Implementation Plan: JSON Grid Editor Component

- [x] 1. Create JsonGridEditor component structure


  - Create `framework/frontend/components/grid/JsonGridEditor.tsx` with component skeleton
  - Define TypeScript interfaces for props, data models, and internal state
  - Set up component exports in `framework/frontend/components/grid/index.ts`
  - _Requirements: 1.1, 5.1_


- [ ] 2. Implement column detection logic
  - Create `useColumnDetection` hook to extract unique keys from JSON array
  - Implement `formatColumnLabel` function to convert snake_case to Title Case
  - Handle edge cases: empty arrays, null values, mixed key structures
  - Return sorted, consistent column list

  - _Requirements: 1.1_

- [ ] 3. Implement grid rendering
  - Render table structure with detected columns as headers
  - Render all rows with their corresponding values

  - Apply basic styling for grid layout
  - _Requirements: 1.2_

- [ ] 4. Implement inline cell editing
  - Make cells clickable to enter edit mode
  - Render input field for active cell

  - Handle blur/Enter key to exit edit mode
  - Update underlying data on edit completion
  - _Requirements: 1.3, 1.4_

- [ ] 5. Implement add row functionality
  - Create "Add Row" button above or below grid

  - Generate new row with all columns initialized to empty strings
  - Append to JSON array and update grid display
  - Focus first editable cell in new row
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6. Implement delete row functionality

  - Add delete button to each row
  - Remove row from JSON array on delete
  - Update grid display immediately
  - Call onChange callback with updated array
  - _Requirements: 3.1, 3.2, 3.3_


- [ ] 7. Implement state management and callbacks
  - Manage grid data state internally
  - Call onChange callback on any data modification
  - Support controlled component pattern for form integration

  - _Requirements: 4.1, 4.2, 5.3_

- [ ] 8. Integrate with form reset functionality
  - Accept initial data as prop
  - Reset grid to initial state when form resets
  - Maintain state consistency throughout form lifecycle
  - _Requirements: 4.3_

- [ ] 9. Implement CSV/Excel import functionality
  - Create import button and file picker
  - Implement `parseCSVFile` utility function
  - Implement `parseExcelFile` utility function using a library (e.g., xlsx)
  - Handle file parsing errors gracefully
  - _Requirements: 6.1, 6.2_

- [x] 10. Implement import data integration

  - Wire import button to file parsing functions
  - Replace grid data with imported JSON array
  - Auto-detect columns from imported data
  - Call onChange callback with imported data
  - _Requirements: 6.3, 6.4_

- [x] 11. Add styling and polish

  - Create `JsonGridEditor.css` with grid layout styles
  - Style edit mode, buttons, and interactive elements
  - Ensure responsive design
  - _Requirements: 1.2, 3.2_

- [x] 12. Integrate into DeviceForm and MeterForm



  - Identify JSON fields in DeviceForm and MeterForm
  - Replace with JsonGridEditor component
  - Wire up onChange handlers to form state
  - Verify form submission includes updated JSON
  - _Requirements: 4.1, 4.2_

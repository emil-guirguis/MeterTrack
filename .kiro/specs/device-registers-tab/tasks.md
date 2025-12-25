# Implementation Plan - Device Registers Tab

## Overview

This implementation plan breaks down the Device Registers Tab feature into manageable tasks. The plan follows a layered approach: framework components first, then API endpoints, then feature integration.

---

## Phase 1: Framework EditableDataGrid Component (using Material-UI Table)

### 1. Create EditableDataGrid Framework Component

- [ ] 1.1 Create directory structure
  - Create `framework/frontend/components/datagrid/` directory
  - Create `EditableDataGrid.tsx` component file
  - Create `EditableDataGrid.css` stylesheet
  - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [ ] 1.2 Implement EditableDataGrid component using Material-UI Table
  - Import Material-UI Table components (Table, TableContainer, TableHead, TableBody, TableRow, TableCell)
  - Define TypeScript interfaces (EditableDataGridProps, GridColumn, GridRow)
  - Implement component state management (data, editingCell, editValue, loading, error)
  - Implement cell click handler to enter edit mode
  - Implement cell value change handler
  - Implement cell save handler (calls onCellChange callback)
  - Implement cell cancel handler (Escape key)
  - Implement Enter key to save
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

- [ ] 1.3 Implement Material-UI Table rendering
  - Render TableContainer with Paper variant
  - Render Table with headers from columns prop
  - Render TableHead with column labels
  - Render TableBody with data rows
  - Render editable cells with TextField when in edit mode
  - Render delete button (IconButton with DeleteIcon) for each row
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 1.4 Implement grid header with Add button
  - Render Box above table with "Add Register" button (Button component)
  - Render loading indicator (CircularProgress) when loading prop is true
  - Render error message (Alert component) when error prop is set
  - Render retry button in error state
  - _Requirements: 1.3, 1.4, 4.1_

- [ ] 1.5 Implement empty state
  - Display TableRow with empty message when data array is empty
  - Use emptyMessage prop or default message
  - _Requirements: 1.5_

- [ ] 1.6 Implement focus color styling
  - Apply form field focus color to TextField when focused
  - Use CSS variable for focus color (--form-focus-color)
  - Add box-shadow for focus indicator
  - _Requirements: 3.2, 3.3_

- [ ] 1.7 Create EditableDataGrid exports
  - Update `framework/frontend/components/datagrid/index.ts` to export component
  - Update `framework/frontend/components/index.ts` to export from datagrid
  - _Requirements: 2.1_

- [ ] 1.8 Checkpoint - Verify Material-UI Table integration
  - Verify table renders correctly with Material-UI components
  - Verify inline editing works with TextField
  - Verify focus colors match form fields

- [ ] 1.6 Implement focus color styling
  - Apply form field focus color to TextField when focused
  - Use CSS variable for focus color (--form-focus-color)
  - Add box-shadow for focus indicator
  - _Requirements: 3.2, 3.3_

- [ ] 1.7 Create EditableDataGrid exports
  - Update `framework/frontend/components/datagrid/index.ts` to export component
  - Update `framework/frontend/components/index.ts` to export from datagrid
  - _Requirements: 2.1_

- [ ] 1.8 Checkpoint - Verify Material-UI Table integration
  - Verify table renders correctly with Material-UI components
  - Verify inline editing works with TextField
  - Verify focus colors match form fields

---

## Phase 2: API Endpoints for Device Registers

### 2. Create Device Register API Endpoints

- [ ] 2.1 Create device register routes file
  - Create `client/backend/src/routes/deviceRegister.js`
  - Set up Express router with authentication middleware
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2.2 Implement GET /api/devices/:deviceId/registers endpoint
  - Fetch all device_register records for the device
  - Join with register table to get register details
  - Filter by tenant_id for security
  - Return array of device registers with joined register data
  - _Requirements: 7.1_

- [ ] 2.3 Implement POST /api/devices/:deviceId/registers endpoint
  - Accept register_id in request body
  - Create new device_register record
  - Validate device exists and belongs to tenant
  - Validate register exists and belongs to tenant
  - Prevent duplicate register associations
  - Return created device_register record
  - _Requirements: 7.2, 4.5_

- [ ] 2.4 Implement PUT /api/devices/:deviceId/registers/:registerId endpoint
  - Update device_register record (for future use)
  - Validate device and register exist
  - Return updated device_register record
  - _Requirements: 7.3_

- [ ] 2.5 Implement DELETE /api/devices/:deviceId/registers/:registerId endpoint
  - Delete device_register record
  - Validate device and register exist
  - Return success message
  - _Requirements: 7.4_

- [ ] 2.6 Add error handling to all endpoints
  - Handle validation errors (400)
  - Handle not found errors (404)
  - Handle permission errors (403)
  - Handle server errors (500)
  - _Requirements: 7.5_

- [ ]* 2.7 Write unit tests for API endpoints
  - Test GET endpoint returns all registers
  - Test POST endpoint creates device_register
  - Test POST endpoint prevents duplicates
  - Test DELETE endpoint removes device_register
  - Test permission validation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2.8 Register routes in server
  - Import device register routes in `client/backend/src/server.js`
  - Mount routes at `/api/devices/:deviceId/registers`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 2.9 Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 3: Device Feature Components

### 3. Create RegistersGrid Component

- [ ] 3.1 Create RegistersGrid component file
  - Create `client/frontend/src/features/devices/RegistersGrid.tsx`
  - Create `client/frontend/src/features/devices/RegistersGrid.css`
  - Create `client/frontend/src/features/devices/RegistersGrid.test.ts`
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 3.2 Implement RegistersGrid component
  - Extend EditableDataGrid from framework
  - Define columns configuration (number, name, unit, field_name)
  - Implement state management (registers, loading, error, etc.)
  - Implement loadRegisters() method to fetch from API
  - Implement handleCellChange() to update cell values
  - Implement handleSaveCell() to save to backend
  - Implement handleAddRegister() to show add modal
  - Implement handleDeleteClick() to show delete confirmation
  - Implement handleDeleteConfirm() to delete from backend
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 5.1_

- [ ] 3.3 Implement register loading on mount
  - Load registers when component mounts
  - Load registers when deviceId prop changes
  - Display loading state while fetching
  - Display error state if fetch fails
  - _Requirements: 1.2, 1.3, 1.4_

- [ ]* 3.4 Write property test for RegistersGrid
  - **Property 1: Register Grid Consistency** - For any device with registers, the grid should display all registers with correct values
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 3.5 Implement add register functionality
  - Create AddRegisterModal component
  - Fetch available registers from API
  - Filter out already-associated registers
  - Allow user to select register
  - Call API to add register
  - Update grid with new register
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3.6 Implement delete register functionality
  - Create DeleteConfirmDialog component
  - Show confirmation when delete button clicked
  - Call API to delete register
  - Remove register from grid
  - Handle delete errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3.7 Implement error handling and retry
  - Display error messages for failed operations
  - Provide retry button for failed loads
  - Handle API errors gracefully
  - Show user-friendly error messages
  - _Requirements: 1.4, 3.5, 5.5_

- [ ]* 3.8 Write unit tests for RegistersGrid
  - Test register loading
  - Test add register flow
  - Test edit register flow
  - Test delete register flow
  - Test error handling
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 3.9 Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 4: Device Form Integration

### 4. Integrate RegistersGrid into DeviceForm

- [ ] 4.1 Update DeviceWithSchema.js
  - Add formGrouping metadata for Registers tab
  - Set tabName: 'Registers', tabOrder: 2
  - _Requirements: 6.1, 6.2_

- [ ] 4.2 Update DeviceForm component
  - Import RegistersGrid component
  - Add conditional rendering for Registers tab
  - Pass deviceId to RegistersGrid
  - Handle error and success callbacks
  - _Requirements: 1.1, 6.1_

- [ ] 4.3 Update DeviceForm styling
  - Ensure Registers tab displays correctly
  - Ensure grid integrates with form layout
  - Ensure focus colors match form fields
  - _Requirements: 3.2, 3.3_

- [ ] 4.4 Test form integration
  - Verify Registers tab appears in tab navigation
  - Verify tab switches correctly
  - Verify registers load when tab is active
  - Verify form submission doesn't include register changes
  - _Requirements: 1.1, 6.1, 6.3, 6.4, 6.5_

- [ ] 4.5 Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 5: End-to-End Testing

### 5. Complete End-to-End Testing

- [ ] 5.1 Test complete register management flow
  - Open device form
  - Click Registers tab
  - Verify registers load
  - Edit a register value
  - Verify edit is saved
  - Add a new register
  - Verify new register appears
  - Delete a register
  - Verify register is removed
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 5.2 Test error scenarios
  - Test load error with retry
  - Test save error handling
  - Test delete error handling
  - Test add error handling
  - _Requirements: 1.4, 3.5, 5.5_

- [ ] 5.3 Test edge cases
  - Test with no registers
  - Test with many registers
  - Test duplicate prevention
  - Test permission validation
  - _Requirements: 1.5, 4.5, 7.5_

- [ ] 5.4 Test UI/UX
  - Verify focus colors match form fields
  - Verify loading indicators display
  - Verify error messages are clear
  - Verify empty state displays
  - Verify buttons are accessible
  - _Requirements: 3.2, 3.3, 1.3, 1.4, 1.5_

- [ ] 5.5 Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Summary

**Total Tasks:** 40+ implementation tasks
**Phases:** 5 phases (Framework, API, Feature, Integration, Testing)
**Estimated Effort:** 
- Phase 1 (Framework): 2-3 days
- Phase 2 (API): 1-2 days
- Phase 3 (Feature): 2-3 days
- Phase 4 (Integration): 1 day
- Phase 5 (Testing): 1-2 days

**Total:** 7-11 days

---

## Notes

- All optional tasks (marked with *) are testing-related and can be skipped for MVP
- Each phase has a checkpoint to ensure quality
- Framework components should be reusable for other features
- API endpoints follow RESTful conventions
- All code should follow existing project patterns and conventions

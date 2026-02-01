# Implementation Plan: Combined Meters Selector

## Overview

This implementation plan breaks down the Combined Meters Selector feature into discrete coding tasks. The feature adds a new tab to the meter form that allows users to select and combine physical meters into a virtual meter. The DualListSelector component is built as a reusable framework component for use across the application.

## Tasks

- [ ] 1. Set up database schema and API integration
  - [x] 1.1 Verify meter_virtual table exists in database
    - Confirm meter_virtual table is created with correct schema
    - Verify columns: meter_virtual_id, meter_id, selected_meter_id, select_meter_element_id
    - Verify primary key constraints and indexes
    - Verify RLS policies are set correctly
    - _Requirements: 11.1, 11.5_

- [ ] 2. Implement backend API endpoints
  - [x] 2.1 Create unified getMeterElements endpoint with filtering
    - Implement GET /api/meters/elements endpoint with optional query parameters
    - Support filtering by: type (physical/virtual), excludeIds (comma-separated), searchQuery
    - Query database for meters matching filters
    - Return meters with id, name, identifier fields
    - Format response consistently with favorites display
    - Endpoint reusable for: favorites, meter readings sidebar, combined meters selector
    - _Requirements: 12.1, 12.4_
  
  - [ ]* 2.2 Write unit tests for getMeterElements endpoint
    - Test endpoint returns all available meters
    - Test filtering by type parameter
    - Test filtering by excludeIds parameter
    - Test filtering by searchQuery parameter
    - Test response format includes required fields
    - Test error handling for database failures
    - _Requirements: 12.1, 12.4_
  
  - [x] 2.3 Create virtual meter config GET endpoint
    - Implement GET /api/meters/:meterId/virtual-config endpoint
    - Query meter_virtual table for selected meters
    - Return selected meters with full details
    - _Requirements: 11.3, 4.2_
  
  - [x] 2.4 Create virtual meter config POST endpoint
    - Implement POST /api/meters/:meterId/virtual-config endpoint
    - Accept selectedMeterIds and selectedMeterElementIds in request body
    - Insert/update records in meter_virtual table
    - Return success response with saved configuration
    - _Requirements: 11.2, 8.1_
  
  - [ ]* 2.5 Write unit tests for virtual meter endpoints
    - Test GET endpoint returns correct selected meters
    - Test POST endpoint saves selections correctly
    - Test error handling for invalid meter IDs
    - Test concurrent save operations
    - _Requirements: 11.2, 11.3, 11.4_

- [ ] 3. Implement frontend data layer
  - [x] 3.1 Create Meter and VirtualMeterConfig types
    - Define TypeScript interfaces for Meter, VirtualMeterConfig
    - Export types from types file
    - _Requirements: 1.1_
  
  - [x] 3.2 Create API service for meter operations
    - Implement getMeterElements() function with filtering support
    - Implement getVirtualMeterConfig() function
    - Implement saveVirtualMeterConfig() function
    - Add error handling and retry logic
    - _Requirements: 12.1, 12.3, 11.2, 11.3, 11.4_
  
  - [ ]* 3.3 Write unit tests for API service
    - Test getMeterElements calls correct endpoint with filters
    - Test getVirtualMeterConfig retrieves saved selections
    - Test saveVirtualMeterConfig sends correct data
    - Test error handling and retry logic
    - _Requirements: 12.1, 12.3_

- [ ] 4. Implement reusable DualListSelector framework component
  - [x] 4.1 Create DualListSelector component in framework
    - Create React component in @framework/components/dual-list-selector
    - Implement state management for available and selected items
    - Add Material Design styling for lists
    - Add scrollable containers
    - Export component for reuse across application
    - _Requirements: 3.1, 4.1_
  
  - [x] 4.2 Implement SearchBox in DualListSelector
    - Add search input field at top of component
    - Implement real-time filtering of both lists
    - Add Material Design styling
    - Add placeholder text
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 4.3 Implement ListItem component for DualListSelector
    - Create React component to display item name and identifier
    - Implement double-click handler
    - Implement drag event handlers (onDragStart, onDragEnd)
    - Add Material Design styling
    - Add hover and focus states
    - _Requirements: 3.2, 5.1, 5.2, 6.1, 6.2_
  
  - [x] 4.4 Implement double-click functionality
    - Add double-click handler to list items
    - Move item from left to right on double-click
    - Move item from right to left on double-click
    - Update both lists immediately
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 4.5 Write property test for double-click moves items
    - **Property 3: Double-click moves items between lists**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [x] 4.6 Implement drag-and-drop functionality
    - Add drag event handlers to list items
    - Implement drop zones on both lists
    - Move item from source to target list on drop
    - Add visual feedback during drag (highlight drop zone)
    - Update both lists immediately
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 4.7 Write property test for drag-and-drop moves items
    - **Property 4: Drag-and-drop moves items between lists**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [x] 4.8 Implement delete key functionality
    - Add keyboard event handler for Delete key
    - Remove focused item from selected list
    - Add item back to available list
    - Update both lists immediately
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 4.9 Write property test for delete removes items
    - **Property 5: Delete key removes from selected list**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  
  - [x] 4.10 Implement keyboard navigation
    - Add Tab key navigation through list items
    - Add Arrow key navigation within lists
    - Add Enter key to activate double-click
    - Add focus management
    - _Requirements: 9.4_
  
  - [ ]* 4.11 Write property test for keyboard navigation
    - **Property 9: Keyboard navigation works for all interactive elements**
    - **Validates: Requirements 9.4**
  
  - [x] 4.12 Implement search filtering
    - Filter available list based on search query
    - Filter selected list based on search query
    - Update both lists in real-time as user types
    - Maintain search state during list operations
    - _Requirements: 2.2, 2.3, 2.4, 5.4_
  
  - [ ]* 4.13 Write property test for search filtering
    - **Property 1: Search filters both lists**
    - **Validates: Requirements 2.2, 2.3, 2.4**
  
  - [ ]* 4.14 Write property test for search state persistence
    - **Property 6: Search state persists during operations**
    - **Validates: Requirements 5.4**
  
  - [x] 4.15 Implement selected items exclusion
    - Filter out any item that appears in selected list
    - Apply filter after each list operation
    - Apply filter when search results are displayed
    - _Requirements: 3.4, 4.3_
  
  - [ ]* 4.16 Write property test for selected items exclusion
    - **Property 2: Selected meters excluded from available list**
    - **Validates: Requirements 3.4, 4.3**
  
  - [x] 4.17 Implement empty state messages
    - Display message when available list is empty
    - Display message when selected list is empty
    - Display message when search returns no results
    - Use Material Design styling for messages
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 4.18 Implement Material Design styling
    - Use Material Design color palette
    - Use Material Design typography
    - Use Material Design spacing and layout
    - Add hover and focus states for accessibility
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 4.19 Write unit tests for DualListSelector framework component
    - Test list items are rendered correctly
    - Test double-click moves items
    - Test drag-and-drop moves items
    - Test delete key removes items
    - Test keyboard navigation
    - Test search filtering
    - Test selected items exclusion
    - Test empty state messages
    - Test Material Design compliance
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 7.1, 7.2, 9.4, 2.2, 3.4, 10.1_

- [ ] 5. Implement CombinedMetersTab component
  - [x] 5.1 Create CombinedMetersTab component structure
    - Create React component that uses DualListSelector framework component
    - Implement state management for available and selected meters
    - Implement loading and error states
    - Add Material Design styling
    - _Requirements: 1.2, 1.3_
  
  - [x] 5.2 Implement component initialization
    - Load available meters from getMeterElements API on mount
    - Load previously selected meters from virtual meter config
    - Handle loading and error states
    - _Requirements: 1.4, 4.2, 12.1, 12.3_
  
  - [ ]* 5.3 Write property test for API loading
    - **Property 10: Available meters loaded from API on component mount**
    - **Validates: Requirements 1.4, 12.1, 12.3**
  
  - [x] 5.4 Implement real-time save on meter selection
    - Call saveVirtualMeterConfig API when meter is added
    - Call saveVirtualMeterConfig API when meter is removed
    - Show loading indicator during save
    - Handle save errors with retry option
    - Revert UI changes if save fails
    - _Requirements: 8.1, 8.3_
  
  - [ ]* 5.5 Write property test for persistence
    - **Property 7: Selected meters persist to database**
    - **Validates: Requirements 4.2, 8.1, 8.4, 11.2, 11.3, 11.4**
  
  - [x] 5.6 Implement tab disabled state
    - Disable tab until parent meter is saved
    - Show tooltip explaining why tab is disabled
    - Enable tab after parent meter is saved
    - Auto-save parent meter when first meter is selected
    - _Requirements: 1.2_
  
  - [ ]* 5.7 Write unit tests for CombinedMetersTab
    - Test component loads available meters on mount
    - Test component loads previously selected meters
    - Test real-time save on meter selection
    - Test error handling and retry
    - Test tab disabled state
    - Test auto-save parent meter
    - _Requirements: 1.2, 1.4, 4.2, 8.1, 8.3_

- [ ] 6. Integrate CombinedMetersTab into MeterForm
  - [x] 6.1 Add CombinedMetersTab to meter form tabs
    - Import CombinedMetersTab component
    - Add tab to TabContainer when meter type is virtual
    - Hide ElementsTab when meter type is virtual
    - Show ElementsTab when meter type is physical
    - _Requirements: 1.2_
  
  - [x] 6.2 Pass required props to CombinedMetersTab
    - Pass meterId prop
    - Pass isVirtual prop
    - Pass isParentSaved prop
    - Pass onError callback
    - _Requirements: 1.2_
  
  - [ ]* 6.3 Write integration tests for MeterForm integration
    - Test CombinedMetersTab appears for virtual meters
    - Test ElementsTab appears for physical meters
    - Test tab switching works correctly
    - Test data flows correctly between components
    - _Requirements: 1.2_

- [ ] 7. Implement API response validation
  - [x] 7.1 Add validation for getMeterElements response
    - Validate response contains required fields (id, name, identifier)
    - Filter out invalid meters
    - Log warnings for invalid data
    - _Requirements: 12.4_
  
  - [ ]* 7.2 Write property test for API response format
    - **Property 8: API response contains required fields**
    - **Validates: Requirements 3.2, 12.4**
  
  - [ ]* 7.3 Write unit tests for API response validation
    - Test valid response is processed correctly
    - Test invalid meters are filtered out
    - Test warnings are logged
    - _Requirements: 12.4_

- [ ] 8. Implement error handling and recovery
  - [x] 8.1 Add error handling for API failures
    - Handle getMeterElements API failures
    - Handle virtual meter config API failures
    - Handle save operation failures
    - Display user-friendly error messages
    - Provide retry buttons
    - _Requirements: 8.3_
  
  - [x] 8.2 Implement save failure recovery
    - Revert UI changes if save fails
    - Keep previous state in memory
    - Allow user to retry operation
    - _Requirements: 8.3_
  
  - [ ]* 8.3 Write unit tests for error handling
    - Test API failure error messages
    - Test save failure recovery
    - Test retry functionality
    - _Requirements: 8.3_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass (minimum 100 iterations each)
  - Ensure no console errors or warnings
  - Ask the user if questions arise

- [ ] 10. Final integration and verification
  - [x] 10.1 Test complete user flow
    - Create new virtual meter
    - Navigate to Combined Meters tab
    - Search for meters
    - Add meters via double-click
    - Add meters via drag-and-drop
    - Remove meters via delete key
    - Verify selections persist after reload
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 7.1, 7.2, 8.1, 8.4_
  
  - [x] 10.2 Verify Material Design compliance
    - Check colors match design system
    - Check typography matches design system
    - Check spacing matches design system
    - Check accessibility features work
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 10.3 Verify database schema
    - Verify meter_virtual table exists
    - Verify data is persisted correctly
    - Verify constraints are enforced
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property-based tests pass
  - Ensure no console errors or warnings
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check or similar library with minimum 100 iterations
- All tests should be automated and run in CI/CD pipeline
- Real-time save means each meter operation (add/remove) immediately persists to database
- Tab is disabled until parent meter is saved; first meter selection auto-saves parent
- DualListSelector is a reusable framework component for use across the application

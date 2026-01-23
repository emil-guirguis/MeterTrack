# Implementation Plan: Sidebar Favorites with Meter Readings

## Overview

This implementation plan breaks down the Sidebar Favorites with Meter Readings feature into discrete coding tasks. The tasks follow a logical progression: first setting up the component structure and data models, then implementing the favorites section, followed by the active meters section, meter expansion, readings grid, state persistence, and finally error handling and testing. Each task builds on previous work with no orphaned code.

## Tasks

- [x] 1. Set up project structure and core interfaces
  - Create directory structure for new components
  - Define TypeScript interfaces for Meter, Element, Favorite, MeterReading, and ExpandedState
  - Set up CSS modules for styling
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1_

- [x] 2. Implement SidebarMetersSection container component
  - Create SidebarMetersSection component with state management
  - Implement loadMeters() to fetch active meters from metersService
  - Implement loadFavorites() to fetch favorites from favoritesService
  - Implement loadExpandedState() to restore expanded meters from local storage
  - Wire component lifecycle to load data on mount
  - _Requirements: 1.1, 2.1, 6.1, 6.2, 6.4_

- [x] 3. Implement FavoritesSection presentational component
  - Create FavoritesSection component to display favorited items
  - Implement empty state message when no favorites exist
  - Display favorites in insertion order
  - Wire star click and element click handlers
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [-]* 3.1 Write property tests for FavoritesSection
  - **Property 1: Favorites Display Completeness**
  - **Property 2: Favorites Maintain Insertion Order**
  - **Validates: Requirements 1.3, 1.4, 6.4**

- [x] 4. Implement AllActiveMetersSection presentational component
  - Create AllActiveMetersSection component to display all active meters
  - Filter and display only active meters
  - Display each meter with name and star icon
  - Wire meter toggle and star click handlers
  - _Requirements: 2.1, 2.2, 2.4_

- [ ]* 4.1 Write property tests for AllActiveMetersSection
  - **Property 4: Active Meters Display Completeness**
  - **Property 5: Inactive Meters Exclusion**
  - **Property 6: Meter Display Consistency**
  - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 5. Implement MeterItem container component
  - Create MeterItem component to display individual meter
  - Implement meter expansion/collapse toggle
  - Display chevron icon for expanded state
  - Show elements indented below meter when expanded
  - Wire element click handler
  - _Requirements: 4.1, 4.3, 4.4_

- [ ]* 5.1 Write property tests for MeterItem
  - **Property 10: Meter Expansion Display**
  - **Property 12: Meter Collapse Toggle**
  - **Property 13: Expanded State Visual Indicator**
  - **Validates: Requirements 4.1, 4.3, 4.4**

- [x] 6. Implement MeterElementItem presentational component
  - Create MeterElementItem component to display individual element
  - Format element name as "element-element_name"
  - Display star icon for favorite toggle
  - Wire star click and element click handlers
  - _Requirements: 4.2, 8.1, 8.3_

- [ ]* 6.1 Write property tests for MeterElementItem
  - **Property 11: Element Name Formatting**
  - **Validates: Requirements 4.2, 8.1, 8.3**

- [x] 7. Implement star icon toggle functionality
  - Create StarIcon component with filled/outline states
  - Implement toggleFavorite() method in SidebarMetersSection
  - Call favoritesService.addFavorite() when star is clicked
  - Call favoritesService.removeFavorite() when filled star is clicked
  - Update UI immediately after toggle
  - _Requirements: 3.1, 3.2, 3.3, 3.6_

- [ ]* 7.1 Write property tests for star icon toggle
  - **Property 7: Star Icon Toggle State**
  - **Property 8: Favorite Persistence to Database**
  - **Property 9: Favorite Deletion from Database**
  - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 8. Implement ReadingsGridPanel container component
  - Create ReadingsGridPanel component to display meter readings
  - Display element name and meter name as context
  - Implement close button to hide grid and return to meter list
  - Wire loading and error state display
  - _Requirements: 5.3, 5.4_

- [x] 9. Implement readings grid data display
  - Integrate EditableDataGrid component from framework
  - Format readings using dataGridIntegration utility
  - Display columns: timestamp, value, unit
  - Fetch readings when element is clicked
  - _Requirements: 5.1, 5.2, 5.5_

- [ ]* 9.1 Write property tests for readings grid
  - **Property 15: Readings Grid Display Completeness**
  - **Property 16: Readings Grid Context Display**
  - **Property 17: Readings Grid Close Navigation**
  - **Property 18: Readings Data Formatting**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 10. Implement expanded state persistence to local storage
  - Implement persistExpandedState() to save expanded meters to local storage
  - Call persistExpandedState() when meter is toggled
  - Implement loadExpandedState() to restore from local storage on mount
  - Handle local storage errors gracefully
  - _Requirements: 6.1, 6.2_

- [ ]* 10.1 Write property tests for expanded state persistence
  - **Property 14: Expanded State Persistence**
  - **Property 22: Expanded State Reset on Storage Clear**
  - **Validates: Requirements 6.1, 6.2, 6.5**

- [x] 11. Implement loading indicators
  - Display loading indicator while fetching meters
  - Display loading indicator while fetching readings
  - Show loading state in appropriate UI sections
  - _Requirements: 7.1, 7.2_

- [ ]* 11.1 Write property tests for loading indicators
  - **Property 19: Loading Indicator Display**
  - **Validates: Requirements 7.1, 7.2**

- [x] 12. Implement error handling and recovery
  - Display error messages for meter fetch failures
  - Display error messages for readings fetch failures
  - Implement retry button for failed operations
  - Log errors to console for debugging
  - _Requirements: 7.3, 7.4, 7.5_

- [ ]* 12.1 Write property tests for error handling
  - **Property 20: Error Message Display**
  - **Property 21: Error Recovery Option**
  - **Validates: Requirements 7.3, 7.4, 7.5**

- [x] 13. Implement favorite removal from Favorites section
  - When favorite is removed, immediately remove from Favorites section
  - Update UI state when favorite is deleted
  - _Requirements: 1.5, 3.3_

- [ ]* 13.1 Write property tests for favorite removal
  - **Property 3: Favorite Removal Completeness**
  - **Validates: Requirements 1.5, 3.3**

- [x] 14. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests with minimum 100 iterations
  - Verify no console errors or warnings
  - Ask the user if questions arise

- [x] 15. Integration and wiring
  - Wire all components together in SidebarMetersSection
  - Verify data flows correctly between components
  - Test meter expansion, element display, and readings grid
  - Verify favorites persist and display correctly
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1_

- [ ]* 15.1 Write integration tests
  - Test complete flow: expand meter → click element → view readings
  - Test favorite workflow: mark favorite → verify in Favorites section → remove favorite
  - Test state persistence: expand meter → reload → verify expanded
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests with minimum 100 iterations
  - Run integration tests
  - Verify no console errors or warnings
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All components use TypeScript for type safety
- CSS modules are used for component-scoped styling
- Local storage is used for expanded state persistence
- Favorites service is used for database persistence

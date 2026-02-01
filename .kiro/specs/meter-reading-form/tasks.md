# Implementation Plan: Meter Reading Form

## Overview

This implementation plan breaks down the meter reading form feature into discrete TypeScript/React development tasks. Each task builds incrementally, starting with core component structure, moving through data integration, and finishing with graph visualization and navigation. The plan includes property-based tests as sub-tasks to validate correctness properties early in development.

## Tasks

- [x] 1. Set up project structure and core types
  - Create MeterReadingForm component file structure
  - Define TypeScript interfaces for MeterReading, Meter, MeterElement, GraphDataPoint
  - Set up component state management using React hooks
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Implement MeterInfoPanel component
  - Create component to display driver name, description, serial number
  - Display reading timestamp
  - Handle missing data with placeholder text
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.1 Write property test for meter information completeness
    - **Property 2: Meter Information Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Implement ReadingDataTable component
  - Create table structure with sections (Total Consumption, Total Generation)
  - Organize data by phase columns (Overall, Phase 1, Phase 2, Phase 3)
  - Display numeric values with units
  - Handle null/missing phase data with indicators
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.1 Write property test for reading values organization
    - **Property 3: Reading Values Organization**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 3.2 Write property test for numeric values with units
    - **Property 4: Numeric Values with Units**
    - **Validates: Requirements 3.3**

- [x] 4. Implement frequency display in ReadingDataTable
  - Add frequency row to data table
  - Display frequency value with Hz unit
  - Handle missing frequency data
  - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 4.1 Write property test for frequency display
    - **Property 5: Frequency Display**
    - **Validates: Requirements 4.1, 4.2**

- [x] 5. Implement ConsumptionGraph component with time period filters
  - Create graph component using existing dashboard card component
  - Add time period filter buttons (Today, Weekly, Monthly, Yearly)
  - Implement time period selection state management
  - Fetch graph data based on selected time period
  - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 5.1 Write property test for time period filter options
    - **Property 6: Time Period Filter Options**
    - **Validates: Requirements 5.1**

  - [ ]* 5.2 Write property test for graph update on time period change
    - **Property 7: Graph Update on Time Period Change**
    - **Validates: Requirements 5.2, 5.3**

- [x] 6. Implement graph type toggle (Consumption, Demand, GHG Emissions)
  - Add graph type toggle buttons to ConsumptionGraph
  - Implement graph type selection state management
  - Update graph data based on selected graph type
  - Persist graph type selection across time period changes
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 6.1 Write property test for graph type toggle options
    - **Property 8: Graph Type Toggle Options**
    - **Validates: Requirements 6.1**

  - [ ]* 6.2 Write property test for graph update on type change
    - **Property 9: Graph Update on Type Change**
    - **Validates: Requirements 6.2**

  - [ ]* 6.3 Write property test for graph type persistence
    - **Property 10: Graph Type Persistence**
    - **Validates: Requirements 6.3**

- [x] 7. Implement navigation to meter reading list
  - Add button to navigate to MeterReadingList component
  - Pass meter element ID to filter the list
  - Implement navigation using existing routing mechanisms
  - _Requirements: 7.1, 7.2_

  - [ ]* 7.1 Write property test for navigation button presence
    - **Property 11: Navigation Button Presence**
    - **Validates: Requirements 7.1**

  - [ ]* 7.2 Write property test for navigation to filtered list
    - **Property 12: Navigation to Filtered List**
    - **Validates: Requirements 7.2**

- [x] 8. Implement data loading and error handling
  - Add loading state indicator while fetching meter reading data
  - Display error messages when data fetch fails
  - Provide retry button on error
  - Prevent display of partial or stale data on error
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 8.1 Write property test for no partial data on error
    - **Property 14: No Partial Data on Error**
    - **Validates: Requirements 9.4**

- [x] 9. Integrate MeterReadingForm with existing meter services
  - Use existing meter reading service API to fetch last reading
  - Use existing meter store for state management
  - Follow existing component patterns and styling conventions
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 10. Implement responsive layout
  - Arrange components: meter info at top, reading values in middle, graphs below
  - Stack components vertically on mobile screens
  - Adjust graph sizes for different screen sizes
  - Ensure no horizontal scrolling on standard screen sizes
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11. Implement empty states and edge cases
  - Display message when no meter readings exist
  - Display message when no graph data exists for selected time period
  - Display message when meter information is missing
  - Display loading indicator during data fetch
  - _Requirements: 1.3, 2.4, 5.4, 6.4, 9.1_

- [x] 12. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests with minimum 100 iterations
  - Verify no console errors or warnings
  - Ask the user if questions arise

- [x] 13. Integration testing
  - Test complete flow: navigate to form → view reading → change graph filters → navigate to list
  - Test data consistency between form and list views
  - Test error recovery (error → retry → success)
  - Test responsive layout on different screen sizes
  - _Requirements: 1.1, 5.2, 6.2, 7.2, 8.1, 8.2_

  - [ ]* 13.1 Write integration tests for complete user flows
    - Test navigation and data consistency
    - _Requirements: 1.1, 5.2, 6.2, 7.2_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests with minimum 100 iterations
  - Run integration tests
  - Verify responsive design on multiple screen sizes
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional test-related sub-tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation of functionality
- All components should follow existing styling conventions from the dashboard card components
- Use existing meter reading service APIs for data fetching
- Integrate with existing meter store for state management


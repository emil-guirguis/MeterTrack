# Implementation Plan: Fix Meter Readings Datagrid Loading

## Overview

The meter readings datagrid fails to display data when a user clicks on a favorite meter element. The fix involves three main steps:

1. Ensure MeterReadingManagementPage correctly extracts and passes tenantId, meterId, and meterElementId to the store
2. Fix MeterReadingList's filtering logic to not hide the loading state
3. Verify the data displays correctly in the datagrid

The root issue is that `filteredData` returns an empty array while loading, which prevents the loading indicator from showing. We need to show the loading state while data is being fetched, then display the data once it arrives.

## Tasks

- [x] 1. Fix MeterReadingList filtering logic to preserve loading state
  - Modify the `filteredData` memoized value to return `baseList.data` when loading is true, instead of an empty array
  - This allows the loading indicator to display while data is being fetched
  - Once data arrives, the filtered results will display
  - _Requirements: 1.2, 1.3, 1.4_

- [ ]* 1.1 Write property test for data display
  - **Property 3: Fetched Data Displays in Grid**
  - **Validates: Requirements 1.3**
  - Test that when meter readings are fetched successfully, they render in the datagrid

- [x] 2. Verify MeterReadingManagementPage correctly passes all three parameters
  - Confirm that tenantId (from auth.user?.client), meterId, and meterElementId are all passed to store.fetchItems()
  - Check that the fetch parameters object includes all three values
  - _Requirements: 1.1, 1.2_

- [ ]* 2.1 Write property test for parameter extraction
  - **Property 1: Favorite Value Extraction**
  - **Validates: Requirements 1.1**
  - Test that when a favorite is clicked, the three required values are correctly extracted

- [x] 3. Verify store.fetchItems() includes filter parameters in API request
  - Confirm that meterId and meterElementId are added to the query string when provided
  - Check that the API endpoint receives these parameters correctly
  - _Requirements: 1.2_

- [ ]* 3.1 Write property test for fetch parameters
  - **Property 2: Grid Uses Extracted Values**
  - **Validates: Requirements 1.2**
  - Test that when values are passed to MeterReadingList, the fetch call includes them as parameters

- [x] 4. Test the complete flow end-to-end
  - Navigate to `/meter-readings?meterId=1&elementId=8`
  - Verify the datagrid shows loading state initially
  - Verify data displays once the API responds
  - Verify the grid is not empty
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 4.1 Write property test for grid not empty
  - **Property 4: Grid Not Empty After Load**
  - **Validates: Requirements 1.4**
  - Test that after successful data fetch, the grid contains data and is not empty

- [x] 5. Checkpoint - Verify all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass with minimum 100 iterations
  - Verify the datagrid displays data correctly when navigating via favorite

# Implementation Plan: AI Search Feature Fix

## Overview

This implementation plan fixes the broken AI search feature by addressing the search algorithm bug, improving keyword matching, fixing authentication issues, and adding comprehensive testing. The work is organized into phases: backend fixes, frontend improvements, testing, and integration.

## Tasks

- [x] 1. Fix Backend Search Algorithm
  - [x] 1.1 Remove device filtering by readings
    - Modify `performKeywordSearch()` to include devices without recent readings
    - Add placeholder data for devices without readings (value: 0, timestamp: current)
    - _Requirements: Design - Property 4_
  
  - [x] 1.2 Improve keyword matching algorithm
    - Add support for partial keyword matches (not just exact matches)
    - Implement case-insensitive matching for all fields
    - Add scoring for partial matches (lower score than exact matches)
    - _Requirements: Design - Property 2, Property 3_
  
  - [x] 1.3 Enhance relevance scoring
    - Exact name match: +10 points
    - Partial name match: +5 points
    - Type match: +3 points
    - Location match: +2 points
    - Status match: +1 point
    - Normalize scores to 0-1 range
    - _Requirements: Design - Property 1_
  
  - [ ]* 1.4 Write unit tests for search algorithm
    - Test exact name matching
    - Test partial name matching
    - Test type, location, status matching
    - Test scoring calculation
    - Test sorting by relevance
    - Test devices without readings are included
    - _Requirements: Design - Property 1, Property 2, Property 3, Property 4_

- [x] 2. Fix Frontend Authentication
  - [x] 2.1 Verify token retrieval mechanism
    - Check what token key is actually used in localStorage/sessionStorage
    - Verify token is set after login
    - Add console logging to debug token retrieval
    - _Requirements: Design - Property 7_
  
  - [x] 2.2 Improve error handling for failed searches
    - Add try-catch around fetch call
    - Log error details to console
    - Display user-friendly error message
    - Handle network errors gracefully
    - _Requirements: Design - Error Handling_
  
  - [x] 2.3 Add loading state during search
    - Show loading indicator while search is in progress
    - Disable search input during search
    - Add timeout for long-running searches
    - _Requirements: Design - User Experience_

- [x] 3. Add Backend Error Handling
  - [x] 3.1 Improve error messages
    - Add specific error codes for different failure scenarios
    - Include helpful error messages for debugging
    - Log errors with full context
    - _Requirements: Design - Error Handling_
  
  - [x] 3.2 Add validation for search parameters
    - Validate query is non-empty string
    - Validate limit is positive integer
    - Validate offset is non-negative integer
    - Return 400 for invalid parameters
    - _Requirements: Design - Error Handling_
  
  - [x] 3.3 Add tenant isolation verification
    - Verify tenantId is present in request context
    - Verify all queries filter by tenantId
    - Add logging for tenant context
    - _Requirements: Design - Property 6_

- [x] 4. Checkpoint - Backend fixes complete
  - Ensure all backend changes are in place
  - Verify search algorithm returns results for devices without readings
  - Test with sample data to confirm fixes work
  - Ask the user if questions arise

- [x] 5. Add Property-Based Tests
  - [x] 5.1 Write property test for relevance scoring
    - **Property 1: Search Results Relevance**
    - Generate random devices and search queries
    - Verify all results have score > 0
    - Verify results sorted by score descending
    - _Requirements: Design - Property 1_
  
  - [x] 5.2 Write property test for keyword matching
    - **Property 2: Keyword Matching Consistency**
    - Generate random devices with names
    - Generate search queries that match device names
    - Verify matching devices appear in results
    - _Requirements: Design - Property 2_
  
  - [x] 5.3 Write property test for partial matching
    - **Property 3: Partial Match Inclusion**
    - Generate random device names
    - Generate partial search queries
    - Verify devices with partial matches are included
    - _Requirements: Design - Property 3_
  
  - [x] 5.4 Write property test for devices without readings
    - **Property 4: Device Without Readings Inclusion**
    - Generate random devices without readings
    - Search for those devices
    - Verify they appear in results
    - _Requirements: Design - Property 4_
  
  - [x] 5.5 Write property test for pagination
    - **Property 5: Pagination Correctness**
    - Generate random devices
    - Test various limit and offset combinations
    - Verify results respect pagination boundaries
    - _Requirements: Design - Property 5_
  
  - [x] 5.6 Write property test for tenant isolation
    - **Property 6: Tenant Isolation**
    - Generate devices for multiple tenants
    - Search from each tenant
    - Verify only that tenant's devices are returned
    - _Requirements: Design - Property 6_
  
  - [x] 5.7 Write property test for authentication
    - **Property 7: Authentication Required**
    - Test with valid tokens
    - Test with invalid tokens
    - Test with missing tokens
    - Verify appropriate error responses
    - _Requirements: Design - Property 7_

- [x] 6. Add Integration Tests
  - [x] 6.1 Test end-to-end search flow
    - Create test devices in database
    - Create test meters for devices
    - Create test readings for meters
    - Perform search from frontend
    - Verify results are displayed correctly
    - _Requirements: Design - Testing Strategy_
  
  - [x] 6.2 Test voice search functionality
    - Verify voice recognition triggers search
    - Verify voice input is converted to text
    - Verify search results are displayed
    - _Requirements: Design - Components and Interfaces_
  
  - [x] 6.3 Test pagination in UI
    - Search for query with many results
    - Verify "View all" button works
    - Verify pagination displays correct results
    - _Requirements: Design - Components and Interfaces_
  
  - [x] 6.4 Test error scenarios
    - Test with empty query
    - Test with no matching results
    - Test with authentication failure
    - Test with network error
    - _Requirements: Design - Error Handling_

- [x] 7. Checkpoint - All tests passing
  - Ensure all unit tests pass
  - Ensure all property-based tests pass
  - Ensure all integration tests pass
  - Ask the user if questions arise

- [x] 8. Frontend UI Improvements
  - [x] 8.1 Add "no results" message
    - Display helpful message when no results found
    - Suggest alternative search terms
    - _Requirements: Design - Error Handling_
  
  - [x] 8.2 Improve search results display
    - Show relevance score visually
    - Add device status indicator
    - Show last reading timestamp
    - _Requirements: Design - Components and Interfaces_
  
  - [x] 8.3 Add search suggestions
    - Show popular search terms
    - Show recent searches
    - Show device categories
    - _Requirements: Design - User Experience_

- [x] 9. Final Checkpoint - Feature complete
  - Ensure all tests pass
  - Verify search works end-to-end
  - Verify voice search works
  - Verify pagination works
  - Verify error handling works
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific design properties for traceability
- Property-based tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- All changes maintain backward compatibility
- All changes maintain tenant isolation
- All changes maintain security (authentication/authorization)

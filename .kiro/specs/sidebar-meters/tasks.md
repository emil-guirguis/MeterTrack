# Implementation Plan: Sidebar Meters Section

## Overview

This implementation plan breaks down the Sidebar Meters Section feature into discrete TypeScript/React coding tasks. The feature will be built incrementally, starting with core components, then adding data fetching, favorites functionality, and finally integration with the existing data grid. Each task builds on previous work with no orphaned code.

## Tasks

- [x] 1. Set up project structure and core types
  - Create directory structure: `src/components/SidebarMetersSection/`
  - Define TypeScript interfaces for Meter, MeterElement, Favorite, and MeterReading
  - Create types file: `types.ts`
  - Set up testing framework configuration for property-based tests
  - _Requirements: 1.1, 2.1, 4.1_

- [ ] 2. Implement MetersService for data fetching
  - [x] 2.1 Create MetersService with API methods
    - Implement `getMetersForTenant(tenantId: string)`
    - Implement `getMeterElements(meterId: string)`
    - Implement `getMeterReadings(meterId: string, limit?: number)`
    - Implement `getMeterElementReadings(meterId: string, elementId: string, limit?: number)`
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 2.2 Write property test for meter readings sorting
    - **Property 6: Meter Readings Sorted Descending**
    - **Validates: Requirements 2.1, 2.2**
    - Generate random readings with various dates, verify sorted by created_date descending

- [ ] 3. Implement FavoritesService for database operations
  - [x] 3.1 Create FavoritesService with database methods
    - Implement `getFavorites(tenantId: number, userId: number): Promise<Favorite[]>`
    - Implement `addFavorite(tenantId: number, userId: number, meterId: number, elementId?: number): Promise<Favorite>`
    - Implement `removeFavorite(tenantId: number, userId: number, meterId: number, elementId?: number): Promise<void>`
    - Implement `isFavorite(favorites: Favorite[], meterId: number, elementId?: number): boolean`
    - _Requirements: 3.5, 4.1, 4.2_
  
  - [ ]* 3.2 Write property test for favorite persistence
    - **Property 12: Favorites Persist Across Sessions**
    - **Validates: Requirements 3.4, 4.3**
    - Mark favorites, refresh data, verify same items are still marked
  
  - [ ]* 3.3 Write property test for tenant isolation in favorites
    - **Property 15: Tenant Isolation in Favorites Query**
    - **Validates: Requirements 4.5, 6.2**
    - Create favorites for different users/tenants, verify each user only sees their own

- [ ] 4. Implement MeterItem component
  - [x] 4.1 Create MeterItem component with expand/collapse
    - Render meter name with expand/collapse arrow
    - Handle expand/collapse state
    - Display favorite indicator (star icon) if favorited
    - Apply selection highlighting when selected
    - _Requirements: 1.1, 1.5, 5.4_
  
  - [x] 4.2 Add favorite toggle button to MeterItem
    - Display favorite button on hover
    - Handle favorite toggle callback
    - Update visual state immediately
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 4.3 Write unit tests for MeterItem component
    - Test expand/collapse functionality
    - Test selection highlighting
    - Test favorite button visibility on hover
    - Test favorite toggle callback

- [ ] 5. Implement MeterElementItem component
  - [x] 5.1 Create MeterElementItem component
    - Render element name
    - Display favorite indicator if favorited
    - Apply selection highlighting when selected
    - _Requirements: 1.2, 1.5, 5.4_
  
  - [x] 5.2 Add favorite toggle button to MeterElementItem
    - Display favorite button on hover
    - Handle favorite toggle callback
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 5.3 Write unit tests for MeterElementItem component
    - Test selection highlighting
    - Test favorite button visibility on hover
    - Test favorite toggle callback

- [ ] 6. Implement MetersList component with tree structure
  - [x] 6.1 Create MetersList component
    - Render list of MeterItem components
    - Manage expanded/collapsed state for each meter
    - Handle meter selection callbacks
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [x] 6.2 Implement favorites sorting logic
    - Sort meters with favorites first, then non-favorites
    - Sort meter elements within each meter (favorites first)
    - Maintain original order within each group
    - _Requirements: 1.3, 5.1, 5.2_
  
  - [ ]* 6.3 Write property test for favorites ordering
    - **Property 3: Favorites Appear First in List**
    - **Validates: Requirements 1.3, 5.1, 5.2**
    - Generate mixed favorite/non-favorite items, verify favorites appear first

- [ ] 7. Implement SidebarMetersSection main component
  - [x] 7.1 Create SidebarMetersSection container component
    - Accept props: tenantId, userId, onMeterSelect, onMeterElementSelect
    - Manage state: meters, favorites, expandedMeters, selectedItem, loading
    - _Requirements: 1.1, 2.1, 2.2_
  
  - [x] 7.2 Implement data loading on component mount
    - Load meters from MetersService on mount
    - Load favorites from FavoritesService on mount
    - Handle loading and error states
    - _Requirements: 1.1, 3.4_
  
  - [x] 7.3 Implement meter selection handler
    - Call onMeterSelect callback when meter is clicked
    - Update selectedItem state
    - Trigger data grid update
    - _Requirements: 2.1, 2.4_
  
  - [x] 7.4 Implement meter element selection handler
    - Call onMeterElementSelect callback when element is clicked
    - Update selectedItem state
    - Trigger data grid update
    - _Requirements: 2.2, 2.4_
  
  - [x] 7.5 Implement favorite toggle handler
    - Call FavoritesService to add/remove favorite
    - Update favorites state
    - Trigger re-sort of list
    - Handle errors gracefully
    - _Requirements: 3.2, 3.3, 3.5, 4.1, 4.2_
  
  - [ ]* 7.6 Write property test for tenant isolation in sidebar
    - **Property 18: Tenant Isolation in Sidebar Display**
    - **Validates: Requirements 6.1**
    - Create meters for different tenants, verify only current tenant's meters display

- [ ] 8. Integrate with existing data grid
  - [x] 8.1 Create data grid integration layer
    - Implement function to fetch readings for selected meter/element
    - Format readings for existing data grid schema
    - Sort readings by created_date descending
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 8.2 Implement loading indicator for data grid
    - Display loading state while fetching readings
    - Hide loading indicator when data is loaded
    - _Requirements: 2.5_
  
  - [x] 8.3 Wire sidebar selection to data grid updates
    - Pass selected meter/element to data grid
    - Trigger data grid refresh on selection change
    - _Requirements: 2.4_
  
  - [ ]* 8.4 Write property test for grid updates on selection
    - **Property 7: Grid Updates on Selection Change**
    - **Validates: Requirements 2.4**
    - Select different meters/elements, verify grid content changes

- [ ] 9. Implement error handling and validation
  - [x] 9.1 Add tenant validation for favorites
    - Validate meter belongs to current tenant before favoriting
    - Prevent cross-tenant access
    - _Requirements: 4.4, 6.4, 6.5_
  
  - [x] 9.2 Implement error handling for all API calls
    - Handle meter load failures with retry
    - Handle favorite operation failures with rollback
    - Handle readings load failures with error display
    - _Requirements: 2.5_
  
  - [x] 9.3 Add error messages and user feedback
    - Display error toast for failed operations
    - Show access denied message for cross-tenant attempts
    - _Requirements: 6.5_
  
  - [ ]* 9.4 Write property test for cross-tenant access prevention
    - **Property 20: Cross-Tenant Access Prevention**
    - **Validates: Requirements 6.5**
    - Attempt to access meter from different tenant, verify access denied

- [ ] 10. Implement session state persistence
  - [x] 10.1 Add session storage for expanded meters
    - Save expanded/collapsed state to session storage
    - Restore state on component mount
    - Update storage on expand/collapse
    - _Requirements: 1.4_
  
  - [ ]* 10.2 Write property test for session state persistence
    - **Property 4: Session State Persistence**
    - **Validates: Requirements 1.4**
    - Expand meter, navigate away, return, verify still expanded

- [x] 11. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests with minimum 100 iterations each
  - Verify no console errors or warnings
  - Ask the user if questions arise

- [x] 12. Add visual styling and polish
  - [x] 12.1 Style MeterItem and MeterElementItem components
    - Apply hover states for favorite button visibility
    - Style favorite indicator (star icon)
    - Apply selection highlighting
    - _Requirements: 1.5, 3.1, 5.4_
  
  - [x] 12.2 Style SidebarMetersSection container
    - Apply consistent spacing and typography
    - Ensure responsive layout
    - Add smooth transitions for expand/collapse
    - _Requirements: 1.1, 1.2_
  
  - [x] 12.3 Add loading and error state styling
    - Style loading spinner
    - Style error messages
    - _Requirements: 2.5_

- [x] 13. Final checkpoint - Ensure all tests pass and integration works
  - Run all unit tests and verify they pass
  - Run all property-based tests with minimum 100 iterations each
  - Test sidebar integration with data grid
  - Test favorites persistence across page refresh
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use minimum 100 iterations for comprehensive coverage
- All tests should be tagged with: **Feature: sidebar-meters, Property {number}: {property_text}**
- The favorites table already exists in the database with schema: `favorite_id`, `tenant_id`, `users_id`, `meter_id`, `meter_element_id`
- Session state is stored in browser session storage, not persisted to database
- Existing data grid schema should be reused without modification

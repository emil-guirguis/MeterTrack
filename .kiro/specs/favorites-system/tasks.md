# Implementation Plan: Favorites UI Implementation

## Overview

The implementation focuses on the frontend layer, adding star icons to meter elements and creating a Favorites section in the sidebar. The approach builds incrementally: first creating the star icon component, then integrating it with meter elements, then building the Favorites section, and finally synchronizing state across both sections.

## Tasks

- [x] 1. Create StarIcon component
  - [x] 1.1 Create StarIcon component with props for id1, id2, is_favorited, is_loading, on_click
    - Render filled star icon when is_favorited is true
    - Render outlined star icon when is_favorited is false
    - Show loading spinner when is_loading is true
    - Stop event propagation on click to prevent element click
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 1.2 Write unit tests for StarIcon component
    - Test filled star renders when is_favorited is true
    - Test outlined star renders when is_favorited is false
    - Test loading state displays during operations
    - _Requirements: 1.2, 1.3_

- [x] 2. Create FavoritesManager service
  - [x] 2.1 Create FavoritesManager class to handle favorite operations
    - Implement load_favorites(users_id, tenant_id) method to fetch all user favorites from API
    - Implement add_favorite(id1, id2, users_id, tenant_id) method to add favorite via API
    - Implement remove_favorite(id1, id2, users_id, tenant_id) method to remove favorite via API
    - Implement is_favorited(id1, id2) method to check if element is favorited
    - Maintain internal Map of favorites keyed by "id1:id2"
    - _Requirements: 1.4, 2.1, 2.3_
  
  - [ ]* 2.2 Write property test for favorites load
    - **Property 2: Favorites Load on Sidebar Init**
    - **Validates: Requirements 1.4**

- [x] 3. Integrate StarIcon into MeterElementItem component
  - [x] 3.1 Update MeterElementItem to include StarIcon
    - Add id1 and id2 props
    - Add is_favorited prop
    - Add on_star_click callback prop
    - Render element name formatted as "element-element_name"
    - Render StarIcon component next to element name
    - Handle element click (not star) to display meter readings grid
    - _Requirements: 1.1, 2.6, 5.2_
  
  - [ ]* 3.2 Write unit tests for MeterElementItem
    - Test element name formats correctly as "element-element_name"
    - Test star icon renders with correct state
    - Test element click displays readings grid
    - Test star icon click doesn't trigger element click
    - _Requirements: 1.1, 5.2_

- [x] 4. Implement star icon click handler
  - [x] 4.1 Create click handler that toggles favorite status
    - If element is not favorited: call add_favorite() and update state to filled
    - If element is favorited: call remove_favorite() and update state to outlined
    - Set is_loading to true during operation
    - Set is_loading to false after operation completes
    - _Requirements: 2.1, 2.3, 2.5_
  
  - [ ]* 4.2 Write property test for star click triggers API call
    - **Property 3: Star Click Triggers API Call**
    - **Validates: Requirements 2.1**
  
  - [ ]* 4.3 Write property test for UI updates after add
    - **Property 4: UI Updates After Add**
    - **Validates: Requirements 2.2**
  
  - [ ]* 4.4 Write property test for UI updates after remove
    - **Property 6: UI Updates After Remove**
    - **Validates: Requirements 2.4**

- [x] 5. Implement error handling for star icon operations
  - [x] 5.1 Add error handling to star icon click handler
    - Catch errors from add_favorite() and remove_favorite() calls
    - Display user-friendly error message
    - Keep star icon in previous state if operation fails
    - Provide retry option
    - Log error details for debugging
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 5.2 Write unit tests for error handling
    - Test error message displays on add failure
    - Test error message displays on remove failure
    - Test star icon state preserved on failure
    - Test retry option is available
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Create FavoritesSection component
  - [x] 6.1 Create FavoritesSection component
    - Display "Favorites" header that is visually distinct
    - Render list of favorited meter elements
    - Display empty state message when no favorites exist
    - Format each favorite as "meter_name - element-element_name"
    - _Requirements: 4.1, 4.3, 5.1, 5.2_
  
  - [ ]* 6.2 Write unit tests for FavoritesSection
    - Test Favorites section displays with correct header
    - Test empty state message displays when no favorites
    - Test favorited items display with correct format
    - _Requirements: 4.1, 4.3, 5.1, 5.2_

- [x] 7. Load favorites on sidebar initialization
  - [x] 7.1 Update SidebarMetersSection to load favorites on mount
    - Get logged-in users_id and tenant_id from auth context or props
    - Call FavoritesManager.load_favorites(users_id, tenant_id) on component mount
    - Store favorites in component state
    - Pass favorites to MeterElementItem components to set initial star icon state
    - Pass favorites to FavoritesSection component
    - _Requirements: 1.4, 1.5, 4.2_
  
  - [ ]* 7.2 Write property test for star icon state initialization
    - **Property 1: Star Icon Reflects Favorite Status**
    - **Validates: Requirements 1.2, 1.3, 1.5**

- [x] 8. Implement FavoritesSection item interactions
  - [x] 8.1 Add click handlers to FavoritesSection items
    - When favorite item is clicked: display meter readings grid for that element
    - When star icon on favorite is clicked: remove favorite and update section
    - Pass on_item_click and on_star_click callbacks to FavoritesSection
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 8.2 Write property test for favorite item click
    - **Property 8: Element Click Displays Grid**
    - **Validates: Requirements 2.6, 5.3**

- [x] 9. Implement real-time Favorites section updates
  - [x] 9.1 Sync Favorites section with star icon operations
    - When a favorite is added from meter elements: update Favorites section immediately
    - When a favorite is removed from meter elements: update Favorites section immediately
    - When a favorite is added from Favorites section: update star icons in meter elements immediately
    - When a favorite is removed from Favorites section: update star icons in meter elements immediately
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 9.2 Write property test for Favorites section updates
    - **Property 10: Favorites Section Updates on Add**
    - **Property 11: Favorites Section Updates on Remove**
    - **Validates: Requirements 4.4, 4.5, 6.1, 6.2**
  
  - [ ]* 9.3 Write property test for star icon sync
    - **Property 13: Star Icon Updates in Meter Section**
    - **Validates: Requirements 6.3, 6.4**

- [x] 10. Implement Favorites section display completeness
  - [x] 10.1 Ensure all user favorites display in Favorites section
    - Verify all favorites from API are rendered in Favorites section
    - Verify favorites maintain correct display format
    - _Requirements: 4.2, 5.1, 5.2_
  
  - [ ]* 10.2 Write property test for Favorites section completeness
    - **Property 9: Favorites Section Displays All User Favorites**
    - **Validates: Requirements 4.2**
  
  - [ ]* 10.3 Write property test for favorite item display format
    - **Property 12: Favorite Item Display Format**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass (minimum 100 iterations each)
  - Verify no console errors or warnings
  - Ask the user if questions arise

- [x] 12. Integration testing
  - [x] 12.1 Test complete favorite workflow
    - Add a meter element to favorites via star icon
    - Verify it appears in Favorites section
    - Verify star icon is filled
    - Remove meter element from favorites
    - Verify it disappears from Favorites section
    - Verify star icon is outlined
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.4, 4.5_
  
  - [ ]* 12.2 Test error scenarios
    - Test behavior when add favorite fails
    - Test behavior when remove favorite fails
    - Test behavior when load favorites fails
    - Verify error messages display correctly
    - Verify retry option works
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 12.3 Test real-time synchronization
    - Add favorite from meter section, verify Favorites section updates
    - Remove favorite from meter section, verify Favorites section updates
    - Add favorite from Favorites section, verify star icon updates
    - Remove favorite from Favorites section, verify star icon updates
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify complete feature works end-to-end
  - Ask the user if questions arise

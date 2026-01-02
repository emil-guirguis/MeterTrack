# Implementation Plan: Form Section Orientation Fix

## Overview

Fix the form layout system to properly respect the `sectionOrientation` property defined at the tab level. The issue is that CSS grid classes with `!important` override inline styles, preventing vertical orientation from working. This plan addresses the root cause by refactoring the layout calculation and CSS specificity.

## Tasks

- [ ] 1. Refactor layout calculation in BaseForm component
  - Create new `getLayoutStyle()` function that returns complete layout configuration
  - Handle both grid and flexbox layouts based on orientation
  - Apply styles directly to `.base-form__sections-container` via inline styles
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 2. Fix CSS specificity issues in BaseForm.css
  - Remove `!important` from `.base-form__main--grid-1/2/3` class definitions
  - Update CSS selectors to be more specific if needed
  - Ensure inline styles take precedence over CSS classes
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [ ] 3. Update BaseForm component to use new layout function
  - Replace `calculateGridColumns()` with `getLayoutStyle()`
  - Update `.base-form__sections-container` to use returned style object
  - Ensure layout updates when active tab changes
  - _Requirements: 1.1, 1.3_

- [ ]* 3.1 Write property test for vertical orientation layout
  - **Property 1: Vertical Orientation Single Column**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 3.2 Write property test for horizontal orientation layout
  - **Property 2: Horizontal Orientation Multi-Column**
  - **Validates: Requirements 1.2**

- [ ]* 3.3 Write property test for orientation persistence
  - **Property 3: Orientation Persistence Across Tab Switches**
  - **Validates: Requirements 1.3**

- [ ]* 3.4 Write property test for flex properties with vertical orientation
  - **Property 4: Flex Properties with Vertical Orientation**
  - **Validates: Requirements 1.4, 2.1, 2.2**

- [ ] 4. Test with Contact form (vertical orientation example)
  - Verify Contact form "Additional Info" tab renders vertically
  - Verify sections stack in single column
  - Verify switching tabs updates layout correctly
  - _Requirements: 1.1, 1.3_

- [ ] 5. Test with Meter form (mixed orientations)
  - Verify Meter form tabs with different orientations work correctly
  - Verify horizontal tabs render multi-column
  - Verify vertical tabs render single column
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Focus on core layout fix first (tasks 1-3)
- Property tests validate universal correctness properties
- Manual testing with Contact and Meter forms ensures real-world functionality


# Implementation Plan: Material Design 3 Outlined FormField

- [x] 1. Update FormField component structure for floating label pattern





  - Modify renderInput() to return label after input for CSS sibling selector
  - Update all input type cases (textarea, select, email, url, tel, default) to include label
  - Change placeholder from actual text to space character " " to enable :not(:placeholder-shown) selector
  - _Requirements: 1.1, 1.2, 1.3_

- [x]* 1.1 Write property test for outlined border display
  - **Feature: formfield-material-design-outlined, Property 1: Outlined Border Display**
  - **Validates: Requirements 1.1**





- [x] 2. Update FormField.css with Material Design 3 outlined styling

  - Add CSS custom properties for Material Design 3 colors (primary, error, outline, surface, etc.)
  - Update input, textarea, select styling with outlined border and proper padding
  - Implement floating label animation with cubic-bezier timing
  - Update focus state styling with primary color outline
  - Update error state styling with error color
  - Update disabled state styling with reduced opacity
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 4.1_

- [x]* 2.1 Write property test for floating label on focus
  - **Feature: formfield-material-design-outlined, Property 2: Floating Label on Focus**
  - **Validates: Requirements 1.2**

- [x]* 2.2 Write property test for floating label with value
  - **Feature: formfield-material-design-outlined, Property 3: Floating Label with Value**
  - **Validates: Requirements 1.3**




- [x]* 2.3 Write property test for error state styling
  - **Feature: formfield-material-design-outlined, Property 4: Error State Styling**
  - **Validates: Requirements 1.4**

- [x] 3. Update checkbox and radio styling to maintain current patterns





  - Verify checkbox and radio fields maintain existing styling
  - Update accent-color to use primary color CSS custom property
  - Ensure checkbox/radio do not get outlined border wrapper
  - _Requirements: 2.4_




- [x]* 3.1 Write property test for checkbox and radio styling preservation
  - **Feature: formfield-material-design-outlined, Property 8: Checkbox and Radio Styling Preservation**
  - **Validates: Requirements 2.4**


- [x] 4. Update edit button styling for Material Design





  - Update edit button border and background colors to use CSS custom properties
  - Update hover state with primary color background tint
  - Update focus state with primary color outline
  - _Requirements: 4.1_





- [x] 5. Add required indicator styling
  - Verify asterisk displays in label with error color
  - Ensure proper spacing and styling
  - _Requirements: 3.3_

- [x]* 5.1 Write property test for required indicator display
  - **Feature: formfield-material-design-outlined, Property 11: Required Indicator Display**
  - **Validates: Requirements 3.3**


- [x] 6. Verify error message display and styling
  - Ensure error messages display below field in error color
  - Verify appropriate spacing and font size
  - _Requirements: 3.4_

- [x]* 6.1 Write property test for error message display




  - **Feature: formfield-material-design-outlined, Property 12: Error Message Display**
  - **Validates: Requirements 3.4**



- [x] 7. Test all input types with Material Design styling
  - Render and verify text, email, password, number, url, tel input types
  - Render and verify textarea with appropriate height
  - Render and verify select field with dropdown
  - Verify consistent styling across all types
  - _Requirements: 2.1, 2.2, 2.3_

- [x]* 7.1 Write property test for input type styling consistency
  - **Feature: formfield-material-design-outlined, Property 5: Input Type Styling Consistency**
  - **Validates: Requirements 2.1**




- [x]* 7.2 Write property test for textarea Material Design styling
  - **Feature: formfield-material-design-outlined, Property 6: Textarea Material Design Styling**
  - **Validates: Requirements 2.2**

- [x]* 7.3 Write property test for select field styling
  - **Feature: formfield-material-design-outlined, Property 7: Select Field Styling**


  - **Validates: Requirements 2.3**


- [x] 8. Test disabled state appearance

  - Verify disabled fields display with reduced opacity

  - Verify disabled cursor is applied



  - _Requirements: 3.1_

- [x]* 8.1 Write property test for disabled field appearance
  - **Feature: formfield-material-design-outlined, Property 9: Disabled Field Appearance**
  - **Validates: Requirements 3.1**

- [x] 9. Verify focus transition smoothness
  - Check CSS transition timing uses cubic-bezier(0.4, 0, 0.2, 1)

  - Verify smooth color transitions on focus

  - _Requirements: 3.2_

- [x]* 9.1 Write property test for focus transition smoothness
  - **Feature: formfield-material-design-outlined, Property 10: Focus Transition Smoothness**
  - **Validates: Requirements 3.2**





- [x] 10. Verify CSS custom properties usage

  - Audit CSS file to ensure all colors and spacing use CSS custom properties
  - No hardcoded color values in Material Design styled elements
  - _Requirements: 4.1_

- [x]* 10.1 Write property test for CSS custom properties usage
  - **Feature: formfield-material-design-outlined, Property 13: CSS Custom Properties Usage**
  - **Validates: Requirements 4.1**

- [x] 11. Add prefers-reduced-motion support

  - Add media query for prefers-reduced-motion
  - Disable or minimize transitions when motion is reduced
  - _Requirements: 4.2_

- [x]* 11.1 Write property test for motion preference respect
  - **Feature: formfield-material-design-outlined, Property 14: Motion Preference Respect**
  - **Validates: Requirements 4.2**

- [x] 12. Test backward compatibility

  - Verify existing form implementations still work
  - Test with ContactForm, DeviceForm, MeterForm
  - Ensure no breaking changes to component API
  - _Requirements: 4.3_

- [x]* 12.1 Write property test for backward compatibility
  - **Feature: formfield-material-design-outlined, Property 15: Backward Compatibility**
  - **Validates: Requirements 4.3**

- [x] 13. Verify consistent Material Design application

  - Audit all field types for consistent Material Design principles
  - Verify spacing, colors, and interactions are consistent
  - _Requirements: 4.4_

- [x]* 13.1 Write property test for consistent Material Design application
  - **Feature: formfield-material-design-outlined, Property 16: Consistent Material Design Application**
  - **Validates: Requirements 4.4**

- [x] 14. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

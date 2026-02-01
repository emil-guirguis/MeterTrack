# Implementation Plan: Conditional Tab Display for Virtual vs Physical Meters

## Overview

This implementation adds conditional tab visibility to the meter form based on meter type. The approach is schema-driven and layered, starting with hook enhancements, then component updates, and finally schema configuration. Each step builds on the previous one with incremental validation through tests.

## Tasks

- [ ] 1. Enhance useFormTabs hook to support meter type filtering
  - [x] 1.1 Update useFormTabs hook signature to accept meterType parameter
    - Add `meterType?: 'physical' | 'virtual' | null` parameter to useFormTabs
    - Update TypeScript interfaces to include meterType
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 1.2 Implement tab filtering logic based on visibleFor property
    - Add filtering logic that checks tab.visibleFor against meterType
    - Ensure tabs without visibleFor are always included
    - Handle null/undefined meterType by showing all tabs
    - _Requirements: 2.2, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 1.3 Write property test for tab filtering with physical meter type
    - **Property 2: Physical meter shows only physical-visible tabs**
    - **Validates: Requirements 1.3, 4.1, 4.3, 7.2, 7.3**
  
  - [ ]* 1.4 Write property test for tab filtering with virtual meter type
    - **Property 3: Virtual meter shows only virtual-visible tabs**
    - **Validates: Requirements 1.4, 3.1, 3.3, 7.2, 7.3**
  
  - [ ]* 1.5 Write property test for backward compatibility (tabs without visibleFor)
    - **Property 1: Tabs without visibleFor are always visible**
    - **Validates: Requirements 1.2, 5.1, 5.2, 5.3, 7.4, 7.5**
  
  - [ ]* 1.6 Write property test for null meterType behavior
    - **Property 4: Null meterType shows all tabs**
    - **Validates: Requirements 2.4, 5.2, 5.3, 7.5**

- [ ] 2. Update BaseForm component to accept and use meterType prop
  - [x] 2.1 Add meterType prop to BaseFormProps interface
    - Add `meterType?: 'physical' | 'virtual' | null` to BaseFormProps
    - Update JSDoc comments to document the new prop
    - _Requirements: 2.1, 6.3_
  
  - [x] 2.2 Pass meterType to useFormTabs hook call
    - Update useFormTabs call to include meterType parameter
    - Ensure meterType is passed through the component lifecycle
    - _Requirements: 2.2, 6.3_
  
  - [ ]* 2.3 Write property test for BaseForm tab filtering
    - **Property 2: Physical meter shows only physical-visible tabs**
    - **Validates: Requirements 2.2, 6.3**

- [ ] 3. Update MeterForm component to determine and pass meter type
  - [x] 3.1 Implement meter type detection logic
    - Extract meter_type from meter object or use meterType prop
    - Determine correct meter type value to pass to BaseForm
    - _Requirements: 6.1, 6.2_
  
  - [x] 3.2 Pass meterType prop to BaseForm component
    - Update BaseForm call to include meterType prop
    - Ensure meter type is passed correctly on initial render and updates
    - _Requirements: 6.2, 6.3_
  
  - [ ]* 3.3 Write property test for MeterForm meter type passing
    - **Property 8: MeterForm passes correct meterType to BaseForm**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 4. Checkpoint - Verify hook and component integration
  - Ensure all tests pass for useFormTabs and BaseForm changes
  - Verify no console errors or warnings
  - Ask the user if questions arise

- [ ] 5. Update MeterWithSchema to define tab visibility
  - [x] 5.1 Add visibleFor property to Elements tab
    - Set `visibleFor: ['physical']` on Elements tab
    - Ensure tab structure remains valid
    - _Requirements: 8.1_
  
  - [x] 5.2 Add Combined Meters tab with virtual visibility
    - Create new Combined Meters tab with `visibleFor: ['virtual']`
    - Ensure tab has same structure as Elements tab
    - _Requirements: 8.2_
  
  - [x] 5.3 Verify Meter tab has no visibleFor (visible for all)
    - Confirm Meter tab does not have visibleFor property
    - Ensure backward compatibility
    - _Requirements: 8.3_
  
  - [x] 5.4 Verify Additional Info tab has no visibleFor (visible for all)
    - Confirm Additional Info tab does not have visibleFor property
    - Ensure backward compatibility
    - _Requirements: 8.4_

- [x] 6. Checkpoint - Verify schema configuration
  - Ensure MeterWithSchema loads without errors
  - Verify schema is valid and contains all required tabs
  - Ask the user if questions arise

- [ ]* 7. Write unit tests for tab visibility behavior
  - [ ]* 7.1 Write unit test for physical meter tab visibility
    - Test that Elements tab appears for physical meters
    - Test that Combined Meters tab does not appear for physical meters
    - Test that Meter and Additional Info tabs appear
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [ ]* 7.2 Write unit test for virtual meter tab visibility
    - Test that Combined Meters tab appears for virtual meters
    - Test that Elements tab does not appear for virtual meters
    - Test that Meter and Additional Info tabs appear
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ]* 7.3 Write unit test for tab switching between meter types
    - Test switching from physical to virtual meter
    - Test switching from virtual to physical meter
    - Verify tabs update correctly
    - _Requirements: 3.3, 4.3_
  
  - [ ]* 7.4 Write unit test for backward compatibility
    - Test that existing schemas without visibleFor work unchanged
    - Test that tabs without visibleFor appear for all meter types
    - _Requirements: 5.1, 5.4_

- [ ]* 8. Write property test for tab list consistency
  - **Property 5: Tab filtering is consistent across meter types**
  - **Validates: Requirements 1.5, 2.2**

- [ ]* 9. Write property test for filtered tab removal
  - **Property 6: Filtered tabs are completely removed from rendering**
  - **Validates: Requirements 2.3, 3.4, 4.2**

- [ ]* 10. Write property test for tab list updates on meter type change
  - **Property 7: Tab list updates when meterType changes**
  - **Validates: Requirements 2.5, 3.3, 4.3, 6.4**

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass (minimum 100 iterations each)
  - Verify no console errors or warnings
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Both test types are complementary and necessary for comprehensive coverage
- The implementation is backward compatible - existing schemas continue to work unchanged

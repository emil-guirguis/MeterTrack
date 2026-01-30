# Implementation Plan: Register Display Names

## Overview

This implementation plan breaks down the register display names feature into discrete, incremental tasks. The approach starts with backend API support, then implements the frontend service, and finally updates the meter reading and dashboard components to use register names.

## Tasks

- [x] 1. Create backend API endpoint for registers
  - [x] 1.1 Create GET /api/registers endpoint
    - Return all registers with register_id, name, register, unit, field_name
    - Include pagination support
    - _Requirements: 3.1_
  
  - [x] 1.2 Add authentication and authorization checks
    - Verify user is authenticated
    - Ensure endpoint is accessible
    - _Requirements: 3.1_
  
  - [ ]* 1.3 Write unit tests for registers endpoint
    - Test endpoint returns all registers
    - Test response format is correct
    - Test error handling
    - _Requirements: 3.1_

- [x] 2. Create RegisterMappingService
  - [x] 2.1 Create service class with initialization
    - Fetch registers from backend API
    - Cache mappings in memory
    - Handle initialization errors
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 2.2 Implement getRegisterName function
    - Look up register name by field name
    - Return formatted field name as fallback
    - _Requirements: 3.3, 3.4_
  
  - [x] 2.3 Implement getRegisterUnit function
    - Look up register unit by field name
    - Return empty string as fallback
    - _Requirements: 3.3, 3.4_
  
  - [x] 2.4 Implement hasRegister function
    - Check if field name exists in cache
    - _Requirements: 3.3_
  
  - [x] 2.5 Implement getAllMappings function
    - Return all cached mappings
    - _Requirements: 3.3_
  
  - [ ]* 2.6 Write unit tests for RegisterMappingService
    - **Property 1: Register Name Mapping Accuracy**
    - **Property 2: Fallback for Missing Registers**
    - **Property 3: Cache Consistency**
    - Test initialization and caching
    - Test error handling
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 3. Update meter reading configuration
  - [x] 3.1 Update column labels to use register names
    - Modify meterReadingColumns to use RegisterMappingService
    - Display register name with unit
    - Implement fallback formatting
    - _Requirements: 1.1, 4.1, 4.2_
  
  - [x] 3.2 Update export headers to use register names
    - Modify meterReadingExportConfig headers
    - Use register names instead of hardcoded strings
    - _Requirements: 4.3_
  
  - [x] 3.3 Update stats labels to use register names
    - Modify meterReadingStats labels
    - Use register names for clarity
    - _Requirements: 4.4_
  
  - [ ]* 3.4 Write unit tests for meter reading configuration
    - Test columns display register names
    - Test export headers use register names
    - Test stats labels use register names
    - Test fallback behavior
    - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4_

- [x] 4. Update dashboard components
  - [x] 4.1 Update DashboardCard component
    - Modify card labels to use register names
    - Display register name with unit
    - Implement fallback formatting
    - _Requirements: 2.1, 5.1, 5.2_
  
  - [x] 4.2 Update dashboard metric displays
    - Modify metric labels to use register names
    - Update filter labels to use register names
    - _Requirements: 5.2, 5.3_
  
  - [x] 4.3 Update dashboard exports
    - Modify export headers to use register names
    - _Requirements: 5.4_
  
  - [ ]* 4.4 Write unit tests for dashboard components
    - Test card labels display register names
    - Test metric displays use register names
    - Test filter labels use register names
    - Test export headers use register names
    - Test fallback behavior
    - _Requirements: 2.1, 5.1, 5.2, 5.3, 5.4_

- [x] 5. Checkpoint - Ensure all backend and service tests pass
  - Ensure all unit tests pass
  - Verify API endpoint works correctly
  - Verify service initialization and caching work
  - Ask the user if questions arise

- [x] 6. Integration testing
  - [x] 6.1 Test meter reading list displays register names
    - Verify columns show register names
    - Verify fallback works for missing registers
    - _Requirements: 1.1, 1.4_
  
  - [x] 6.2 Test dashboard cards display register names
    - Verify card labels show register names
    - Verify metric displays show register names
    - Verify fallback works for missing registers
    - _Requirements: 2.1, 2.4_
  
  - [x] 6.3 Test exports use register names
    - Verify export headers use register names
    - Verify exported data is correct
    - _Requirements: 4.3, 5.4_
  
  - [ ]* 6.4 Write integration tests
    - Test end-to-end register name display
    - Test fallback behavior in real scenarios
    - Test cache updates
    - _Requirements: All_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all unit, property, and integration tests pass
  - Verify meter reading columns display register names
  - Verify dashboard cards display register names
  - Verify exports use register names
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Fallback formatting is critical for robustness


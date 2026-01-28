# Implementation Plan: Meter Readings Fetch Fix

## Overview

This implementation plan addresses the critical schema mismatch causing 500 errors in the meter readings endpoint. The fix involves three coordinated changes: updating the MeterReadingsWithSchema model to match the actual database schema, simplifying the toFrontendReading mapper function, and adding comprehensive error handling throughout the endpoint. The work is organized to validate core functionality early through incremental testing.

## Tasks

- [ ] 1. Fix MeterReadingsWithSchema Model Definition
  - [ ] 1.1 Update schema to define only the 9 actual database columns
    - Remove all non-existent field definitions (phaseAVoltage, phaseBVoltage, totalActivePower, etc.)
    - Define only: meter_reading_id, tenant_id, meter_id, reading_timestamp, data_point, value, unit, created_at, updated_at
    - Ensure field types match database column types
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 1.2 Write property test for schema definition correctness
    - **Property 1: Schema Definition Correctness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
    - Verify schema contains exactly 9 fields
    - Verify no extra fields are defined
    - Verify initialization with valid records succeeds

- [ ] 2. Simplify and Fix toFrontendReading Mapper Function
  - [ ] 2.1 Rewrite mapper to safely handle only existing database fields
    - Remove all mappings for non-existent fields
    - Map only the 9 actual database columns to frontend field names
    - Use safe property access (no fallback chains)
    - Ensure all returned fields are serializable
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 2.2 Write property test for mapper function correctness
    - **Property 2: Mapper Function Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - Generate random valid meter reading records
    - Verify all expected fields present in output
    - Verify JSON serialization succeeds
    - Verify no undefined values in output

- [ ] 3. Add Error Handling to Meter Readings Endpoint
  - [ ] 3.1 Add try-catch blocks and detailed logging to GET / endpoint
    - Wrap database query in try-catch
    - Wrap mapper function in try-catch
    - Log errors with context (tenant ID, query params, error message)
    - Return appropriate HTTP status codes (401, 403, 500)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 3.2 Write property test for error handling and logging
    - **Property 3: Error Handling and Logging**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Generate various error conditions
    - Verify appropriate status codes returned
    - Verify error messages are descriptive
    - Verify logs contain required context

- [ ] 4. Verify Tenant Filtering Implementation
  - [ ] 4.1 Review and test tenant filtering in GET / endpoint
    - Verify all queries include WHERE tenant_id = $1
    - Verify tenant ID comes from authenticated user context
    - Verify responses only include readings for user's tenant
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 4.2 Write property test for tenant data isolation
    - **Property 4: Tenant Data Isolation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    - Generate requests from multiple tenants
    - Verify each tenant only gets their readings
    - Verify cross-tenant access rejected with 403
    - Verify missing tenant context rejected with 401

- [ ] 5. Verify Response Format Consistency
  - [ ] 5.1 Ensure endpoint returns consistent response format
    - Verify success flag is always present
    - Verify data object contains items array
    - Verify pagination info includes total, page, pageSize, totalPages, hasMore
    - Verify each reading has all required fields
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 5.2 Write property test for response format consistency
    - **Property 5: Response Format Consistency**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    - Generate various valid requests
    - Verify response structure consistent
    - Verify all required fields present
    - Verify pagination info correct
    - Verify frontend can process response

- [ ] 6. Remove Unused meterReadingMapper.js File
  - [ ] 6.1 Delete the unused mapper file
    - Remove client/backend/src/utils/meterReadingMapper.js
    - Verify no other files import from this module
    - _Requirements: Code consolidation_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all property tests pass (minimum 100 iterations each)
  - Ensure all unit tests pass
  - Verify no console errors or warnings
  - Ask the user if questions arise

- [ ] 8. Update Frontend Store to Handle Response Format
  - [ ] 8.1 Verify meterReadingsStore.ts correctly processes the response
    - Verify store expects success flag and data.items array
    - Verify store handles pagination info correctly
    - Verify store handles error responses gracefully
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Integration Testing
  - [ ] 9.1 Test end-to-end flow from frontend to backend
    - Frontend makes request to GET /api/meterreadings
    - Backend returns properly formatted response
    - Frontend store updates without errors
    - UI displays meter readings correctly
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all property tests pass
  - Ensure all unit tests pass
  - Verify no console errors or warnings
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The actual database schema is correct; only the model definition needs fixing
- The toFrontendReading mapper already exists but needs simplification
- Tenant filtering is partially implemented but needs verification

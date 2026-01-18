# Implementation Plan: Meter Reading Upload Authentication 500 Error Fix

## Overview

This implementation plan addresses the 500 "Authentication error" that occurs when the meter reading upload manager attempts to authenticate with the client API. The root cause is incorrect column names in the authenticateSyncServer middleware queries. The fix involves correcting two database queries to use the actual column names from the tenant table schema.

## Tasks

- [x] 1. Fix authenticateSyncServer middleware query
  - [x] 1.1 Correct the column name from "id" to "tenant_id"
    - Change: `SELECT id as tenant_id` → `SELECT tenant_id`
    - Reason: The tenant table's primary key column is named `tenant_id`, not `id`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.2 Verify the active status column name is correct
    - Verify: Column is `active`, not `is_active`
    - Reason: The tenant table uses `active` for the status flag
    - _Requirements: 1.1, 1.4_

  - [x] 1.3 Test authenticateSyncServer with valid API key
    - Create test tenant with valid API key
    - Send request with X-API-Key header
    - Verify 200 response (no 500 error)
    - Verify tenant_id attached to request
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

  - [x] 1.4 Test authenticateSyncServer with invalid API key
    - Send request with invalid API key
    - Verify 401 Unauthorized response
    - Verify error message "Invalid API key"
    - _Requirements: 1.2, 1.3_

  - [x] 1.5 Test authenticateSyncServer with missing API key
    - Send request without X-API-Key header
    - Verify 401 Unauthorized response
    - Verify error message "API key required"
    - _Requirements: 1.2_

- [x] 2. Fix getSiteIdFromApiKey function
  - [x] 2.1 Correct the column name from "id" to "tenant_id"
    - Change: `return result.rows[0].id` → `return result.rows[0].tenant_id`
    - Reason: The query returns tenant_id column, not id
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Correct the active status column name
    - Change: `is_active = true` → `active = true`
    - Reason: The tenant table uses `active`, not `is_active`
    - _Requirements: 1.1_

  - [x] 2.3 Test getSiteIdFromApiKey with valid API key
    - Create test tenant with valid API key
    - Call getSiteIdFromApiKey with that key
    - Verify correct tenant_id returned
    - _Requirements: 2.1, 2.2_

  - [x] 2.4 Test getSiteIdFromApiKey with invalid API key
    - Call getSiteIdFromApiKey with invalid key
    - Verify null returned
    - _Requirements: 2.1_

- [x] 3. Verify meter reading upload authentication flow
  - [x] 3.1 Test meter reading upload with correct authentication
    - Start upload manager with valid API key
    - Attempt to upload meter readings
    - Verify no 500 authentication error
    - Verify readings uploaded successfully
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

  - [x] 3.2 Test meter reading upload with invalid API key
    - Start upload manager with invalid API key
    - Attempt to upload meter readings
    - Verify 401 response (not 500)
    - Verify readings kept in sync database
    - _Requirements: 1.2, 1.3_

  - [x] 3.3 Test meter reading upload with inactive tenant
    - Create tenant with active=false
    - Start upload manager with that tenant's API key
    - Attempt to upload meter readings
    - Verify 401 response (not 500)
    - Verify readings kept in sync database
    - _Requirements: 1.1_

- [x] 4. Checkpoint - Verify authentication fixes work
  - Verify authenticateSyncServer returns correct tenant_id
  - Verify getSiteIdFromApiKey returns correct tenant_id
  - Verify meter reading upload succeeds with valid API key
  - Verify meter reading upload fails gracefully with invalid API key
  - Ask the user if questions arise

- [ ]* 5. Write property tests for authentication
  - [ ]* 5.1 Write property test for API key authentication returns correct tenant ID
    - **Property 1: API Key Authentication Returns Correct Tenant ID**
    - **Validates: Requirements 1.1, 2.1, 2.2, 2.3**

  - [ ]* 5.2 Write property test for invalid API key returns 401
    - **Property 2: Invalid API Key Returns 401**
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 5.3 Write property test for inactive tenant returns 401
    - **Property 3: Inactive Tenant Returns 401**
    - **Validates: Requirements 1.1**

  - [ ]* 5.4 Write property test for database query uses correct column names
    - **Property 4: Database Query Uses Correct Column Names**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 5.5 Write property test for getSiteIdFromApiKey returns correct tenant ID
    - **Property 5: getSiteIdFromApiKey Returns Correct Tenant ID**
    - **Validates: Requirements 2.1, 2.2**

- [x] 6. Final checkpoint - Verify all fixes work
  - Verify no 500 authentication errors
  - Verify meter readings upload successfully
  - Verify invalid API keys are rejected with 401
  - Verify inactive tenants are rejected with 401
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- The root cause was incorrect column names in SQL queries
- The tenant table uses `tenant_id` as the primary key, not `id`
- The tenant table uses `active` for status, not `is_active`
- All fixes are in the `client/backend/src/middleware/auth.js` file
- The fixes enable the meter reading upload manager to authenticate successfully
- After these fixes, meter readings should upload without 500 authentication errors


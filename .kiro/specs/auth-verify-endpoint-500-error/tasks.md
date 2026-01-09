# Implementation Plan: Auth Verify Endpoint 500 Error Fix

## Overview

This implementation plan addresses the 500 error on the `/api/auth/verify` endpoint by fixing field name inconsistencies in JWT token generation and verification. The fix ensures that tokens are generated with consistent field names and that the verify endpoint can successfully decode and validate tokens.

## Tasks

- [x] 1. Fix token generation in auth.js login endpoint
  - Update generateToken calls to pass user.users_id as userId parameter
  - Ensure tenant_id is always passed as second parameter
  - Verify token payload contains correct field names
  - _Requirements: 1.1, 1.2_

- [ ]* 1.1 Write property test for token round trip consistency
  - **Property 1: Token Round Trip Consistency**
  - **Validates: Requirements 1.1, 1.2**

- [x] 2. Fix token generation in auth.js refresh endpoint
  - Update generateToken calls to use consistent parameter naming
  - Ensure decoded.userId is used for user lookup
  - _Requirements: 1.1, 1.2_

- [ ]* 2.1 Write unit tests for refresh endpoint
  - Test successful token refresh with valid token
  - Test failure with invalid refresh token
  - _Requirements: 1.1, 1.2_

- [x] 3. Fix authenticateToken middleware in auth.js
  - Verify middleware uses decoded.userId for user lookup
  - Add error handling for user lookup failures
  - Ensure tenant_id is set from token payload
  - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [ ]* 3.1 Write property test for user lookup after token decode
  - **Property 2: User Lookup After Token Decode**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 4. Test verify endpoint with valid token
  - Create test user and generate valid token
  - Call verify endpoint with token
  - Verify response contains user data with 200 status
  - _Requirements: 2.3_

- [ ]* 4.1 Write property test for verify endpoint success path
  - **Property 3: Verify Endpoint Success Path**
  - **Validates: Requirements 2.3**

- [x] 5. Test verify endpoint error handling
  - Test with expired token (should return 401)
  - Test with invalid token (should return 401)
  - Test with missing token (should return 401)
  - Verify no 500 errors are returned
  - _Requirements: 2.4, 2.5, 3.1, 3.2_

- [ ]* 5.1 Write property test for verify endpoint failure path
  - **Property 4: Verify Endpoint Failure Path**
  - **Validates: Requirements 2.4, 2.5**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify no 500 errors on verify endpoint
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All changes maintain backward compatibility with existing tokens

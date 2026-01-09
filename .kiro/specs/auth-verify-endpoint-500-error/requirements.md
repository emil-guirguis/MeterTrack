# Requirements Document: Auth Verify Endpoint 500 Error Fix

## Introduction

The `/api/auth/verify` endpoint is returning a 500 Internal Server Error when the frontend attempts to verify a valid JWT token. This prevents users from being authenticated on page load and breaks the authentication flow.

## Glossary

- **JWT Token**: JSON Web Token containing user identity and tenant information
- **Token Payload**: The decoded data within a JWT token (userId, tenant_id, etc.)
- **Primary Key**: The unique identifier for a user in the database (users_id)
- **Verify Endpoint**: GET /api/auth/verify that validates a token and returns user information
- **Authenticate Middleware**: Middleware that validates JWT tokens and loads user data

## Requirements

### Requirement 1: Token Generation Consistency

**User Story:** As a developer, I want JWT tokens to be generated with consistent field names, so that token verification doesn't fail due to field name mismatches.

#### Acceptance Criteria

1. WHEN a user logs in successfully, THE System SHALL generate a JWT token with a `userId` field containing the user's primary key (users_id)
2. WHEN a JWT token is generated, THE System SHALL include the `tenant_id` field in the token payload
3. WHEN a token is decoded, THE System SHALL be able to extract both `userId` and `tenant_id` fields without errors

_Requirements: 1.1, 1.2, 1.3_

### Requirement 2: Token Verification Success

**User Story:** As a user, I want the verify endpoint to successfully validate my token, so that I can remain authenticated across page reloads.

#### Acceptance Criteria

1. WHEN a valid JWT token is sent to the verify endpoint, THE System SHALL decode the token successfully
2. WHEN a token is decoded, THE System SHALL look up the user by the userId field from the token
3. WHEN a user is found, THE System SHALL return the user's information with a 200 status code
4. WHEN a user is not found, THE System SHALL return a 401 Unauthorized response
5. WHEN an error occurs during verification, THE System SHALL return a 500 error with a descriptive message

_Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

### Requirement 3: Middleware Error Handling

**User Story:** As a developer, I want clear error messages when token verification fails, so that I can debug authentication issues.

#### Acceptance Criteria

1. WHEN the authenticateToken middleware encounters an error, THE System SHALL log the error with context
2. WHEN User.findById fails, THE System SHALL catch the error and return a 500 response with details
3. WHEN a user lookup error occurs, THE System SHALL include the error message in the response for development environments

_Requirements: 3.1, 3.2, 3.3_

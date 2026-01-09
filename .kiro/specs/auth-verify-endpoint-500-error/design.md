# Design Document: Auth Verify Endpoint 500 Error Fix

## Overview

The authentication verify endpoint is failing with a 500 error due to a field name mismatch in JWT token generation and verification. The token is generated with `user.users_id` but the middleware attempts to look up the user using `decoded.userId`. This design document outlines the fix to ensure consistent field naming throughout the authentication flow.

## Architecture

The authentication flow consists of three main components:

1. **Token Generation (auth.js - login endpoint)**
   - Creates JWT token with user identity
   - Currently uses inconsistent field naming

2. **Token Verification (auth.js - verify endpoint)**
   - Calls authenticateToken middleware
   - Middleware decodes token and looks up user

3. **User Lookup (UserWithSchema.js)**
   - findById method expects the primary key (users_id)
   - Returns user object with all fields initialized from schema

## Components and Interfaces

### JWT Token Payload Structure

```javascript
{
  userId: number,        // User's primary key (users_id from database)
  tenant_id: number,     // Tenant identifier
  iat: number,          // Issued at timestamp
  exp: number           // Expiration timestamp
}
```

### Token Generation Function

```javascript
const generateToken = (userId, tenant_id) => {
  return jwt.sign({ userId, tenant_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};
```

**Changes Required:**
- Ensure `userId` parameter receives `user.users_id` (the primary key)
- Ensure `tenant_id` is always included

### Token Verification Flow

```
1. Client sends Authorization header with Bearer token
2. authenticateToken middleware extracts token
3. jwt.verify() decodes token to get { userId, tenant_id }
4. User.findById(userId) looks up user in database
5. User object is attached to req.user
6. Verify endpoint returns user data
```

**Changes Required:**
- Ensure middleware uses `decoded.userId` (not `decoded.id`)
- Ensure User.findById can handle the userId parameter correctly

## Data Models

### User Object (from UserWithSchema)

```javascript
{
  users_id: number,           // Primary key
  email: string,
  name: string,
  role: string,
  tenant_id: number,
  active: boolean,
  passwordHash: string,       // Hashed password
  permissions: object|array,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  passwordChangedAt: Date,
  failedLoginAttempts: number,
  lockedUntil: Date
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Token Round Trip Consistency

**For any** valid user with a users_id and tenant_id, generating a token and then decoding it should produce the same userId and tenant_id values.

**Validates: Requirements 1.1, 1.2**

### Property 2: User Lookup After Token Decode

**For any** valid JWT token generated from a user, decoding the token and then looking up the user by the decoded userId should return a user object with matching users_id.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Verify Endpoint Success Path

**For any** valid user with an active status, calling the verify endpoint with a valid token should return a 200 response containing the user's information.

**Validates: Requirements 2.3**

### Property 4: Verify Endpoint Failure Path

**For any** invalid or expired token, calling the verify endpoint should return a 401 response without throwing a 500 error.

**Validates: Requirements 2.4, 2.5**

## Error Handling

### Token Verification Errors

1. **Missing Token**: Return 401 with "Access token required"
2. **Invalid Token**: Return 401 with "Invalid token"
3. **Expired Token**: Return 401 with "Token expired"
4. **User Not Found**: Return 401 with "Invalid token - user not found"
5. **User Lookup Error**: Return 500 with error details (development only)
6. **Inactive User**: Return 401 with "Account is inactive"

### Error Response Format

```javascript
{
  success: false,
  message: "Error message",
  detail: "Additional details (development only)"
}
```

## Testing Strategy

### Unit Tests

1. **Token Generation**
   - Test that generateToken includes userId and tenant_id
   - Test that token can be decoded successfully
   - Test that token expiration is set correctly

2. **Token Verification**
   - Test successful verification with valid token
   - Test failure with expired token
   - Test failure with invalid token
   - Test failure with missing token

3. **User Lookup**
   - Test that User.findById returns correct user
   - Test that user object has all required fields
   - Test that tenant_id is preserved through lookup

### Property-Based Tests

1. **Property 1: Token Round Trip Consistency**
   - Generate random users with users_id and tenant_id
   - Create tokens for each user
   - Decode tokens and verify userId and tenant_id match

2. **Property 2: User Lookup After Token Decode**
   - Generate random valid users
   - Create tokens for each user
   - Decode token and look up user
   - Verify returned user has matching users_id

3. **Property 3: Verify Endpoint Success Path**
   - Create valid users with active status
   - Generate tokens for each user
   - Call verify endpoint with token
   - Verify response is 200 with user data

4. **Property 4: Verify Endpoint Failure Path**
   - Generate invalid/expired tokens
   - Call verify endpoint with each token
   - Verify response is 401 (not 500)

## Implementation Notes

### Key Changes

1. **auth.js - generateToken function**
   - Ensure first parameter is named `userId` and receives `user.users_id`
   - Ensure second parameter is `tenant_id`

2. **auth.js - login endpoint**
   - Pass `user.users_id` as first argument to generateToken
   - Pass `user.tenant_id` as second argument

3. **auth.js - refresh endpoint**
   - Ensure consistent parameter naming
   - Use `decoded.userId` when looking up user

4. **middleware/auth.js - authenticateToken**
   - Verify that `decoded.userId` is used for user lookup
   - Add error handling for user lookup failures
   - Ensure tenant_id is set from token or user object

### Testing Approach

- Unit tests validate specific scenarios
- Property tests validate universal correctness across many inputs
- Both test types are necessary for comprehensive coverage

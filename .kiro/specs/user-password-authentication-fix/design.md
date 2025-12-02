# Design Document

## Overview

This design addresses two critical authentication failures:

1. **Password Hash Field Mapping**: The database stores the password hash in a column named `passwordhash` (lowercase, no underscore), but the User model schema defines it as `password_hash` (snake_case with underscore), causing the field mapping to fail and resulting in undefined values during password comparison.

2. **Status Field Type Mismatch**: The User model defines the `status` field as a BOOLEAN type (true/false), but the authentication middleware in `auth.js` incorrectly checks `user.status !== 'active'` (string comparison), causing all authenticated users to be rejected as "inactive" even when their status is `true`.

The solution involves correcting the schema definition to match the actual database column name, fixing the status field type checking in the middleware, adding validation to prevent bcrypt errors, and improving error handling throughout the authentication flow.

## Architecture

The authentication system consists of three main layers:

1. **Route Layer** (`client/backend/src/routes/auth.js`): Handles HTTP requests, validates input, and orchestrates authentication flow
2. **Model Layer** (`client/backend/src/models/UserWithSchema.js`): Defines the User entity with schema-based field mapping and authentication methods
3. **Schema Layer** (`framework/backend/api/base/SchemaDefinition.js`): Maps database fields to model properties using the `initializeFromData` method

The issue occurs at the boundary between the Model and Schema layers, where the dbField configuration doesn't match the actual database column name.

## Components and Interfaces

### User Model

**Location:** `client/backend/src/models/UserWithSchema.js`

**Changes Required:**
- Update `passwordHash` field definition to use correct `dbField: 'passwordhash'` (lowercase, no underscore)
- Enhance `comparePassword` method with validation
- Remove fallback to `this.passwordhash` since proper mapping will handle this

**Interface:**
```javascript
class User extends BaseModel {
  static async findByEmail(email: string): Promise<User|null>
  async comparePassword(password: string): Promise<boolean>
  async updateLastLogin(): Promise<User>
  static async hashPassword(password: string): Promise<string>
}
```

### Authentication Route

**Location:** `client/backend/src/routes/auth.js`

**Changes Required:**
- Add validation for password field presence
- Improve error logging for missing password hashes
- Maintain security by not exposing password hash issues to users
- Status field is already correctly checked as boolean (`if (!user.status)`)

**Interface:**
```javascript
POST /login
  Request: { email: string, password: string, rememberMe?: boolean }
  Response: { success: boolean, data?: {...}, message?: string, errors?: [...] }
```

### Authentication Middleware

**Location:** `client/backend/src/middleware/auth.js`

**Changes Required:**
- Fix status field comparison from string check (`user.status !== 'active'`) to boolean check (`!user.status` or `user.status !== true`)
- Ensure consistent boolean comparison with the User model schema definition

**Current Bug:**
```javascript
// WRONG - compares boolean to string
if (user.status !== 'active') {
  return res.status(401).json({
    success: false,
    message: 'Account is inactive'
  });
}
```

**Correct Implementation:**
```javascript
// CORRECT - boolean comparison
if (!user.status) {
  return res.status(401).json({
    success: false,
    message: 'Account is inactive'
  });
}
```

## Data Models

### User Model Schema

```javascript
{
  formFields: {
    passwordHash: {
      type: FieldTypes.STRING,
      dbField: 'passwordhash',  // CORRECTED: matches actual DB column
      required: false,
      readOnly: true,
      maxLength: 200
    }
  }
}
```

### Database Schema

The users table in PostgreSQL has the following relevant columns:
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR, UNIQUE)
- `passwordhash` (VARCHAR) - Note: lowercase, no underscore
- `name` (VARCHAR)
- `role` (VARCHAR)
- `status` (VARCHAR)
- `createdat` (TIMESTAMP)
- `updatedat` (TIMESTAMP)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Field mapping consistency
*For any* user record retrieved from the database, the passwordHash model property should contain the value from the passwordhash database column
**Validates: Requirements 1.3**

### Property 2: Password validation before comparison
*For any* call to comparePassword, if either the password parameter or the passwordHash property is null, undefined, or empty string, the method should return false without calling bcrypt.compare
**Validates: Requirements 2.1, 2.2**

### Property 3: Authentication failure for missing password hash
*For any* user record with a null or undefined passwordhash value, login attempts should fail with an "Invalid email or password" message
**Validates: Requirements 1.1, 3.1, 3.3**

### Property 4: Error logging without exposure
*For any* authentication error, detailed error information should be logged to the server console while only generic messages are returned to the client
**Validates: Requirements 1.4, 3.4**

### Property 5: Input validation before authentication
*For any* login request, if the password field is missing or empty, the system should return a 400 Bad Request response before attempting database queries
**Validates: Requirements 2.3, 2.4**

### Property 6: Status field boolean comparison
*For any* user with status set to true, the authentication middleware should allow access to protected resources
**Validates: Requirements 4.1, 4.2, 4.4**

### Property 7: Inactive account rejection
*For any* user with status set to false, the authentication middleware should deny access with "Account is inactive" message
**Validates: Requirements 4.3**

## Error Handling

### Password Comparison Errors

**Current Behavior:** bcrypt.compare throws "Illegal arguments" error when receiving undefined
**New Behavior:** 
- Validate inputs before calling bcrypt.compare
- Return false immediately if password or passwordHash is invalid
- Log warning when passwordHash is missing for administrative review

### Authentication Errors

**Strategy:** Fail securely by providing generic error messages to users while logging detailed information for administrators

**Error Categories:**
1. **Validation Errors** (400): Missing or invalid input fields
2. **Authentication Errors** (401): Invalid credentials, inactive account, missing password hash
3. **System Errors** (500): Database errors, unexpected failures

### Logging Strategy

- **Client-facing messages:** Generic, security-conscious (e.g., "Invalid email or password")
- **Server logs:** Detailed, including user email, error type, stack traces
- **Special case:** Log when user record has no password hash for admin investigation

## Testing Strategy

### Unit Tests

**Location:** `client/backend/src/__tests__/UserModel.test.js`

Tests to implement:
1. Test that passwordHash field correctly maps from passwordhash database column
2. Test comparePassword returns false when passwordHash is null
3. Test comparePassword returns false when passwordHash is undefined
4. Test comparePassword returns false when password parameter is empty
5. Test comparePassword returns true for valid password match
6. Test comparePassword returns false for invalid password match

### Property-Based Tests

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Minimum 100 iterations per property test

Tests to implement:
1. Property 1: Field mapping consistency (generate random user records, verify passwordHash mapping)
2. Property 2: Password validation (generate random invalid inputs, verify no bcrypt calls)
3. Property 3: Authentication failure (generate users with null/undefined passwords, verify login fails)
4. Property 5: Input validation (generate requests with missing/empty passwords, verify 400 response)

### Integration Tests

**Location:** `client/backend/src/__tests__/auth.integration.test.js`

Tests to implement:
1. Test login flow with valid credentials
2. Test login flow with user having no password hash
3. Test login flow with missing password field
4. Test error messages don't expose internal details
5. Test that detailed errors are logged server-side

### Testing Approach

- Write implementation fixes first
- Then write unit tests to verify fixes
- Then write property-based tests for comprehensive coverage
- Finally write integration tests for end-to-end validation

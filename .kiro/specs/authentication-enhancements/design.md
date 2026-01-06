# Authentication Enhancements Design

## Overview

This design document outlines the implementation of secure password requirements, password management features, forgot password recovery, and two-factor authentication (2FA) for MeterIt Pro. The system will support multiple 2FA methods (TOTP, Email OTP, SMS OTP) with secure token generation, rate limiting, and comprehensive logging.

## Architecture

### High-Level Flow

```
User Login
  ↓
Email + Password Validation
  ↓
2FA Enabled?
  ├─ Yes → Send 2FA Code (TOTP/Email/SMS)
  │         ↓
  │         User Enters Code
  │         ↓
  │         Validate Code
  │         ↓
  │         Create Session
  │
  └─ No → Create Session
```

### Components

1. **Password Validator Service** - Validates password strength and security requirements
2. **2FA Service** - Manages TOTP, Email OTP, SMS OTP generation and validation
3. **Token Service** - Generates and validates secure reset tokens
4. **Email Service** - Sends password reset and 2FA emails
5. **SMS Service** - Sends 2FA SMS codes (optional, requires SMS provider)
6. **Auth Service** - Orchestrates login, password change, password reset flows
7. **Change Password Modal** - Frontend component for password changes
8. **Forgot Password Page** - Frontend page for self-service password recovery
9. **2FA Setup Wizard** - Frontend component for enabling 2FA
10. **2FA Verification Modal** - Frontend component for entering 2FA codes during login

## Database Schema

### New Tables

#### `user_2fa_methods`
```sql
CREATE TABLE user_2fa_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method_type VARCHAR(20) NOT NULL, -- 'totp', 'email_otp', 'sms_otp'
  secret_key VARCHAR(255), -- For TOTP
  phone_number VARCHAR(20), -- For SMS OTP
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, method_type)
);
```

#### `user_2fa_backup_codes`
```sql
CREATE TABLE user_2fa_backup_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL, -- Bcrypt hash of backup code
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `password_reset_tokens`
```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- Bcrypt hash of token
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `auth_logs`
```sql
CREATE TABLE auth_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- 'login', 'password_change', 'password_reset', '2fa_enable', '2fa_disable', 'failed_login'
  status VARCHAR(20) NOT NULL, -- 'success', 'failed'
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Modified Tables

#### `users` table additions
```sql
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/login`
- **Request**: `{ email, password, totp_code?, otp_code? }`
- **Response**: `{ token, user, requires_2fa?, 2fa_method? }`
- **Behavior**: Validates credentials, checks 2FA requirement, returns token or 2FA challenge

#### POST `/api/auth/verify-2fa`
- **Request**: `{ session_token, code }`
- **Response**: `{ token, user }`
- **Behavior**: Validates 2FA code, creates session if valid

#### POST `/api/auth/forgot-password`
- **Request**: `{ email }`
- **Response**: `{ message }`
- **Behavior**: Generates reset token, sends email (generic response for security)

#### POST `/api/auth/reset-password`
- **Request**: `{ token, new_password }`
- **Response**: `{ message }`
- **Behavior**: Validates token, updates password, invalidates token

#### POST `/api/auth/change-password`
- **Request**: `{ current_password, new_password }`
- **Response**: `{ message }`
- **Behavior**: Validates current password, updates to new password, logs out user

### 2FA Endpoints

#### POST `/api/auth/2fa/setup`
- **Request**: `{ method: 'totp'|'email_otp'|'sms_otp', phone_number? }`
- **Response**: `{ secret, qr_code, backup_codes }`
- **Behavior**: Generates 2FA setup data

#### POST `/api/auth/2fa/verify-setup`
- **Request**: `{ method, code }`
- **Response**: `{ message, backup_codes }`
- **Behavior**: Verifies setup code, enables 2FA method

#### POST `/api/auth/2fa/disable`
- **Request**: `{ method, password }`
- **Response**: `{ message }`
- **Behavior**: Validates password, disables 2FA method

#### GET `/api/auth/2fa/methods`
- **Response**: `{ methods: [{ type, enabled, created_at }] }`
- **Behavior**: Returns user's 2FA methods

#### POST `/api/auth/2fa/regenerate-backup-codes`
- **Request**: `{ password }`
- **Response**: `{ backup_codes }`
- **Behavior**: Generates new backup codes, invalidates old ones

### Admin Endpoints

#### POST `/api/users/:id/reset-password`
- **Request**: `{}`
- **Response**: `{ message }`
- **Behavior**: Generates reset token, sends email to user

## Services

### PasswordValidator Service

```typescript
interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

class PasswordValidator {
  validate(password: string, email?: string, username?: string): PasswordValidationResult
  // Checks: length >= 12, uppercase, lowercase, number, special char
  // Rejects: common patterns, email/username match
  
  getStrengthScore(password: string): number
  // Returns 0-100 strength score
}
```

### 2FA Service

```typescript
interface TOTPSetup {
  secret: string;
  qr_code: string;
}

interface BackupCode {
  code: string;
}

class TwoFactorService {
  generateTOTPSecret(): TOTPSetup
  verifyTOTPCode(secret: string, code: string): boolean
  generateBackupCodes(count: number = 10): BackupCode[]
  
  generateEmailOTP(): string
  verifyEmailOTP(stored_code: string, provided_code: string): boolean
  
  generateSMSOTP(): string
  verifySMSOTP(stored_code: string, provided_code: string): boolean
}
```

### Token Service

```typescript
interface ResetToken {
  token: string;
  token_hash: string;
  expires_at: Date;
}

class TokenService {
  generateResetToken(length: number = 32): ResetToken
  // Uses crypto.randomBytes for secure generation
  
  validateResetToken(token: string, user_id: number): boolean
  // Checks existence, expiration, not used
  
  invalidateResetToken(token: string): void
}
```

## Frontend Components

### Change Password Modal
- Current password input (password type)
- New password input with strength indicator
- Confirm password input
- Password requirements checklist (real-time validation)
- Submit and Cancel buttons
- Error/success messages

### Forgot Password Page
- Email input field
- Submit button
- Generic success message
- Link back to login

### Password Reset Page
- Token validation on load
- New password input with strength indicator
- Confirm password input
- Password requirements checklist
- Submit button
- Error handling for expired/invalid tokens

### 2FA Setup Wizard
- Step 1: Choose method (TOTP/Email/SMS)
- Step 2: Display QR code and secret (for TOTP)
- Step 3: Verify setup with code
- Step 4: Display and save backup codes
- Completion message

### 2FA Verification Modal
- Display method (TOTP/Email/SMS)
- Code input field (6 digits)
- Resend code button (for Email/SMS)
- Backup code option
- Submit button
- Error handling and retry limits

## Security Considerations

### Password Security
- Passwords hashed with bcrypt (salt rounds: 10)
- Password history not stored (users can reuse after change)
- Password change requires current password verification
- Failed login attempts tracked and account locked after 5 attempts for 15 minutes

### Token Security
- Reset tokens generated with crypto.randomBytes
- Tokens hashed before storage (bcrypt)
- Tokens expire after 24 hours
- Tokens invalidated after use
- Previous tokens invalidated when new reset requested
- Rate limiting: 3 reset requests per hour per email

### 2FA Security
- TOTP secrets stored encrypted in database
- Backup codes hashed with bcrypt
- Backup codes single-use only
- OTP codes expire after 5 minutes
- Rate limiting: 3 failed attempts locks login for 15 minutes
- 2FA codes not logged in auth logs

### Session Security
- Sessions created only after successful 2FA verification
- 2FA verification required before session creation
- Sessions expire after 24 hours of inactivity
- Logout invalidates session immediately

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Password Strength Validation
**For any** password string, if it passes validation, it must contain at least 12 characters, at least one uppercase letter, at least one lowercase letter, at least one digit, and at least one special character.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 2: Password Change Atomicity
**For any** user with a valid current password, after a successful password change, the old password hash must no longer authenticate, and the new password hash must authenticate.

**Validates: Requirements 2.6, 2.10**

### Property 3: Reset Token Expiration
**For any** password reset token, if the current time is after the expiration time, the token must be rejected and the password must not be changed.

**Validates: Requirements 3.3, 10.3**

### Property 4: Reset Token Single Use
**For any** password reset token that has been used successfully, subsequent attempts to use the same token must be rejected.

**Validates: Requirements 4.15, 10.4**

### Property 5: TOTP Code Validation
**For any** TOTP secret and valid 6-digit code generated by an authenticator app, the code must validate successfully within the 30-second time window.

**Validates: Requirements 5.9, 5.10**

### Property 6: Backup Code Single Use
**For any** backup code that has been used successfully, subsequent attempts to use the same code must be rejected.

**Validates: Requirements 5.13, 8.8**

### Property 7: OTP Code Expiration
**For any** OTP code (Email or SMS), if the current time is more than 5 minutes after generation, the code must be rejected.

**Validates: Requirements 6.4, 7.8**

### Property 8: OTP Rate Limiting
**For any** login attempt with invalid OTP codes, after 3 consecutive failures, the login must be locked for 15 minutes.

**Validates: Requirements 6.8, 7.12**

### Property 9: 2FA Session Creation
**For any** user with 2FA enabled, a session must not be created until a valid 2FA code is provided and verified.

**Validates: Requirements 9.4, 9.6**

### Property 10: Login Audit Trail
**For any** login attempt (successful or failed), an entry must be created in the auth_logs table with the event type, status, timestamp, and user information.

**Validates: Requirements 10.6**

### Property 11: Password Reset Rate Limiting
**For any** email address, if more than 3 password reset requests are made within 1 hour, subsequent requests must be rejected.

**Validates: Requirements 10.8**

### Property 12: Multiple 2FA Methods
**For any** user with multiple 2FA methods enabled, at least one valid code from any enabled method must be accepted during login.

**Validates: Requirements 8.5, 8.6**

## Error Handling

### Password Validation Errors
- "Password must be at least 12 characters long"
- "Password must contain at least one uppercase letter"
- "Password must contain at least one lowercase letter"
- "Password must contain at least one number"
- "Password must contain at least one special character"
- "Password cannot contain your email or username"
- "Password is too common, please choose a stronger password"

### 2FA Errors
- "Invalid 2FA code, please try again"
- "2FA code has expired, please request a new one"
- "Too many failed attempts, please try again in 15 minutes"
- "2FA method not found"
- "2FA is not enabled for your account"

### Reset Token Errors
- "Reset link has expired, please request a new one"
- "Reset link is invalid"
- "Password reset token not found"

### Login Errors
- "Invalid email or password"
- "Account is locked, please try again in 15 minutes"
- "2FA verification required"

## Testing Strategy

### Unit Tests
- Password validator: test all validation rules, edge cases
- Token service: test generation, validation, expiration
- 2FA service: test TOTP, Email OTP, SMS OTP generation and validation
- Backup code service: test generation, single-use enforcement

### Property-Based Tests
- Property 1: Generate random passwords, verify strength validation
- Property 2: Generate valid passwords, verify change atomicity
- Property 3: Generate tokens with various expiration times, verify expiration
- Property 4: Generate tokens, use once, verify single-use enforcement
- Property 5: Generate TOTP secrets, verify code validation
- Property 6: Generate backup codes, use once, verify single-use
- Property 7: Generate OTP codes with various ages, verify expiration
- Property 8: Simulate multiple failed OTP attempts, verify rate limiting
- Property 9: Simulate login with 2FA, verify session creation only after verification
- Property 10: Simulate login attempts, verify audit trail creation
- Property 11: Simulate multiple reset requests, verify rate limiting
- Property 12: Enable multiple 2FA methods, verify any valid code accepted

### Integration Tests
- Full login flow with 2FA
- Password change flow
- Password reset flow
- 2FA setup and verification
- Backup code usage

## Implementation Notes

1. **Email Service**: Use existing email service or integrate with SendGrid/AWS SES
2. **SMS Service**: Optional, integrate with Twilio or AWS SNS if needed
3. **TOTP Library**: Use `speakeasy` or `otplib` for Node.js
4. **QR Code Generation**: Use `qrcode` library
5. **Bcrypt**: Already in use, continue with salt rounds: 10
6. **Rate Limiting**: Use `express-rate-limit` middleware
7. **Session Management**: Extend existing session system with 2FA verification flag


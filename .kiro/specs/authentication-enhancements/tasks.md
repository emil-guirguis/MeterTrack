# Implementation Plan: Authentication Enhancements

## Overview

This implementation plan breaks down the authentication enhancements into discrete, manageable tasks. Tasks are organized by feature area and build incrementally, with testing integrated throughout. Each task includes property-based tests to validate correctness properties from the design document.

## Tasks

- [x] 1. Database Schema and Migrations
  - [x] 1.1 Create migration for user_2fa_methods table
    - Add user_2fa_methods table with method_type, secret_key, phone_number, is_enabled
    - _Requirements: 5.1, 6.1, 7.1_
  
  - [x] 1.2 Create migration for user_2fa_backup_codes table
    - Add user_2fa_backup_codes table with code_hash, is_used, used_at
    - _Requirements: 5.12, 8.8_
  
  - [x] 1.3 Create migration for password_reset_tokens table
    - Add password_reset_tokens table with token_hash, expires_at, is_used
    - _Requirements: 3.2, 4.6_
  
  - [x] 1.4 Create migration for auth_logs table
    - Add auth_logs table with event_type, status, ip_address, user_agent, details
    - _Requirements: 10.6_
  
  - [x] 1.5 Alter users table with new columns
    - Add password_changed_at, last_login_at, failed_login_attempts, locked_until
    - _Requirements: 2.12, 10.1_

- [x] 2. Password Validator Service
  - [x] 2.1 Create PasswordValidator class
    - Implement validate() method checking: length >= 12, uppercase, lowercase, number, special char
    - Implement rejection of common patterns and email/username matches
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9_
  
  - [ ]* 2.2 Write property test for password strength validation
    - **Property 1: Password Strength Validation**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**
  
  - [x] 2.3 Implement getStrengthScore() method
    - Return 0-100 strength score based on password complexity
    - _Requirements: 1.1_

- [-] 3. Token Service
  - [x] 3.1 Create TokenService class
    - Implement generateResetToken() using crypto.randomBytes
    - Implement validateResetToken() checking existence, expiration, not used
    - Implement invalidateResetToken() marking token as used
    - _Requirements: 3.2, 4.6, 10.1, 10.2_
  
  - [ ]* 3.2 Write property test for reset token expiration
    - **Property 3: Reset Token Expiration**
    - **Validates: Requirements 3.3, 10.3**
  
  - [ ]* 3.3 Write property test for reset token single use
    - **Property 4: Reset Token Single Use**
    - **Validates: Requirements 4.15, 10.4**

- [-] 4. 2FA Service - TOTP
  - [x] 4.1 Create TwoFactorService class with TOTP methods
    - Implement generateTOTPSecret() using speakeasy library
    - Implement verifyTOTPCode() validating 6-digit codes
    - Implement generateBackupCodes() creating 10 single-use codes
    - _Requirements: 5.4, 5.5, 5.12, 5.13_
  
  - [ ]* 4.2 Write property test for TOTP code validation
    - **Property 5: TOTP Code Validation**
    - **Validates: Requirements 5.9, 5.10**
  
  - [ ]* 4.3 Write property test for backup code single use
    - **Property 6: Backup Code Single Use**
    - **Validates: Requirements 5.13, 8.8**

- [x] 5. 2FA Service - Email OTP
  - [x] 5.1 Implement generateEmailOTP() method
    - Generate 6-digit random code
    - Store code with 5-minute expiration
    - _Requirements: 6.3, 6.4_
  
  - [x] 5.2 Implement verifyEmailOTP() method
    - Validate code matches stored code
    - Check expiration
    - Implement 3-attempt limit with 15-minute lockout
    - _Requirements: 6.6, 6.7, 6.8_
  
  - [ ]* 5.3 Write property test for OTP code expiration
    - **Property 7: OTP Code Expiration**
    - **Validates: Requirements 6.4, 7.8**
  
  - [ ]* 5.4 Write property test for OTP rate limiting
    - **Property 8: OTP Rate Limiting**
    - **Validates: Requirements 6.8, 7.12**

- [x] 6. 2FA Service - SMS OTP
  - [x] 6.1 Implement generateSMSOTP() method
    - Generate 6-digit random code
    - Store code with 5-minute expiration
    - Integrate with SMS provider (Twilio/AWS SNS)
    - _Requirements: 7.7, 7.8_
  
  - [x] 6.2 Implement verifySMSOTP() method
    - Validate code matches stored code
    - Check expiration
    - Implement 3-attempt limit with 15-minute lockout
    - _Requirements: 7.10, 7.11, 7.12_

- [x] 7. Auth Service - Password Change
  - [x] 7.1 Create changePassword() endpoint
    - Validate current password against stored hash
    - Validate new password meets security requirements
    - Reject if new password matches current password
    - Hash new password and update database
    - Log password change event
    - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.10_
  
  - [ ]* 7.2 Write property test for password change atomicity
    - **Property 2: Password Change Atomicity**
    - **Validates: Requirements 2.6, 2.10**

- [x] 8. Auth Service - Forgot Password
  - [x] 8.1 Create forgotPassword() endpoint
    - Accept email address
    - Check if email exists (generic response for security)
    - Generate reset token with 24-hour expiration
    - Send email with reset link
    - Implement rate limiting (3 per hour per email)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 10.8_
  
  - [ ]* 8.2 Write property test for password reset rate limiting
    - **Property 11: Password Reset Rate Limiting**
    - **Validates: Requirements 10.8**

- [x] 9. Auth Service - Password Reset
  - [x] 9.1 Create resetPassword() endpoint
    - Accept reset token and new password
    - Validate token exists, not expired, not used
    - Validate new password meets security requirements
    - Hash new password and update database
    - Invalidate reset token
    - Log password reset event
    - _Requirements: 4.10, 4.11, 4.12, 4.13, 4.14, 4.15_

- [x] 10. Auth Service - Admin Password Reset
  - [x] 10.1 Create adminResetPassword() endpoint
    - Accept user ID
    - Generate reset token with 24-hour expiration
    - Send email to user with reset link
    - Log admin password reset event
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 11. Auth Service - Login with 2FA
  - [x] 11.1 Update login endpoint to support 2FA
    - Validate email and password
    - Check if 2FA is enabled
    - If 2FA enabled, generate temporary session and return 2FA challenge
    - If 2FA disabled, create full session
    - Implement account lockout after 5 failed attempts (15 minutes)
    - Log login attempt (success/failure)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.6_
  
  - [ ]* 11.2 Write property test for 2FA session creation
    - **Property 9: 2FA Session Creation**
    - **Validates: Requirements 9.4, 9.6**
  
  - [ ]* 11.3 Write property test for login audit trail
    - **Property 10: Login Audit Trail**
    - **Validates: Requirements 10.6**

- [x] 12. Auth Service - 2FA Verification
  - [x] 12.1 Create verify2FA() endpoint
    - Accept temporary session token and 2FA code
    - Validate code against enabled 2FA methods
    - Support TOTP, Email OTP, SMS OTP, and backup codes
    - Create full session on success
    - Implement rate limiting (3 attempts, 15-minute lockout)
    - _Requirements: 9.6, 9.7, 9.8, 9.9_
  
  - [ ]* 12.2 Write property test for multiple 2FA methods
    - **Property 12: Multiple 2FA Methods**
    - **Validates: Requirements 8.5, 8.6**

- [x] 13. 2FA Management Endpoints
  - [x] 13.1 Create setup2FA() endpoint
    - Accept method type (totp/email_otp/sms_otp)
    - Generate setup data (TOTP secret + QR code, or phone verification)
    - Return setup data for frontend
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_
  
  - [x] 13.2 Create verify2FASetup() endpoint
    - Accept method type and verification code
    - Validate code
    - Store 2FA method in database
    - Generate and return backup codes (for TOTP)
    - _Requirements: 5.8, 5.9, 5.10, 5.11, 5.12, 5.13_
  
  - [x] 13.3 Create disable2FA() endpoint
    - Accept method type and password
    - Validate password
    - Disable 2FA method
    - Log 2FA disable event
    - _Requirements: 8.2, 8.3, 8.4_
  
  - [x] 13.4 Create get2FAMethods() endpoint
    - Return all enabled 2FA methods for user
    - _Requirements: 8.1_
  
  - [x] 13.5 Create regenerateBackupCodes() endpoint
    - Accept password
    - Validate password
    - Generate new backup codes
    - Invalidate old codes
    - Return new codes
    - _Requirements: 8.9_

- [ ] 14. Frontend - Change Password Modal
  - [ ] 14.1 Create ChangePasswordModal component
    - Display current password input
    - Display new password input with strength indicator
    - Display confirm password input
    - Display password requirements checklist (real-time validation)
    - Implement form validation
    - Call changePassword() API endpoint
    - Display success/error messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.11, 2.12_
  
  - [ ]* 14.2 Write property test for password strength UI validation
    - **Property 1: Password Strength Validation**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

- [x] 15. Frontend - Forgot Password Page
  - [x] 15.1 Create ForgotPasswordPage component
    - Display email input field
    - Display submit button
    - Call forgotPassword() API endpoint
    - Display generic success message
    - Display link back to login
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 16. Frontend - Password Reset Page
  - [x] 16.1 Create PasswordResetPage component
    - Extract token from URL query parameter
    - Validate token on page load
    - Display new password input with strength indicator
    - Display confirm password input
    - Display password requirements checklist
    - Call resetPassword() API endpoint
    - Display success message and redirect to login
    - Handle expired/invalid token errors
    - _Requirements: 4.10, 4.11, 4.12, 4.13, 4.14, 4.15, 4.16_

- [-] 17. Frontend - 2FA Setup Wizard
  - [x] 17.1 Create 2FASetupWizard component
    - Step 1: Display method selection (TOTP/Email/SMS)
    - Step 2: Display QR code and secret (for TOTP) or phone verification (for SMS)
    - Step 3: Display verification code input
    - Step 4: Display and save backup codes (for TOTP)
    - Call setup2FA() and verify2FASetup() API endpoints
    - Display completion message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15_

- [x] 18. Frontend - 2FA Verification Modal
  - [x] 18.1 Create 2FAVerificationModal component
    - Display 2FA method (TOTP/Email/SMS)
    - Display code input field (6 digits)
    - Display resend code button (for Email/SMS)
    - Display backup code option
    - Call verify2FA() API endpoint
    - Display error messages and retry limits
    - _Requirements: 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

- [x] 19. Frontend - 2FA Management Page
  - [x] 19.1 Create 2FAManagementPage component
    - Display all enabled 2FA methods
    - Display disable button for each method
    - Display regenerate backup codes button
    - Call disable2FA() and regenerateBackupCodes() API endpoints
    - Display success/error messages
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7, 8.8, 8.9_

- [-] 20. Frontend - Update Login Form
  - [x] 20.1 Update LoginForm component
    - Add "Forgot Password?" link
    - Integrate 2FA verification modal
    - Display 2FA challenge when required
    - Handle 2FA verification flow
    - _Requirements: 4.1, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

- [-] 21. Frontend - Update User Form
  - [x] 21.1 Update UserForm component
    - Add "Change Password" button
    - Add "Reset Password" button (admin only)
    - Integrate ChangePasswordModal
    - Call changePassword() and adminResetPassword() API endpoints
    - _Requirements: 2.1, 3.1, 3.9_

- [x] 22. Email Templates
  - [x] 22.1 Create password reset email template
    - Include reset link with token
    - Include expiration time (24 hours)
    - Include warning about link expiration
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 4.9_
  
  - [x] 22.2 Create 2FA email template
    - Include 6-digit code
    - Include expiration time (5 minutes)
    - _Requirements: 6.4_

- [x] 23. Checkpoint - Core Authentication Features
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [x] 24. Integration Tests
  - [x] 24.1 Write integration test for full login flow with 2FA
    - Test login with TOTP
    - Test login with Email OTP
    - Test login with SMS OTP
    - Test login with backup code
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_
  
  - [x] 24.2 Write integration test for password change flow
    - Test successful password change
    - Test invalid current password
    - Test password validation failures
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_
  
  - [x] 24.3 Write integration test for password reset flow
    - Test forgot password request
    - Test reset with valid token
    - Test reset with expired token
    - Test reset with invalid token
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 4.14, 4.15, 4.16_
  
  - [x] 24.4 Write integration test for 2FA setup and management
    - Test TOTP setup
    - Test Email OTP setup
    - Test SMS OTP setup
    - Test disable 2FA
    - Test backup code regeneration
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15, 8.1, 8.2, 8.3, 8.4, 8.7, 8.8, 8.9_

- [x] 25. Final Checkpoint - All Tests Pass
  - Ensure all unit tests, property tests, and integration tests pass.
  - Verify all correctness properties are validated.
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each property-based test should run minimum 100 iterations
- All API endpoints should include proper error handling and validation
- All password operations should be logged in auth_logs table
- All 2FA operations should be logged in auth_logs table (except codes themselves)
- Rate limiting should be implemented at middleware level
- Email service should be configured before deployment
- SMS service (Twilio/AWS SNS) is optional but recommended for production


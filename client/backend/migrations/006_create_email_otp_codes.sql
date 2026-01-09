-- Migration: Create email_otp_codes table
-- Description: Stores temporary email OTP codes for 2FA verification
-- Requirements: 6.3, 6.4

CREATE TABLE IF NOT EXISTS email_otp_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_otp_codes_user_id ON email_otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_otp_codes_expires_at ON email_otp_codes(expires_at);

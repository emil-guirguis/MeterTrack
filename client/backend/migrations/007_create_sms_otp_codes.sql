-- Migration: Create sms_otp_codes table
-- Description: Stores temporary SMS OTP codes for 2FA verification
-- Requirements: 7.7, 7.8

CREATE TABLE IF NOT EXISTS sms_otp_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sms_otp_codes_user_id ON sms_otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_otp_codes_expires_at ON sms_otp_codes(expires_at);

-- Migration: Create user_2fa_methods table
-- Description: Stores user's 2FA method configurations (TOTP, Email OTP, SMS OTP)
-- Requirements: 5.1, 6.1, 7.1

CREATE TABLE IF NOT EXISTS user_2fa_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
  method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('totp', 'email_otp', 'sms_otp')),
  secret_key VARCHAR(255),
  phone_number VARCHAR(20),
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, method_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_methods_user_id ON user_2fa_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_methods_method_type ON user_2fa_methods(method_type);
CREATE INDEX IF NOT EXISTS idx_user_2fa_methods_is_enabled ON user_2fa_methods(is_enabled);

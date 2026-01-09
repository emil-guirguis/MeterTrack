-- Migration: Create user_2fa_backup_codes table
-- Description: Stores single-use backup codes for 2FA recovery
-- Requirements: 5.12, 8.8

CREATE TABLE IF NOT EXISTS user_2fa_backup_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
  code_hash VARCHAR(255) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_backup_codes_user_id ON user_2fa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_backup_codes_is_used ON user_2fa_backup_codes(is_used);

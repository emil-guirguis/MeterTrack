-- Migration: Add missing columns to sync_log table
-- This migration adds the operation_type, batch_size, success, and error_message columns
-- to the sync_log table if they don't already exist.

-- Add operation_type column if it doesn't exist
ALTER TABLE sync_log
ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50);

-- Add batch_size column if it doesn't exist
ALTER TABLE sync_log
ADD COLUMN IF NOT EXISTS batch_size INTEGER;

-- Add success column if it doesn't exist
ALTER TABLE sync_log
ADD COLUMN IF NOT EXISTS success BOOLEAN;

-- Add error_message column if it doesn't exist
ALTER TABLE sync_log
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add synced_at column if it doesn't exist
ALTER TABLE sync_log
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index on synced_at if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log(synced_at);

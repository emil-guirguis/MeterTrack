-- Migration: Add batch size configuration columns to tenant table
-- This migration adds download_batch_size and upload_batch_size columns
-- to the tenant table if they don't already exist.
-- Default values: download_batch_size=1000, upload_batch_size=100

-- Add download_batch_size column if it doesn't exist
ALTER TABLE tenant
ADD COLUMN IF NOT EXISTS download_batch_size INTEGER NOT NULL DEFAULT 1000;

-- Add upload_batch_size column if it doesn't exist
ALTER TABLE tenant
ADD COLUMN IF NOT EXISTS upload_batch_size INTEGER NOT NULL DEFAULT 100;

-- Create index on batch size columns for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_tenant_batch_sizes ON tenant(download_batch_size, upload_batch_size);

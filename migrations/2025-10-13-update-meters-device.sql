-- Migration: Update meters table to use device_id foreign key
-- Remove manufacturer and model columns
ALTER TABLE meters
  DROP COLUMN IF EXISTS manufacturer,
  DROP COLUMN IF EXISTS model;

-- Add device_id column and foreign key
ALTER TABLE meters
  ADD COLUMN IF NOT EXISTS device_id UUID;

-- Create devices table if not exists
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  description TEXT,
  createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint
ALTER TABLE meters
  ADD CONSTRAINT fk_meters_device_id FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL;

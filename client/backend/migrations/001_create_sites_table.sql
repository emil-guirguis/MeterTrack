-- Migration: Create sites table
-- Description: Create the sites table to store Sync site information
-- Date: 2025-11-14

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  last_heartbeat TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on api_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_api_key ON sites(api_key);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_sites_is_active ON sites(is_active);

-- Add comment to table
COMMENT ON TABLE sites IS 'Stores information about Sync sites that connect to the Client System';
COMMENT ON COLUMN sites.api_key IS 'API key for Sync authentication (stored as plain text for comparison)';
COMMENT ON COLUMN sites.last_heartbeat IS 'Timestamp of last heartbeat received from Sync';
COMMENT ON COLUMN sites.is_active IS 'Whether the site is active and allowed to sync';

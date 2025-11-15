-- Migration: Create meters table
-- Description: Create the meters table with site_id foreign key
-- Date: 2025-11-14

-- Create meters table
CREATE TABLE IF NOT EXISTS meters (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  bacnet_device_id INTEGER,
  bacnet_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, external_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meters_site_id ON meters(site_id);
CREATE INDEX IF NOT EXISTS idx_meters_external_id ON meters(external_id);

-- Add comments to table
COMMENT ON TABLE meters IS 'Stores meter information for all sites';
COMMENT ON COLUMN meters.site_id IS 'Foreign key to sites table';
COMMENT ON COLUMN meters.external_id IS 'External identifier from Sync (e.g., meter-001)';
COMMENT ON COLUMN meters.bacnet_device_id IS 'BACnet device ID for the meter';
COMMENT ON COLUMN meters.bacnet_ip IS 'IP address of the BACnet meter';

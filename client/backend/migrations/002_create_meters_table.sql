-- Migration: Create meter table
-- Description: Create the meter table with site_id foreign key
-- Date: 2025-11-14

-- Create meter table
CREATE TABLE IF NOT EXISTS meter (
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
CREATE INDEX IF NOT EXISTS idx_meter_site_id ON meter(site_id);
CREATE INDEX IF NOT EXISTS idx_meter_external_id ON meter(external_id);

-- Add comments to table
COMMENT ON TABLE meter IS 'Stores meter information for all sites';
COMMENT ON COLUMN meter.site_id IS 'Foreign key to sites table';
COMMENT ON COLUMN meter.external_id IS 'External identifier from Sync (e.g., meter-001)';
COMMENT ON COLUMN meter.bacnet_device_id IS 'BACnet device ID for the meter';
COMMENT ON COLUMN meter.bacnet_ip IS 'IP address of the BACnet meter';

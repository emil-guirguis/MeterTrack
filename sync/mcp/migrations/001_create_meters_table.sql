-- Migration: Create meters table
-- Description: Stores local meter configuration cached from Client System

CREATE TABLE IF NOT EXISTS meters (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  bacnet_device_id INTEGER,
  bacnet_ip VARCHAR(45),
  config JSONB,
  last_reading_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active meters lookup
CREATE INDEX idx_meters_active ON meters(is_active);

-- Create index for external_id lookup
CREATE INDEX idx_meters_external_id ON meters(external_id);

-- Migration: Create meter_readings table
-- Description: Temporary storage for meter readings with sync tracking

CREATE TABLE IF NOT EXISTS meter_readings (
  id SERIAL PRIMARY KEY,
  meter_external_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  data_point VARCHAR(100) NOT NULL,
  value NUMERIC(15, 3) NOT NULL,
  unit VARCHAR(50),
  is_synchronized BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create composite index for sync queries (unsynchronized readings ordered by creation)
CREATE INDEX idx_meter_readings_sync_status ON meter_readings(is_synchronized, created_at);

-- Create index for meter and timestamp lookups
CREATE INDEX idx_meter_readings_meter_timestamp ON meter_readings(meter_external_id, timestamp);

-- Create index for timestamp-based queries
CREATE INDEX idx_meter_readings_timestamp ON meter_readings(timestamp);

-- Migration: Create meter_readings table
-- Description: Create the meter_readings table with meter_id foreign key
-- Date: 2025-11-14

-- Create meter_readings table
CREATE TABLE IF NOT EXISTS meter_readings (
  id SERIAL PRIMARY KEY,
  meter_id INTEGER REFERENCES meters(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  data_point VARCHAR(100) NOT NULL,
  value NUMERIC(15, 3) NOT NULL,
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_id ON meter_readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_timestamp ON meter_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_timestamp ON meter_readings(meter_id, timestamp);

-- Add comments to table
COMMENT ON TABLE meter_readings IS 'Stores meter reading data from all sites';
COMMENT ON COLUMN meter_readings.meter_id IS 'Foreign key to meters table';
COMMENT ON COLUMN meter_readings.timestamp IS 'Timestamp when the reading was taken';
COMMENT ON COLUMN meter_readings.data_point IS 'Type of data point (e.g., total_kwh, current_kw)';
COMMENT ON COLUMN meter_readings.value IS 'Numeric value of the reading';
COMMENT ON COLUMN meter_readings.unit IS 'Unit of measurement (e.g., kWh, kW, V, A)';

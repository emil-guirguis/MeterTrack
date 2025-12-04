-- Initialize Sync Database Schema

-- Tenant table
CREATE TABLE IF NOT EXISTS tenant (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(255),
  street VARCHAR(255),
  street2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meter table
CREATE TABLE IF NOT EXISTS meter (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  serial_number VARCHAR(255),
  installation_date VARCHAR(50),
  device_id VARCHAR(255),
  location_id VARCHAR(255),
  ip VARCHAR(50),
  port VARCHAR(10),
  protocol VARCHAR(50),
  status VARCHAR(50),
  register_map JSONB,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at VARCHAR(50),
  updated_at VARCHAR(50)
);

-- Meter Reading table
CREATE TABLE IF NOT EXISTS meter_reading (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(255) NOT NULL REFERENCES meter(id),
  timestamp TIMESTAMP NOT NULL,
  data_point VARCHAR(255),
  value NUMERIC,
  unit VARCHAR(50),
  is_synchronized BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync Log table
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  batch_size INTEGER,
  success BOOLEAN,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meter_reading_meter_id ON meter_reading(meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_reading_is_synchronized ON meter_reading(is_synchronized);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log(synced_at);

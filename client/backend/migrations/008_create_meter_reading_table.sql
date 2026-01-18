-- Create meter_reading table for storing readings synced from BACnet devices
CREATE TABLE IF NOT EXISTS meter_reading (
  meter_reading_id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
  meter_id INTEGER NOT NULL REFERENCES meter(meter_id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  data_point VARCHAR(255),
  value NUMERIC,
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meter_reading_tenant_id ON meter_reading(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meter_reading_meter_id ON meter_reading(meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_reading_timestamp ON meter_reading(timestamp);
CREATE INDEX IF NOT EXISTS idx_meter_reading_tenant_meter ON meter_reading(tenant_id, meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_reading_tenant_timestamp ON meter_reading(tenant_id, timestamp);

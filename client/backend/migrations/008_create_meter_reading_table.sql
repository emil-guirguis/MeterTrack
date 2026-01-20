-- Create meter_reading table for storing readings synced from BACnet devices
-- Note: Using reading_timestamp instead of timestamp (reserved keyword in PostgreSQL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meter_reading') THEN
    CREATE TABLE meter_reading (
      meter_reading_id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
      meter_id INTEGER NOT NULL REFERENCES meter(meter_id) ON DELETE CASCADE,
      reading_timestamp TIMESTAMP NOT NULL,
      data_point VARCHAR(255),
      value NUMERIC,
      unit VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes for common queries
    CREATE INDEX idx_meter_reading_tenant_id ON meter_reading(tenant_id);
    CREATE INDEX idx_meter_reading_meter_id ON meter_reading(meter_id);
    CREATE INDEX idx_meter_reading_reading_timestamp ON meter_reading(reading_timestamp);
    CREATE INDEX idx_meter_reading_tenant_meter ON meter_reading(tenant_id, meter_id);
    CREATE INDEX idx_meter_reading_tenant_timestamp ON meter_reading(tenant_id, reading_timestamp);
  END IF;
END $$;

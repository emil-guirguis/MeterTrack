-- Meter Integration Tables Creation Script
-- This script creates tables for meter integration logging and tracking

-- Drop existing tables if they exist
DROP TABLE IF EXISTS meter_status_log;
DROP TABLE IF EXISTS meter_usage_alerts;
DROP TABLE IF EXISTS meter_monitoring_alerts;

-- Create meter_status_log table
CREATE TABLE meter_status_log (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint for status values
ALTER TABLE meter_status_log ADD CONSTRAINT meter_status_log_status_check 
CHECK (old_status IN ('active', 'inactive', 'offline', 'maintenance', 'error') OR old_status IS NULL);

ALTER TABLE meter_status_log ADD CONSTRAINT meter_status_log_new_status_check 
CHECK (new_status IN ('active', 'inactive', 'offline', 'maintenance', 'error'));

-- Create indexes for meter_status_log
CREATE INDEX idx_meter_status_log_meter_id ON meter_status_log(meter_id);
CREATE INDEX idx_meter_status_log_created_at ON meter_status_log(created_at);
CREATE INDEX idx_meter_status_log_new_status ON meter_status_log(new_status);

-- Create meter_usage_alerts table
CREATE TABLE meter_usage_alerts (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    alert_data JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint for alert_type
ALTER TABLE meter_usage_alerts ADD CONSTRAINT meter_usage_alerts_type_check 
CHECK (alert_type IN ('high_usage', 'low_usage', 'usage_spike', 'no_usage', 'anomaly'));

-- Create indexes for meter_usage_alerts
CREATE INDEX idx_meter_usage_alerts_meter_id ON meter_usage_alerts(meter_id);
CREATE INDEX idx_meter_usage_alerts_type ON meter_usage_alerts(alert_type);
CREATE INDEX idx_meter_usage_alerts_resolved ON meter_usage_alerts(resolved);
CREATE INDEX idx_meter_usage_alerts_created_at ON meter_usage_alerts(created_at);

-- Create a trigger to automatically update the updated_at timestamp for meter_usage_alerts
CREATE OR REPLACE FUNCTION update_meter_usage_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meter_usage_alerts_updated_at
    BEFORE UPDATE ON meter_usage_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_meter_usage_alerts_updated_at();

-- Create meter_monitoring_alerts table
CREATE TABLE meter_monitoring_alerts (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    alert_data JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint for alert_type
ALTER TABLE meter_monitoring_alerts ADD CONSTRAINT meter_monitoring_alerts_type_check 
CHECK (alert_type IN ('offline', 'communication_gaps', 'pattern_anomaly', 'reading_error'));

-- Create indexes for meter_monitoring_alerts
CREATE INDEX idx_meter_monitoring_alerts_meter_id ON meter_monitoring_alerts(meter_id);
CREATE INDEX idx_meter_monitoring_alerts_type ON meter_monitoring_alerts(alert_type);
CREATE INDEX idx_meter_monitoring_alerts_resolved ON meter_monitoring_alerts(resolved);
CREATE INDEX idx_meter_monitoring_alerts_created_at ON meter_monitoring_alerts(created_at);

-- Create a trigger to automatically update the updated_at timestamp for meter_monitoring_alerts
CREATE TRIGGER update_meter_monitoring_alerts_updated_at
    BEFORE UPDATE ON meter_monitoring_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_meter_usage_alerts_updated_at();

-- Add building_id column to meters table if it doesn't exist
DO $$ 
BEGIN
    -- Add building_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meters' AND column_name = 'building_id') THEN
        
        -- Check if buildings table exists and determine the ID type
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
            -- Check if buildings.id is UUID type
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'buildings' AND column_name = 'id' AND data_type = 'uuid') THEN
                -- Add UUID column for building_id
                ALTER TABLE meters ADD COLUMN building_id UUID;
                
                -- Try to populate building_id from location_building
                UPDATE meters 
                SET building_id = b.id
                FROM buildings b 
                WHERE meters.location_building = b.name 
                    AND meters.building_id IS NULL;
            ELSE
                -- Add INTEGER column for building_id
                ALTER TABLE meters ADD COLUMN building_id INTEGER;
                
                -- Try to populate building_id from location_building
                UPDATE meters 
                SET building_id = b.id 
                FROM buildings b 
                WHERE meters.location_building = b.name 
                    AND meters.building_id IS NULL;
            END IF;
        ELSE
            -- Default to INTEGER if buildings table doesn't exist
            ALTER TABLE meters ADD COLUMN building_id INTEGER;
        END IF;
        
        -- Create index for building_id
        CREATE INDEX idx_meters_building_id ON meters(building_id);
    END IF;
    
    -- Add is_active column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meters' AND column_name = 'is_active') THEN
        ALTER TABLE meters ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Set is_active based on status
        UPDATE meters SET is_active = (status = 'active');
        
        -- Create index for is_active
        CREATE INDEX idx_meters_is_active ON meters(is_active);
    END IF;
END $$;
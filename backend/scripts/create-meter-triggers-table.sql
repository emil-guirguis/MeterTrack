-- Meter Triggers Table Creation Script
-- This script creates the meter_triggers table for tracking detected triggers and anomalies

-- Drop existing table if it exists
DROP TABLE IF EXISTS meter_triggers;

-- Create meter_triggers table
CREATE TABLE meter_triggers (
    id SERIAL PRIMARY KEY,
    meter_id INTEGER NOT NULL,
    location_id INTEGER,
    trigger_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    message TEXT NOT NULL,
    trigger_data JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint for trigger_type
ALTER TABLE meter_triggers ADD CONSTRAINT meter_triggers_type_check 
CHECK (trigger_type IN (
    'communication_timeout', 'no_readings', 'communication_gaps',
    'high_usage', 'usage_spike', 'low_usage', 'statistical_anomaly',
    'maintenance_due', 'maintenance_overdue'
));

-- Add check constraint for severity
ALTER TABLE meter_triggers ADD CONSTRAINT meter_triggers_severity_check 
CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Create indexes for better performance
CREATE INDEX idx_meter_triggers_meter_id ON meter_triggers(meter_id);
CREATE INDEX idx_meter_triggers_location_id ON meter_triggers(location_id);
CREATE INDEX idx_meter_triggers_type ON meter_triggers(trigger_type);
CREATE INDEX idx_meter_triggers_severity ON meter_triggers(severity);
CREATE INDEX idx_meter_triggers_resolved ON meter_triggers(resolved);
CREATE INDEX idx_meter_triggers_created_at ON meter_triggers(created_at);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_meter_triggers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meter_triggers_updated_at
    BEFORE UPDATE ON meter_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_meter_triggers_updated_at();
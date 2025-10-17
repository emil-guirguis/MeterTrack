-- Notification Logs Table Creation Script
-- This script creates the notification_logs table for tracking automated notifications

-- Drop existing table if it exists
DROP TABLE IF EXISTS notification_logs;

-- Create notification_logs table
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    meter_id INTEGER,
    location_id INTEGER,
    template_id INTEGER REFERENCES email_templates(id),
    recipients TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint for type
ALTER TABLE notification_logs ADD CONSTRAINT notification_logs_type_check 
CHECK (type IN ('monthly_report', 'maintenance_reminder', 'error_notification', 'custom'));

-- Add check constraint for status
ALTER TABLE notification_logs ADD CONSTRAINT notification_logs_status_check 
CHECK (status IN ('pending', 'sent', 'failed', 'failed_max_retries', 'cancelled'));

-- Create indexes for better performance
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX idx_notification_logs_meter_id ON notification_logs(meter_id);
CREATE INDEX idx_notification_logs_location_id ON notification_logs(location_id);
CREATE INDEX idx_notification_logs_template_id ON notification_logs(template_id);
CREATE INDEX idx_notification_logs_scheduled_at ON notification_logs(scheduled_at);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_logs_updated_at
    BEFORE UPDATE ON notification_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_logs_updated_at();

-- Add maintenance tracking columns to meters table if they don't exist
DO $$ 
BEGIN
    -- Add maintenance_reminder_sent column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meters' AND column_name = 'maintenance_reminder_sent') THEN
        ALTER TABLE meters ADD COLUMN maintenance_reminder_sent DATE;
    END IF;
    
    -- Add next_maintenance column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meters' AND column_name = 'next_maintenance') THEN
        ALTER TABLE meters ADD COLUMN next_maintenance DATE;
    END IF;
    
    -- Add last_maintenance column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meters' AND column_name = 'last_maintenance') THEN
        ALTER TABLE meters ADD COLUMN last_maintenance DATE;
    END IF;
    
    -- Add maintenance_interval column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meters' AND column_name = 'maintenance_interval') THEN
        ALTER TABLE meters ADD COLUMN maintenance_interval VARCHAR(50) DEFAULT '3 months';
    END IF;
    
    -- Add maintenance_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'meters' AND column_name = 'maintenance_notes') THEN
        ALTER TABLE meters ADD COLUMN maintenance_notes TEXT;
    END IF;
END $$;
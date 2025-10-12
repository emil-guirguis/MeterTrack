-- Email Templates Table Creation Script
-- This script creates the email_templates table for the facility management system

-- Drop existing table if it exists
DROP TABLE IF EXISTS email_templates;

-- Create email_templates table with correct structure
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    isdefault BOOLEAN DEFAULT false,
    isactive BOOLEAN DEFAULT true,
    usagecount INTEGER DEFAULT 0,
    lastused TIMESTAMP,
    createdby INTEGER,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint for category
ALTER TABLE email_templates ADD CONSTRAINT email_templates_category_check 
CHECK (category IN ('meter_readings', 'meter_errors', 'maintenance', 'general'));

-- Create indexes for better performance
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_isactive ON email_templates(isactive);
CREATE INDEX idx_email_templates_isdefault ON email_templates(isdefault);
CREATE INDEX idx_email_templates_usagecount ON email_templates(usagecount);
CREATE INDEX idx_email_templates_createdat ON email_templates(createdat);
CREATE INDEX idx_email_templates_name ON email_templates(name);

-- Create a trigger to automatically update the updatedat timestamp
CREATE OR REPLACE FUNCTION update_email_templates_updatedat()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updatedat
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_email_templates_updatedat();
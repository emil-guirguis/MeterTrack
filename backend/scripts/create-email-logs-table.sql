-- Email Logs Table Creation Script
-- This script creates the email_logs table for tracking email delivery

-- Drop existing table if it exists
DROP TABLE IF EXISTS email_logs;

-- Create email_logs table
CREATE TABLE email_logs (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255),
    recipient TEXT NOT NULL,
    subject VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    response TEXT,
    error TEXT,
    template_id INTEGER REFERENCES email_templates(id),
    tracking_id VARCHAR(100),
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add check constraint for status
ALTER TABLE email_logs ADD CONSTRAINT email_logs_status_check 
CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'));

-- Create indexes for better performance
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX idx_email_logs_message_id ON email_logs(message_id);
CREATE INDEX idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX idx_email_logs_tracking_id ON email_logs(tracking_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON email_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_email_logs_updated_at();
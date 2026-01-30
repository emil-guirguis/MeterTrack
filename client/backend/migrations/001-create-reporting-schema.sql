-- Reporting Module Database Schema
-- Creates tables for reports, execution history, and email delivery logs
-- Note: Using report_email_logs instead of email_logs to avoid conflict with existing email_logs table

-- Create Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  schedule VARCHAR(255) NOT NULL,
  recipients TEXT[] NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Report_History table
CREATE TABLE IF NOT EXISTS report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  executed_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Report_Email_Logs table
CREATE TABLE IF NOT EXISTS report_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  history_id UUID NOT NULL REFERENCES report_history(id) ON DELETE CASCADE,
  recipient VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for query performance on report_history
CREATE INDEX IF NOT EXISTS idx_report_history_report_id ON report_history(report_id);

-- Create indexes for query performance on report_history (executed_at)
CREATE INDEX IF NOT EXISTS idx_report_history_executed_at ON report_history(executed_at);

-- Create indexes for query performance on report_email_logs
CREATE INDEX IF NOT EXISTS idx_report_email_logs_report_id ON report_email_logs(report_id);

-- Create indexes for query performance on report_email_logs (history_id)
CREATE INDEX IF NOT EXISTS idx_report_email_logs_history_id ON report_email_logs(history_id);

-- Create indexes for query performance on report_email_logs (recipient)
CREATE INDEX IF NOT EXISTS idx_report_email_logs_recipient ON report_email_logs(recipient);

-- Create indexes for query performance on report_email_logs (sent_at)
CREATE INDEX IF NOT EXISTS idx_report_email_logs_sent_at ON report_email_logs(sent_at);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_report_history_report_executed ON report_history(report_id, executed_at DESC);

-- Create composite indexes for report_email_logs
CREATE INDEX IF NOT EXISTS idx_report_email_logs_history_recipient ON report_email_logs(history_id, recipient);

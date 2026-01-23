-- Extend email_templates table with sendTo and sendFrom fields
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS send_to VARCHAR(500),
ADD COLUMN IF NOT EXISTS send_from VARCHAR(255);


-- Add grouping_type column to dashboard table
-- This column stores the data grouping preference (total, hourly, daily, weekly, monthly)

ALTER TABLE dashboard
ADD COLUMN IF NOT EXISTS grouping_type VARCHAR(50) DEFAULT 'daily' NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN dashboard.grouping_type IS 'Data grouping type: total (single aggregation), hourly, daily, weekly, or monthly';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_dashboard_grouping_type ON dashboard(grouping_type);

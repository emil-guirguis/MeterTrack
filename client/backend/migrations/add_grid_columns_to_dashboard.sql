-- Add grid layout columns to dashboard table
-- These columns store the grid position and size for dashboard cards

ALTER TABLE dashboard
ADD COLUMN IF NOT EXISTS grid_x INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grid_y INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grid_w INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grid_h INTEGER DEFAULT NULL;

-- Add comments to explain the columns
COMMENT ON COLUMN dashboard.grid_x IS 'Grid column position (0-based)';
COMMENT ON COLUMN dashboard.grid_y IS 'Grid row position (0-based)';
COMMENT ON COLUMN dashboard.grid_w IS 'Grid column width (in grid units)';
COMMENT ON COLUMN dashboard.grid_h IS 'Grid row height (in grid units)';

-- Create index for grid queries
CREATE INDEX IF NOT EXISTS idx_dashboard_grid_position ON dashboard(grid_x, grid_y);

-- Add grid layout columns to dashboard table
-- These columns store the grid position and size in PIXELS for dashboard cards

ALTER TABLE dashboard
ADD COLUMN IF NOT EXISTS grid_x INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grid_y INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grid_w INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grid_h INTEGER DEFAULT NULL;

-- Add comments to explain the columns (in PIXELS, not grid units)
COMMENT ON COLUMN dashboard.grid_x IS 'Grid X position in pixels';
COMMENT ON COLUMN dashboard.grid_y IS 'Grid Y position in pixels';
COMMENT ON COLUMN dashboard.grid_w IS 'Card width in pixels';
COMMENT ON COLUMN dashboard.grid_h IS 'Card height in pixels';

-- Create index for grid queries
CREATE INDEX IF NOT EXISTS idx_dashboard_grid_position ON dashboard(grid_x, grid_y);

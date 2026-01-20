-- Create dashboard table for storing user-configured dashboard cards
CREATE TABLE IF NOT EXISTS dashboard (
  dashboard_id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenant(tenant_id) ON DELETE CASCADE,
  created_by_users_id BIGINT NOT NULL REFERENCES "users"(users_id) ON DELETE CASCADE,
  meter_id BIGINT NOT NULL REFERENCES meter(meter_id) ON DELETE CASCADE,
  meter_element_id INTEGER NOT NULL,
  
  -- Card configuration
  card_name VARCHAR(255) NOT NULL,
  card_description TEXT,
  
  -- Column selection (JSON array of column names)
  selected_columns JSONB NOT NULL DEFAULT '[]',
  
  -- Time frame configuration
  time_frame_type VARCHAR(50) NOT NULL DEFAULT 'last_month',
  custom_start_date TIMESTAMP,
  custom_end_date TIMESTAMP,
  
  -- Visualization configuration
  visualization_type VARCHAR(50) NOT NULL DEFAULT 'line',
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_dashboard_meter_element FOREIGN KEY (meter_element_id, meter_id) REFERENCES meter_element(meter_element_id, meter_id) ON DELETE CASCADE,
  CONSTRAINT check_time_frame_type CHECK (time_frame_type IN ('custom', 'last_month', 'this_month_to_date', 'since_installation')),
  CONSTRAINT check_visualization_type CHECK (visualization_type IN ('pie', 'line', 'candlestick', 'bar', 'area')),
  CONSTRAINT check_custom_date_range CHECK (
    time_frame_type != 'custom' OR (custom_start_date IS NOT NULL AND custom_end_date IS NOT NULL AND custom_start_date < custom_end_date)
  )
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_dashboard_tenant_id ON dashboard(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_created_by ON dashboard(created_by_users_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_meter_id ON dashboard(meter_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_meter_element_id ON dashboard(meter_element_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tenant_meter_element ON dashboard(tenant_id, meter_element_id);

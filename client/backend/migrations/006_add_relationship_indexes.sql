-- Migration: Add indexes for foreign keys to optimize relationship queries
-- Created: 2025-11-21
-- Purpose: Improve performance of JOIN operations and relationship loading

-- Indexes for meters table
CREATE INDEX IF NOT EXISTS idx_meters_device_id ON meters(device_id);
CREATE INDEX IF NOT EXISTS idx_meters_location_id ON meters(location_id);
CREATE INDEX IF NOT EXISTS idx_meters_tenant_id ON meters(tenant_id);

-- Indexes for devices table
CREATE INDEX IF NOT EXISTS idx_devices_tenant_id ON devices(tenant_id);

-- Indexes for locations table
CREATE INDEX IF NOT EXISTS idx_locations_tenant_id ON locations(tenant_id);

-- Indexes for contacts table
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON contacts(tenant_id);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- Indexes for meter_readings table
CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_id ON meter_readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_timestamp ON meter_readings(timestamp);

-- Indexes for meter_maintenance table
CREATE INDEX IF NOT EXISTS idx_meter_maintenance_meter_id ON meter_maintenance(meter_id);

-- Indexes for meter_status_log table
CREATE INDEX IF NOT EXISTS idx_meter_status_log_meter_id ON meter_status_log(meter_id);

-- Indexes for meter_triggers table
CREATE INDEX IF NOT EXISTS idx_meter_triggers_meter_id ON meter_triggers(meter_id);

-- Indexes for meter_usage_alerts table
CREATE INDEX IF NOT EXISTS idx_meter_usage_alerts_meter_id ON meter_usage_alerts(meter_id);

-- Indexes for meter_monitoring_alerts table
CREATE INDEX IF NOT EXISTS idx_meter_monitoring_alerts_meter_id ON meter_monitoring_alerts(meter_id);

-- Indexes for meter_maps table
CREATE INDEX IF NOT EXISTS idx_meter_maps_meter_id ON meter_maps(meter_id);

-- Indexes for email_logs table
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_id ON email_logs(tenant_id);

-- Indexes for notification_logs table
CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant_id ON notification_logs(tenant_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_meters_tenant_status ON meters(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_devices_tenant_status ON devices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_locations_tenant_status ON locations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_status ON contacts(tenant_id, status);

-- Index for meter readings by meter and date range (common query pattern)
CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_timestamp ON meter_readings(meter_id, timestamp DESC);

COMMENT ON INDEX idx_meters_device_id IS 'Optimize meter -> device relationship queries';
COMMENT ON INDEX idx_meters_location_id IS 'Optimize meter -> location relationship queries';
COMMENT ON INDEX idx_meter_readings_meter_id IS 'Optimize meter -> readings relationship queries';
COMMENT ON INDEX idx_meters_tenant_status IS 'Optimize filtered meter queries by tenant and status';

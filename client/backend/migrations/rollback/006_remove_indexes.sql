-- Rollback Migration 006: Remove relationship indexes
-- Created: 2025-11-21

-- Remove foreign key indexes
DROP INDEX IF EXISTS idx_meters_device_id;
DROP INDEX IF EXISTS idx_meters_location_id;
DROP INDEX IF EXISTS idx_meters_tenant_id;
DROP INDEX IF EXISTS idx_devices_tenant_id;
DROP INDEX IF EXISTS idx_locations_tenant_id;
DROP INDEX IF EXISTS idx_contacts_tenant_id;
DROP INDEX IF EXISTS idx_users_tenant_id;
DROP INDEX IF EXISTS idx_meter_readings_meter_id;
DROP INDEX IF EXISTS idx_meter_readings_timestamp;
DROP INDEX IF EXISTS idx_meter_maintenance_meter_id;
DROP INDEX IF EXISTS idx_meter_status_log_meter_id;
DROP INDEX IF EXISTS idx_meter_triggers_meter_id;
DROP INDEX IF EXISTS idx_meter_usage_alerts_meter_id;
DROP INDEX IF EXISTS idx_meter_monitoring_alerts_meter_id;
DROP INDEX IF EXISTS idx_meter_maps_meter_id;
DROP INDEX IF EXISTS idx_email_logs_tenant_id;
DROP INDEX IF EXISTS idx_notification_logs_tenant_id;

-- Remove composite indexes
DROP INDEX IF EXISTS idx_meters_tenant_status;
DROP INDEX IF EXISTS idx_devices_tenant_status;
DROP INDEX IF EXISTS idx_locations_tenant_status;
DROP INDEX IF EXISTS idx_contacts_tenant_status;
DROP INDEX IF EXISTS idx_meter_readings_meter_timestamp;

-- Rollback: Drop meter_readings table
-- Description: Rollback for 003_create_meter_readings_table.sql
-- Date: 2025-11-14

-- Drop indexes
DROP INDEX IF EXISTS idx_meter_readings_meter_id;
DROP INDEX IF EXISTS idx_meter_readings_timestamp;
DROP INDEX IF EXISTS idx_meter_readings_meter_timestamp;

-- Drop table
DROP TABLE IF EXISTS meter_readings CASCADE;

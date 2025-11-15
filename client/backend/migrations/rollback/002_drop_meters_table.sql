-- Rollback: Drop meter table
-- Description: Rollback for 002_create_meters_table.sql
-- Date: 2025-11-14

-- Drop indexes
DROP INDEX IF EXISTS idx_meter_site_id;
DROP INDEX IF EXISTS idx_meter_external_id;

-- Drop table
DROP TABLE IF EXISTS meter CASCADE;

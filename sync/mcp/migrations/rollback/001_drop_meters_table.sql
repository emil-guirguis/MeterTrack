-- Rollback: Drop meters table
-- Description: Rollback for 001_create_meters_table.sql
-- Date: 2025-11-14

-- Drop indexes
DROP INDEX IF EXISTS idx_meters_active;
DROP INDEX IF EXISTS idx_meters_external_id;

-- Drop table
DROP TABLE IF EXISTS meters CASCADE;

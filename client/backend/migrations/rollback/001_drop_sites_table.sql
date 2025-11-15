-- Rollback: Drop sites table
-- Description: Rollback for 001_create_sites_table.sql
-- Date: 2025-11-14

-- Drop indexes
DROP INDEX IF EXISTS idx_sites_api_key;
DROP INDEX IF EXISTS idx_sites_is_active;

-- Drop table
DROP TABLE IF EXISTS sites CASCADE;

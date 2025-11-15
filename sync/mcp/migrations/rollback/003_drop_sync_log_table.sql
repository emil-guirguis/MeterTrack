-- Rollback: Drop sync_log table
-- Description: Rollback for 003_create_sync_log_table.sql
-- Date: 2025-11-14

-- Drop indexes
DROP INDEX IF EXISTS idx_sync_log_synced_at;
DROP INDEX IF EXISTS idx_sync_log_success;

-- Drop table
DROP TABLE IF EXISTS sync_log CASCADE;

-- Migration: Create sync_log table
-- Description: Tracks synchronization operations for monitoring and debugging

CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  batch_size INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for querying recent sync operations
CREATE INDEX idx_sync_log_synced_at ON sync_log(synced_at DESC);

-- Create index for filtering by success status
CREATE INDEX idx_sync_log_success ON sync_log(success);

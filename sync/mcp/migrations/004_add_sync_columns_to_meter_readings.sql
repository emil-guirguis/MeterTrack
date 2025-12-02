-- Migration: Add sync column to meter_readings table
-- Description: Add is_synchronized column for database sync tracking

-- Add is_synchronized column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meter_readings' AND column_name = 'is_synchronized'
    ) THEN
        ALTER TABLE meter_readings ADD COLUMN is_synchronized BOOLEAN DEFAULT false;
        CREATE INDEX idx_meter_readings_sync ON meter_readings(is_synchronized, createdat);
        
        -- Set existing records to false
        UPDATE meter_readings SET is_synchronized = false WHERE is_synchronized IS NULL;
    END IF;
END $$;

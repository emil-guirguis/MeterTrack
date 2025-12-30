-- Remove status column from meter_element table
-- This migration removes the status column that is no longer used

ALTER TABLE meter_element DROP COLUMN IF EXISTS status;

-- Verify the column was removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'meter_element' 
ORDER BY ordinal_position;

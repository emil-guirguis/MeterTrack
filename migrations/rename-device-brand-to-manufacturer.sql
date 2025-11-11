-- Rename device.brand to device.manufacturer
-- This migration renames the brand column to manufacturer in the device table

BEGIN;

-- Rename the column in the device table
ALTER TABLE device 
RENAME COLUMN brand TO manufacturer;

-- Update any indexes that reference the brand column
DROP INDEX IF EXISTS idx_device_brand;
CREATE INDEX IF NOT EXISTS idx_device_manufacturer ON device(manufacturer);

-- Verification
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'device' 
        AND column_name = 'manufacturer'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'SUCCESS: Column renamed from brand to manufacturer';
    ELSE
        RAISE EXCEPTION 'FAILED: manufacturer column not found';
    END IF;
END $$;

COMMIT;

SELECT 'Device brand to manufacturer migration completed successfully!' as status;

-- Migration: Update meter device_id references
-- This script adds device_id column to meters table and updates references
-- to point to the new devices table instead of using manufacturer/model directly

-- Step 1: Add device_id column to meters table if it doesn't exist
ALTER TABLE meters 
ADD COLUMN IF NOT EXISTS device_id UUID;

-- Step 2: Create foreign key constraint to devices table
ALTER TABLE meters 
ADD CONSTRAINT fk_meters_device_id 
FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL;

-- Step 3: Update meter device_id references based on manufacturer and model
-- This uses the brand_device_mapping table created in the previous migration
UPDATE meters 
SET device_id = (
    SELECT d.id 
    FROM devices d
    WHERE 
        -- Try exact manufacturer match first
        d.name = meters.manufacturer
        OR 
        -- Try manufacturer + model match
        (meters.model IS NOT NULL AND meters.model != '' AND 
         d.name = meters.manufacturer || ' (' || meters.model || ')')
        OR
        -- Try partial match on description containing the model
        (meters.model IS NOT NULL AND meters.model != '' AND 
         d.description LIKE '%Model: ' || meters.model || '%')
    LIMIT 1
)
WHERE meters.manufacturer IS NOT NULL 
AND meters.device_id IS NULL;

-- Step 4: For meters without manufacturer but with model, try to find device by model in description
UPDATE meters 
SET device_id = (
    SELECT d.id 
    FROM devices d
    WHERE meters.model IS NOT NULL 
    AND meters.model != '' 
    AND d.description LIKE '%Model: ' || meters.model || '%'
    LIMIT 1
)
WHERE meters.manufacturer IS NULL 
AND meters.model IS NOT NULL 
AND meters.device_id IS NULL;

-- Step 5: Create devices for meters that don't have matching devices
-- This handles cases where meters have manufacturer/model combinations not in the brands table
INSERT INTO devices (name, description)
SELECT DISTINCT
    COALESCE(manufacturer, 'Unknown Manufacturer') as name,
    CASE 
        WHEN model IS NOT NULL AND model != '' THEN 'Model: ' || model
        ELSE 'Device created from meter data'
    END as description
FROM meters 
WHERE device_id IS NULL 
AND (manufacturer IS NOT NULL OR model IS NOT NULL)
AND NOT EXISTS (
    SELECT 1 FROM devices d 
    WHERE d.name = COALESCE(meters.manufacturer, 'Unknown Manufacturer')
);

-- Step 6: Update remaining meters with the newly created devices
UPDATE meters 
SET device_id = (
    SELECT d.id 
    FROM devices d
    WHERE d.name = COALESCE(meters.manufacturer, 'Unknown Manufacturer')
    AND (
        (meters.model IS NOT NULL AND d.description LIKE '%Model: ' || meters.model || '%')
        OR 
        (meters.model IS NULL AND d.description = 'Device created from meter data')
    )
    LIMIT 1
)
WHERE device_id IS NULL 
AND (manufacturer IS NOT NULL OR model IS NOT NULL);

-- Step 7: Create index on device_id for better query performance
CREATE INDEX IF NOT EXISTS idx_meters_device_id ON meters(device_id);

-- Step 8: Verify the migration results
DO $$
DECLARE
    total_meters INTEGER;
    meters_with_device_id INTEGER;
    meters_without_device_id INTEGER;
    orphaned_meters INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_meters FROM meters;
    SELECT COUNT(*) INTO meters_with_device_id FROM meters WHERE device_id IS NOT NULL;
    SELECT COUNT(*) INTO meters_without_device_id FROM meters WHERE device_id IS NULL;
    SELECT COUNT(*) INTO orphaned_meters FROM meters 
    WHERE device_id IS NULL AND (manufacturer IS NOT NULL OR model IS NOT NULL);
    
    RAISE NOTICE 'Meter Device Reference Migration Summary:';
    RAISE NOTICE '- Total meters: %', total_meters;
    RAISE NOTICE '- Meters with device_id: %', meters_with_device_id;
    RAISE NOTICE '- Meters without device_id: %', meters_without_device_id;
    RAISE NOTICE '- Orphaned meters (have manufacturer/model but no device_id): %', orphaned_meters;
    
    IF orphaned_meters > 0 THEN
        RAISE WARNING 'There are % meters that could not be matched to devices', orphaned_meters;
        RAISE NOTICE 'These meters may need manual review';
    END IF;
    
    RAISE NOTICE 'Meter device reference migration completed!';
END $$;

-- Step 9: Show sample of updated meters for verification
SELECT 
    m.meterid,
    m.name as meter_name,
    m.manufacturer,
    m.model,
    d.name as device_name,
    d.description as device_description
FROM meters m
LEFT JOIN devices d ON m.device_id = d.id
LIMIT 10;
-- Complete Brands to Devices Migration Script
-- This script performs the complete migration from brands table to devices table
-- and updates all meter references to use the new device_id foreign key

-- Enable transaction for rollback capability
BEGIN;

-- =============================================================================
-- PART 1: Migrate brands data to devices table
-- =============================================================================

-- Step 1: Rename the current devices table to brands_backup for safety
ALTER TABLE devices RENAME TO brands_backup;

-- Step 2: Create the new devices table with proper schema
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create unique index on device name
CREATE UNIQUE INDEX idx_devices_name ON devices(name);

-- Step 4: Create update trigger for devices table
CREATE TRIGGER update_devices_updatedat 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updatedat_column();

-- Step 5: Migrate data from brands_backup to devices table
-- Handle duplicate names by appending model information
INSERT INTO devices (name, description, createdat, updatedat)
SELECT 
    CASE 
        -- If there are duplicates with the same manufacture name, append model
        WHEN COUNT(*) OVER (PARTITION BY manufacture) > 1 THEN 
            CASE 
                WHEN model IS NOT NULL AND model != '' THEN 
                    manufacture || ' (' || model || ')'
                ELSE 
                    manufacture || ' (ID: ' || id || ')'
            END
        ELSE 
            manufacture
    END as name,
    CASE 
        WHEN model IS NOT NULL AND model != '' THEN 
            CASE 
                WHEN notes IS NOT NULL AND notes != '' THEN 
                    'Model: ' || model || '. ' || notes
                ELSE 
                    'Model: ' || model
            END
        ELSE 
            notes
    END as description,
    COALESCE(createdat, CURRENT_TIMESTAMP) as createdat,
    COALESCE(updatedat, CURRENT_TIMESTAMP) as updatedat
FROM brands_backup
ORDER BY id;

-- Step 6: Create a mapping table to track old brand IDs to new device UUIDs
CREATE TABLE brand_device_mapping (
    old_brand_id INTEGER,
    new_device_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 7: Populate the mapping table
INSERT INTO brand_device_mapping (old_brand_id, new_device_id)
SELECT 
    b.id as old_brand_id,
    d.id as new_device_id
FROM brands_backup b
JOIN devices d ON (
    -- Match by exact name or name with model appended
    d.name = b.manufacture OR 
    d.name = b.manufacture || ' (' || COALESCE(b.model, 'ID: ' || b.id) || ')'
)
ORDER BY b.id;

-- =============================================================================
-- PART 2: Update meter device_id references
-- =============================================================================

-- Step 8: Add device_id column to meters table if it doesn't exist
ALTER TABLE meters 
ADD COLUMN IF NOT EXISTS device_id UUID;

-- Step 9: Create foreign key constraint to devices table
ALTER TABLE meters 
ADD CONSTRAINT fk_meters_device_id 
FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL;

-- Step 10: Update meter device_id references based on manufacturer and model
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

-- Step 11: For meters without manufacturer but with model, try to find device by model in description
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

-- Step 12: Create devices for meters that don't have matching devices
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

-- Step 13: Update remaining meters with the newly created devices
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

-- Step 14: Create index on device_id for better query performance
CREATE INDEX IF NOT EXISTS idx_meters_device_id ON meters(device_id);

-- =============================================================================
-- VERIFICATION AND REPORTING
-- =============================================================================

-- Step 15: Comprehensive verification
DO $$
DECLARE
    brands_count INTEGER;
    devices_count INTEGER;
    mapping_count INTEGER;
    total_meters INTEGER;
    meters_with_device_id INTEGER;
    meters_without_device_id INTEGER;
    orphaned_meters INTEGER;
BEGIN
    -- Brands to devices migration verification
    SELECT COUNT(*) INTO brands_count FROM brands_backup;
    SELECT COUNT(*) INTO devices_count FROM devices;
    SELECT COUNT(*) INTO mapping_count FROM brand_device_mapping;
    
    -- Meter device references verification
    SELECT COUNT(*) INTO total_meters FROM meters;
    SELECT COUNT(*) INTO meters_with_device_id FROM meters WHERE device_id IS NOT NULL;
    SELECT COUNT(*) INTO meters_without_device_id FROM meters WHERE device_id IS NULL;
    SELECT COUNT(*) INTO orphaned_meters FROM meters 
    WHERE device_id IS NULL AND (manufacturer IS NOT NULL OR model IS NOT NULL);
    
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Brands to Devices Migration:';
    RAISE NOTICE '- Original brands records: %', brands_count;
    RAISE NOTICE '- New devices records: %', devices_count;
    RAISE NOTICE '- Mapping records created: %', mapping_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Meter Device References:';
    RAISE NOTICE '- Total meters: %', total_meters;
    RAISE NOTICE '- Meters with device_id: %', meters_with_device_id;
    RAISE NOTICE '- Meters without device_id: %', meters_without_device_id;
    RAISE NOTICE '- Orphaned meters: %', orphaned_meters;
    
    IF brands_count != mapping_count THEN
        RAISE EXCEPTION 'Migration verification failed: Brand mapping incomplete';
    END IF;
    
    IF orphaned_meters > 0 THEN
        RAISE WARNING 'There are % meters that could not be matched to devices', orphaned_meters;
        RAISE NOTICE 'These meters may need manual review';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
END $$;

-- Step 16: Show sample results for verification
SELECT 
    'Sample Devices' as table_name,
    d.name,
    d.description,
    d.createdat
FROM devices d
ORDER BY d.createdat
LIMIT 5;

SELECT 
    'Sample Meter-Device Relationships' as table_name,
    m.meterid,
    m.name as meter_name,
    m.manufacturer,
    m.model,
    d.name as device_name,
    d.description as device_description
FROM meters m
LEFT JOIN devices d ON m.device_id = d.id
WHERE m.device_id IS NOT NULL
LIMIT 5;

-- Commit the transaction
COMMIT;

-- Final success message
SELECT 'Brands to Devices migration completed successfully!' as status;
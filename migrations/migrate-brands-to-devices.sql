-- Migration: Copy brands data to devices table
-- This script migrates data from the current "devices" table (which is actually brands data)
-- to a new properly structured devices table

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

-- Step 8: Verify migration results
DO $$
DECLARE
    brands_count INTEGER;
    devices_count INTEGER;
    mapping_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO brands_count FROM brands_backup;
    SELECT COUNT(*) INTO devices_count FROM devices;
    SELECT COUNT(*) INTO mapping_count FROM brand_device_mapping;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Original brands records: %', brands_count;
    RAISE NOTICE '- New devices records: %', devices_count;
    RAISE NOTICE '- Mapping records created: %', mapping_count;
    
    IF brands_count != devices_count OR brands_count != mapping_count THEN
        RAISE EXCEPTION 'Migration verification failed: Record counts do not match';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;
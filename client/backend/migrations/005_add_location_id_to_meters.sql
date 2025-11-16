-- Migration: Add location_id foreign key to meters table
-- Description: Add location_id column with foreign key constraint to location table
-- Date: 2025-11-16

-- Add location_id column to meters table (if using 'meters' table name)
DO $$ 
BEGIN
    -- Check if meters table exists and add column
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meters') THEN
        -- Add location_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'meters' AND column_name = 'location_id') THEN
            ALTER TABLE meters ADD COLUMN location_id UUID;
            RAISE NOTICE 'Added location_id column to meters table';
        END IF;
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints 
                      WHERE constraint_name = 'fk_meters_location_id' AND table_name = 'meters') THEN
            ALTER TABLE meters 
            ADD CONSTRAINT fk_meters_location_id 
            FOREIGN KEY (location_id) 
            REFERENCES location(id) 
            ON DELETE RESTRICT;
            RAISE NOTICE 'Added foreign key constraint fk_meters_location_id to meters table';
        END IF;
        
        -- Create index for performance if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'meters' AND indexname = 'idx_meters_location_id') THEN
            CREATE INDEX idx_meters_location_id ON meters(location_id);
            RAISE NOTICE 'Created index idx_meters_location_id on meters table';
        END IF;
    END IF;

    -- Check if meter table exists and add column (singular form)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meter') THEN
        -- Add location_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'meter' AND column_name = 'location_id') THEN
            ALTER TABLE meter ADD COLUMN location_id UUID;
            RAISE NOTICE 'Added location_id column to meter table';
        END IF;
        
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints 
                      WHERE constraint_name = 'fk_meter_location_id' AND table_name = 'meter') THEN
            ALTER TABLE meter 
            ADD CONSTRAINT fk_meter_location_id 
            FOREIGN KEY (location_id) 
            REFERENCES location(id) 
            ON DELETE RESTRICT;
            RAISE NOTICE 'Added foreign key constraint fk_meter_location_id to meter table';
        END IF;
        
        -- Create index for performance if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'meter' AND indexname = 'idx_meter_location_id') THEN
            CREATE INDEX idx_meter_location_id ON meter(location_id);
            RAISE NOTICE 'Created index idx_meter_location_id on meter table';
        END IF;
    END IF;
END $$;

-- Add comments
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meters') THEN
        COMMENT ON COLUMN meters.location_id IS 'Foreign key to location table';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meter') THEN
        COMMENT ON COLUMN meter.location_id IS 'Foreign key to location table';
    END IF;
END $$;

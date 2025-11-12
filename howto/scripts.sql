
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.meters') 
    AND name = 'location_id'
)
BEGIN
     ALTER TABLE meters 
   add COLUMN location_id uuid;

    PRINT 'Added location_id column to meters table';
END
ELSE
BEGIN
    PRINT 'location_id column already exists';
END
GO

-- Step 3: Add foreign key constraint if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE name = 'fk_meters_location_id'
)
BEGIN
    ALTER TABLE meters
    ADD CONSTRAINT fk_meters_location_id 
    FOREIGN KEY (location_id) 
    REFERENCES location(id);
    
    PRINT 'Added foreign key constraint fk_meters_location_id';
END
ELSE
BEGIN
    PRINT 'Foreign key constraint fk_meters_location_id already exists';
END
GO

-- Step 4: Add index on location_id for query performance
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'ix_meters_location_id' 
    AND object_id = OBJECT_ID('dbo.meters')
)
BEGIN
    CREATE INDEX ix_meters_location_id ON meters(location_id);

    
    PRINT 'Added index ix_meters_location_id';
END
ELSE
BEGIN
    PRINT 'Index ix_meters_location_id already exists';
END
GO

PRINT 'Migration completed successfully';
GO

-- Rollback script (run this if you need to undo the changes):
/*
-- Remove foreign key constraint
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_meters_location_id')
BEGIN
    ALTER TABLE dbo.meters DROP CONSTRAINT fk_meters_location_id;
    PRINT 'Removed foreign key constraint';
END

-- Remove index
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_meters_location_id' AND object_id = OBJECT_ID('dbo.meters'))
BEGIN
    DROP INDEX ix_meters_location_id ON dbo.meters;
    PRINT 'Removed index';
END

-- Remove column
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.meters') AND name = 'location_id')
BEGIN
    ALTER TABLE dbo.meters DROP COLUMN location_id;
    PRINT 'Removed location_id column';
END

PRINT 'Rollback completed';
*/

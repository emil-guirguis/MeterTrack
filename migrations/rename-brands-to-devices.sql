-- Rename the table
ALTER TABLE brands
    RENAME TO devices;
-- Rename indexes
DROP INDEX IF EXISTS idx_brands_name;
DROP INDEX IF EXISTS idx_brands_name_model;
CREATE INDEX IF NOT EXISTS idx_devices_name ON devices(name);
CREATE INDEX IF NOT EXISTS idx_devices_name_model ON devices(name, model);
-- Rename the trigger function
DROP FUNCTION IF EXISTS update_brands_updated_at();
CREATE OR REPLACE FUNCTION update_devices_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updatedAt = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS update_brands_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at BEFORE
UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_devices_updated_at();
-- Update foreign key references in meters table
ALTER TABLE meters DROP CONSTRAINT IF EXISTS fk_meters_brand_id;
ALTER TABLE meters
    RENAME COLUMN brand_id TO device_id;
ALTER TABLE meters
ADD CONSTRAINT fk_meters_device_id FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE
SET NULL;
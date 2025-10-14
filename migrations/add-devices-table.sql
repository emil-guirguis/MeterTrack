-- Create devices table for PostgreSQL
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on device name
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_name ON devices(name);

-- Create update trigger for devices table
CREATE TRIGGER update_devices_updatedat BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updatedat_column();
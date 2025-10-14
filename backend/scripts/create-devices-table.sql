drop table devices ;
-- Create devices table for meter device management
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    model VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_devices_name ON devices(name);
CREATE INDEX IF NOT EXISTS idx_devices_name_model ON devices(name, model);

-- Insert some default devices
INSERT INTO devices (name, description, model) VALUES 
    ('Schneider Electric', 'Industrial automation and energy management', 'PowerLogic'),
    ('ABB', 'Power and automation technologies', 'M2M'),
    ('Siemens', 'Industrial automation and digitalization', 'SENTRON'),
    ('General Electric', 'Digital industrial solutions', 'Multilin'),
    ('Honeywell', 'Industrial automation and control', 'PM800')
ON CONFLICT (name) DO NOTHING;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_devices_updated_at();
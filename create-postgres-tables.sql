-- PostgreSQL table creation script
-- Converted from SQL Server schemas for facility management system

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    passwordhash VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin','manager','technician','viewer')) DEFAULT 'viewer',
    permissions JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active','inactive')) DEFAULT 'active',
    lastlogin TIMESTAMP WITH TIME ZONE,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address_street VARCHAR(200) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_state VARCHAR(50) NOT NULL,
    address_zip_code VARCHAR(20) NOT NULL,
    address_country VARCHAR(100) NOT NULL,
    contact_primarycontact VARCHAR(100),
    contact_email VARCHAR(254) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_website VARCHAR(255),
    type VARCHAR(20) NOT NULL CHECK (type IN ('office','warehouse','retail','residential','industrial')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active','inactive','maintenance')) DEFAULT 'active',
    totalfloors INTEGER CHECK (totalfloors >= 1),
    totalunits INTEGER CHECK (totalunits >= 0),
    yearbuilt INTEGER CHECK (yearbuilt >= 1800 AND yearbuilt <= EXTRACT(YEAR FROM CURRENT_DATE)),
    squarefootage INTEGER CHECK (squarefootage >= 1),
    description TEXT,
    notes TEXT,
    equipmentcount INTEGER NOT NULL DEFAULT 0 CHECK (equipmentcount >= 0),
    metercount INTEGER NOT NULL DEFAULT 0 CHECK (metercount >= 0),
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buildings_name ON buildings(name);
CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(type);
CREATE INDEX IF NOT EXISTS idx_buildings_status ON buildings(status);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL,
    buildingid UUID,
    buildingname VARCHAR(200),
    specifications JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('operational','maintenance','offline')) DEFAULT 'operational',
    installdate TIMESTAMP WITH TIME ZONE NOT NULL,
    lastmaintenance TIMESTAMP WITH TIME ZONE,
    nextmaintenance TIMESTAMP WITH TIME ZONE,
    serialnumber VARCHAR(200) UNIQUE,
    manufacturer VARCHAR(200),
    model VARCHAR(200),
    location VARCHAR(500),
    notes TEXT,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_equipment_name ON equipment(name);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_buildingid ON equipment(buildingid);
CREATE INDEX IF NOT EXISTS idx_equipment_serialnumber ON equipment(serialnumber);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    role VARCHAR(100),
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(50),
    address_street VARCHAR(200),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip_code VARCHAR(20),
    address_country VARCHAR(100),
    category VARCHAR(50) NOT NULL CHECK (category IN ('vendor','contractor','internal','emergency','other')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active','inactive')) DEFAULT 'active',
    notes TEXT,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Meters table
CREATE TABLE IF NOT EXISTS meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meterid VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('electric','gas','water','steam','other')),
    manufacturer VARCHAR(200),
    model VARCHAR(200),
    serialnumber VARCHAR(200) UNIQUE,
    installation_date TIMESTAMP WITH TIME ZONE,
    last_reading_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active','inactive','maintenance')) DEFAULT 'active',
    location_building VARCHAR(200),
    location_floor VARCHAR(50),
    location_room VARCHAR(50),
    location_description TEXT,
    unit_of_measurement VARCHAR(20),
    multiplier DECIMAL(10,4) DEFAULT 1.0,
    notes TEXT,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meters_meterid ON meters(meterid);
CREATE INDEX IF NOT EXISTS idx_meters_type ON meters(type);
CREATE INDEX IF NOT EXISTS idx_meters_status ON meters(status);
CREATE INDEX IF NOT EXISTS idx_meters_location_building ON meters(location_building);

-- Meter readings table
CREATE TABLE IF NOT EXISTS meterreadings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meterid VARCHAR(50) NOT NULL,
    reading_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reading_value DECIMAL(15,4) NOT NULL,
    reading_type VARCHAR(20) DEFAULT 'manual' CHECK (reading_type IN ('manual','automatic','estimated')),
    multiplier DECIMAL(10,4) DEFAULT 1.0,
    final_value DECIMAL(15,4),
    unit_of_measurement VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','disputed')),
    notes TEXT,
    read_by VARCHAR(100),
    verified_by VARCHAR(100),
    verified_date TIMESTAMP WITH TIME ZONE,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meterid) REFERENCES meters(meterid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_meterreadings_meterid ON meterreadings(meterid);
CREATE INDEX IF NOT EXISTS idx_meterreadings_reading_date ON meterreadings(reading_date);
CREATE INDEX IF NOT EXISTS idx_meterreadings_status ON meterreadings(status);

-- Company settings table
CREATE TABLE IF NOT EXISTS companysettings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    company_address_street VARCHAR(200),
    company_address_city VARCHAR(100),
    company_address_state VARCHAR(50),
    company_address_zip_code VARCHAR(20),
    company_address_country VARCHAR(100),
    company_phone VARCHAR(50),
    company_email VARCHAR(254),
    company_website VARCHAR(255),
    default_currency VARCHAR(3) DEFAULT 'USD',
    default_timezone VARCHAR(50) DEFAULT 'UTC',
    business_hours JSONB,
    notification_settings JSONB,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email templates table (if needed)
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    template_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
    variables JSONB,
    createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create update triggers for automatically updating the updatedat field
CREATE OR REPLACE FUNCTION update_updatedat_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_users_updatedat BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updatedat_column();
CREATE TRIGGER update_buildings_updatedat BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updatedat_column();
CREATE TRIGGER update_equipment_updatedat BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updatedat_column();
CREATE TRIGGER update_contacts_updatedat BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updatedat_column();
CREATE TRIGGER update_meters_updatedat BEFORE UPDATE ON meters FOR EACH ROW EXECUTE FUNCTION update_updatedat_column();
CREATE TRIGGER update_meterreadings_updatedat BEFORE UPDATE ON meterreadings FOR EACH ROW EXECUTE FUNCTION update_updatedat_column();
CREATE TRIGGER update_companysettings_updatedat BEFORE UPDATE ON companysettings FOR EACH ROW EXECUTE FUNCTION update_updatedat_column();
CREATE TRIGGER update_email_templates_updatedat BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updatedat_column();
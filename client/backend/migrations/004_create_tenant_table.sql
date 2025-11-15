-- Create tenant table for company information
CREATE TABLE IF NOT EXISTS tenant (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255) NULL,
    address VARCHAR(100) NULL,
    address2 VARCHAR(100) NULL,
    city VARCHAR(50) NULL,
    state VARCHAR(50) NULL,
    zip VARCHAR(15) NULL,
    country VARCHAR(50) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS IX_tenant_city ON tenant (city);
CREATE INDEX IF NOT EXISTS IX_tenant_state ON tenant (state);

-- Insert default tenant record if none exists
INSERT INTO tenant (name, url, address, address2, city, state, zip, country, active)
SELECT 'Your Company Name', 'https://yourcompany.com', '123 Main Street', '', 'Your City', 'Your State', '12345', 'USA', true
WHERE NOT EXISTS (SELECT 1 FROM tenant);

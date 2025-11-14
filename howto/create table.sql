CREATE TABLE tenant (
    -- id INT IDENTITY(1,1) PRIMARY KEY, -- SQL Server syntax
    id SERIAL PRIMARY KEY, -- PostgreSQL uses SERIAL or GENERATED ALWAYS AS IDENTITY
    name VARCHAR(100) NOT NULL,
    
    url VARCHAR(255) NULL,
    address VARCHAR(100) NULL,
    address2 VARCHAR(100) NULL,
    city VARCHAR(50) NULL,
    state VARCHAR(50) NULL,
    zip VARCHAR(15) NULL,
    country VARCHAR(50) NULL,
    
    --active BIT NOT NULL -- SQL Server syntax
    active BOOLEAN NOT NULL DEFAULT TRUE, -- Use BOOLEAN and TRUE/FALSE
    --created_at DATETIME DEFAULT GETDATE(), -- SQL Server syntax
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Use TIMESTAMP and CURRENT_TIMESTAMP
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IX_tenant_city ON tenant (city);
CREATE INDEX IX_tenant_state ON tenant (state);

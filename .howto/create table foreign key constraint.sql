CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY, -- Primary key for the user
    tenant_id INT NOT NULL,          -- Foreign key linking to the tenants table
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    -- Add the foreign key constraint
    CONSTRAINT FK_Users_TenantId FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Add a UNIQUE constraint that combines tenant_id and email. 
-- A user's email only needs to be unique within their own tenant, not globally.
CREATE UNIQUE INDEX IX_Users_TenantId_Email ON users (tenant_id, email);

-- Optional: An index on just tenant_id for queries that only fetch all users for a given tenant
CREATE INDEX IX_Users_TenantId ON users (tenant_id);

-- Check Sync Database Schema
-- Run this to verify the tenant table exists and is properly configured

-- 1. Check if tenant table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'tenant'
) as tenant_table_exists;

-- 2. If it exists, check its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tenant'
ORDER BY ordinal_position;

-- 3. Check tenant records
SELECT COUNT(*) as tenant_count FROM tenant;

-- 4. View all tenant records
SELECT * FROM tenant;

-- 5. Check for any constraints or indexes
SELECT 
  constraint_name, 
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
AND table_name = 'tenant';

-- If the table doesn't exist, create it with this script:
-- CREATE TABLE IF NOT EXISTS tenant (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   url VARCHAR(255),
--   street VARCHAR(255),
--   street2 VARCHAR(255),
--   city VARCHAR(255),
--   state VARCHAR(50),
--   zip VARCHAR(20),
--   country VARCHAR(100),
--   active BOOLEAN DEFAULT true,
--   created_at TIMESTAMP DEFAULT NOW(),
--   updated_at TIMESTAMP DEFAULT NOW()
-- );

-- If you need to insert a test tenant:
-- INSERT INTO tenant (name, url, street, city, state, zip, country, active, created_at, updated_at)
-- VALUES ('Test Company', 'https://example.com', '123 Main St', 'Test City', 'TS', '12345', 'USA', true, NOW(), NOW());

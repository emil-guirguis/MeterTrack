-- Step 1: Add the column to the users table
ALTER TABLE users 
ADD COLUMN tenant_id INTEGER;

insert into tenant (name) select 'Synergy Solutions'
select * from tenant
update users set tenant_id = 1 where tenant_id is null;

-- Optional Step 1.5: If you have existing users, you must update their tenant_id to a valid value 
-- before making the column NOT NULL. Example:
-- UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Step 2: Make the column NOT NULL (if necessary)
ALTER TABLE users 
ALTER COLUMN tenant_id SET NOT NULL;

-- Step 3: Add the foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_tenant_id 
FOREIGN KEY (tenant_id) 
REFERENCES tenant(id);
--ON DELETE RESTRICT; -- Define action on delete (CASCADE, RESTRICT, SET NULL, etc.)

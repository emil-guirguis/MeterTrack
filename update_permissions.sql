-- Update all users to add device permissions, organized by module
UPDATE users
SET permissions = array_cat(
  permissions,
  ARRAY['device:create', 'device:read', 'device:update', 'device:delete']
)
WHERE permissions IS NOT NULL
  AND NOT (permissions @> ARRAY['device:create']);

-- Verify the update
SELECT id, email, permissions FROM users ORDER BY id;

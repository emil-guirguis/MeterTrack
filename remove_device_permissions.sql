-- Remove device create, update, delete permissions from all users
-- Keep only device:read permission as devices are now read-only

UPDATE users
SET permissions = array_remove(
    array_remove(
        array_remove(permissions, 'device:create'),
        'device:update'
    ),
    'device:delete'
)
WHERE permissions IS NOT NULL;

-- Verify the update - show remaining device permissions
SELECT id, email, 
       array_to_string(
           ARRAY(SELECT unnest(permissions) WHERE unnest(permissions) LIKE 'device:%'), 
           ', '
       ) as device_permissions
FROM users 
WHERE permissions IS NOT NULL
ORDER BY id;

-- Show summary of permission changes
SELECT 
    'Total users' as metric,
    COUNT(*) as count
FROM users
WHERE permissions IS NOT NULL

UNION ALL

SELECT 
    'Users with device:read' as metric,
    COUNT(*) as count
FROM users
WHERE permissions @> ARRAY['device:read']

UNION ALL

SELECT 
    'Users with device:create (should be 0)' as metric,
    COUNT(*) as count
FROM users
WHERE permissions @> ARRAY['device:create']

UNION ALL

SELECT 
    'Users with device:update (should be 0)' as metric,
    COUNT(*) as count
FROM users
WHERE permissions @> ARRAY['device:update']

UNION ALL

SELECT 
    'Users with device:delete (should be 0)' as metric,
    COUNT(*) as count
FROM users
WHERE permissions @> ARRAY['device:delete'];
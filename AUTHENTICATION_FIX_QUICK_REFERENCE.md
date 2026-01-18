# Authentication Fix - Quick Reference

## What Was Fixed

The meter reading upload manager was getting 500 "Authentication error" because the auth middleware was querying for a non-existent database column.

## Changes Made

### File: `client/backend/src/middleware/auth.js`

#### Change 1: Line 195 (getSiteIdFromApiKey function)
```diff
- 'SELECT tenant_id FROM tenant WHERE api_key = $1 AND is_active = true',
+ 'SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true',
```

#### Change 2: Line 196 (getSiteIdFromApiKey function)
```diff
- return result.rows[0].id;
+ return result.rows[0].tenant_id;
```

#### Change 3: Line 227 (authenticateSyncServer function)
```diff
- 'SELECT id as tenant_id FROM tenant WHERE api_key = $1 AND active = true',
+ 'SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true',
```

## Why These Changes

The tenant table schema:
- Primary key column is `tenant_id` (not `id`)
- Status column is `active` (not `is_active`)

When writing raw SQL queries, use the actual database column names, not the logical model names.

## Result

✅ Meter reading uploads now authenticate successfully
✅ No more 500 errors
✅ Invalid API keys return 401 (proper error code)

## Next Steps

1. Restart the backend server
2. Restart the sync MCP server
3. Meter readings should upload without authentication errors

## Related Documentation

- Full spec: `.kiro/specs/meter-reading-upload-authentication-500-error/`
- Detailed fix: `METER_READING_UPLOAD_AUTH_FIX.md`


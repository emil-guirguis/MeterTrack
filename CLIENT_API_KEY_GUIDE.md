# CLIENT_API_KEY Guide

## What is CLIENT_API_KEY?

The `CLIENT_API_KEY` is an authentication token used by the Sync MCP Server to communicate with the Client API. It's stored in the `sites` table of the Client database and is used to authenticate sync operations like heartbeat checks, meter uploads, and configuration downloads.

## Where to Get It

### Option 1: Query the Database Directly

The API key is stored in the `sites` table in the Client database. You can retrieve it with:

```sql
SELECT id, name, api_key FROM sites WHERE is_active = true LIMIT 1;
```

**Steps:**
1. Connect to your Client database (PostgreSQL)
2. Run the query above
3. Copy the `api_key` value
4. Add it to your `.env` file as `CLIENT_API_KEY=<the-api-key>`

### Option 2: Check if One Already Exists

If you're not sure if an API key exists, check:

```sql
SELECT COUNT(*) FROM sites WHERE api_key IS NOT NULL AND is_active = true;
```

If the count is 0, you need to generate one (see below).

### Option 3: Generate a New API Key

If no API key exists, you need to create one. Here's how:

1. **Generate a random API key** (use any of these methods):
   ```bash
   # Using OpenSSL
   openssl rand -hex 32
   
   # Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Using Python
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Insert it into the database**:
   ```sql
   UPDATE sites 
   SET api_key = '<your-generated-key>'
   WHERE id = 1 AND is_active = true;
   ```

3. **Verify it was inserted**:
   ```sql
   SELECT api_key FROM sites WHERE id = 1;
   ```

4. **Add to `.env`**:
   ```env
   CLIENT_API_KEY=<your-generated-key>
   ```

## How It's Used

The API key is sent in the HTTP header when making requests to the Client API:

```
X-API-Key: <CLIENT_API_KEY>
```

Example request:
```bash
curl -X POST http://localhost:3001/api/sync/heartbeat \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "2024-01-06T12:00:00Z"}'
```

## Verification

To verify your API key is correct:

1. **Check the logs** - When the Sync MCP Server starts, it should log:
   ```
   🔍 [ClientSystemApiClient] Testing connection to: http://localhost:3001/api/sync/heartbeat
   ✅ [ClientSystemApiClient] Connection successful - Status: 200
   ```

2. **Check the frontend** - The System Connection card should show "Connected" (green)

3. **Manual test**:
   ```bash
   curl -X POST http://localhost:3001/api/sync/heartbeat \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"timestamp": "2024-01-06T12:00:00Z"}'
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "message": "Heartbeat received",
     "siteId": 1
   }
   ```

## Troubleshooting

### "API key required" error
- The `CLIENT_API_KEY` is not set in `.env`
- Solution: Add `CLIENT_API_KEY=<your-key>` to `.env`

### "Invalid API key" error
- The API key doesn't exist in the database
- The site is not active (`is_active = false`)
- Solution: Verify the key exists and the site is active

### Connection still shows "Disconnected"
1. Verify the API key is correct
2. Verify the Client API is running on port 3001
3. Check the backend logs for detailed error messages
4. Ensure `CLIENT_API_URL` is set correctly

## Database Schema

The `sites` table structure (relevant columns):

```sql
CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  api_key VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Notes

- **Keep the API key secret** - Don't commit it to version control
- **Use `.env` file** - Store it in `.env` which is in `.gitignore`
- **Rotate periodically** - Consider rotating the key periodically for security
- **Use strong keys** - Generated keys should be at least 32 bytes (256 bits)

## Example .env Configuration

```env
# Client API Configuration
CLIENT_API_URL=http://localhost:3001/api
CLIENT_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# Sync Configuration
SYNC_INTERVAL_MINUTES=5
ENABLE_AUTO_SYNC=true
```

## Next Steps

1. Get or generate an API key using one of the methods above
2. Add it to your `.env` file
3. Restart the Sync MCP Server
4. Verify the connection is working by checking the logs and frontend

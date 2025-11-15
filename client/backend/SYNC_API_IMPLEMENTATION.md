# Sync API Implementation Summary

This document summarizes the implementation of the Sync API for the Client System backend.

## Completed Tasks

### Task 2.1: Create Sync Authentication Middleware

**File**: `src/middleware/auth.js`

**Added Functions**:
- `hashApiKey(apiKey)` - Hash API keys using bcrypt
- `verifyApiKey(apiKey, hashedApiKey)` - Verify API keys against hashed values
- `getSiteIdFromApiKey(apiKey)` - Retrieve site ID from API key
- `authenticateSyncServer` - Middleware to authenticate Sync servers using API keys

**Features**:
- API key validation via `x-api-key` header
- Site ID extraction and attachment to request object
- Active site verification
- Error handling for authentication failures

### Task 2.2: Create Sync API Endpoints

**File**: `src/routes/sync.js`

**Endpoints Implemented**:

1. **POST /api/sync/auth**
   - Authenticates Sync and verifies API key
   - Returns site information on success

2. **POST /api/sync/readings/batch**
   - Accepts batch meter reading uploads
   - Validates reading format using express-validator
   - Creates meters automatically if they don't exist
   - Inserts readings in a transaction
   - Returns success/error counts

3. **GET /api/sync/config**
   - Downloads configuration for Sync
   - Returns site information and meter list
   - Includes sync settings (interval, batch size)

4. **POST /api/sync/heartbeat**
   - Receives health check from Sync
   - Updates last_heartbeat timestamp
   - Returns server time

**Validation Rules**:
- `readings` must be an array
- `meter_external_id` must be a non-empty string
- `timestamp` must be valid ISO8601 date
- `data_point` must be a non-empty string
- `value` must be numeric
- `unit` is optional string

**Integration**:
- Routes registered in `src/server.js` at `/api/sync`

### Task 2.3: Update Client Database Schema

**Migration Files Created**:

1. **001_create_sites_table.sql**
   - Creates `sites` table
   - Columns: id, name, api_key, last_heartbeat, is_active, created_at
   - Indexes on api_key and is_active

2. **002_create_meters_table.sql**
   - Creates `meters` table
   - Columns: id, site_id, external_id, name, bacnet_device_id, bacnet_ip, created_at
   - Foreign key to sites with CASCADE delete
   - Unique constraint on (site_id, external_id)
   - Indexes on site_id and external_id

3. **003_create_meter_readings_table.sql**
   - Creates `meter_readings` table
   - Columns: id, meter_id, timestamp, data_point, value, unit, created_at
   - Foreign key to meters with CASCADE delete
   - Indexes on meter_id, timestamp, and composite (meter_id, timestamp)

**Rollback Scripts**:
- `rollback/001_drop_sites_table.sql`
- `rollback/002_drop_meters_table.sql`
- `rollback/003_drop_meter_readings_table.sql`

**Migration Runner**:
- `migrations/run-migrations.js` - Executes all migrations in order
- Added npm script: `npm run db:migrate`

## Database Schema

### sites
```sql
CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  last_heartbeat TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### meters
```sql
CREATE TABLE meters (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  bacnet_device_id INTEGER,
  bacnet_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, external_id)
);
```

### meter_readings
```sql
CREATE TABLE meter_readings (
  id SERIAL PRIMARY KEY,
  meter_id INTEGER REFERENCES meters(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  data_point VARCHAR(100) NOT NULL,
  value NUMERIC(15, 3) NOT NULL,
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage

### Running Migrations

```bash
# Run all migrations
npm run db:migrate

# Or directly
node migrations/run-migrations.js
```

### Testing Sync API

1. **Create a test site** (manually in database):
```sql
INSERT INTO sites (name, api_key, is_active) 
VALUES ('Test Site', 'test-api-key-123', true);
```

2. **Test authentication**:
```bash
curl -X POST http://localhost:3001/api/sync/auth \
  -H "x-api-key: test-api-key-123"
```

3. **Upload batch readings**:
```bash
curl -X POST http://localhost:3001/api/sync/readings/batch \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "readings": [
      {
        "meter_external_id": "meter-001",
        "timestamp": "2025-11-14T10:00:00Z",
        "data_point": "total_kwh",
        "value": 1234.567,
        "unit": "kWh"
      }
    ]
  }'
```

4. **Get configuration**:
```bash
curl http://localhost:3001/api/sync/config \
  -H "x-api-key: test-api-key-123"
```

5. **Send heartbeat**:
```bash
curl -X POST http://localhost:3001/api/sync/heartbeat \
  -H "x-api-key: test-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "healthy",
    "queue_size": 0,
    "last_collection": "2025-11-14T10:00:00Z"
  }'
```

## Requirements Satisfied

- **Requirement 2.4**: API key authentication for Syncs ✅
- **Requirement 2.5**: Sync API endpoints for authentication and data upload ✅
- **Requirement 2.3**: Endpoints for batch uploads, config download, and heartbeat ✅
- **Requirement 8.4**: Database schema with proper foreign keys and indexes ✅

## Next Steps

To complete the Sync integration:

1. Run the migrations to create the database schema
2. Create initial site records with API keys
3. Configure Sync deployments with API keys
4. Test the full sync flow from Sync to Client System

## Notes

- API keys are stored as plain text in the database for direct comparison
- All foreign keys use CASCADE delete for automatic cleanup
- Indexes are optimized for common query patterns
- Validation ensures data integrity before insertion
- Transaction support ensures atomic batch uploads

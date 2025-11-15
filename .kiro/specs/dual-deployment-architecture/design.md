# Design Document: Dual Deployment Architecture

## Overview

This design document outlines the architecture for restructuring MeterIT into two distinct deployments:

1. **Client System**: A centralized server hosting the Shared API, Client Database, and Client Frontend
2. **Sync**: An on-site edge system that collects BACnet meter data locally and synchronizes with the Client System

The architecture enables offline operation, centralized monitoring, and scalable multi-site deployments.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT SYSTEM                          │
│                    (Centralized Server)                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Client     │  │   Shared     │  │     Client      │  │
│  │   Frontend   │──│     API      │──│    Database     │  │
│  │              │  │  (backend)   │  │  (PostgreSQL)   │  │
│  └──────────────┘  └──────┬───────┘  └─────────────────┘  │
│                           │                                 │
│  ┌──────────────┐         │                                 │
│  │   Client     │─────────┘                                 │
│  │  MCP Server  │                                           │
│  └──────────────┘                                           │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ HTTPS/Internet
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼─────────────────────▼─────────────────────▼────────┐
│                    Sync (Site 1)                     │
│                     (On-Site Edge)                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Sync  │  │    Sync      │  │  Sync    │  │
│  │   Frontend   │──│   Service    │──│    Database     │  │
│  │              │  │              │  │  (PostgreSQL)   │  │
│  └──────────────┘  └──────┬───────┘  └─────────────────┘  │
│                           │                                 │
│  ┌──────────────┐         │          ┌─────────────────┐  │
│  │ Sync  │─────────┤          │     Meter       │  │
│  │     MCP      │         │          │   Collection    │  │
│  └──────────────┘         │          │    Service      │  │
│                           │          └────────┬────────┘  │
│                           │                   │            │
│                           │                   │ BACnet     │
│                           │          ┌────────▼────────┐  │
│                           │          │  BACnet Meters  │  │
│                           │          │  (Local Network)│  │
│                           │          └─────────────────┘  │
│                           │                                 │
│                           └─────────────────────────────────┤
│                                    Uploads to Shared API    │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Model

- **Client System**: Single centralized deployment (cloud or data center)
- **Sync**: Multiple distributed deployments (one per site)
- **Communication**: Syncs connect to Client System via HTTPS over internet
- **Data Flow**: Unidirectional - Syncs push data to Client System

## Components and Interfaces

### 1. Client System Components

#### 1.1 Shared API (Backend)

**Location**: `backend/` directory

**Purpose**: Centralized API serving both Client Frontend and all Syncs

**Key Responsibilities**:
- Handle authentication and authorization for Syncs
- Provide endpoints for meter reading uploads
- Serve Client Frontend requests
- Manage Client Database operations
- Provide configuration data to Syncs

**Technology Stack**:
- Node.js with Express
- PostgreSQL client (pg)
- JWT for authentication
- Express middleware for validation

**API Endpoints**:

```javascript
// Sync Endpoints
POST   /api/sync/auth              // Authenticate Sync
POST   /api/sync/readings/batch    // Upload batch meter readings
GET    /api/sync/config             // Download configuration
POST   /api/sync/heartbeat          // Sync health check

// Client Frontend Endpoints
GET    /api/meters                  // Get all meters across all sites
GET    /api/readings                // Get readings with filters
GET    /api/sites                   // Get all Sync sites
GET    /api/sites/:id/status        // Get site connectivity status
```

**Configuration**:
```javascript
// backend/.env
PORT=3001
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=meterit_client
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<password>
JWT_SECRET=<secret>
SYNC_SERVER_API_KEY=<api_key>
```

#### 1.2 Client Frontend

**Location**: `frontend/` directory (existing)

**Purpose**: Web interface for centralized monitoring

**Key Features**:
- Multi-site dashboard
- Real-time meter readings from all sites
- Site connectivity status indicators
- Historical data analysis
- User management

**Technology Stack**:
- React 19
- TypeScript
- Material-UI
- Zustand for state management
- Axios for API calls

**Configuration**:
```javascript
// frontend/.env
VITE_API_URL=http://localhost:3001
```

#### 1.3 Client MCP Server

**Location**: `client/mcp/` directory (new)

**Purpose**: AI assistance for Client System operations, focusing on alerts and email notifications

**Key Responsibilities**:
- Monitor system health and trigger alerts
- Send email notifications for critical events
- Query Client Database for reporting
- Analyze multi-site data
- Manage notification rules

**Technology Stack**:
- TypeScript
- @modelcontextprotocol/sdk
- PostgreSQL client
- Nodemailer for email notifications

**MCP Tools**:
```typescript
- query_meters: Query meter information across all sites
- query_readings: Query readings with filters
- get_site_status: Get connectivity status of Syncs
- send_alert_email: Send alert emails for critical events
- configure_alert_rules: Configure alert thresholds and rules
- generate_report: Generate multi-site reports
```

### 2. Sync Components

#### 2.1 Sync Service

**Location**: `sync/mcp/src/sync-service/` directory (integrated into MCP)

**Purpose**: Orchestrate meter collection and data synchronization

**Key Responsibilities**:
- Coordinate Meter Collection Service
- Batch upload readings to Shared API
- Handle offline queueing
- Manage retry logic with exponential backoff
- Download configuration from Shared API

**Technology Stack**:
- Node.js
- node-cron for scheduling
- Axios for HTTP requests
- Winston for logging

**Configuration**:
```javascript
// sync/.env
CLIENT_API_URL=https://client.meterit.com/api
CLIENT_API_KEY=<api_key>
SYNC_INTERVAL_MINUTES=5
BATCH_SIZE=1000
MAX_RETRIES=5
LOCAL_POSTGRES_HOST=localhost
LOCAL_POSTGRES_PORT=5432
LOCAL_POSTGRES_DB=meterit_sync
LOCAL_POSTGRES_USER=postgres
LOCAL_POSTGRES_PASSWORD=<password>
```

**Sync Algorithm**:
```
1. Every SYNC_INTERVAL_MINUTES:
   a. Check Client System connectivity
   b. If connected:
      - Query Sync Database for unsynchronized readings
      - Batch readings (max BATCH_SIZE)
      - POST to /api/sync/readings/batch
      - If success: Mark readings as synchronized and delete
      - If failure: Increment retry count, apply exponential backoff
   c. If disconnected:
      - Log connectivity issue
      - Continue meter collection
      - Queue readings in Sync Database
```

#### 2.2 Meter Collection Service

**Location**: `sync/mcp/src/meter-collection/` directory (adapted from existing mcp-modbus-agent)

**Purpose**: Collect data from BACnet meters on local network

**Key Responsibilities**:
- Connect to BACnet meters using BACnet protocol
- Read configured data points
- Store readings in Sync Database
- Handle meter connectivity errors
- Log collection metrics

**Technology Stack**:
- Node.js
- BACnet library (e.g., `node-bacnet` or `bacstack`) - replaces jsmodbus
- node-cron for scheduling
- Winston for logging

**Protocol Change**: This service adapts the existing Modbus-based collection from `mcp-modbus-agent` to use BACnet protocol instead. The core collection logic remains similar, but communication uses BACnet/IP instead of Modbus TCP.

**Configuration**:
```javascript
// sync/.env (continued)
COLLECTION_INTERVAL_SECONDS=60
BACNET_INTERFACE=0.0.0.0
BACNET_PORT=47808
BACNET_BROADCAST_ADDRESS=255.255.255.255
```

**Meter Configuration Format**:
```json
{
  "meters": [
    {
      "id": "meter-001",
      "name": "Building A Main",
      "bacnet_device_id": 12345,
      "bacnet_ip": "192.168.1.100",
      "data_points": [
        {
          "object_type": "analogInput",
          "instance": 0,
          "property": "presentValue",
          "name": "total_kwh"
        },
        {
          "object_type": "analogInput",
          "instance": 1,
          "property": "presentValue",
          "name": "current_kw"
        }
      ]
    }
  ]
}
```

#### 2.3 Sync Frontend

**Location**: `sync/frontend/` directory (new)

**Purpose**: Local web interface for on-site monitoring

**Key Features**:
- Local meter readings dashboard
- Sync status indicator
- Meter connectivity status
- Local data viewing (last 24 hours)
- Manual sync trigger

**Technology Stack**:
- React 19
- TypeScript
- Material-UI
- Zustand for state management
- Axios for API calls

**Configuration**:
```javascript
// sync/frontend/.env
VITE_API_URL=http://localhost:3002
VITE_CLIENT_API_URL=https://client.meterit.com/api
```

#### 2.4 Sync MCP

**Location**: `sync/mcp/` directory (adapted from existing mcp-modbus-agent)

**Purpose**: AI assistance for Sync operations and orchestration of sync/collection services

**Key Responsibilities**:
- Control Meter Collection Service
- Control Sync Service
- Monitor sync status
- Query local data
- Trigger manual sync
- Provide MCP tools for AI interaction

**Technology Stack**:
- TypeScript
- @modelcontextprotocol/sdk
- PostgreSQL client
- Integrates Sync Service and Meter Collection Service

**MCP Tools**:
```typescript
- start_collection: Start meter collection
- stop_collection: Stop meter collection
- get_sync_status: Get synchronization status
- trigger_sync: Manually trigger sync
- query_meter_readings: Query local readings
- get_meter_status: Get BACnet meter connectivity status
```

**Note**: This component adapts the existing `mcp-modbus-agent` codebase, replacing Modbus TCP protocol with BACnet/IP protocol for meter communication.

## Data Models

### Client Database Schema

```sql
-- Sites (Syncs)
CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  last_heartbeat TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meters
CREATE TABLE meters (
  id SERIAL PRIMARY KEY,
  site_id INTEGER REFERENCES sites(id),
  external_id VARCHAR(255) NOT NULL, -- meter-001
  name VARCHAR(255) NOT NULL,
  bacnet_device_id INTEGER,
  bacnet_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, external_id)
);

-- Meter Readings
CREATE TABLE meter_readings (
  id SERIAL PRIMARY KEY,
  meter_id INTEGER REFERENCES meters(id),
  timestamp TIMESTAMP NOT NULL,
  data_point VARCHAR(100) NOT NULL, -- total_kwh, current_kw
  value NUMERIC(15, 3) NOT NULL,
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_meter_timestamp (meter_id, timestamp),
  INDEX idx_timestamp (timestamp)
);
```

### Sync Database Schema

```sql
-- Local Meters (cached from Client)
CREATE TABLE meters (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  bacnet_device_id INTEGER,
  bacnet_ip VARCHAR(45),
  config JSONB, -- Full meter configuration
  last_reading_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Local Readings (temporary storage)
CREATE TABLE meter_readings (
  id SERIAL PRIMARY KEY,
  meter_external_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  data_point VARCHAR(100) NOT NULL,
  value NUMERIC(15, 3) NOT NULL,
  unit VARCHAR(50),
  is_synchronized BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sync_status (is_synchronized, created_at),
  INDEX idx_meter_timestamp (meter_external_id, timestamp)
);

-- Sync Log
CREATE TABLE sync_log (
  id SERIAL PRIMARY KEY,
  batch_size INTEGER,
  success BOOLEAN,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

### Sync Error Scenarios

#### 1. Client System Unreachable

**Detection**: HTTP request timeout or connection refused

**Handling**:
```javascript
try {
  await axios.post(`${CLIENT_API_URL}/sync/readings/batch`, batch);
} catch (error) {
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    logger.warn('Client System unreachable, queueing readings');
    // Readings remain in meter_readings with is_synchronized=false
    // Will retry on next sync interval
  }
}
```

#### 2. BACnet Meter Unreachable

**Detection**: BACnet read timeout or device not responding

**Handling**:
```javascript
try {
  const value = await bacnetClient.readProperty(deviceId, objectId);
  await storeReading(meterId, value);
} catch (error) {
  logger.error(`Meter ${meterId} unreachable: ${error.message}`);
  // Continue with next meter
  // Update meter status in meters
  await db.query(
    'UPDATE meters SET last_error = $1, last_error_at = NOW() WHERE id = $2',
    [error.message, meterId]
  );
}
```

#### 3. Sync Upload Failure

**Detection**: HTTP 4xx or 5xx response

**Handling**:
```javascript
const MAX_RETRIES = 5;
const BACKOFF_BASE = 2; // seconds

async function syncBatch(batch, retryCount = 0) {
  try {
    await axios.post(`${CLIENT_API_URL}/sync/readings/batch`, batch);
    // Success: delete from meter_readings
    await deleteReadings(batch.map(r => r.id));
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(BACKOFF_BASE, retryCount) * 1000;
      logger.warn(`Sync failed, retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms`);
      await sleep(delay);
      return syncBatch(batch, retryCount + 1);
    } else {
      logger.error(`Sync failed after ${MAX_RETRIES} retries`);
      // Update retry_count in meter_readings
      await incrementRetryCount(batch.map(r => r.id));
    }
  }
}
```

### Client System Error Scenarios

#### 1. Invalid Sync Authentication

**Detection**: Missing or invalid API key

**Handling**:
```javascript
app.post('/api/sync/readings/batch', authenticateSyncServer, async (req, res) => {
  // authenticateSyncServer middleware validates API key
  // Returns 401 if invalid
});

function authenticateSyncServer(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  req.siteId = getSiteIdFromApiKey(apiKey);
  next();
}
```

#### 2. Invalid Data Format

**Detection**: Schema validation failure

**Handling**:
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/sync/readings/batch',
  authenticateSyncServer,
  body('readings').isArray(),
  body('readings.*.meter_external_id').isString(),
  body('readings.*.timestamp').isISO8601(),
  body('readings.*.data_point').isString(),
  body('readings.*.value').isNumeric(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process batch
  }
);
```

## Testing Strategy

### Unit Tests

**Backend API**:
- Test authentication middleware
- Test batch upload endpoint
- Test data validation
- Test database operations

**Sync Service**:
- Test batch creation logic
- Test retry mechanism
- Test exponential backoff
- Test offline queueing

**Meter Collection Service**:
- Test BACnet communication (mocked)
- Test error handling for unreachable meters
- Test data storage

### Integration Tests

**Sync to Client System**:
- Test full sync flow
- Test authentication
- Test batch upload
- Test retry on failure
- Test offline operation

**Meter Collection**:
- Test BACnet device discovery
- Test data point reading
- Test storage in Sync Database

### End-to-End Tests

**Full System Flow**:
1. Meter Collection Service reads BACnet meter
2. Reading stored in Sync Database
3. Sync Service batches readings
4. Readings uploaded to Client System
5. Client Frontend displays reading
6. Reading deleted from Sync Database

**Offline Recovery**:
1. Disconnect Client System
2. Meter Collection continues
3. Readings queue in Sync Database
4. Reconnect Client System
5. Sync Service uploads queued readings
6. Verify all readings in Client Database

## Project Structure

```
meterit/
├── client/                     # Client System (new directory)
│   ├── backend/                # Shared API (existing backend moved here)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── sync.js    # Sync endpoints
│   │   │   │   └── client.js  # Client Frontend endpoints
│   │   │   ├── middleware/
│   │   │   │   └── auth.js    # Authentication
│   │   │   ├── models/
│   │   │   └── server.js
│   │   ├── migrations/        # Client Database migrations
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── frontend/               # Client Frontend (existing frontend moved here)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx  # Multi-site dashboard
│   │   │   │   └── Sites.tsx      # Site management
│   │   │   └── stores/
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── mcp/                    # Client MCP Server (new - for alerts/notifications)
│       ├── src/
│       │   ├── index.ts
│       │   └── tools/
│       ├── .env.example
│       └── package.json
│
├── sync/                # Sync (new)
│   ├── frontend/               # Sync Frontend (new)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   │   ├── LocalDashboard.tsx
│   │   │   │   └── SyncStatus.tsx
│   │   │   └── stores/
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── mcp/                    # Sync MCP (existing mcp-modbus-agent adapted)
│       ├── src/
│       │   ├── index.ts
│       │   ├── sync-service/
│       │   │   ├── sync-manager.ts
│       │   │   └── api-client.ts
│       │   ├── meter-collection/
│       │   │   ├── bacnet-client.ts
│       │   │   └── collector.ts
│       │   ├── database/
│       │   │   └── postgres.ts
│       │   └── tools/
│       ├── migrations/         # Sync Database migrations
│       ├── config/
│       │   └── meters.example.json
│       ├── .env.example
│       └── package.json
│
├── scripts/
│   ├── start-client.sh         # Start Client System
│   └── start-sync.sh    # Start Sync
│
└── package.json                # Root package.json
```

## Deployment

### Client System Deployment

**Requirements**:
- Node.js 20+
- PostgreSQL 14+
- 2GB RAM minimum
- 50GB storage minimum

**Steps**:
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../mcp-client && npm install

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp mcp-client/.env.example mcp-client/.env
# Edit .env files

# 3. Setup database
psql -U postgres -c "CREATE DATABASE meterit_client;"
cd backend && npm run migrate

# 4. Build frontend
cd frontend && npm run build

# 5. Start services
npm run start:client
```

### Sync Deployment

**Requirements**:
- Node.js 20+
- PostgreSQL 14+
- 1GB RAM minimum
- 20GB storage minimum
- Network access to BACnet devices
- Internet connectivity to Client System

**Steps**:
```bash
# 1. Install dependencies
cd sync && npm install

# 2. Configure environment
cp .env.example .env
cp config/meters.example.json config/meters.json
# Edit .env and meters.json

# 3. Setup database
psql -U postgres -c "CREATE DATABASE meterit_sync;"
npm run migrate

# 4. Build frontend
cd frontend && npm run build

# 5. Start services
npm run start
```

## Security Considerations

### Authentication

**Sync to Client System**:
- API key-based authentication
- API keys stored securely in Sync .env
- API keys hashed in Client Database
- HTTPS required for all communication

**Client Frontend**:
- JWT-based authentication
- Existing user authentication system

### Network Security

**Client System**:
- Expose only HTTPS port (443)
- Rate limiting on sync endpoints
- IP whitelisting for Syncs (optional)

**Sync**:
- Local frontend accessible only on local network
- Firewall rules to restrict external access
- BACnet traffic isolated to local network

### Data Security

**In Transit**:
- HTTPS/TLS 1.3 for all Client System communication
- Certificate validation

**At Rest**:
- PostgreSQL encryption at rest (optional)
- API keys encrypted in configuration

## Performance Considerations

### Sync

**Batch Size**: 1000 readings per batch
- Balances network efficiency and memory usage
- Configurable via BATCH_SIZE environment variable

**Collection Interval**: 60 seconds default
- Adjustable based on meter count and network capacity
- Configurable via COLLECTION_INTERVAL_SECONDS

**Database Cleanup**:
- Delete synchronized readings immediately
- Retain sync logs for 30 days
- Vacuum database weekly

### Client System

**Database Indexing**:
- Index on meter_readings(meter_id, timestamp)
- Index on meter_readings(timestamp)
- Partition meter_readings by month (optional for large deployments)

**API Rate Limiting**:
- 100 requests per minute per Sync
- Prevents abuse and ensures fair resource allocation

**Caching**:
- Cache site status for 1 minute
- Cache meter configuration for 5 minutes

## Monitoring and Observability

### Metrics

**Sync**:
- Meter collection success rate
- Sync success rate
- Queue size (unsynchronized readings)
- Client System connectivity status
- BACnet meter connectivity status

**Client System**:
- Sync heartbeat status
- Readings ingestion rate
- API response times
- Database connection pool status

### Logging

**Sync**:
- Winston logger with file rotation
- Log levels: error, warn, info, debug
- Separate log files for sync and collection

**Client System**:
- Winston logger with file rotation
- Request logging with morgan
- Error tracking

### Alerting

**Sync**:
- Alert when Client System unreachable > 15 minutes
- Alert when meter unreachable > 5 minutes
- Alert when queue size > 10,000 readings

**Client System**:
- Alert when Sync heartbeat missing > 10 minutes
- Alert when database connection fails
- Alert when API error rate > 5%

# Sync MCP Server

Model Context Protocol server for Sync operations. Provides AI tools for controlling meter collection, synchronization, and local data queries.

## Overview

The Sync MCP Server integrates with the Sync system to provide AI-assisted operations through the Model Context Protocol. It orchestrates:

- **Meter Collection Service**: BACnet meter data collection
- **Sync Manager**: Data synchronization with Client System
- **Local API Server**: HTTP endpoints for Sync Frontend
- **Database**: PostgreSQL connection for local data storage

## Available Tools

### 1. start_collection

Start the Meter Collection Service to begin collecting data from BACnet meters.

**Input**: None

**Output**: Success status and collector status including meter count and configuration

**Example**:
```json
{
  "success": true,
  "message": "Meter collection started successfully",
  "status": {
    "isRunning": true,
    "meterCount": 5,
    "collectionInterval": 60
  }
}
```

### 2. stop_collection

Stop the Meter Collection Service.

**Input**: None

**Output**: Success confirmation

**Example**:
```json
{
  "success": true,
  "message": "Meter collection stopped"
}
```

### 3. get_sync_status

Get the current synchronization status including connectivity, queue size, and recent sync operations.

**Input**: None

**Output**: Comprehensive sync status including:
- Current sync state (running, last sync time, success/failure)
- Client System connectivity status
- Queue size (unsynchronized readings)
- 24-hour statistics
- Recent sync logs

**Example**:
```json
{
  "sync_status": {
    "isRunning": false,
    "lastSyncTime": "2024-01-15T10:30:00Z",
    "lastSyncSuccess": true,
    "queueSize": 150,
    "isClientConnected": true
  },
  "connectivity": {
    "isConnected": true,
    "lastCheckTime": "2024-01-15T10:35:00Z"
  },
  "stats_24h": {
    "total_syncs": 48,
    "successful_syncs": 47,
    "failed_syncs": 1,
    "total_readings_synced": 12500,
    "success_rate": 97.92
  }
}
```

### 4. trigger_sync

Manually trigger a synchronization operation to upload queued readings to the Client System.

**Input**: None

**Output**: Sync result with before/after queue sizes

**Example**:
```json
{
  "success": true,
  "message": "Sync triggered successfully",
  "queue_size_before": 150,
  "queue_size_after": 0,
  "last_sync_success": true
}
```

**Errors**:
- "Client System is not reachable" - Cannot sync when offline
- "Sync is already in progress" - Another sync is running

### 5. query_meter_readings

Query local meter readings with optional filters.

**Input**:
- `meter_id` (optional): Filter by meter external ID
- `hours` (optional): Number of hours to look back (default: 24)
- `limit` (optional): Maximum number of readings to return (default: 100)

**Output**: Array of meter readings

**Example**:
```json
{
  "count": 50,
  "readings": [
    {
      "id": 1234,
      "meter_external_id": "meter-001",
      "timestamp": "2024-01-15T10:30:00Z",
      "data_point": "total_kwh",
      "value": 1234.56,
      "unit": "kWh",
      "is_synchronized": false
    }
  ]
}
```

### 6. get_meter_status

Get the connectivity and health status of BACnet meters.

**Input**:
- `meter_id` (optional): Get status for specific meter (returns all if omitted)

**Output**: Meter status information including connectivity and error counts

**Example** (all meters):
```json
{
  "isRunning": true,
  "bacnetConnected": true,
  "meterCount": 5,
  "meters": [
    {
      "id": "meter-001",
      "name": "Building A Main",
      "deviceId": 12345,
      "ip": "192.168.1.100",
      "isHealthy": true,
      "errorCount": 0,
      "dataPointCount": 4
    }
  ]
}
```

**Example** (specific meter):
```json
{
  "id": "meter-001",
  "name": "Building A Main",
  "deviceId": 12345,
  "ip": "192.168.1.100",
  "isHealthy": true,
  "errorCount": 0,
  "dataPointCount": 4
}
```

## Configuration

The MCP server is configured through environment variables in `.env`:

```bash
# Database Configuration
LOCAL_POSTGRES_HOST=localhost
LOCAL_POSTGRES_PORT=5432
LOCAL_POSTGRES_DB=meterit_sync
LOCAL_POSTGRES_USER=postgres
LOCAL_POSTGRES_PASSWORD=your_password

# Client System API
CLIENT_API_URL=https://client.meterit.com/api
CLIENT_API_KEY=your_api_key

# BACnet Configuration
BACNET_INTERFACE=0.0.0.0
BACNET_PORT=47808
BACNET_BROADCAST_ADDRESS=255.255.255.255

# Collection Configuration
COLLECTION_INTERVAL_SECONDS=60
METER_CONFIG_PATH=config/meters.json

# Sync Configuration
SYNC_INTERVAL_MINUTES=5
BATCH_SIZE=1000
MAX_RETRIES=5
ENABLE_AUTO_SYNC=true

# Local API Server
LOCAL_API_PORT=3002

# Logging
LOG_LEVEL=info
```

## Running the Server

### Build
```bash
npm run build
```

### Start
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

## Architecture

The MCP server acts as the orchestration layer for the Sync system:

```
┌─────────────────────────────────────────────────────────┐
│                    Sync MCP Server                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Meter     │  │     Sync     │  │   Local API  │ │
│  │  Collector   │  │   Manager    │  │    Server    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                             │
│                    ┌──────▼───────┐                     │
│                    │     Sync     │                     │
│                    │   Database   │                     │
│                    └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
         │                  │                  │
         │                  │                  │
    BACnet Meters    Client System      Sync Frontend
```

## Integration with Kiro

To use this MCP server with Kiro, add it to your MCP configuration:

```json
{
  "mcpServers": {
    "sync-mcp": {
      "command": "node",
      "args": ["c:/Projects/MeterItPro/sync/mcp/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Logging

Logs are written to:
- `logs/sync-mcp.log` - All logs
- `logs/sync-mcp-error.log` - Error logs only
- Console output with colorized formatting

## Error Handling

The MCP server includes comprehensive error handling:

- **Database Connection Errors**: Fails initialization if database is unreachable
- **BACnet Errors**: Logs errors and continues with other meters
- **Client System Unreachable**: Queues readings for later sync
- **Tool Execution Errors**: Returns error messages in MCP response format

## Requirements

- Node.js 20+
- PostgreSQL 14+
- Network access to BACnet devices
- Internet connectivity to Client System (for sync operations)

## Related Documentation

- [Sync Service Implementation](./SYNC_SERVICE_IMPLEMENTATION.md)
- [BACnet Implementation](./BACNET_IMPLEMENTATION.md)
- [Design Document](../../.kiro/specs/dual-deployment-architecture/design.md)

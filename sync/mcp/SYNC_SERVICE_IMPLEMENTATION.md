# Sync Service Implementation

This document describes the implementation of the Sync Service for the MeterIT Sync MCP.

## Overview

The Sync Service orchestrates the synchronization of meter readings from the local Sync Database to the centralized Client System. It handles:

- Scheduled synchronization at configurable intervals
- Batch uploads with retry logic and exponential backoff
- Offline operation with automatic queue management
- Connectivity monitoring with auto-resume on reconnection
- Configuration downloads from Client System
- Heartbeat mechanism for health monitoring

## Architecture

The Sync Service consists of three main components:

### 1. API Client (`api-client.ts`)

Handles all HTTP communication with the Client System API.

**Key Features:**
- Authentication with API key
- Batch upload with built-in retry logic
- Configuration download
- Heartbeat sending
- Connection timeout and error handling
- Exponential backoff for retryable errors

**Methods:**
- `testConnection()`: Check if Client System is reachable
- `authenticate()`: Authenticate with Client System using API key
- `uploadBatch(readings, retryCount)`: Upload batch of readings with retry logic
- `downloadConfig()`: Download meter configuration from Client System
- `sendHeartbeat()`: Send heartbeat to Client System

**Error Handling:**
- Network errors (ECONNREFUSED, ETIMEDOUT) → Throws "Client System unreachable"
- 401 Unauthorized → Returns authentication failure
- 400 Bad Request → Returns validation error
- 5xx Server errors → Retries with exponential backoff
- 429 Rate Limit → Retries with exponential backoff

### 2. Sync Manager (`sync-manager.ts`)

Orchestrates the synchronization process with scheduled execution.

**Key Features:**
- Scheduled sync using node-cron (configurable interval)
- Batch processing (configurable batch size)
- Exponential backoff retry logic (max 5 retries)
- Automatic cleanup of synchronized readings
- Sync operation logging
- Status tracking and reporting

**Methods:**
- `start()`: Start sync manager with scheduled sync
- `stop()`: Stop sync manager
- `performSync()`: Execute a single sync operation
- `triggerSync()`: Manually trigger sync
- `downloadConfiguration()`: Download and update meter configuration
- `sendHeartbeat()`: Send heartbeat to Client System
- `getStatus()`: Get current sync status
- `getSyncStats(hours)`: Get sync statistics

**Sync Algorithm:**
```
1. Check Client System connectivity
2. If disconnected:
   - Log connectivity issue
   - Queue readings in database
   - Return
3. If connected:
   - Query unsynchronized readings (up to BATCH_SIZE)
   - Upload batch to Client System
   - If success:
     - Delete synchronized readings from database
     - Log success
   - If failure:
     - Increment retry count
     - Apply exponential backoff
     - Retry up to MAX_RETRIES times
     - Log failure
4. Update queue size
```

**Status Information:**
- `isRunning`: Whether sync manager is active
- `lastSyncTime`: Timestamp of last sync attempt
- `lastSyncSuccess`: Whether last sync succeeded
- `lastSyncError`: Error message from last sync (if failed)
- `queueSize`: Number of unsynchronized readings
- `totalSynced`: Total readings synced since start
- `totalFailed`: Total readings failed since start
- `isClientConnected`: Current Client System connectivity status

### 3. Connectivity Monitor (`connectivity-monitor.ts`)

Monitors Client System connectivity and handles offline operation.

**Key Features:**
- Periodic connectivity checks (configurable interval)
- State change detection (online ↔ offline)
- Event emission on connectivity changes
- Uptime/downtime tracking
- Consecutive failure counting

**Methods:**
- `start()`: Start connectivity monitoring
- `stop()`: Stop connectivity monitoring
- `getStatus()`: Get current connectivity status
- `isConnected()`: Check if currently connected
- `forceCheck()`: Force immediate connectivity check

**Events:**
- `connected`: Emitted when connectivity is restored
- `disconnected`: Emitted when connectivity is lost
- `state-change`: Emitted on any state change

**Status Information:**
- `isConnected`: Current connectivity state
- `lastCheckTime`: Timestamp of last connectivity check
- `lastSuccessfulConnection`: Timestamp of last successful connection
- `lastFailedConnection`: Timestamp of last failed connection
- `consecutiveFailures`: Number of consecutive connection failures
- `uptime`: Seconds since last state change (if connected)
- `downtime`: Seconds since last state change (if disconnected)

## Configuration

All components can be configured via environment variables:

```bash
# Client System API Configuration
CLIENT_API_URL=https://client.meterit.com/api
CLIENT_API_KEY=your_api_key_here
API_TIMEOUT=30000

# Sync Configuration
SYNC_INTERVAL_MINUTES=5
BATCH_SIZE=1000
MAX_RETRIES=5
ENABLE_AUTO_SYNC=true

# Connectivity Monitoring
CONNECTIVITY_CHECK_INTERVAL_MS=60000
```

## Usage Example

```typescript
import { createDatabaseFromEnv } from './database/postgres.js';
import { createApiClientFromEnv, createSyncManagerFromEnv } from './sync-service/index.js';

// Initialize components
const database = createDatabaseFromEnv();
const apiClient = createApiClientFromEnv();
const syncManager = createSyncManagerFromEnv(database, apiClient);

// Start sync manager
await syncManager.start();

// Get status
const status = syncManager.getStatus();
console.log('Sync Status:', status);

// Get connectivity status
const connectivity = syncManager.getConnectivityStatus();
console.log('Connectivity:', connectivity);

// Manually trigger sync
await syncManager.triggerSync();

// Download configuration
await syncManager.downloadConfiguration();

// Send heartbeat
await syncManager.sendHeartbeat();

// Get sync statistics
const stats = await syncManager.getSyncStats(24);
console.log('Sync Stats (24h):', stats);

// Stop sync manager
await syncManager.stop();
```

## Offline Operation

The Sync Service is designed to handle offline operation gracefully:

1. **Connectivity Monitoring**: Continuously monitors Client System connectivity
2. **Automatic Queueing**: When offline, readings are queued in the Sync Database
3. **Auto-Resume**: When connectivity is restored, sync automatically resumes
4. **No Data Loss**: All readings are persisted locally until successfully synchronized

**Offline Flow:**
```
1. Connectivity Monitor detects Client System unreachable
2. Emits 'disconnected' event
3. Sync Manager logs connectivity issue
4. Meter Collection Service continues collecting readings
5. Readings accumulate in Sync Database (is_synchronized = false)
6. Connectivity Monitor detects Client System reachable
7. Emits 'connected' event
8. Sync Manager automatically triggers sync
9. Queued readings are uploaded in batches
10. Successfully synced readings are deleted
```

## Error Handling

### Network Errors
- **ECONNREFUSED / ETIMEDOUT**: Client System unreachable
  - Action: Queue readings, wait for connectivity restoration
  - No retries (handled by connectivity monitor)

### Server Errors (5xx)
- **500 Internal Server Error**: Temporary server issue
  - Action: Retry with exponential backoff (max 5 retries)
  - Backoff: 2s, 4s, 8s, 16s, 32s

### Client Errors (4xx)
- **400 Bad Request**: Invalid data format
  - Action: Log error, do not retry
  - Readings remain in queue for manual inspection
- **401 Unauthorized**: Invalid API key
  - Action: Log error, do not retry
  - Requires configuration fix

### Rate Limiting (429)
- **429 Too Many Requests**: Rate limit exceeded
  - Action: Retry with exponential backoff
  - Backoff: 2s, 4s, 8s, 16s, 32s

## Database Operations

### Sync Flow Database Operations:
1. `getUnsynchronizedReadings(BATCH_SIZE)`: Query readings to sync
2. `uploadBatch(readings)`: Upload to Client System
3. `deleteSynchronizedReadings(readingIds)`: Delete on success
4. `incrementRetryCount(readingIds)`: Increment on failure
5. `logSyncOperation(batchSize, success, error)`: Log operation

### Cleanup Operations:
- `deleteOldSynchronizedReadings(7)`: Delete readings older than 7 days
- `deleteOldSyncLogs(30)`: Delete logs older than 30 days

## Performance Considerations

### Batch Size
- Default: 1000 readings per batch
- Balances network efficiency and memory usage
- Configurable via `BATCH_SIZE` environment variable

### Sync Interval
- Default: 5 minutes
- Adjustable based on data volume and network capacity
- Configurable via `SYNC_INTERVAL_MINUTES` environment variable

### Connectivity Check Interval
- Default: 60 seconds (1 minute)
- Balances responsiveness and network overhead
- Configurable via `CONNECTIVITY_CHECK_INTERVAL_MS` environment variable

### Retry Strategy
- Exponential backoff: 2s, 4s, 8s, 16s, 32s
- Max retries: 5
- Max backoff: 60 seconds
- Prevents overwhelming the Client System during issues

## Monitoring and Observability

### Sync Status
```typescript
{
  isRunning: boolean,
  lastSyncTime: Date,
  lastSyncSuccess: boolean,
  lastSyncError: string,
  queueSize: number,
  totalSynced: number,
  totalFailed: number,
  isClientConnected: boolean
}
```

### Connectivity Status
```typescript
{
  isConnected: boolean,
  lastCheckTime: Date,
  lastSuccessfulConnection: Date,
  lastFailedConnection: Date,
  consecutiveFailures: number,
  uptime: number,
  downtime: number
}
```

### Sync Statistics (24h)
```typescript
{
  total_syncs: number,
  successful_syncs: number,
  failed_syncs: number,
  total_readings_synced: number,
  success_rate: number
}
```

## Integration with MCP Server

The Sync Service will be integrated into the MCP Server to provide tools for:
- Starting/stopping sync
- Triggering manual sync
- Getting sync status
- Getting connectivity status
- Downloading configuration
- Sending heartbeat

See the MCP implementation tasks for details on tool integration.

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 4.1**: Batch upload at configurable intervals ✓
- **Requirement 4.2**: Delete synchronized readings on success ✓
- **Requirement 4.3**: Retry with exponential backoff (max 5 retries) ✓
- **Requirement 4.4**: Queue readings when Client System unreachable ✓
- **Requirement 4.5**: Download configuration from Client System ✓
- **Requirement 4.6**: Log sync operations ✓
- **Requirement 9.1**: Continue operation when Client System unreachable ✓
- **Requirement 9.3**: Queue readings in Sync Database ✓
- **Requirement 9.4**: Auto-resume sync when connectivity restored ✓
- **Requirement 9.5**: Provide connectivity status ✓

## Next Steps

1. Integrate Sync Service into MCP Server (Task 9)
2. Create MCP tools for sync control
3. Implement heartbeat scheduling
4. Add configuration download scheduling
5. Create frontend API endpoints for status display
6. Implement end-to-end testing

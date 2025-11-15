# Sync Service

The Sync Service handles synchronization of meter readings from the local Sync Database to the centralized Client System.

## Components

### API Client (`api-client.ts`)
Handles HTTP communication with Client System API.

```typescript
import { createApiClientFromEnv } from './api-client.js';

const apiClient = createApiClientFromEnv();

// Test connection
const isConnected = await apiClient.testConnection();

// Authenticate
const authResult = await apiClient.authenticate();

// Upload batch
const result = await apiClient.uploadBatch(readings);

// Download config
const config = await apiClient.downloadConfig();

// Send heartbeat
await apiClient.sendHeartbeat();
```

### Sync Manager (`sync-manager.ts`)
Orchestrates synchronization with scheduled execution.

```typescript
import { createSyncManagerFromEnv } from './sync-manager.js';

const syncManager = createSyncManagerFromEnv(database, apiClient);

// Start sync manager
await syncManager.start();

// Get status
const status = syncManager.getStatus();

// Manually trigger sync
await syncManager.triggerSync();

// Download configuration
await syncManager.downloadConfiguration();

// Get sync statistics
const stats = await syncManager.getSyncStats(24);

// Stop sync manager
await syncManager.stop();
```

### Connectivity Monitor (`connectivity-monitor.ts`)
Monitors Client System connectivity and handles offline operation.

```typescript
import { ConnectivityMonitor } from './connectivity-monitor.js';

const monitor = new ConnectivityMonitor(apiClient);

// Listen for events
monitor.on('connected', () => {
  console.log('Client System connected');
});

monitor.on('disconnected', () => {
  console.log('Client System disconnected');
});

// Start monitoring
monitor.start();

// Get status
const status = monitor.getStatus();

// Stop monitoring
monitor.stop();
```

## Quick Start

```typescript
import { createDatabaseFromEnv } from '../database/postgres.js';
import { createApiClientFromEnv, createSyncManagerFromEnv } from './index.js';

// Initialize
const database = createDatabaseFromEnv();
const apiClient = createApiClientFromEnv();
const syncManager = createSyncManagerFromEnv(database, apiClient);

// Start
await syncManager.start();

// The sync manager will now:
// - Monitor Client System connectivity
// - Sync readings every SYNC_INTERVAL_MINUTES
// - Auto-resume when connectivity is restored
// - Queue readings when offline
```

## Configuration

Set these environment variables:

```bash
CLIENT_API_URL=https://client.meterit.com/api
CLIENT_API_KEY=your_api_key_here
SYNC_INTERVAL_MINUTES=5
BATCH_SIZE=1000
MAX_RETRIES=5
```

## Features

- ✅ Scheduled synchronization
- ✅ Batch processing
- ✅ Exponential backoff retry
- ✅ Offline operation
- ✅ Auto-resume on reconnection
- ✅ Configuration download
- ✅ Heartbeat mechanism
- ✅ Comprehensive error handling
- ✅ Status tracking
- ✅ Sync statistics

## Documentation

See [SYNC_SERVICE_IMPLEMENTATION.md](../../SYNC_SERVICE_IMPLEMENTATION.md) for detailed documentation.

## Example

See [example.ts](./example.ts) for a complete usage example.

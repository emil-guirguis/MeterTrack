# Design Document: Meter Sync Agent

## Overview

The Meter Sync Agent is a scheduled service component of the Sync MCP Server that synchronizes meter configuration from the remote Client System database to the local Sync database. The agent retrieves only meters that belong to the tenant configured in the local Sync tenant table, treats the remote database as the master source of truth, and performs insert, update, and delete operations to keep the local database synchronized. The agent runs automatically every hour and can be manually triggered via the Sync Status page UI.

## Architecture

The Meter Sync Agent follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                  Sync MCP Server                        │
├─────────────────────────────────────────────────────────┤
│  MCP Tool: trigger_meter_sync (manual trigger)          │
├─────────────────────────────────────────────────────────┤
│              Meter Sync Agent Service                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ - Scheduled execution (hourly cron job)          │   │
│  │ - Concurrency prevention                         │   │
│  │ - Remote database connection management          │   │
│  │ - Sync operation orchestration                   │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│              Database Layer                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Local Sync Database (PostgreSQL)                 │   │
│  │ - Meters table (local copy)                      │   │
│  │ - Meter sync logs                                │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Remote Client System Database (PostgreSQL)       │   │
│  │ - Meters table (master source)                   │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│              Local API Server                           │
│  - GET /api/local/meter-sync-status                     │
│  - POST /api/local/meter-sync-trigger                   │
├─────────────────────────────────────────────────────────┤
│              Frontend (React)                           │
│  - Sync Status page with meter sync controls            │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Meter Sync Agent Service

**File:** `sync/mcp/src/sync-service/meter-sync-agent.ts`

Responsible for orchestrating meter synchronization operations.

```typescript
interface MeterSyncAgentConfig {
  database: SyncDatabase;
  remoteDatabase: RemoteDatabaseClient;
  syncIntervalMinutes?: number;
  enableAutoSync?: boolean;
}

interface MeterSyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  error?: string;
  timestamp: Date;
}

class MeterSyncAgent {
  // Start scheduled sync
  async start(): Promise<void>
  
  // Stop scheduled sync
  async stop(): Promise<void>
  
  // Perform a single sync operation
  async performSync(): Promise<MeterSyncResult>
  
  // Get current sync status
  getStatus(): MeterSyncStatus
}
```

### 2. Remote Database Connection

The Meter Sync Agent uses the existing remote database pool pattern established in the SyncMcpServer. It connects to the remote Client System database using environment variables (POSTGRES_CLIENT_HOST, POSTGRES_CLIENT_PORT, POSTGRES_CLIENT_DB, POSTGRES_CLIENT_USER, POSTGRES_CLIENT_PASSWORD) and queries the meters table filtered by the tenant ID from the local Sync tenant table.

### 3. Local API Endpoints

**File:** `sync/mcp/src/api/server.ts` (additions)

New endpoints for meter sync operations:

```
GET /api/local/meter-sync-status
  Returns: {
    last_sync_at: Date | null,
    last_sync_success: boolean | null,
    last_sync_error: string | null,
    inserted_count: number,
    updated_count: number,
    deleted_count: number,
    meter_count: number,
    is_syncing: boolean
  }

POST /api/local/meter-sync-trigger
  Returns: {
    success: boolean,
    message: string,
    result?: MeterSyncResult
  }
```

### 4. Frontend Components

**File:** `sync/frontend/src/pages/SyncStatus.tsx` (modifications)

Add meter sync controls to the Sync Status page:
- Display last meter sync timestamp
- Display meter count
- Display sync operation results (inserted, updated, deleted)
- Button to manually trigger meter sync
- Loading state while sync is in progress
- Error display if sync fails

## Data Models

### Local Meter Table

The existing `meter` table in the Sync database is used to store local meter copies:

```
Columns: id, name, type, serial_number, installation_date, device_id, location_id, ip, port, protocol, status, register_map (JSON), notes, active, created_at, updated_at
```

The sync agent performs insert, update, and delete operations on this table to keep it synchronized with the remote database. The `register_map` field stores meter mapping as JSON.

### Remote Meter Structure

The remote database has the same meter table structure as the local database, with the addition of a `tenant_id` field:

```typescript
interface RemoteMeter {
  id: number;
  name: string;
  type: string;
  serial_number?: string;
  installation_date?: Date;
  device_id?: number;
  location_id?: number;
  ip?: string;
  port?: number;
  protocol?: string;
  status: string;
  register_map?: any; // JSON meter mapping
  notes?: string;
  active?: boolean;
  created_at: Date;
  updated_at: Date;
  tenant_id: number; // Only in remote database
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: New Meters Are Inserted

*For any* set of remote meters that don't exist in the local database, after a sync operation completes, all those meters should be present in the local database with all fields matching the remote meter (excluding tenant_id).

**Validates: Requirements 1.2**

### Property 2: Existing Meters Are Updated

*For any* meter that exists in both the remote and local databases, if any field in the remote meter is modified, after a sync operation completes, the local meter should have all updated values matching the remote meter.

**Validates: Requirements 1.3**

### Property 3: Deleted Meters Are Deactivated

*For any* meter that exists in the local database but not in the remote database, after a sync operation completes, the local meter should be marked as inactive (active = false).

**Validates: Requirements 1.4**

### Property 4: Sync Operations Are Logged

*For any* sync operation that completes, a log entry should be created in the meter_sync_log table with the correct counts of inserted, updated, and deleted meters.

**Validates: Requirements 1.5**

### Property 5: Concurrent Syncs Are Prevented

*For any* sync operation that is in progress, attempting to start another sync operation should be rejected and the second operation should not execute.

**Validates: Requirements 2.3**

### Property 6: Sync Status Reflects Last Operation

*For any* completed sync operation, the sync status should reflect the timestamp, success status, and error message (if applicable) of that operation.

**Validates: Requirements 4.1, 4.3, 4.4**

### Property 7: Meter Count Is Accurate

*For any* query of the meter count, the returned count should equal the number of active meters in the local database.

**Validates: Requirements 4.2**

## Error Handling

The Meter Sync Agent implements comprehensive error handling:

1. **Connection Failures**: If the remote database connection fails, the sync operation logs the error and retries at the next scheduled interval.

2. **Partial Sync Failures**: If individual meter operations fail (e.g., update fails for one meter), the operation continues with remaining meters and logs the partial failure.

3. **Concurrent Sync Prevention**: If a sync is already in progress, subsequent sync requests are rejected with a clear error message.

4. **Data Validation**: All remote meter data is validated before insertion/update to ensure data integrity.

5. **Transaction Safety**: Sync operations use database transactions to ensure consistency.

## Testing Strategy

Property-based tests verify universal properties across many inputs with a minimum of 100 iterations per test:

- **Property 1 (New Meters Inserted)**: Verify new remote meters are inserted into local database
- **Property 2 (Existing Meters Updated)**: Verify meter updates from remote database are reflected locally
- **Property 3 (Deleted Meters Deactivated)**: Verify meters deleted from remote database are marked inactive locally
- **Property 4 (Sync Operations Logged)**: Verify all sync operations create log entries with correct counts
- **Property 5 (Concurrent Syncs Prevented)**: Verify concurrent sync operations are prevented
- **Property 6 (Sync Status Reflects Last Operation)**: Verify sync status matches the last completed operation
- **Property 7 (Meter Count Accurate)**: Verify meter count matches active meters in database

## Implementation Notes

1. The meter sync agent uses the existing `SyncDatabase` class for local database operations.

2. The sync agent uses the existing remote database pool pattern from `SyncMcpServer.createRemoteDatabasePool()` to connect to the remote Client System database.

3. The sync agent retrieves the tenant ID from the local Sync tenant table and only synchronizes meters that belong to that tenant from the remote database.

4. The sync agent will be integrated into the `SyncMcpServer` initialization process and started alongside other services.

5. The hourly schedule uses node-cron with the expression `0 * * * *` (every hour at minute 0).

6. The frontend will poll the `/api/local/meter-sync-status` endpoint to display current sync status.

7. Manual sync triggers from the UI will call the `/api/local/meter-sync-trigger` endpoint.

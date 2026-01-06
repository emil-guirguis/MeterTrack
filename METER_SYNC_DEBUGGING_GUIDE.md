# Meter Sync Debugging Guide

## Overview
This guide shows you the complete flow of the meter sync process and where debugger statements have been added.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SYNC FRONTEND (React)                                                       │
│ MeterSyncCard.tsx                                                           │
│ - User clicks "Trigger Meter Sync" button                                   │
│ - Calls: meterSyncApi.triggerSync()                                         │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND API CLIENT                                                         │
│ sync/frontend/src/api/services.ts                                           │
│ - meterSyncApi.triggerSync()                                                │
│ - Makes POST request to: /api/local/meter-sync-trigger                      │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SYNC MCP SERVER (Node.js)                                                   │
│ sync/mcp/src/api/server.ts                                                  │
│                                                                              │
│ POST /api/local/meter-sync-trigger                                          │
│ ├─ 🔴 DEBUGGER #1 HERE                                                      │
│ └─ Calls: this.meterSyncAgent.triggerSync()                                 │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ METER SYNC AGENT                                                            │
│ sync/mcp/src/sync-service/meter-sync-agent.ts                               │
│                                                                              │
│ triggerSync()                                                               │
│ └─ Calls: this.performSync()                                                │
│                                                                              │
│    performSync()                                                            │
│    ├─ 🔴 DEBUGGER #2 HERE (Main sync operation)                             │
│    ├─ Calls: this.getRemoteMeters(tenantId)                                 │
│    │                                                                         │
│    │  getRemoteMeters(tenantId)                                             │
│    │  ├─ 🔴 DEBUGGER #3 HERE (Remote DB query)                              │
│    │  ├─ Queries REMOTE database:                                           │
│    │  │  SELECT m.id, m.name, m.ip, m.port, m.active, me.element           │
│    │  │  FROM meter m                                                       │
│    │  │  JOIN meter_element me ON me.meter_id = m.id                        │
│    │  │  WHERE m.tenant_id = $1                                             │
│    │  └─ Returns: Array of MeterEntity from REMOTE database                 │
│    │                                                                         │
│    ├─ Calls: this.syncDatabase.getMeters(false)                             │
│    │  └─ Queries LOCAL sync database for existing meters                    │
│    │                                                                         │
│    ├─ Compares remote vs local meters                                       │
│    │  ├─ INSERT new meters into LOCAL database                              │
│    │  ├─ UPDATE changed meters in LOCAL database                            │
│    │  └─ DELETE/DEACTIVATE removed meters in LOCAL database                 │
│    │                                                                         │
│    └─ Returns: MeterSyncResult (inserted, updated, deleted counts)          │
│                                                                              │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ RESPONSE BACK TO FRONTEND                                                   │
│ {                                                                            │
│   "success": true,                                                          │
│   "message": "Meter sync completed successfully",                           │
│   "result": {                                                               │
│     "inserted": 5,                                                          │
│     "updated": 2,                                                           │
│     "deleted": 1,                                                           │
│     "timestamp": "2024-01-05T..."                                           │
│   }                                                                          │
│ }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Debugger Locations

### 🔴 Debugger #1: API Endpoint Entry Point
**File:** `sync/mcp/src/api/server.ts`  
**Line:** POST `/api/local/meter-sync-trigger` endpoint  
**Purpose:** Break when the trigger button is clicked from the frontend

```typescript
this.app.post('/api/local/meter-sync-trigger', async (_req, res, next) => {
  debugger; // ← DEBUGGER #1
  try {
    console.log('📥 [API] POST /api/local/meter-sync-trigger - Request received');
    // ... rest of endpoint
  }
});
```

### 🔴 Debugger #2: Main Sync Operation
**File:** `sync/mcp/src/sync-service/meter-sync-agent.ts`  
**Method:** `performSync()`  
**Purpose:** Break at the start of the actual sync operation

```typescript
async performSync(): Promise<MeterSyncResult> {
  debugger; // ← DEBUGGER #2
  if (this.isSyncing) {
    // ... rest of method
  }
}
```

### 🔴 Debugger #3: Remote Database Query
**File:** `sync/mcp/src/sync-service/meter-sync-agent.ts`  
**Method:** `getRemoteMeters(tenantId)`  
**Purpose:** Break when querying the REMOTE database for meters

```typescript
private async getRemoteMeters(tenantId: number): Promise<MeterEntity[]> {
  debugger; // ← DEBUGGER #3
  try {
    const query = `
      SELECT m.id as meter_id,
             m.name as name,
             m.ip as ip,
             m.port as port,
             m.active as active,
             me.element as element
        FROM meter m
             JOIN meter_element me ON me.meter_id = m.id
      WHERE m.tenant_id = $1
    `;
    
    const result = await this.remotePool.query(query, [tenantId]);
    // ← This queries the REMOTE database
    return result.rows as MeterEntity[];
  }
}
```

## What Happens at Each Step

1. **Debugger #1 (API Endpoint)**
   - Frontend sends POST request to `/api/local/meter-sync-trigger`
   - Server receives the request
   - Validates that meterSyncAgent is available
   - Calls `meterSyncAgent.triggerSync()`

2. **Debugger #2 (performSync)**
   - Main sync operation starts
   - Checks if sync is already in progress
   - Gets tenant_id from local database
   - Calls `getRemoteMeters()` to fetch from REMOTE database
   - Calls `syncDatabase.getMeters()` to fetch from LOCAL database
   - Compares the two lists
   - Performs INSERT/UPDATE/DELETE operations on LOCAL database

3. **Debugger #3 (getRemoteMeters)**
   - Queries the REMOTE database (Client System database)
   - Joins meter table with meter_element table
   - Filters by tenant_id
   - Returns array of meters from REMOTE database

## Databases Involved

### REMOTE Database (Client System)
- **Connection:** `remotePool` (configured in connection-manager.ts)
- **Tables:** `meter`, `meter_element`
- **Purpose:** Source of truth for meter configuration
- **Queried in:** `getRemoteMeters()` method

### LOCAL Database (Sync System)
- **Connection:** `syncPool` (configured in connection-manager.ts)
- **Tables:** `meter`, `meter_reading`, `sync_log`, etc.
- **Purpose:** Local cache of meter data for offline access
- **Updated in:** `performSync()` method via `syncDatabase.upsertMeter()` and `syncDatabase.deleteInactiveMeter()`

## How to Debug

1. **Start the debugger:**
   - Open VS Code
   - Go to Run → "Debug Sync Backend" or "Debug All Backends"

2. **Trigger the sync:**
   - Open Sync Frontend (http://localhost:3003)
   - Navigate to the "Remote Meter Sync" card
   - Click "Trigger Meter Sync" button

3. **Debugger will break at:**
   - **Debugger #1:** When the button is clicked (API endpoint)
   - **Debugger #2:** When the sync operation starts
   - **Debugger #3:** When querying the remote database

4. **Inspect variables:**
   - `tenantId` - The tenant being synced
   - `remoteMeters` - Meters from REMOTE database
   - `localMeters` - Meters from LOCAL database
   - `result.rows` - Raw query results from remote database

## Key Files

| File | Purpose |
|------|---------|
| `sync/frontend/src/components/MeterSyncCard.tsx` | UI component for triggering sync |
| `sync/frontend/src/api/services.ts` | API client that calls `/api/local/meter-sync-trigger` |
| `sync/mcp/src/api/server.ts` | Express endpoint that receives the trigger request |
| `sync/mcp/src/sync-service/meter-sync-agent.ts` | Core sync logic that reads from remote and writes to local |
| `sync/mcp/src/database/connection-pools.ts` | Database connection configuration |

## Notes

- The sync reads from the **REMOTE** database (Client System) and writes to the **LOCAL** database (Sync System)
- The sync is filtered by `tenant_id` to ensure data isolation
- The sync performs INSERT, UPDATE, and DELETE operations to keep the local database in sync with the remote
- The sync can run automatically on a schedule or be manually triggered

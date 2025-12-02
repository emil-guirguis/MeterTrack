# Download Sync Manager Implementation

## Overview

The Download Sync Manager handles downloading meter configurations from the remote (Client) database to the local (Sync) database. It implements comparison logic to detect new and updated meters, performs upsert operations, and tracks changes for logging.

## Implementation Details

### Requirements Addressed

- **8.1**: Query all meter configurations from remote database
- **8.2**: Retrieve all meter columns including id, name, type, location_id, etc.
- **8.3**: Compare remote meters with local meters to detect changes
- **8.4**: Insert new meter records that don't exist locally
- **8.5**: Update existing meter records with new values
- **9.1**: Log new meters with meter_id and name
- **9.2**: Log total count of new meters added
- **9.3**: Log which fields were changed for updated meters
- **9.4**: Log when meter configurations are up to date
- **9.5**: Continue with other operations if meter download fails

### Key Features

1. **Full Meter Synchronization**: Downloads all meter configurations from remote database
2. **Change Detection**: Compares remote and local meters to identify new and updated records
3. **Upsert Operations**: Inserts new meters and updates existing ones
4. **Change Tracking**: Logs which specific fields changed for each updated meter
5. **Comprehensive Logging**: Provides detailed logs for monitoring and troubleshooting
6. **Error Handling**: Gracefully handles errors and continues operation

### Database Schema

The meter table has the following structure:

```sql
CREATE TABLE meter (
  id BIGINT PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  serial_number VARCHAR,
  installation_date TIMESTAMP WITH TIME ZONE,
  device_id BIGINT,
  location_id BIGINT,
  ip VARCHAR,
  port INTEGER,
  protocol VARCHAR,
  status VARCHAR NOT NULL,
  next_maintenance DATE,
  last_maintenance DATE,
  maintenance_interval VARCHAR,
  maintenance_notes TEXT,
  register_map JSON,
  notes TEXT,
  active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## API

### MeterConfiguration Interface

```typescript
interface MeterConfiguration {
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
  next_maintenance?: Date;
  last_maintenance?: Date;
  maintenance_interval?: string;
  maintenance_notes?: string;
  register_map?: any;
  notes?: string;
  active?: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### MeterSyncResult Interface

```typescript
interface MeterSyncResult {
  success: boolean;
  newMeters: number;
  updatedMeters: number;
  totalMeters: number;
  error?: string;
  duration: number;
  newMeterIds: number[];
  updatedMeterIds: number[];
}
```

### Main Methods

#### syncMeterConfigurations()

Executes the complete meter synchronization process:
1. Queries all meters from remote database
2. Queries all meters from local database
3. Compares and identifies new/updated meters
4. Inserts new meters
5. Updates existing meters
6. Returns detailed sync results

```typescript
async syncMeterConfigurations(): Promise<MeterSyncResult>
```

#### getLocalMeterCount()

Returns the count of meters in the local database.

```typescript
async getLocalMeterCount(): Promise<number>
```

## Usage Example

```typescript
import { DatabaseConnectionManager, DownloadSyncManager } from './database';

// Initialize connection manager
const connectionManager = new DatabaseConnectionManager(config);
await connectionManager.initialize();

// Create download sync manager
const downloadManager = new DownloadSyncManager({
  localPool: connectionManager.getLocalPool(),
  remotePool: connectionManager.getRemotePool(),
  logger: myLogger,
});

// Execute meter sync
const result = await downloadManager.syncMeterConfigurations();

console.log(`Success: ${result.success}`);
console.log(`New meters: ${result.newMeters}`);
console.log(`Updated meters: ${result.updatedMeters}`);
console.log(`Total meters: ${result.totalMeters}`);
```

## Testing

### Manual Test

Run the test script to verify functionality:

```bash
npm run build
node dist/database/test-download-sync-manager.js
```

### Test Results

The test script:
1. Initializes database connections
2. Creates Download Sync Manager
3. Gets initial meter count
4. Executes meter sync
5. Reports sync results
6. Gets final meter count

Example output:
```
=== Testing Download Sync Manager ===
Step 1: Initializing database connections...
✅ Database connections initialized

Step 2: Creating Download Sync Manager...
✅ Download Sync Manager created

Step 3: Getting initial meter counts...
Local meter count: 1

Step 4: Executing meter configuration sync...
Retrieved 1 meter configurations from remote database
Found 1 meter configurations in local database
Meter configurations are up to date

=== Sync Results ===
Success: true
Total meters in remote: 1
New meters added: 0
Meters updated: 0
Duration: 29ms

Step 5: Getting final meter counts...
Local meter count: 1
Change: 0

=== Test Complete ===
```

## Change Detection Logic

The manager compares the following fields to detect changes:
- name
- type
- serial_number
- device_id
- location_id
- ip
- port
- protocol
- status
- active
- register_map (JSON comparison)

When a change is detected, the specific fields that changed are logged for audit purposes.

## Error Handling

- **Query Errors**: Logged and thrown to caller
- **Insert Errors**: Logged with meter ID and error message
- **Update Errors**: Logged with meter ID and error message
- **Sync Failures**: Returned in result with success=false and error message

## Logging

The manager provides comprehensive logging:
- Number of meters retrieved from remote
- Number of meters found locally
- Each new meter added (with ID and name)
- Each meter updated (with ID and changed fields)
- Status when configurations are up to date
- All errors with context

## Integration

The Download Sync Manager is exported from the database module:

```typescript
import { DownloadSyncManager } from './database';
```

It integrates with:
- **DatabaseConnectionManager**: Provides connection pools
- **Sync Scheduler**: Calls syncMeterConfigurations() periodically
- **Status Reporter**: Uses getLocalMeterCount() for status

## Future Enhancements

1. **Tenant Sync**: Add syncTenantData() method (Task 4)
2. **Batch Processing**: Process meters in batches for large datasets
3. **Conflict Resolution**: Handle conflicts when same meter updated in both databases
4. **Incremental Sync**: Only download changed meters based on updated_at timestamp
5. **Deletion Handling**: Detect and handle meters deleted from remote
6. **Validation**: Validate meter data before inserting/updating

## Files

- `src/database/download-sync-manager.ts` - Main implementation
- `src/database/test-download-sync-manager.ts` - Manual test script
- `src/database/index.ts` - Module exports
- `check-meter-schema.mjs` - Schema verification utility

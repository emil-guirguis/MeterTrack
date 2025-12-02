# Design Document

## Overview

The Database-to-Database Sync Process is a standalone service that provides bi-directional data synchronization between a local PostgreSQL database (Sync Server) and a remote PostgreSQL database (Client Server). The service operates continuously, executing sync cycles at regular intervals to upload meter readings and download meter configurations.

### Key Features

- Direct PostgreSQL-to-PostgreSQL connections (no API layer)
- Bi-directional synchronization:
  - Upload: Meter readings from local to remote
  - Download: Meter configurations and tenant data from remote to local
- Batch processing for efficient data transfer (100 records per batch)
- Automatic cleanup of synchronized data
- Robust error handling with retry logic
- Comprehensive logging and status reporting
- Graceful shutdown handling

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Sync Process Service                      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Scheduler  │  │ Upload Sync  │  │ Download Sync│      │
│  │              │──│   Manager    │  │   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                           │                   │              │
│                           │                   │              │
│  ┌────────────────────────┴───────────────────┴──────────┐  │
│  │           Database Connection Manager                  │  │
│  └────────────────────────────────────────────────────────┘  │
│         │                                          │          │
└─────────┼──────────────────────────────────────────┼──────────┘
          │                                          │
          ▼                                          ▼
┌──────────────────┐                      ┌──────────────────┐
│  Local Database  │                      │ Remote Database  │
│  (Sync Server)   │                      │ (Client Server)  │
│                  │                      │                  │
│ • meter_readings │                      │ • meter_readings │
│ • meters         │                      │ • meters         │
│ • tenant         │                      │ • tenant         │
│ • sync_logs      │                      │                  │
└──────────────────┘                      └──────────────────┘
```

### Component Responsibilities

1. **Scheduler**: Manages sync cycle timing and execution
2. **Upload Sync Manager**: Handles meter reading uploads from local to remote
3. **Download Sync Manager**: Handles meter configuration and tenant data downloads from remote to local
4. **Database Connection Manager**: Manages connections to both databases with connection pooling

## Components and Interfaces

### 1. Database Connection Manager

Manages PostgreSQL connections to both local and remote databases.

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;        // Connection pool size
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

interface DatabaseConnectionManager {
  // Initialize connections
  initialize(): Promise<void>;
  
  // Get connection pools
  getLocalPool(): Pool;
  getRemotePool(): Pool;
  
  // Test connectivity
  testLocalConnection(): Promise<boolean>;
  testRemoteConnection(): Promise<boolean>;
  
  // Close connections
  close(): Promise<void>;
}
```

### 2. Upload Sync Manager

Handles uploading meter readings from local to remote database.

```typescript
interface MeterReading {
  id: number;
  meter_id: string;
  timestamp: Date;
  value: number;
  unit: string;
  metadata?: Record<string, any>;
}

interface UploadSyncManager {
  // Execute upload sync
  syncReadings(): Promise<UploadSyncResult>;
  
  // Get upload queue size
  getQueueSize(): Promise<number>;
}

interface UploadSyncResult {
  success: boolean;
  recordsUploaded: number;
  recordsDeleted: number;
  error?: string;
  duration: number;
}
```

### 3. Download Sync Manager

Handles downloading meter configurations and tenant data from remote to local database.

```typescript
interface MeterConfiguration {
  meter_id: string;
  name: string;
  location_id?: string;
  meter_type: string;
  unit: string;
  configuration?: Record<string, any>;
  updated_at: Date;
}

interface Tenant {
  tenant_id: string;
  name: string;
  configuration?: Record<string, any>;
  metadata?: Record<string, any>;
  updated_at: Date;
}

interface DownloadSyncManager {
  // Execute download sync for meters
  syncMeterConfigurations(): Promise<MeterSyncResult>;
  
  // Execute download sync for tenant data
  syncTenantData(): Promise<TenantSyncResult>;
  
  // Get local meter count
  getLocalMeterCount(): Promise<number>;
  
  // Get local tenant count
  getLocalTenantCount(): Promise<number>;
}

interface MeterSyncResult {
  success: boolean;
  newMeters: number;
  updatedMeters: number;
  totalMeters: number;
  error?: string;
  duration: number;
  newMeterIds: string[];
  updatedMeterIds: string[];
}

interface TenantSyncResult {
  success: boolean;
  newTenants: number;
  updatedTenants: number;
  totalTenants: number;
  error?: string;
  duration: number;
  newTenantIds: string[];
  updatedTenantIds: string[];
  tenantChanges: Array<{
    tenant_id: string;
    changedFields: string[];
  }>;
}
```

### 4. Sync Scheduler

Orchestrates the sync cycle execution.

```typescript
interface SyncScheduler {
  // Start scheduled sync
  start(): void;
  
  // Stop scheduled sync
  stop(): Promise<void>;
  
  // Execute one sync cycle
  executeSyncCycle(): Promise<SyncCycleResult>;
  
  // Get status
  getStatus(): SyncStatus;
}

interface SyncCycleResult {
  success: boolean;
  uploadResult: UploadSyncResult;
  meterDownloadResult: MeterSyncResult;
  tenantDownloadResult: TenantSyncResult;
  totalDuration: number;
  timestamp: Date;
}

interface SyncStatus {
  isRunning: boolean;
  lastSyncTime?: Date;
  lastSyncSuccess: boolean;
  lastSyncError?: string;
  queueSize: number;
  totalRecordsSynced: number;
  localMeterCount: number;
  remoteMeterCount: number;
  localTenantCount: number;
  remoteTenantCount: number;
  localDbConnected: boolean;
  remoteDbConnected: boolean;
}
```

## Data Models

### Local Database Schema

```sql
-- Meter readings table (local)
CREATE TABLE meter_readings (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50) NOT NULL,
  metadata JSONB,
  is_synchronized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meter_readings_sync ON meter_readings(is_synchronized, timestamp);
CREATE INDEX idx_meter_readings_meter_time ON meter_readings(meter_id, timestamp);

-- Meters configuration table (local)
CREATE TABLE meters (
  meter_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location_id VARCHAR(255),
  meter_type VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  configuration JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP
);

-- Tenant table (local)
CREATE TABLE tenant (
  tenant_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  configuration JSONB,
  metadata JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP
);

-- Sync logs table (local only)
CREATE TABLE sync_logs (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL, -- 'upload' or 'download'
  success BOOLEAN NOT NULL,
  records_processed INTEGER,
  error_message TEXT,
  duration_ms INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_logs_timestamp ON sync_logs(timestamp DESC);
```

### Remote Database Schema

```sql
-- Meter readings table (remote)
CREATE TABLE meter_readings (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meter_readings_meter_time ON meter_readings(meter_id, timestamp);

-- Meters configuration table (remote)
CREATE TABLE meters (
  meter_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location_id VARCHAR(255),
  meter_type VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  configuration JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant table (remote)
CREATE TABLE tenant (
  tenant_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  configuration JSONB,
  metadata JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Batch size limit enforcement
*For any* sync cycle, when querying unsynchronized meter readings, the system should return at most 100 records ordered by timestamp ascending
**Validates: Requirements 2.2**

### Property 2: Upload-delete atomicity
*For any* batch of meter readings, if the upload to the remote database succeeds, then those exact records (identified by their IDs) must be deleted from the local database
**Validates: Requirements 4.1, 4.2**

### Property 3: Transaction atomicity
*For any* database operation (insert or delete), if the operation fails at any point, then the transaction must be rolled back and no partial changes should persist
**Validates: Requirements 3.3, 3.5, 4.3, 4.5**

### Property 4: Data preservation on failure
*For any* upload error, the meter readings must remain in the local database with is_synchronized = false, ensuring they will be retried in the next sync cycle
**Validates: Requirements 6.3**

### Property 5: Retry with exponential backoff
*For any* retryable error (connection, query, or upload), the system should retry with exponentially increasing delays (2^n seconds) up to the maximum retry count
**Validates: Requirements 1.3, 2.5, 6.1, 6.2**

### Property 6: Sync cycle mutual exclusion
*For any* time during execution, at most one sync cycle should be in progress - attempting to start a new cycle while one is running should be prevented
**Validates: Requirements 5.4**

### Property 7: Graceful shutdown completion
*For any* shutdown signal received during a sync cycle, the system should complete the current cycle before terminating, ensuring no partial operations
**Validates: Requirements 5.5**

### Property 8: Meter configuration upsert correctness
*For any* meter configuration retrieved from the remote database, if it doesn't exist locally it should be inserted, and if it exists but differs it should be updated with the new values
**Validates: Requirements 8.4, 8.5**

### Property 9: New meter detection
*For any* meter configuration that is inserted (not updated) during a sync cycle, the system should log the meter_id and name, and include it in the new meter count
**Validates: Requirements 9.1, 9.2**

### Property 10: Download failure isolation
*For any* meter configuration download failure, the system should log the error and continue with the meter reading upload, ensuring one failure doesn't block the other
**Validates: Requirements 9.5**

### Property 13: Tenant upsert correctness
*For any* tenant record retrieved from the remote database, if it doesn't exist locally it should be inserted, and if it exists but differs it should be updated with the new values
**Validates: Requirements 10.4, 10.5**

### Property 14: Tenant change tracking
*For any* tenant that is updated (not inserted) during a sync cycle, the system should log the tenant_id and which fields were changed
**Validates: Requirements 11.3**

### Property 15: Tenant download failure isolation
*For any* tenant download failure, the system should log the error and continue with other sync operations (meter upload and meter config download), ensuring one failure doesn't block others
**Validates: Requirements 11.5**

### Property 11: Comprehensive logging
*For any* sync cycle, the system should log: cycle start with queue size, upload success/failure with record count and duration, delete success with record count, and any errors with type and context
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 12: Status accuracy
*For any* status query, the reported values (running state, last sync time, queue size, total synced, connection status, meter count, tenant count) should accurately reflect the current system state
**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

## Error Handling

### Connection Errors

**Scenario**: Database connection fails during initialization or operation

**Handling**:
1. Log the connection error with full details (host, port, error message)
2. Retry connection with exponential backoff: 2s, 4s, 8s, 16s, 32s (max 5 attempts)
3. If all retries fail, log critical error and wait for next sync cycle
4. Continue monitoring and attempt reconnection on next cycle

**Recovery**: Automatic reconnection on next sync cycle

### Query Errors

**Scenario**: Database query fails (SELECT, INSERT, DELETE)

**Handling**:
1. Log the query error with SQL statement and error message
2. Rollback any active transaction
3. Retry query with exponential backoff: 2s, 4s, 8s (max 3 attempts)
4. If all retries fail, log error and skip to next sync cycle
5. Data remains in local database for next attempt

**Recovery**: Automatic retry on next sync cycle

### Upload Errors

**Scenario**: Batch insert to remote database fails

**Handling**:
1. Rollback the insert transaction
2. Log the error with batch size and error details
3. Leave records in local database (is_synchronized = false)
4. Do not attempt to delete records from local database
5. Continue to next sync cycle

**Recovery**: Records will be retried in next sync cycle

### Delete Errors

**Scenario**: Delete from local database fails after successful upload

**Handling**:
1. Rollback the delete transaction
2. Log the error with record IDs and error details
3. Records remain in local database but are already in remote database
4. Mark records with a retry flag or timestamp
5. On next sync cycle, check if records exist in remote before uploading

**Recovery**: Duplicate detection on next sync cycle (check remote before upload)

### Download Errors

**Scenario**: Meter configuration download from remote database fails

**Handling**:
1. Log the download error with details
2. Continue with meter reading upload and tenant download (don't block other operations)
3. Retry download on next sync cycle
4. Local meter configurations remain unchanged

**Recovery**: Automatic retry on next sync cycle

### Tenant Download Errors

**Scenario**: Tenant data download from remote database fails

**Handling**:
1. Log the download error with details
2. Continue with meter reading upload and meter configuration download (don't block other operations)
3. Retry download on next sync cycle
4. Local tenant data remains unchanged

**Recovery**: Automatic retry on next sync cycle

### Unhandled Exceptions

**Scenario**: Unexpected exception occurs during sync cycle

**Handling**:
1. Catch exception at top level
2. Log full stack trace
3. Rollback any active transactions
4. Mark sync cycle as failed
5. Continue to next sync cycle

**Recovery**: Automatic retry on next sync cycle

## Testing Strategy

### Unit Testing

Unit tests will verify individual components in isolation:

**Database Connection Manager**:
- Connection initialization with valid credentials
- Connection failure handling and retry logic
- Connection pool management
- Graceful connection closure

**Upload Sync Manager**:
- Query for unsynchronized readings
- Batch size limiting (100 records)
- Record ordering by timestamp
- Batch insert to remote database
- Delete from local database after successful upload
- Transaction rollback on errors

**Download Sync Manager**:
- Query meter configurations from remote
- Compare with local configurations
- Insert new meters
- Update existing meters
- Track new meter IDs
- Query tenant data from remote
- Compare with local tenant data
- Insert new tenants
- Update existing tenants
- Track tenant changes (which fields changed)

**Sync Scheduler**:
- Sync cycle execution
- Interval timing
- Mutual exclusion (no concurrent cycles)
- Graceful shutdown
- Status reporting

### Property-Based Testing

Property-based tests will verify correctness properties across many randomly generated inputs using a PBT library appropriate for the implementation language (e.g., fast-check for TypeScript/JavaScript, Hypothesis for Python).

Each property-based test will:
- Run a minimum of 100 iterations with randomly generated data
- Be tagged with a comment referencing the specific correctness property from this design document
- Use the format: `**Feature: database-sync-process, Property {number}: {property_text}**`

**Test Data Generators**:
- Random meter readings with various timestamps, values, and metadata
- Random meter configurations with different field combinations
- Random database states (empty, partially filled, full)
- Random error conditions (connection failures, query failures, etc.)

**Property Tests**:
1. Batch size limit enforcement (Property 1)
2. Upload-delete atomicity (Property 2)
3. Transaction atomicity (Property 3)
4. Data preservation on failure (Property 4)
5. Retry with exponential backoff (Property 5)
6. Sync cycle mutual exclusion (Property 6)
7. Graceful shutdown completion (Property 7)
8. Meter configuration upsert correctness (Property 8)
9. New meter detection (Property 9)
10. Download failure isolation (Property 10)
11. Comprehensive logging (Property 11)
12. Status accuracy (Property 12)
13. Tenant upsert correctness (Property 13)
14. Tenant change tracking (Property 14)
15. Tenant download failure isolation (Property 15)

### Integration Testing

Integration tests will verify end-to-end functionality:

- Full sync cycle with real PostgreSQL databases (using Docker containers)
- Bi-directional sync (upload readings + download meters + download tenant data)
- Error recovery scenarios (connection loss, query failures)
- Concurrent operation handling
- Graceful shutdown during active sync
- Status reporting accuracy
- Tenant change detection and logging

### Performance Testing

Performance tests will verify:

- Sync cycle duration with various batch sizes
- Memory usage during large batch processing
- Connection pool efficiency
- Database query performance
- Throughput (records per second)

## Configuration

### Environment Variables

```bash
# Local Database (Sync Server)
POSTGRES_SYNC_HOST=localhost
POSTGRES_SYNC_PORT=5432
POSTGRES_SYNC_DB=meterit_sync
POSTGRES_SYNC_USER=postgres
POSTGRES_SYNC_PASSWORD=your_password

# Remote Database (Client Server)
POSTGRES_CLIENT_HOST=remote.example.com
POSTGRES_CLIENT_PORT=5432
POSTGRES_CLIENT_DB=meterit_client
POSTGRES_CLIENT_USER=postgres
POSTGRES_CLIENT_PASSWORD=your_password

# Sync Configuration
SYNC_INTERVAL_SECONDS=60          # Default: 60 seconds
BATCH_SIZE=100                     # Default: 100 records
MAX_CONNECTION_RETRIES=5           # Default: 5
MAX_QUERY_RETRIES=3                # Default: 3

# Connection Pool Configuration
DB_POOL_MAX=10                     # Default: 10 connections
DB_POOL_IDLE_TIMEOUT_MS=30000      # Default: 30 seconds
DB_CONNECTION_TIMEOUT_MS=5000      # Default: 5 seconds

# Logging Configuration
LOG_LEVEL=info                     # Default: info (debug, info, warn, error)
LOG_FILE=logs/sync-process.log
```

### Configuration Validation

On startup, the sync process will:
1. Validate all required environment variables are present
2. Validate numeric values are within acceptable ranges
3. Test database connections with provided credentials
4. Log configuration summary (with passwords redacted)

## Deployment

### Prerequisites

- Node.js 18+ or Python 3.10+ (depending on implementation language)
- PostgreSQL client libraries
- Network access to both local and remote databases
- Sufficient disk space for logs

### Installation

```bash
# Install dependencies
npm install  # or pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations (if needed)
npm run migrate  # or python migrate.py
```

### Running the Service

```bash
# Start the sync process
npm start  # or python main.py

# Run in background (Linux/Mac)
nohup npm start > sync-process.log 2>&1 &

# Run as systemd service (Linux)
sudo systemctl start sync-process
sudo systemctl enable sync-process
```

### Monitoring

Monitor the sync process through:
- Log files: `logs/sync-process.log`
- Status endpoint: Query status via MCP tool or API
- Database: Check `sync_logs` table for operation history
- System metrics: CPU, memory, network usage

## Security Considerations

### Database Credentials

- Store credentials in environment variables, never in code
- Use strong passwords with minimum 16 characters
- Rotate passwords regularly
- Use read-only credentials where possible (remote database for downloads)

### Network Security

- Use SSL/TLS for database connections in production
- Configure firewall rules to restrict database access
- Use VPN or SSH tunnels for remote database connections
- Implement connection timeout limits

### Data Security

- Ensure meter readings don't contain sensitive personal information
- Log only necessary information (avoid logging full data payloads)
- Implement log rotation to prevent disk space exhaustion
- Secure log files with appropriate file permissions

## Maintenance

### Log Rotation

Implement log rotation to prevent disk space issues:
- Rotate logs daily or when they reach 100MB
- Keep last 30 days of logs
- Compress old logs

### Database Maintenance

Periodic maintenance tasks:
- Clean up old sync_logs (keep last 90 days)
- Vacuum and analyze tables for performance
- Monitor table sizes and indexes
- Review slow query logs

### Monitoring and Alerts

Set up alerts for:
- Sync cycle failures (3+ consecutive failures)
- Database connection failures
- Queue size exceeding threshold (e.g., 10,000 records)
- Disk space low
- Process crashes or restarts

## Future Enhancements

### Potential Improvements

1. **Configurable batch size**: Allow dynamic batch size based on network conditions
2. **Compression**: Compress data before upload for large batches
3. **Parallel uploads**: Upload multiple batches concurrently
4. **Incremental downloads**: Only download changed meter configurations
5. **Metrics dashboard**: Web UI for monitoring sync status and metrics
6. **Alerting integration**: Send alerts via email, Slack, or PagerDuty
7. **Data validation**: Validate meter readings before upload
8. **Conflict resolution**: Handle conflicts when same meter updated in both databases

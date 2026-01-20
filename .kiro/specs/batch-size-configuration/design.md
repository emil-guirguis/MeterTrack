# Design Document: Batch Size Configuration for Meter Reading Sync

## Overview

This design adds configurable batch sizes for meter reading synchronization operations. Currently, batch sizes are hardcoded (1000 for remote uploads, 100 for database inserts), causing excessive SQL activity. The solution stores tenant-specific batch size settings in the tenant table and uses them throughout the sync pipeline. Additionally, the sync status flag will be properly updated after successful remote uploads.

## Architecture

### Current Flow (Problematic)
```
MeterReadingUploadManager.uploadReadings()
  → Fetches 1000 readings (hardcoded)
  → Uploads to remote in batches of 100 (hardcoded)
  → Does NOT update is_synchronized flag
  → Excessive SQL queries due to small batch sizes
```

### Fixed Flow
```
SyncManager.initialize()
  → Loads tenant batch sizes from tenant table
  → Caches batch sizes in memory
  → Falls back to defaults if not configured

MeterReadingUploadManager.uploadReadings()
  → Fetches readings using cached tenant's upload_batch_size
  → Uploads to remote in batches of upload_batch_size
  → Updates is_synchronized flag after successful upload
  → Reduced SQL queries through optimized batching

SyncManager.downloadReadings()
  → Fetches from remote using cached tenant's download_batch_size
  → Inserts to sync DB in batches of upload_batch_size
  → Logs batch operations

Cache Invalidation
  → When batch sizes are updated, cache is invalidated
  → Next sync cycle reloads from database
```

## Components and Interfaces

### 1. Batch Size Configuration from Tenant Cache

The batch size configuration will be stored in the existing tenant cache. When a tenant is loaded, its `download_batch_size` and `upload_batch_size` fields will be available:

```typescript
// Tenant cache already exists and will be extended with:
// tenant.download_batch_size: number (default 1000)
// tenant.upload_batch_size: number (default 100)

// Usage in SyncManager:
const tenant = await tenantCache.getTenant(tenantId);
const downloadBatchSize = tenant.download_batch_size;
const uploadBatchSize = tenant.upload_batch_size;
```

### 2. Database Schema Changes

#### Tenant Table Columns
```sql
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS download_batch_size INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE tenant ADD COLUMN IF NOT EXISTS upload_batch_size INTEGER NOT NULL DEFAULT 100;
```

### 2. SyncManager Configuration

```typescript
export interface SyncManagerConfig {
  database: SyncDatabase;
  apiClient: ClientSystemApiClient;
  syncIntervalMinutes?: number;
  batchSize?: number;  // Deprecated - use tenant-specific settings
  maxRetries?: number;
  enableAutoSync?: boolean;
  connectivityCheckIntervalMs?: number;
  tenantId?: number;  // For loading tenant-specific batch sizes from cache
}
```

### 3. SyncDatabase Interface Extensions

```typescript
export interface SyncDatabase {
  // Existing methods...
  
  // New methods for batch size configuration
  getTenantBatchConfig(tenantId: number): Promise<{ downloadBatchSize: number; uploadBatchSize: number }>;
  markReadingsAsSynchronized(readingIds: string[], tenantId: number): Promise<number>;
}
```

### 4. MeterReadingUploadManager Updates

```typescript
export interface MeterReadingUploadManagerConfig {
  database: SyncDatabase;
  apiClient: ClientSystemApiClient;
  uploadBatchSize?: number;  // Will be loaded from tenant cache
  maxRetries?: number;
  connectivityCheckIntervalMs?: number;
  tenantId?: number;
  tenantCache?: TenantCache;  // Existing tenant cache
}

class MeterReadingUploadManager {
  private uploadBatchSize: number;
  private tenantId: number;
  private tenantCache: TenantCache;
  
  async uploadReadings(): Promise<void> {
    // Get tenant from cache (includes batch size settings)
    const tenant = await this.tenantCache.getTenant(this.tenantId);
    this.uploadBatchSize = tenant.upload_batch_size;
    
    // Fetch readings using cached batch size
    const readings = await this.database.getUnsynchronizedReadings(this.uploadBatchSize);
    
    // Upload in batches
    for (let i = 0; i < readings.length; i += this.uploadBatchSize) {
      const batch = readings.slice(i, i + this.uploadBatchSize);
      await this.uploadBatch(batch);
      
      // Mark as synchronized after successful upload
      await this.database.markReadingsAsSynchronized(
        batch.map(r => r.meter_reading_id),
        this.tenantId
      );
    }
  }
}
```

### 5. SyncManager Updates

```typescript
class SyncManager {
  private downloadBatchSize: number;
  private uploadBatchSize: number;
  private tenantId: number;
  private tenantCache: TenantCache;
  
  async initialize(): Promise<void> {
    // Get tenant from cache (includes batch size settings)
    const tenant = await this.tenantCache.getTenant(this.tenantId);
    this.downloadBatchSize = tenant.download_batch_size;
    this.uploadBatchSize = tenant.upload_batch_size;
    
    console.log(`📊 Loaded batch config for tenant ${this.tenantId}:`, {
      downloadBatchSize: this.downloadBatchSize,
      uploadBatchSize: this.uploadBatchSize,
      source: 'tenant cache'
    });
  }
  
  async downloadReadings(): Promise<void> {
    // Use cached download batch size
    const readings = await this.apiClient.getReadings(this.downloadBatchSize);
    
    // Insert in batches using cached upload_batch_size
    for (let i = 0; i < readings.length; i += this.uploadBatchSize) {
      const batch = readings.slice(i, i + this.uploadBatchSize);
      await this.database.insertReadings(batch);
    }
  }
}
```

## Data Models

### Tenant Table Extension
The existing Tenant interface in the cache will be extended with batch size fields:

```typescript
// Existing Tenant interface is extended with:
export interface Tenant {
  // ... existing fields ...
  download_batch_size: number;  // Default: 1000
  upload_batch_size: number;    // Default: 100
}
```

### Meter Reading Sync Status
```typescript
export interface MeterReading {
  meter_reading_id: string;
  // ... existing fields ...
  is_synchronized: boolean;      // Updated after successful remote upload
  sync_status: 'pending' | 'synchronized' | 'failed';  // Updated after upload
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Batch Size Configuration Persistence
*For any* tenant, when batch sizes are loaded from the database, they should match the values stored in the tenant table.

**Validates: Requirements 1.1, 2.1**

### Property 2: Batch Size Defaults Applied
*For any* tenant without explicit batch size configuration, the system should use default values (download_batch_size=1000, upload_batch_size=100).

**Validates: Requirements 1.2, 2.2**

### Property 3: Readings Marked as Synchronized After Upload
*For any* batch of readings successfully uploaded to the remote database, all readings in that batch should have is_synchronized=true and sync_status='synchronized' in the sync database.

**Validates: Requirements 6.1, 6.2**

### Property 4: Failed Uploads Do Not Update Sync Status
*For any* batch upload that fails, the is_synchronized flag should remain false for all readings in that batch.

**Validates: Requirements 6.3**

### Property 5: Batch Operations Use Configured Sizes
*For any* sync operation, the number of records fetched or processed should not exceed the configured batch size for that operation type.

**Validates: Requirements 3.1, 3.2**

### Property 6: Sync Status Update Atomicity
*For any* batch of readings, updating the sync status should be performed in a single database operation to ensure consistency.

**Validates: Requirements 6.5**

### Property 7: Batch Size Configuration from Tenant Cache
*For any* tenant, batch size configuration should be retrieved from the existing tenant cache, which provides download_batch_size and upload_batch_size fields.

**Validates: Requirements 2.1, 2.3, 2.4**

## Error Handling

- If batch size configuration cannot be loaded for a tenant, log a warning and use default values
- If batch size values are invalid (≤0 or >10000), log an error and use defaults
- If marking readings as synchronized fails, log the error and retry on next sync cycle
- If a batch upload fails, do not update sync status for any readings in that batch
- If the tenant table doesn't have batch size columns, the migration will add them with defaults

## Testing Strategy

### Unit Tests
- Test loading tenant batch configuration from database
- Test default values are used when tenant config is missing
- Test batch size validation (positive integers, reasonable ranges)
- Test that readings are marked as synchronized after successful upload
- Test that failed uploads do not update sync status
- Test batch splitting logic respects configured batch sizes
- Test that sync status update uses single query per batch

### Property-Based Tests
- **Property 1**: For any tenant configuration, verify loaded batch sizes match stored values
- **Property 2**: For any tenant without config, verify defaults are applied
- **Property 3**: For any successful batch upload, verify all readings are marked synchronized
- **Property 4**: For any failed batch upload, verify no readings are marked synchronized
- **Property 5**: For any sync operation, verify batch sizes don't exceed configured limits
- **Property 6**: For any batch update, verify single query is used for sync status

### Integration Tests
- Test end-to-end sync flow with custom batch sizes
- Test that multiple batches are processed correctly
- Test that sync status is properly updated across batches
- Test that configuration changes take effect on next sync cycle

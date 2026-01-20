# Design Document: Sync Meter Readings Cron Expression Fix

## Overview

The SyncManager currently hardcodes a cron expression (`*/${this.syncIntervalMinutes} * * * *`) instead of using the centralized scheduling constants. This causes inconsistency with other scheduling in the system and makes it difficult to configure globally. The fix involves:

1. Importing the `getBACnetUploadCronExpression()` function from scheduling-constants
2. Replacing the hardcoded cron expression with a call to this function
3. Updating the SyncManager constructor to accept an optional `uploadCronExpression` parameter
4. Maintaining backward compatibility with the `syncIntervalMinutes` parameter

## Architecture

### Current Flow (Problematic)
```
SyncManager.start()
  → Creates cron expression: `*/${this.syncIntervalMinutes} * * * *`
  → Schedules job with hardcoded expression
  → Ignores BACNET_UPLOAD_CRON environment variable
```

### Fixed Flow
```
SyncManager.start()
  → Calls getBACnetUploadCronExpression()
  → Checks BACNET_UPLOAD_CRON env var
  → Falls back to CRON_SYNC_TO_REMOTE constant
  → Schedules job with centralized expression
```

## Components and Interfaces

### SyncManager Configuration
The SyncManager constructor already accepts a `SyncManagerConfig` interface. We'll extend it to optionally accept an `uploadCronExpression` parameter:

```typescript
export interface SyncManagerConfig {
  database: SyncDatabase;
  apiClient: ClientSystemApiClient;
  syncIntervalMinutes?: number;  // Deprecated but kept for backward compatibility
  uploadCronExpression?: string;  // New: explicit cron expression
  batchSize?: number;
  maxRetries?: number;
  enableAutoSync?: boolean;
  connectivityCheckIntervalMs?: number;
}
```

### Modified SyncManager.start() Method
The start method will be updated to:
1. Accept an optional `uploadCronExpression` parameter
2. Use `getBACnetUploadCronExpression()` if no explicit expression is provided
3. Log the actual cron expression being used
4. Schedule the cron job with the resolved expression

## Data Models

No data model changes required. The fix only affects scheduling logic.

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Cron Expression Consistency
*For any* SyncManager instance, the cron expression used for scheduling should match the value returned by `getBACnetUploadCronExpression()` when no explicit expression is provided.

**Validates: Requirements 1.1, 1.2**

### Property 2: Environment Variable Precedence
*For any* environment configuration, if `BACNET_UPLOAD_CRON` is set, the SyncManager should use that value; otherwise, it should use the default `CRON_SYNC_TO_REMOTE` constant.

**Validates: Requirements 1.2, 2.3**

### Property 3: Backward Compatibility
*For any* SyncManager initialized with a `syncIntervalMinutes` parameter, the system should still function correctly and respect the parameter for backward compatibility.

**Validates: Requirements 2.1**

## Error Handling

- If `getBACnetUploadCronExpression()` returns an invalid cron expression, the `cron.schedule()` call will throw an error, which should be caught and logged
- The SyncManager should log a warning if no valid cron expression can be determined
- The system should fall back to the default `CRON_SYNC_TO_REMOTE` constant if all other options fail

## Testing Strategy

### Unit Tests
- Test that SyncManager uses `getBACnetUploadCronExpression()` when no explicit expression is provided
- Test that SyncManager respects an explicitly provided `uploadCronExpression` parameter
- Test that the cron job is scheduled with the correct expression
- Test backward compatibility with `syncIntervalMinutes` parameter
- Test that the correct cron expression is logged

### Property-Based Tests
- **Property 1**: For any valid SyncManager configuration, verify that the scheduled cron expression matches the expected value from `getBACnetUploadCronExpression()`
- **Property 2**: For any environment variable configuration, verify that the precedence order is respected (explicit > env var > default)
- **Property 3**: For any `syncIntervalMinutes` value, verify that the system still functions and respects the parameter


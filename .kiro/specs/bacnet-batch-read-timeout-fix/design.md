# Design Document: BACnet Batch Read Timeout Fix

## Overview

This design addresses batch read timeouts in the BACnet meter reading system by implementing:
1. Configurable timeout parameters
2. Graceful timeout handling with partial result support
3. Adaptive batch sizing that reduces batch size on timeout
4. Meter connectivity checking before read attempts
5. Fallback to sequential reads when batch reads fail
6. Enhanced monitoring and metrics for timeout events

The solution maintains backward compatibility while adding resilience and observability to the meter reading pipeline.

## Architecture

### Current Flow
```
Collection Cycle → For Each Meter → Batch Read All Registers → Store Results
```

### Enhanced Flow
```
Collection Cycle → For Each Meter → Connectivity Check → Batch Read (with adaptive sizing) → 
  On Timeout: Sequential Fallback → Store Results → Record Metrics
```

## Components and Interfaces

### 1. BACnetClient Enhancements

**New Configuration Parameters:**
```typescript
interface BACnetClientConfig {
  apduTimeout: number;           // APDU-level timeout (ms)
  batchReadTimeout: number;      // Batch read operation timeout (ms)
  sequentialReadTimeout: number; // Sequential read operation timeout (ms)
  initialBatchSize: number;      // Starting batch size (default: all registers)
  minBatchSize: number;          // Minimum batch size before fallback (default: 1)
}
```

**New Methods:**
- `readPropertyMultiple()` - Enhanced with timeout handling and partial results
- `readPropertySequential()` - New method for sequential fallback reads
- `checkConnectivity()` - New method to verify meter is online

### 2. CollectionCycleManager Enhancements

**New Configuration:**
```typescript
interface CycleManagerConfig {
  readTimeoutMs: number;
  batchReadTimeoutMs: number;
  sequentialReadTimeoutMs: number;
  enableConnectivityCheck: boolean;
  enableSequentialFallback: boolean;
  adaptiveBatchSizing: boolean;
}
```

**Enhanced Methods:**
- `readMeterDataPoints()` - Now includes connectivity check and adaptive batching
- `performBatchRead()` - New method handling batch reads with timeout logic
- `performSequentialFallback()` - New method for sequential read fallback
- `checkMeterConnectivity()` - New method to verify meter is reachable

### 3. BACnetMeterReadingAgent Enhancements

**New Status Fields:**
```typescript
interface AgentStatus {
  // ... existing fields ...
  timeoutMetrics: {
    totalTimeouts: number;
    timeoutsByMeter: Record<string, number>;
    averageTimeoutRecoveryMs: number;
    lastTimeoutTime?: Date;
  };
  offlineMeters: Array<{
    meterId: number;
    lastCheckedAt: Date;
    consecutiveFailures: number;
  }>;
}
```

### 4. New Batch Sizing Strategy

**Adaptive Batch Sizing Algorithm:**
```
Initial batch size = all registers
On successful read:
  - Maintain current batch size
  - Gradually increase (if configured)

On timeout:
  - Reduce batch size by 50%
  - Retry with smaller batch
  - If batch size reaches minimum, use sequential reads

On sequential read success:
  - Record that sequential reads work for this meter
  - Use sequential reads for future cycles
```

## Data Models

### Timeout Event Record
```typescript
interface TimeoutEvent {
  meterId: number;
  timestamp: Date;
  registerCount: number;
  batchSize: number;
  timeoutMs: number;
  recoveryMethod: 'sequential' | 'reduced_batch' | 'offline';
  success: boolean;
}
```

### Meter Connectivity Status
```typescript
interface MeterConnectivityStatus {
  meterId: number;
  isOnline: boolean;
  lastCheckedAt: Date;
  consecutiveFailures: number;
  offlineSince?: Date;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Configured Timeout is Applied
*For any* batch read operation with a configured timeout value, the system should use that configured timeout instead of a hardcoded value for the read operation.

**Validates: Requirements 1.2, 1.4**

### Property 2: Partial Results on Batch Timeout
*For any* batch read that times out, the system should return results for all registers that completed before the timeout, with failed registers marked with timeout errors.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Batch Size Reduction on Timeout
*For any* meter that experiences a batch read timeout, the next batch read attempt should use a smaller batch size (at most 50% of the previous size).

**Validates: Requirements 3.1, 3.3**

### Property 4: Timeout Consistency Across Batches
*For any* collection cycle that processes multiple batches due to size reduction, each batch request should use the same timeout value.

**Validates: Requirements 3.4**

### Property 5: Connectivity Check Prevents Reads
*For any* meter that fails the connectivity check, the system should not attempt batch or sequential reads for that meter in the current cycle.

**Validates: Requirements 6.1, 6.5**

### Property 6: Sequential Fallback on Batch Failure
*For any* batch read that fails completely, if sequential fallback is enabled, the system should attempt to read each register individually and return partial results for any that succeed.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: Timeout Metrics Recording
*For any* batch read timeout event, the system should record metrics including meter ID, register count, and recovery method used.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Cycle Continuation on Meter Failure
*For any* meter that experiences timeout or connectivity failure, the collection cycle should continue processing remaining meters without interruption.

**Validates: Requirements 2.4, 5.4, 6.2**

## Error Handling

### Timeout Scenarios

1. **Batch Read Timeout**
   - Log timeout with meter ID and register count
   - Return partial results for completed registers
   - Mark failed registers with timeout error
   - Trigger batch size reduction
   - Continue to next meter

2. **Connectivity Check Failure**
   - Log offline status
   - Skip meter for current cycle
   - Increment consecutive failure counter
   - Continue to next meter

3. **Sequential Read Timeout**
   - Log individual register timeout
   - Mark register as failed
   - Continue to next register
   - Continue to next meter after all registers attempted

4. **Complete Meter Failure**
   - All read attempts failed
   - Record error with meter ID
   - Continue to next meter
   - Increment meter's failure counter

### Recovery Strategies

1. **Adaptive Batch Sizing**: Reduce batch size on timeout, retry with smaller batches
2. **Sequential Fallback**: If batch fails, attempt sequential reads
3. **Connectivity Validation**: Check meter is online before reading
4. **Cycle Continuation**: Never stop entire cycle due to single meter failure

## Testing Strategy

### Unit Tests

- Test batch read timeout handling with partial results
- Test batch size reduction algorithm
- Test connectivity check success and failure cases
- Test sequential fallback read logic
- Test timeout metrics recording
- Test error logging and reporting

### Property-Based Tests

- **Property 1**: For any batch read timeout, verify partial results are returned
- **Property 2**: For any timeout, verify batch size is reduced for next attempt
- **Property 3**: For any offline meter, verify no read attempts are made
- **Property 4**: For any batch failure, verify sequential fallback is attempted
- **Property 5**: For any cycle, verify timeout metrics match actual events
- **Property 6**: For any meter failure, verify cycle continues with remaining meters

### Integration Tests

- Test complete collection cycle with mixed online/offline meters
- Test timeout recovery across multiple cycles
- Test metrics accumulation over multiple cycles
- Test configuration changes applied to running agent

## Configuration

### Default Configuration
```typescript
{
  readTimeoutMs: 5000,              // Batch read timeout
  sequentialReadTimeoutMs: 3000,    // Sequential read timeout
  enableConnectivityCheck: true,    // Check meter online before reading
  enableSequentialFallback: true,   // Fall back to sequential on batch failure
  adaptiveBatchSizing: true,        // Reduce batch size on timeout
  initialBatchSize: 'all',          // Start with all registers in batch
  minBatchSize: 1,                  // Minimum batch size before sequential
  connectivityCheckTimeoutMs: 2000, // Timeout for connectivity check
}
```

### Environment Variables
- `BACNET_READ_TIMEOUT_MS`: Override batch read timeout
- `BACNET_SEQUENTIAL_TIMEOUT_MS`: Override sequential read timeout
- `BACNET_ENABLE_CONNECTIVITY_CHECK`: Enable/disable connectivity checks
- `BACNET_ENABLE_SEQUENTIAL_FALLBACK`: Enable/disable sequential fallback

## Implementation Notes

1. **Backward Compatibility**: All new features are optional and can be disabled via configuration
2. **Metrics Collection**: Timeout events are recorded for monitoring and diagnostics
3. **Logging**: Enhanced logging at each stage for troubleshooting
4. **Performance**: Adaptive batching reduces unnecessary retries and improves overall throughput
5. **Resilience**: Multiple fallback strategies ensure data collection continues despite timeouts


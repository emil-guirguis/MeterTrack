# Design Document: BACnet Meter Reading Agent

## Overview

The BACnet Meter Reading Agent is a scheduled service that executes every 60 seconds to collect meter readings from BACnet-enabled devices. The agent maintains an in-memory cache of active meters and their register maps, connects to each meter via BACnet using the bacstack library, reads configured properties, and persists the readings to the meter_reading table. The agent is designed to be resilient, handling connection failures and read errors gracefully while continuing to process other meters.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│         BACnet Meter Reading Agent                        │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Every 60 seconds:                                        │
│                                                            │
│  1. Load active meters from database                      │
│  2. For each meter:                                       │
│     - Connect via BACnet (IP + port)                      │
│     - Read all registers from register_map               │
│     - Insert readings into meter_reading table            │
│  3. Log cycle results                                     │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. BACnetMeterReadingAgent

Main agent class that orchestrates the collection process.

```typescript
interface BACnetMeterReadingAgentConfig {
  database: SyncDatabase;
  collectionIntervalSeconds?: number;  // Default: 60
  enableAutoStart?: boolean;            // Default: true
  bacnetInterface?: string;             // Default: '0.0.0.0'
  bacnetPort?: number;                  // Default: 47808
  connectionTimeoutMs?: number;         // Default: 5000
  readTimeoutMs?: number;               // Default: 3000
}

class BACnetMeterReadingAgent {
  async start(): Promise<void>
  async stop(): Promise<void>
  async triggerCollection(): Promise<CollectionCycleResult>
  getStatus(): AgentStatus
}
```

### 2. MeterCache

In-memory cache of active meters and their register maps.

```typescript
interface CachedMeter {
  id: string;
  name: string;
  ip: string;
  port: string;
  register_map: RegisterMap;
  protocol: string;
}

interface RegisterMap {
  [dataPointName: string]: {
    objectType: string;      // e.g., "analogInput", "analogOutput"
    objectInstance: number;  // e.g., 0, 1, 2
    propertyId: string;      // e.g., "presentValue", "units"
  }
}

class MeterCache {
  async reload(database: SyncDatabase): Promise<void>
  getMeters(): CachedMeter[]
  getMeter(meterId: string): CachedMeter | null
  isValid(): boolean
}
```

### 3. BACnetClient

Wrapper around bacstack library for BACnet communication.

```typescript
interface BACnetReadResult {
  success: boolean;
  value?: any;
  unit?: string;
  error?: string;
}

class BACnetClient {
  async readProperty(
    ip: string,
    port: number,
    objectType: string,
    objectInstance: number,
    propertyId: string,
    timeoutMs: number
  ): Promise<BACnetReadResult>
  
  async close(): Promise<void>
}
```

### 4. CollectionCycleManager

Orchestrates a single collection cycle.

```typescript
interface CollectionCycleResult {
  cycleId: string;
  startTime: Date;
  endTime: Date;
  metersProcessed: number;
  readingsCollected: number;
  errors: CollectionError[];
  success: boolean;
}

interface CollectionError {
  meterId: string;
  dataPoint?: string;
  operation: 'connect' | 'read' | 'write';
  error: string;
  timestamp: Date;
}

class CollectionCycleManager {
  async executeCycle(
    meterCache: MeterCache,
    bacnetClient: BACnetClient,
    database: SyncDatabase
  ): Promise<CollectionCycleResult>
}
```

### 5. ReadingBatcher

Batches readings for efficient database insertion.

```typescript
interface PendingReading {
  meter_id: string;
  timestamp: Date;
  data_point: string;
  value: number;
  unit?: string;
}

class ReadingBatcher {
  addReading(reading: PendingReading): void
  async flushBatch(database: SyncDatabase): Promise<number>
  getPendingCount(): number
}
```

## Data Models

### Meter Table (existing)
```sql
CREATE TABLE meter (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ip VARCHAR(50),
  port VARCHAR(10),
  protocol VARCHAR(50),
  register_map JSONB,
  active BOOLEAN DEFAULT true,
  ...
)
```

### Meter Reading Table (existing)
```sql
CREATE TABLE meter_reading (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(255) NOT NULL REFERENCES meter(id),
  timestamp TIMESTAMP NOT NULL,
  data_point VARCHAR(255),
  value NUMERIC,
  unit VARCHAR(50),
  is_synchronized BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Register Map Structure (stored in meter.register_map)
```json
{
  "total_energy": {
    "objectType": "analogInput",
    "objectInstance": 0,
    "propertyId": "presentValue"
  },
  "voltage": {
    "objectType": "analogInput",
    "objectInstance": 1,
    "propertyId": "presentValue"
  },
  "current": {
    "objectType": "analogInput",
    "objectInstance": 2,
    "propertyId": "presentValue"
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Scheduled Execution Consistency
*For any* collection cycle, if the agent is running and no cycle is currently executing, then after the scheduled interval elapses, a new collection cycle SHALL execute exactly once.

**Validates: Requirements 1.1, 1.2**

### Property 2: Non-Overlapping Cycles
*For any* collection cycle that is currently executing, if the scheduled interval elapses, then the system SHALL NOT start a new collection cycle until the current cycle completes.

**Validates: Requirements 1.3**

### Property 3: Graceful Shutdown
*For any* running agent that receives a shutdown signal, the system SHALL stop the scheduled task and close all active BACnet connections without throwing unhandled exceptions.

**Validates: Requirements 1.4**

### Property 4: Meter Cache Loading
*For any* agent startup, the system SHALL load all active meters from the database into the cache, and the cache SHALL contain exactly the set of active meters at startup time.

**Validates: Requirements 2.1**

### Property 5: Cache Usage During Collection
*For any* collection cycle, the system SHALL use only the cached register maps to determine which BACnet properties to read, without querying the database for register map information.

**Validates: Requirements 2.2**

### Property 6: Cache Invalidation on Update
*For any* meter whose register_map is updated in the database, the system SHALL reload the updated register_map into the cache on the next collection cycle.

**Validates: Requirements 2.3**

### Property 7: Invalid Register Map Handling
*For any* meter with an invalid or missing register_map, the system SHALL skip that meter during collection, log an error with the meter ID, and continue processing other meters.

**Validates: Requirements 2.4, 6.2**

### Property 8: Meter Iteration
*For any* collection cycle, the system SHALL iterate through all active meters in the cache and attempt to read from each one.

**Validates: Requirements 3.1**

### Property 9: BACnet Connection Parameters
*For any* meter connection attempt, the system SHALL use the meter's IP address and port from the cache to establish the BACnet connection.

**Validates: Requirements 3.2**

### Property 10: Connection Failure Resilience
*For any* meter that fails to connect via BACnet, the system SHALL log the connection error with meter ID, IP, and port, and continue processing the next meter without stopping the collection cycle.

**Validates: Requirements 3.3, 6.2**

### Property 11: Successful Connection Continuation
*For any* successful BACnet connection to a meter, the system SHALL proceed to read all data points defined in that meter's register map.

**Validates: Requirements 3.4, 4.1**

### Property 12: Reading Capture Completeness
*For any* successfully read register, the system SHALL capture the value, unit, and timestamp of the read operation.

**Validates: Requirements 4.2**

### Property 13: Register Read Failure Resilience
*For any* data point that fails to read from a meter, the system SHALL log the read error with meter ID, data point name, and error details, and continue reading other data points for that meter.

**Validates: Requirements 4.3, 6.3**

### Property 14: Reading Persistence
*For any* successfully read data point, the system SHALL store the reading in the meter_reading table with meter_id, timestamp, data_point, value, and unit.

**Validates: Requirements 4.4, 5.1, 5.2**

### Property 15: Batch Insert Atomicity
*For any* meter, all readings collected from that meter in a single collection cycle SHALL be inserted into the database in a single transaction.

**Validates: Requirements 5.1**

### Property 16: Unsynchronized Marking
*For any* successfully inserted reading, the system SHALL set is_synchronized=false to mark it for later upload to the client system.

**Validates: Requirements 5.2**

### Property 17: Database Write Failure Handling
*For any* batch insert that fails, the system SHALL log the database error and continue processing other meters without stopping the collection cycle.

**Validates: Requirements 5.3, 6.1, 6.4**

### Property 18: Error Logging Context
*For any* error that occurs during a collection cycle, the system SHALL log the error with sufficient context including meter ID, operation type, and error message.

**Validates: Requirements 6.1**

### Property 19: Cycle Status Recording
*For any* completed collection cycle, the system SHALL record the cycle status including start time, end time, meters processed, readings collected, and errors encountered.

**Validates: Requirements 7.1, 5.4**

### Property 20: Status Query Response
*For any* status query, the system SHALL return the current cycle status, last cycle results, and any active errors.

**Validates: Requirements 7.2**

### Property 21: Failure Reason Recording
*For any* collection cycle that fails, the system SHALL record the failure reason and make it available in the status response.

**Validates: Requirements 7.3**

### Property 22: Running Metrics Tracking
*For any* running agent, the system SHALL maintain and increment running counts of total cycles executed, total readings collected, and total errors encountered.

**Validates: Requirements 7.4**

### Property 23: Manual Trigger Execution
*For any* manual trigger request, the system SHALL initiate an immediate collection cycle.

**Validates: Requirements 8.2**

### Property 24: Manual Trigger Isolation
*For any* manual trigger request, if a collection cycle is already executing, the system SHALL prevent the manual trigger from starting a concurrent cycle.

**Validates: Requirements 8.3**

## Error Handling

The agent implements comprehensive error handling at multiple levels:

1. **Connection Errors**: Logged with meter ID, IP, port, and error details. Agent continues to next meter.
2. **Read Errors**: Logged with meter ID, data point name, and error details. Agent continues reading other data points.
3. **Database Errors**: Logged with batch size and error details. Agent continues processing other meters.
4. **Validation Errors**: Invalid register maps are logged and the meter is skipped.
5. **Timeout Errors**: BACnet read operations timeout after configurable duration (default 3 seconds).

All errors are recorded in the collection cycle result and made available via the status endpoint.

## Testing Strategy

### Unit Testing

Unit tests verify specific components in isolation:

- **MeterCache**: Test loading, reloading, and validation of meter configurations
- **BACnetClient**: Test successful reads, timeout handling, and error scenarios
- **ReadingBatcher**: Test adding readings, batch flushing, and edge cases
- **CollectionCycleManager**: Test cycle execution with mocked BACnet client and database

### Property-Based Testing

Property-based tests verify universal properties using the fast-check library:

- **Scheduling**: Verify that cycles execute at the correct interval without overlap
- **Resilience**: Verify that failures in individual meters don't affect other meters
- **Persistence**: Verify that all successfully read values are persisted to the database
- **Cache Consistency**: Verify that the cache stays synchronized with the database

Each property-based test will run a minimum of 100 iterations with randomly generated meter configurations, register maps, and BACnet responses.

### Test Configuration

- **Framework**: Vitest with fast-check for property-based testing
- **Mocking**: Mock BACnet client and database for unit tests
- **Coverage Target**: Minimum 80% code coverage for core collection logic


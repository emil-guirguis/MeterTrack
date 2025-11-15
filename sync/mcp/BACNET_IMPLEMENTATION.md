# BACnet Meter Collection Implementation

## Overview

This document describes the BACnet-based meter collection implementation for the Sync MCP system. The implementation replaces the previous Modbus protocol with BACnet/IP for reading data from building automation meters.

## Components

### 1. BACnet Client (`src/meter-collection/bacnet-client.ts`)

The BACnet client provides low-level communication with BACnet devices on the network.

**Key Features:**
- Device discovery using WhoIs/IAm broadcasts
- Property reading from BACnet objects
- Multiple property reading for efficient data collection
- Connection testing and error handling
- Event-driven architecture with EventEmitter

**Configuration:**
```typescript
{
  interface: '0.0.0.0',           // Network interface to bind to
  port: 47808,                     // BACnet/IP port (standard)
  broadcastAddress: '255.255.255.255',
  timeout: 6000                    // Read timeout in milliseconds
}
```

**Key Methods:**
- `connect()` - Initialize BACnet client
- `discoverDevices()` - Discover BACnet devices on network
- `readProperty()` - Read a single property from a device
- `readMultipleProperties()` - Read multiple properties efficiently
- `testConnection()` - Test connectivity to a device
- `disconnect()` - Close BACnet client

### 2. Meter Collector (`src/meter-collection/collector.ts`)

The meter collector orchestrates data collection from multiple BACnet meters.

**Key Features:**
- Load meter configuration from JSON file
- Scheduled data collection at configurable intervals
- Store readings in Sync Database
- Per-meter error tracking and health monitoring
- Automatic retry and error recovery
- Health checks every 5 minutes

**Configuration:**
```typescript
{
  bacnet: BACnetConfig,           // BACnet client configuration
  collectionInterval: 60,         // Collection interval in seconds
  configPath: 'config/meters.json',
  autoStart: true
}
```

**Key Methods:**
- `initialize()` - Load config and connect to BACnet
- `start()` - Start scheduled data collection
- `stop()` - Stop data collection
- `collectAllMeters()` - Collect from all configured meters
- `getStatus()` - Get collector and meter status
- `getLatestReadings()` - Query recent readings
- `getStatistics()` - Get meter statistics

## Meter Configuration

Meters are configured in `config/meters.json`:

```json
{
  "description": "BACnet meter configuration",
  "meters": [
    {
      "id": "meter-001",
      "name": "Building A Main",
      "bacnet_device_id": 12345,
      "bacnet_ip": "192.168.1.100",
      "data_points": [
        {
          "object_type": 0,      // ANALOG_INPUT
          "instance": 0,
          "property": 85,        // PRESENT_VALUE
          "name": "total_kwh"
        },
        {
          "object_type": 0,
          "instance": 1,
          "property": 85,
          "name": "current_kw"
        }
      ]
    }
  ]
}
```

### BACnet Object Types (Common)
- `0` - ANALOG_INPUT
- `1` - ANALOG_OUTPUT
- `2` - ANALOG_VALUE
- `3` - BINARY_INPUT
- `4` - BINARY_OUTPUT
- `5` - BINARY_VALUE

### BACnet Properties (Common)
- `85` - PRESENT_VALUE (most common for readings)
- `77` - OBJECT_NAME
- `79` - OBJECT_TYPE
- `117` - UNITS

## Data Flow

1. **Collection Cycle**
   - Timer triggers collection at configured interval
   - Collector iterates through all configured meters
   - For each meter, reads all configured data points
   - Stores readings in Sync Database

2. **Reading Storage**
   - Each reading stored with:
     - `meter_external_id` - Meter ID from config
     - `timestamp` - Reading timestamp
     - `data_point` - Data point name (e.g., "total_kwh")
     - `value` - Numeric value
     - `unit` - Optional unit string
     - `is_synchronized` - False initially
     - `retry_count` - 0 initially

3. **Error Handling**
   - Per-meter error tracking
   - Continue collection even if one meter fails
   - Log errors with context
   - Health checks detect unreachable meters

## Integration with Sync Database

The collector uses the `SyncDatabase` class to store readings:

```typescript
await database.insertReading({
  meter_external_id: 'meter-001',
  timestamp: new Date(),
  data_point: 'total_kwh',
  value: 12345.67,
  unit: 'kWh'
});
```

Readings remain in the database with `is_synchronized = false` until the Sync Service uploads them to the Client System.

## Usage Example

```typescript
import { MeterCollector } from './meter-collection/index.js';
import { createDatabaseFromEnv } from './database/index.js';
import winston from 'winston';

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Create database connection
const database = createDatabaseFromEnv();

// Create collector
const collector = new MeterCollector(
  {
    bacnet: {
      interface: '0.0.0.0',
      port: 47808,
      broadcastAddress: '255.255.255.255',
      timeout: 6000
    },
    collectionInterval: 60,
    configPath: 'config/meters.json',
    autoStart: false
  },
  database,
  logger
);

// Start collection
await collector.start();

// Get status
const status = await collector.getStatus();
console.log('Collector status:', status);

// Stop collection
collector.stop();
```

## Environment Variables

Required environment variables for database connection:

```bash
LOCAL_POSTGRES_HOST=localhost
LOCAL_POSTGRES_PORT=5432
LOCAL_POSTGRES_DB=meterit_sync
LOCAL_POSTGRES_USER=postgres
LOCAL_POSTGRES_PASSWORD=your_password
```

## Monitoring and Logging

The collector provides detailed logging:

- **Info Level**: Connection status, collection cycles, health checks
- **Debug Level**: Individual readings, property values
- **Warn Level**: Meter connectivity issues, health check failures
- **Error Level**: Collection failures, database errors

Example log output:
```
[info] BACnet client connected
[info] Loaded 2 meters from configuration
[info] Data collection started with interval: 60s
[info] Collecting data from 2 meters...
[debug] Collecting data from meter Building A Main (meter-001)
[debug] Collected 5 readings from meter Building A Main
[info] Collection cycle complete { duration: '1234ms', success: 2, errors: 0, total: 2 }
```

## Testing

To test the BACnet implementation:

1. Ensure BACnet devices are accessible on the network
2. Configure meters in `config/meters.json`
3. Set environment variables for database
4. Run the collector:

```bash
npm run build
npm start
```

## Differences from Modbus Implementation

| Aspect | Modbus | BACnet |
|--------|--------|--------|
| Protocol | Modbus TCP | BACnet/IP |
| Port | 502 | 47808 |
| Device ID | Slave ID | Device ID |
| Data Access | Register address | Object Type + Instance |
| Discovery | Manual config | WhoIs/IAm broadcast |
| Library | jsmodbus | bacstack |

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 3.1**: Connect to BACnet meters on local network
- **Requirement 3.2**: Read meter data at configurable intervals
- **Requirement 3.3**: Store readings in Sync Database
- **Requirement 3.4**: Handle meter connectivity errors
- **Requirement 3.5**: Run only in Sync deployment

## Next Steps

The meter collection service is now ready for integration with:

1. **Sync Service** - Upload collected readings to Client System
2. **Sync MCP** - Provide MCP tools for controlling collection
3. **Sync Frontend** - Display local meter data and status

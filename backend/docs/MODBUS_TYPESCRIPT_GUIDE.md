# Modbus TypeScript Implementation Guide

## Overview

This guide covers the new TypeScript-based Modbus implementation using `jsmodbus` (node-modbus) library with enhanced connection pooling, error handling, and type safety.

## Architecture

### Core Components

1. **ModbusService** (`src/services/modbusService.ts`) - Main service with connection pooling
2. **DirectMeter Route** (`src/routes/directMeter.ts`) - API endpoints for Modbus operations
3. **Type Definitions** (`src/types/modbus.ts`) - TypeScript interfaces and types
4. **Error Handling** - Comprehensive error categorization and handling

## Configuration

### Environment Variables

```bash
# Connection Pool Settings
MODBUS_MAX_CONNECTIONS=10          # Maximum concurrent connections
MODBUS_IDLE_TIMEOUT=300000         # Idle connection timeout (5 minutes)
MODBUS_ACQUIRE_TIMEOUT=30000       # Connection acquisition timeout (30 seconds)
MODBUS_CREATE_RETRY_INTERVAL=5000  # Retry interval for connection creation
MODBUS_MAX_RETRIES=3               # Maximum retry attempts
MODBUS_HEALTH_CHECK_INTERVAL=60000 # Health check interval (1 minute)

# Default Connection Settings
MODBUS_DEFAULT_PORT=502            # Default Modbus TCP port
MODBUS_DEFAULT_TIMEOUT=5000        # Default operation timeout
MODBUS_DEFAULT_UNIT_ID=1           # Default slave/unit ID

# Error Handling
MODBUS_CIRCUIT_BREAKER_THRESHOLD=5 # Circuit breaker failure threshold
MODBUS_CIRCUIT_BREAKER_TIMEOUT=60000 # Circuit breaker timeout
MODBUS_BASE_RETRY_DELAY=1000       # Base retry delay
MODBUS_MAX_RETRY_DELAY=30000       # Maximum retry delay
MODBUS_BACKOFF_MULTIPLIER=2        # Exponential backoff multiplier
MODBUS_JITTER_ENABLED=true         # Enable jitter in retry delays
```

## TypeScript Interfaces

### ModbusClientConfig

```typescript
interface ModbusClientConfig {
  host: string;                    // Device IP address
  port: number;                    // Modbus TCP port (default: 502)
  unitId: number;                  // Slave/Unit ID (default: 1)
  timeout: number;                 // Operation timeout in ms
  maxRetries?: number;             // Maximum retry attempts
  reconnectDelay?: number;         // Reconnection delay
  keepAlive?: boolean;             // Keep connection alive
  maxConnections?: number;         // Pool max connections
  registers?: RegisterMapping;     // Register configuration
}
```

### RegisterConfig

```typescript
interface RegisterConfig {
  address: number;                 // Register address
  count: number;                   // Number of registers to read
  scale?: number;                  // Scaling factor (default: 1)
  type?: 'holding' | 'input';      // Register type
  dataType?: 'uint16' | 'uint32' | 'float32' | 'int16' | 'int32';
  wordOrder?: 'HI_LO' | 'LO_HI';   // Word order for multi-register values
  byteOrder?: 'BE' | 'LE';         // Byte order
}
```

### ModbusError Types

```typescript
enum ModbusErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  INVALID_REGISTER = 'INVALID_REGISTER',
  DEVICE_BUSY = 'DEVICE_BUSY',
  POOL_EXHAUSTED = 'POOL_EXHAUSTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

## Usage Examples

### Basic Service Usage

```typescript
import modbusService from './services/modbusService.js';

// Test connection
const isConnected = await modbusService.testConnection('192.168.1.100', 502, 1);

// Read meter data with custom registers
const result = await modbusService.readMeterData('192.168.1.100', {
  port: 502,
  unitId: 1,
  registers: {
    voltage: { address: 5, count: 1, scale: 200 },
    current: { address: 6, count: 1, scale: 100 },
    power: { address: 7, count: 1, scale: 1 }
  }
});

// Read input registers
const inputResult = await modbusService.readInputRegisters(
  '192.168.1.100', 
  0, 
  10, 
  { port: 502, unitId: 1 }
);

// Get pool statistics
const stats = modbusService.getPoolStats();
console.log(`Active connections: ${stats.activeConnections}`);
```

### API Endpoints

#### Direct Meter Read

```http
POST /api/direct-meter-read
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "port": 502,
  "slaveId": 1,
  "registers": [
    {
      "address": 5,
      "count": 1,
      "scale": 200,
      "name": "voltage"
    },
    {
      "address": 6,
      "count": 1,
      "scale": 100,
      "name": "current"
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "readings": {
    "voltage": 240.5,
    "current": 12.3
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "deviceInfo": {
    "ip": "192.168.1.100",
    "port": 502,
    "slaveId": 1
  }
}
```

#### Connection Pool Statistics

```http
GET /api/modbus-pool-stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "totalConnections": 5,
    "activeConnections": 2,
    "idleConnections": 3
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Test Connection

```http
POST /api/test-modbus-connection
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "port": 502,
  "slaveId": 1
}
```

## Error Handling

### Error Categories

1. **CONNECTION_FAILED** - Network connection issues
2. **TIMEOUT** - Operation timeout
3. **PROTOCOL_ERROR** - Modbus protocol errors
4. **INVALID_REGISTER** - Invalid register address
5. **DEVICE_BUSY** - Device temporarily unavailable
6. **POOL_EXHAUSTED** - Connection pool at capacity

### Error Response Format

```json
{
  "success": false,
  "error": "Connection failed: ECONNREFUSED",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "deviceInfo": {
    "ip": "192.168.1.100",
    "port": 502,
    "slaveId": 1
  }
}
```

### Handling Errors in Code

```typescript
try {
  const result = await modbusService.readMeterData('192.168.1.100');
} catch (error) {
  if (error instanceof ModbusError) {
    switch (error.type) {
      case ModbusErrorType.CONNECTION_FAILED:
        // Handle connection issues
        break;
      case ModbusErrorType.TIMEOUT:
        // Handle timeouts
        break;
      case ModbusErrorType.PROTOCOL_ERROR:
        // Handle protocol errors
        break;
      default:
        // Handle other errors
    }
  }
}
```

## Connection Pooling

### Benefits

- **Performance**: Reuses existing connections
- **Resource Management**: Automatic cleanup of idle connections
- **Concurrency**: Handles multiple simultaneous requests
- **Reliability**: Health monitoring and automatic recovery

### Pool Configuration

```typescript
const modbusService = new ModbusService({
  maxConnections: 10,        // Maximum concurrent connections
  idleTimeout: 300000,       // 5 minutes idle timeout
  acquireTimeout: 30000,     // 30 seconds acquisition timeout
  createRetryInterval: 5000, // 5 seconds retry interval
  maxRetries: 3,             // Maximum retry attempts
  healthCheckInterval: 60000 // 1 minute health check interval
});
```

### Monitoring Pool Health

```typescript
// Get current pool statistics
const stats = modbusService.getPoolStats();

console.log(`Total connections: ${stats.totalConnections}`);
console.log(`Active connections: ${stats.activeConnections}`);
console.log(`Idle connections: ${stats.idleConnections}`);
```

## Best Practices

### 1. Connection Management

- Use the singleton `modbusService` instance
- Don't create multiple ModbusService instances
- Let the pool manage connections automatically
- Monitor pool statistics for optimization

### 2. Error Handling

- Always handle ModbusError types appropriately
- Implement retry logic for transient errors
- Log errors with sufficient context
- Use circuit breaker pattern for failing devices

### 3. Register Configuration

- Define register mappings in configuration files
- Use appropriate scaling factors
- Validate register addresses before use
- Handle multi-register values correctly

### 4. Performance Optimization

- Configure pool size based on expected load
- Use appropriate timeouts for your network
- Monitor connection pool statistics
- Implement proper error recovery

## Migration from modbus-serial

### Key Changes

1. **Library**: `modbus-serial` → `jsmodbus`
2. **Language**: JavaScript → TypeScript
3. **Architecture**: Direct connections → Connection pooling
4. **Error Handling**: Basic → Comprehensive categorization
5. **Type Safety**: None → Full TypeScript support

### Breaking Changes

- Connection creation is now pooled and managed automatically
- Error objects are now typed ModbusError instances
- Register configuration uses new TypeScript interfaces
- Response formats include additional metadata

### Migration Checklist

- [ ] Update import statements to use new service
- [ ] Replace direct modbus-serial usage with ModbusService
- [ ] Update error handling to use ModbusError types
- [ ] Configure connection pool settings
- [ ] Update register configurations to new format
- [ ] Test all Modbus operations thoroughly

## Troubleshooting

### Common Issues

1. **Connection Pool Exhausted**
   - Increase `maxConnections` setting
   - Check for connection leaks
   - Monitor pool statistics

2. **Frequent Timeouts**
   - Increase `timeout` values
   - Check network connectivity
   - Verify device responsiveness

3. **Protocol Errors**
   - Verify register addresses
   - Check device documentation
   - Validate data types and scaling

4. **Memory Issues**
   - Monitor connection cleanup
   - Check idle timeout settings
   - Review error handling logic

### Debugging

Enable verbose logging:
```bash
LOG_LEVEL=debug
VERBOSE_LOGGING=true
```

Monitor pool statistics:
```typescript
setInterval(() => {
  const stats = modbusService.getPoolStats();
  console.log('Pool Stats:', stats);
}, 60000);
```

## Support

For issues or questions:
1. Check the error logs for detailed information
2. Verify configuration settings
3. Test with simple register reads first
4. Monitor connection pool statistics
5. Review this documentation for best practices
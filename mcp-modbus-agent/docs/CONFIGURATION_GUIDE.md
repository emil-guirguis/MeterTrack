# MCP Modbus Agent Configuration Guide

## Overview

This guide covers configuration options for the enhanced TypeScript MCP Modbus Agent with connection pooling and improved error handling.

## Environment Configuration

### Core Settings

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/facility_management
MONGODB_DATABASE=facility_management
MONGODB_COLLECTION=meter_readings

# Modbus Connection Pool
MODBUS_MAX_CONNECTIONS=20          # Maximum concurrent connections
MODBUS_IDLE_TIMEOUT=300000         # Idle connection timeout (5 minutes)
MODBUS_ACQUIRE_TIMEOUT=30000       # Connection acquisition timeout
MODBUS_CREATE_RETRY_INTERVAL=5000  # Retry interval for connection creation
MODBUS_MAX_RETRIES=3               # Maximum retry attempts
MODBUS_HEALTH_CHECK_INTERVAL=60000 # Health check interval

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

### Data Collection Settings

```bash
# Collection Configuration
COLLECTION_INTERVAL=30000          # Collection interval (30 seconds)
COLLECTION_BATCH_SIZE=10           # Number of devices per batch
COLLECTION_CONCURRENT_LIMIT=5      # Maximum concurrent collections
COLLECTION_RETRY_ATTEMPTS=3        # Retry attempts for failed collections
COLLECTION_RETRY_DELAY=5000        # Delay between retry attempts

# Field Mapping
MODBUS_MAP_FILE=modbus-map.json    # Field mapping configuration file
FIELD_MAPPING_ENABLED=true         # Enable field mapping
FIELD_VALIDATION_ENABLED=true      # Enable field validation
```

### Logging and Monitoring

```bash
# Logging Configuration
LOG_LEVEL=info                     # Log level (debug, info, warn, error)
LOG_FILE=logs/mcp-agent.log        # Log file path
LOG_MAX_SIZE=10485760              # Maximum log file size (10MB)
LOG_MAX_FILES=5                    # Maximum number of log files

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true    # Enable performance monitoring
PERFORMANCE_LOG_INTERVAL=60000         # Performance logging interval
MEMORY_MONITORING_ENABLED=true         # Enable memory monitoring
CONNECTION_MONITORING_ENABLED=true     # Enable connection monitoring
```

## Field Mapping Configuration

### modbus-map.json Structure

```json
{
  "version": "1.0",
  "description": "Modbus register mapping for energy meters",
  "fields": [
    {
      "name": "voltage",
      "address": 5,
      "count": 1,
      "scale": 200,
      "source": "holding",
      "type": "u16",
      "unit": "V",
      "description": "Line voltage"
    },
    {
      "name": "current",
      "address": 6,
      "count": 1,
      "scale": 100,
      "source": "holding",
      "type": "u16",
      "unit": "A",
      "description": "Line current"
    },
    {
      "name": "power",
      "address": 7,
      "count": 1,
      "scale": 1,
      "source": "holding",
      "type": "u16",
      "unit": "W",
      "description": "Active power"
    },
    {
      "name": "energy",
      "address": 40,
      "count": 2,
      "scale": 1,
      "source": "holding",
      "type": "u32",
      "wordOrder": "HI_LO",
      "unit": "Wh",
      "description": "Total active energy"
    },
    {
      "name": "temperature",
      "address": 46,
      "count": 1,
      "scale": 10,
      "source": "holding",
      "type": "i16",
      "unit": "°C",
      "description": "Device temperature"
    }
  ]
}
```

### Field Types

- **u16**: Unsigned 16-bit integer
- **i16**: Signed 16-bit integer  
- **u32**: Unsigned 32-bit integer
- **i32**: Signed 32-bit integer
- **float32**: 32-bit floating point

### Word Order (for multi-register values)

- **HI_LO**: High word first, low word second (default)
- **LO_HI**: Low word first, high word second

### Register Sources

- **holding**: Holding registers (function code 3)
- **input**: Input registers (function code 4)

## Device Configuration

### Device List Format

```json
{
  "devices": [
    {
      "id": "meter-001",
      "name": "Main Location Meter",
      "host": "192.168.1.100",
      "port": 502,
      "unitId": 1,
      "enabled": true,
      "collectionInterval": 30000,
      "timeout": 5000,
      "maxRetries": 3,
      "tags": {
        "building": "main",
        "floor": "1",
        "type": "energy-meter"
      }
    },
    {
      "id": "meter-002", 
      "name": "Secondary Location Meter",
      "host": "192.168.1.101",
      "port": 502,
      "unitId": 1,
      "enabled": true,
      "collectionInterval": 60000,
      "customMapping": "secondary-meter-map.json"
    }
  ]
}
```

## Performance Tuning

### Connection Pool Optimization

```bash
# For high-throughput environments
MODBUS_MAX_CONNECTIONS=50
MODBUS_IDLE_TIMEOUT=600000         # 10 minutes
MODBUS_ACQUIRE_TIMEOUT=15000       # 15 seconds
MODBUS_HEALTH_CHECK_INTERVAL=30000 # 30 seconds

# For resource-constrained environments
MODBUS_MAX_CONNECTIONS=5
MODBUS_IDLE_TIMEOUT=120000         # 2 minutes
MODBUS_ACQUIRE_TIMEOUT=10000       # 10 seconds
```

### Collection Optimization

```bash
# For many devices
COLLECTION_BATCH_SIZE=20
COLLECTION_CONCURRENT_LIMIT=10
COLLECTION_INTERVAL=60000          # 1 minute

# For real-time requirements
COLLECTION_BATCH_SIZE=5
COLLECTION_CONCURRENT_LIMIT=3
COLLECTION_INTERVAL=10000          # 10 seconds
```

### Memory Management

```bash
# Enable memory monitoring
MEMORY_MONITORING_ENABLED=true
PERFORMANCE_LOG_INTERVAL=30000

# Log rotation
LOG_MAX_SIZE=5242880               # 5MB
LOG_MAX_FILES=10
```

## Error Handling Configuration

### Circuit Breaker Settings

```bash
# Aggressive circuit breaking (for unreliable networks)
MODBUS_CIRCUIT_BREAKER_THRESHOLD=3
MODBUS_CIRCUIT_BREAKER_TIMEOUT=30000

# Conservative circuit breaking (for stable networks)
MODBUS_CIRCUIT_BREAKER_THRESHOLD=10
MODBUS_CIRCUIT_BREAKER_TIMEOUT=120000
```

### Retry Configuration

```bash
# Fast retry (for temporary issues)
MODBUS_BASE_RETRY_DELAY=500
MODBUS_MAX_RETRY_DELAY=5000
MODBUS_BACKOFF_MULTIPLIER=1.5

# Slow retry (for persistent issues)
MODBUS_BASE_RETRY_DELAY=2000
MODBUS_MAX_RETRY_DELAY=60000
MODBUS_BACKOFF_MULTIPLIER=3
```

## Monitoring and Diagnostics

### Health Check Endpoints

The MCP agent exposes several monitoring capabilities:

1. **Connection Pool Statistics**
   - Active connections
   - Idle connections
   - Pool utilization

2. **Error Statistics**
   - Error counts by type
   - Error rates by device
   - Circuit breaker states

3. **Performance Metrics**
   - Collection times
   - Memory usage
   - Success rates

### Log Analysis

Key log patterns to monitor:

```bash
# Connection issues
grep "Connection failed" logs/mcp-agent.log

# Circuit breaker events
grep "Circuit breaker" logs/mcp-agent.log

# Performance issues
grep "Collection took" logs/mcp-agent.log

# Memory warnings
grep "Memory usage" logs/mcp-agent.log
```

## Deployment Configurations

### Development Environment

```bash
NODE_ENV=development
LOG_LEVEL=debug
VERBOSE_LOGGING=true
DEBUG_ENABLED=true
PERFORMANCE_MONITORING_ENABLED=true
MODBUS_MAX_CONNECTIONS=5
COLLECTION_INTERVAL=10000
```

### Production Environment

```bash
NODE_ENV=production
LOG_LEVEL=info
VERBOSE_LOGGING=false
DEBUG_ENABLED=false
PERFORMANCE_MONITORING_ENABLED=true
MODBUS_MAX_CONNECTIONS=20
COLLECTION_INTERVAL=30000
LOG_MAX_SIZE=10485760
LOG_MAX_FILES=5
```

### High-Availability Environment

```bash
NODE_ENV=production
LOG_LEVEL=warn
MODBUS_MAX_CONNECTIONS=50
MODBUS_IDLE_TIMEOUT=600000
MODBUS_CIRCUIT_BREAKER_THRESHOLD=5
COLLECTION_CONCURRENT_LIMIT=15
PERFORMANCE_MONITORING_ENABLED=true
CONNECTION_MONITORING_ENABLED=true
```

## Security Considerations

### Network Security

- Use VPN or secure networks for Modbus communication
- Implement firewall rules for Modbus TCP ports
- Monitor for unauthorized connection attempts

### Access Control

- Restrict file system access to configuration files
- Use environment variables for sensitive settings
- Implement proper logging without exposing credentials

### Data Protection

- Encrypt data in transit where possible
- Secure MongoDB connections with authentication
- Implement proper backup and recovery procedures

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check connection pool size
   - Monitor for connection leaks
   - Review collection intervals

2. **Frequent Timeouts**
   - Increase timeout values
   - Check network latency
   - Verify device responsiveness

3. **Circuit Breaker Activation**
   - Check device availability
   - Review error logs
   - Adjust threshold settings

4. **Poor Performance**
   - Optimize collection intervals
   - Reduce concurrent connections
   - Check system resources

### Diagnostic Commands

```bash
# Check agent status
npm run status

# View real-time logs
tail -f logs/mcp-agent.log

# Test Modbus connections
npm run test:modbus

# Check memory usage
npm run memory-check
```

## Migration from Legacy Implementation

### Configuration Changes

1. **Environment Variables**: Update to new naming convention
2. **Field Mapping**: Convert to new JSON format
3. **Connection Settings**: Configure connection pooling
4. **Error Handling**: Update error handling configuration

### Validation Steps

1. Test with existing device configurations
2. Verify data collection accuracy
3. Monitor performance improvements
4. Validate error handling behavior

This configuration guide ensures optimal performance and reliability of the enhanced MCP Modbus Agent.
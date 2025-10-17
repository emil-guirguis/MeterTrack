# ModbusClient Unit Tests

This directory contains comprehensive unit tests for the new ModbusClient implementation using the `node-modbus` library.

## Test Files

### 1. `modbus-client-unit.test.ts`
Tests core ModbusClient functionality including:
- Configuration management and validation
- Error handling and categorization
- Connection pool logic
- Performance metrics calculation
- Retry logic implementation
- Circuit breaker state management
- Data processing and register value parsing
- Utility functions

### 2. `error-handler-unit.test.ts`
Tests the ModbusErrorHandler component:
- Error categorization (connection, timeout, protocol, etc.)
- Retry logic with exponential backoff
- Circuit breaker pattern implementation
- Error statistics tracking
- Event emission for monitoring
- Cleanup and resource management
- Edge cases and concurrent operations

### 3. `connection-pool-unit.test.ts`
Tests connection pool management:
- Pool configuration validation
- Connection statistics tracking
- Connection reuse logic
- Health monitoring
- Request queuing
- Idle connection cleanup
- Utility functions for pool management

## Test Coverage

The tests cover the following key requirements from the specification:

### Requirement 1.1 - 50+ Concurrent Connections
- Connection pool logic for managing multiple connections
- Connection reuse and lifecycle management
- Pool statistics and utilization tracking

### Requirement 1.3 - Automatic Reconnection
- Circuit breaker pattern implementation
- Retry logic with exponential backoff
- Error handling and recovery mechanisms

### Requirement 4.1-4.3 - Connection Management
- Connection pooling functionality
- Idle connection cleanup
- Connection health monitoring

### Requirement 5.1 - Comprehensive Testing
- Unit tests for all core components
- Error handling scenarios
- Performance metrics tracking
- Edge cases and concurrent operations

## Running Tests

```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test -- src/test/modbus-client-unit.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Results

All 55 unit tests pass successfully, covering:
- ✅ 20 ModbusClient core functionality tests
- ✅ 20 Error handler tests
- ✅ 15 Connection pool tests

## Key Features Tested

### Connection Pooling
- Connection reuse based on host:port:unitId
- Pool size limits and queue management
- Connection health monitoring
- Idle connection cleanup

### Error Handling
- Automatic error categorization
- Retry logic with exponential backoff
- Circuit breaker pattern
- Error statistics and monitoring

### Performance Monitoring
- Connection and read time tracking
- Success rate calculation
- Error count accumulation
- Pool utilization metrics

### Data Processing
- Register value parsing (U16, I16, U32, Float32)
- Voltage, current, power calculations
- Field mapping support
- Data validation

The tests ensure that the new `node-modbus` implementation meets all requirements for handling 50+ concurrent connections with improved performance, reliability, and TypeScript support.
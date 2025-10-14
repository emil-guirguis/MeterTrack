# Design Document

## Overview

This design outlines the migration from `modbus-serial` to `node-modbus` library across both the backend API services and the MCP Modbus agent. The migration will be implemented in phases to ensure system stability and backward compatibility.

## Architecture

### Current Architecture
- **Backend**: Uses `modbus-serial` in `modbusService.js` and `directMeter.js` routes
- **MCP Agent**: Uses `modbus-serial` in `modbus-client.ts` for automated data collection
- **Connection Model**: Individual connections per request with basic error handling

### Target Architecture
- **Backend**: Migrated to `node-modbus` with TypeScript interfaces
- **MCP Agent**: Enhanced with `node-modbus` connection pooling and better error handling
- **Connection Model**: Connection pooling with automatic lifecycle management
- **Type Safety**: Full TypeScript support throughout the Modbus layer

## Components and Interfaces

### 1. Enhanced Modbus Client (MCP Agent)
```typescript
interface ModbusClientConfig {
  host: string;
  port: number;
  timeout: number;
  maxConnections: number;
  reconnectDelay: number;
}

interface ModbusConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  readHoldingRegisters(address: number, length: number): Promise<number[]>;
  isConnected(): boolean;
}
```### 
2. Backend Modbus Service
```typescript
interface ModbusServiceInterface {
  testConnection(config: ModbusConfig): Promise<ModbusResult>;
  readMeterData(config: ModbusConfig): Promise<ModbusResult>;
  readRegisters(config: RegisterConfig): Promise<ModbusResult>;
}

interface ConnectionPool {
  getConnection(host: string, port: number): Promise<ModbusConnection>;
  releaseConnection(connection: ModbusConnection): void;
  closeAll(): Promise<void>;
}
```

### 3. Migration Wrapper
A compatibility layer to ensure existing code continues to work during transition:
```typescript
interface MigrationWrapper {
  useNewLibrary: boolean;
  fallbackToOld(error: Error): Promise<any>;
  compareResults(oldResult: any, newResult: any): boolean;
}
```

## Data Models

### Connection Configuration
```typescript
interface ModbusConnectionConfig {
  host: string;
  port: number;
  unitId: number;
  timeout: number;
  maxRetries: number;
  reconnectDelay: number;
}
```

### Register Reading Response
```typescript
interface RegisterReadResponse {
  success: boolean;
  data: number[];
  timestamp: Date;
  connectionInfo: {
    host: string;
    port: number;
    responseTime: number;
  };
  error?: string;
}
```## Er
ror Handling

### Connection Management
- **Automatic Reconnection**: Exponential backoff strategy for failed connections
- **Connection Pooling**: Reuse existing connections when possible
- **Timeout Handling**: Configurable timeouts with graceful degradation
- **Resource Cleanup**: Automatic cleanup of stale connections

### Error Categories
1. **Connection Errors**: Network issues, device unavailable
2. **Protocol Errors**: Invalid register addresses, unsupported function codes
3. **Timeout Errors**: Slow device responses, network latency
4. **Resource Errors**: Connection pool exhaustion, memory issues

### Fallback Strategy
During migration, implement dual-library support:
- Primary: Use `node-modbus` for new connections
- Fallback: Use `modbus-serial` if `node-modbus` fails
- Logging: Track success/failure rates for both libraries

## Testing Strategy

### Unit Testing
- Test connection pooling logic
- Test error handling and reconnection
- Test TypeScript type safety
- Test register reading accuracy

### Integration Testing
- Test with real Modbus devices
- Test concurrent connection handling (50+ connections)
- Test migration compatibility
- Test performance benchmarks

### Performance Testing
- Connection establishment time
- Concurrent read operations
- Memory usage under load
- Connection pool efficiency

### Migration Testing
- Side-by-side comparison of results
- Backward compatibility verification
- Error handling consistency
- Configuration migration validation
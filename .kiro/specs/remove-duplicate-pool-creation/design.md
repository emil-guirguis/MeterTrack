# Design Document: Remove Duplicate Database Pool Creation

## Overview

This refactoring consolidates database pool management by removing duplicate pool creation logic from the Sync MCP Server's main index file. The `connection-manager.ts` module already provides centralized pool initialization and management, so the index file should use these exported pools rather than creating its own.

## Architecture

### Current State (Problematic)
```
connection-manager.ts
  ├─ Exports: remotePool, syncPool, initializePools(), closePools()
  └─ Creates and manages pools

index.ts
  ├─ Imports: remotePool (unused)
  ├─ Creates: createRemoteDatabasePool() [DUPLICATE]
  ├─ Creates: closeRemotePool() [DUPLICATE]
  └─ Manages: this.remotePool (private instance)
```

### Target State (Refactored)
```
connection-manager.ts
  ├─ Exports: remotePool, syncPool, initializePools(), closePools()
  └─ Creates and manages pools

index.ts
  ├─ Imports: remotePool (actively used)
  ├─ Uses: remotePool directly from connection-manager
  └─ Delegates: Pool closure to closePools()
```

## Components and Interfaces

### Connection Manager (Existing)
- **Responsibility**: Centralized database pool management
- **Exports**:
  - `remotePool: Pool` - PostgreSQL connection pool for Client System
  - `syncPool: Pool` - PostgreSQL connection pool for Sync database
  - `initializePools(): void` - Initialize both pools from environment variables
  - `closePools(): Promise<void>` - Close both pools gracefully

### Sync MCP Server (Modified)
- **Changes**:
  - Remove `createRemoteDatabasePool()` method
  - Remove `closeRemotePool()` method
  - Remove `private remotePool?: Pool` instance variable
  - Use imported `remotePool` directly in `initializeServices()`
  - Use `closePools()` in `shutdown()` method
  - Remove unused imports

## Data Models

No changes to data models. The pool configuration remains identical:
```typescript
{
  host: process.env.POSTGRES_CLIENT_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_CLIENT_PORT || '5432', 10),
  database: process.env.POSTGRES_CLIENT_DB || 'postgres',
  user: process.env.POSTGRES_CLIENT_USER || 'postgres',
  password: process.env.POSTGRES_CLIENT_PASSWORD || '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Single Pool Instance
*For any* execution of the Sync MCP Server, the `remotePool` used by the Meter Sync Agent SHALL be the same instance exported from `connection-manager.ts`, ensuring consistent pool management and resource usage.

**Validates: Requirements 1.1, 2.1**

### Property 2: Pool Lifecycle Management
*For any* server startup and shutdown cycle, the remote pool SHALL be initialized during `initializePools()` and closed during `closePools()`, with no orphaned connections remaining after shutdown.

**Validates: Requirements 1.2, 2.2**

### Property 3: Configuration Consistency
*For any* pool initialization, the remote pool configuration (max connections, timeouts, credentials) SHALL match the values defined in `connection-manager.ts` and remain unchanged after refactoring.

**Validates: Requirements 2.3**

## Error Handling

- **Pool Connection Errors**: Already handled by `connection-manager.ts` with error event listeners
- **Pool Closure Errors**: Already handled by `closePools()` with try-catch and logging
- **Initialization Errors**: Existing error handling in `initializeServices()` remains unchanged

## Testing Strategy

### Unit Tests
- Verify that `remotePool` is properly imported and used
- Verify that `createRemoteDatabasePool()` method is removed
- Verify that `closeRemotePool()` method is removed
- Verify that unused imports are cleaned up
- Verify that the Meter Sync Agent receives the correct pool instance

### Property-Based Tests
- **Property 1**: Verify that the same pool instance is used throughout the server lifecycle
- **Property 2**: Verify that pool initialization and closure follow the expected lifecycle
- **Property 3**: Verify that pool configuration remains consistent

### Integration Tests
- Verify that the server starts and initializes services correctly
- Verify that the Meter Sync Agent can use the remote pool
- Verify that the server shuts down gracefully and closes pools


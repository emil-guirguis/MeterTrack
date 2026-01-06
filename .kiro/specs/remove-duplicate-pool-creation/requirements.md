# Requirements Document: Remove Duplicate Database Pool Creation

## Introduction

The Sync MCP Server has duplicated database pool creation logic. The `connection-manager.ts` module already exports a properly initialized `remotePool`, but `index.ts` creates its own `createRemoteDatabasePool()` method instead of using the centralized pool. This duplication creates maintenance issues and inconsistent pool management.

## Glossary

- **Connection Manager**: Module that centralizes database pool initialization and management
- **Remote Pool**: PostgreSQL connection pool for the Client System database
- **Sync Pool**: PostgreSQL connection pool for the local Sync database
- **Pool Initialization**: The process of creating and configuring database connection pools from environment variables

## Requirements

### Requirement 1: Eliminate Duplicate Pool Creation

**User Story:** As a developer, I want to remove duplicate database pool creation logic, so that the codebase has a single source of truth for pool management.

#### Acceptance Criteria

1. WHEN the Sync MCP Server initializes, THE Server SHALL use the `remotePool` exported from `connection-manager.ts` instead of creating its own pool
2. WHEN the Sync MCP Server shuts down, THE Server SHALL properly close the remote pool through the connection manager's `closePools()` function
3. THE `createRemoteDatabasePool()` method in `index.ts` SHALL be removed
4. THE `closeRemotePool()` method in `index.ts` SHALL be removed
5. THE `remotePool` import from `connection-manager.ts` SHALL be actively used in the initialization flow

### Requirement 2: Maintain Existing Functionality

**User Story:** As a system operator, I want the refactored code to maintain all existing functionality, so that the application continues to work correctly.

#### Acceptance Criteria

1. WHEN the Meter Sync Agent is initialized, THE Agent SHALL receive the same remote pool instance as before
2. WHEN the server shuts down, THE Remote pool connection SHALL be properly closed
3. THE Pool configuration (max connections, timeouts, etc.) SHALL remain unchanged
4. THE Error handling for pool operations SHALL remain consistent

### Requirement 3: Clean Up Unused Imports

**User Story:** As a developer, I want unused imports to be removed, so that the code is clean and maintainable.

#### Acceptance Criteria

1. THE `remotePool` import from `connection-manager.ts` in `index.ts` SHALL be actively used (not just imported)
2. UNUSED imports like `syncPool`, `closePools`, `CollectorConfig`, `createSyncManagerFromEnv`, and `ClientSystemApiClient` SHALL be removed if not needed
3. THE TypeScript compiler SHALL report no unused variable warnings for the index file


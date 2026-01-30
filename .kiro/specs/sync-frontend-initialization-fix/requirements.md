# Requirements Document: Sync Frontend Initialization Fix

## Introduction

The sync frontend at http://localhost:3003/sync-status fails to load because the LocalApiServer endpoints depend on a `syncManager` instance that is never created or set. The SyncManager class exists but is not instantiated during initialization, causing API endpoints like `/api/local/sync-status` and `/api/local/sync-trigger` to fail when the frontend tries to fetch sync status data.

## Glossary

- **SyncManager**: Orchestrates synchronization of meter readings from Sync Database to Client System, handles scheduled sync, batching, retry logic, and cleanup
- **LocalApiServer**: HTTP server providing endpoints for the Sync Frontend to query local data and trigger sync operations
- **Sync Frontend**: Web interface at http://localhost:3003/sync-status that displays sync status and allows manual sync triggers
- **API Endpoint**: HTTP endpoint exposed by LocalApiServer (e.g., /api/local/sync-status)
- **Initialization**: Process of creating and starting services during server startup in index.ts

## Requirements

### Requirement 1: Create SyncManager Instance

**User Story:** As a system administrator, I want the SyncManager to be instantiated during initialization, so that sync operations can be managed and monitored.

#### Acceptance Criteria

1. WHEN the Sync MCP Server starts, THE SyncMcpServer SHALL create a SyncManager instance with proper configuration
2. WHEN creating the SyncManager, THE SyncMcpServer SHALL pass the SyncDatabase instance to the SyncManager
3. WHEN creating the SyncManager, THE SyncMcpServer SHALL pass the ClientSystemApiClient instance to the SyncManager
4. WHEN creating the SyncManager, THE SyncMcpServer SHALL configure it with environment variables for sync interval, batch size, and retry settings
5. WHEN the SyncManager is created, THE SyncMcpServer SHALL store it as an instance variable for later use

### Requirement 2: Pass SyncManager to LocalApiServer

**User Story:** As a developer, I want the SyncManager to be passed to the LocalApiServer, so that API endpoints can access sync status and trigger sync operations.

#### Acceptance Criteria

1. WHEN the LocalApiServer is created, THE SyncMcpServer SHALL call setSyncManager on the LocalApiServer instance
2. WHEN setSyncManager is called, THE LocalApiServer SHALL store the SyncManager reference for use in API endpoints
3. WHEN an API endpoint needs sync status, THE LocalApiServer SHALL retrieve it from the stored SyncManager instance
4. WHEN an API endpoint needs to trigger sync, THE LocalApiServer SHALL call methods on the stored SyncManager instance

### Requirement 3: Enable Sync Frontend API Endpoints

**User Story:** As a frontend user, I want the sync status API endpoints to return valid data, so that the sync frontend can display current sync status.

#### Acceptance Criteria

1. WHEN the frontend requests /api/local/sync-status, THE API SHALL return connectivity status from the SyncManager
2. WHEN the frontend requests /api/local/sync-status, THE API SHALL return last sync time from the SyncManager
3. WHEN the frontend requests /api/local/sync-status, THE API SHALL return queue size from the SyncManager
4. WHEN the frontend requests /api/local/sync-trigger, THE API SHALL trigger a manual sync operation via the SyncManager
5. WHEN the frontend requests /api/local/tenant, THE API SHALL return tenant data from the SyncManager

### Requirement 4: Ensure Proper Initialization Order

**User Story:** As a system architect, I want services to be initialized in the correct order, so that all dependencies are available when needed.

#### Acceptance Criteria

1. WHEN services are initialized, THE SyncDatabase SHALL be created before the SyncManager
2. WHEN services are initialized, THE ClientSystemApiClient SHALL be created before the SyncManager
3. WHEN services are initialized, THE SyncManager SHALL be created before the LocalApiServer
4. WHEN services are initialized, THE SyncManager SHALL be passed to the LocalApiServer immediately after LocalApiServer creation
5. WHEN the SyncManager is started, THE LocalApiServer SHALL already have a reference to it

### Requirement 5: Handle Missing SyncManager Gracefully

**User Story:** As a system operator, I want the API to handle missing SyncManager gracefully, so that errors are clear and debugging is easier.

#### Acceptance Criteria

1. IF the SyncManager is not available, THE API endpoints SHALL return a 503 Service Unavailable status
2. IF the SyncManager is not available, THE API endpoints SHALL return a descriptive error message
3. WHEN the SyncManager is not yet initialized, THE /api/local/tenant endpoint SHALL return a 503 status with "initializing" status
4. WHEN the SyncManager is not available, THE /api/local/sync-trigger endpoint SHALL return a 503 status with appropriate error message
5. WHEN the SyncManager is not available, THE /api/local/sync-status endpoint SHALL return a 503 status with appropriate error message

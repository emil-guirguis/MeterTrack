# Requirements: Meter Sync Tenant ID Configuration Fix

## Introduction

The MeterSyncAgent fails with "Tenant ID not configured" error when `triggerSync()` is called directly from the API endpoint without first calling `start()`. The issue is that `tenant_id` is only initialized in the `start()` method, but the API endpoint calls `triggerSync()` directly, bypassing initialization. We need to ensure tenant_id is properly configured before any sync operation.

## Glossary

- **MeterSyncAgent**: Service that synchronizes meter configurations from remote database to local sync database
- **Tenant ID**: Unique identifier for the organization/site, required to filter meters during sync
- **SyncDatabase**: Local database interface providing access to sync data
- **Remote Database**: Client system database containing source meter data
- **Sync Operation**: Process of comparing remote and local meters and updating local database

## Requirements

### Requirement 1: Initialize Tenant ID on Demand

**User Story:** As a sync service, I want tenant_id to be automatically initialized when needed, so that sync operations work whether called from scheduled jobs or API endpoints.

#### Acceptance Criteria

1. WHEN triggerSync() is called, THE MeterSyncAgent SHALL initialize tenant_id if not already set
2. WHEN tenant_id is initialized, THE MeterSyncAgent SHALL retrieve it from the SyncDatabase
3. WHEN tenant_id is successfully retrieved, THE MeterSyncAgent SHALL store it for future use
4. WHEN tenant_id cannot be retrieved, THE MeterSyncAgent SHALL throw a descriptive error

### Requirement 2: Handle Missing Tenant Configuration

**User Story:** As a system operator, I want clear error messages when tenant is not configured, so that I can understand what needs to be fixed.

#### Acceptance Criteria

1. WHEN no tenant exists in the sync database, THE MeterSyncAgent SHALL throw an error with message "No tenant configured in sync database"
2. WHEN tenant exists but has no tenant_id, THE MeterSyncAgent SHALL throw an error with message "Tenant ID not found in database"
3. WHEN an error occurs retrieving tenant, THE MeterSyncAgent SHALL include the underlying error details in the message

### Requirement 3: Prevent Redundant Tenant Queries

**User Story:** As a performance-conscious system, I want to avoid querying the tenant repeatedly, so that sync operations are efficient.

#### Acceptance Criteria

1. WHEN tenant_id is already initialized, THE MeterSyncAgent SHALL not query the database again
2. WHEN tenant_id is initialized, THE MeterSyncAgent SHALL cache it for the lifetime of the agent instance
3. WHEN a sync operation completes, THE MeterSyncAgent SHALL retain the cached tenant_id for subsequent operations

### Requirement 4: Support Both Scheduled and Manual Sync

**User Story:** As a sync system, I want both scheduled and manual sync operations to work correctly, so that users have flexibility in triggering syncs.

#### Acceptance Criteria

1. WHEN start() is called, THE MeterSyncAgent SHALL initialize tenant_id and schedule automatic syncs
2. WHEN triggerSync() is called directly, THE MeterSyncAgent SHALL initialize tenant_id if needed before performing sync
3. WHEN both start() and triggerSync() are used, THE MeterSyncAgent SHALL use the same tenant_id for consistency

# Requirements Document: Meter Sync Agent

## Introduction

The Meter Sync Agent is a scheduled service that synchronizes meter data from the remote Client System database to the local Sync database. The remote database is treated as the master source of truth, and the local database is kept in sync through periodic insert, update, and delete operations. The agent runs automatically every hour and can be manually triggered from the Sync Status page UI.

## Glossary

- **Sync MCP Server**: The local Model Context Protocol server that manages meter collection and synchronization operations
- **Sync Database**: The local PostgreSQL database that stores meters and meter readings
- **Client System**: The remote system that contains the master meter data
- **Meter**: A device that measures energy consumption or other metrics
- **External ID**: A unique identifier for a meter in the Client System
- **Master Data**: The authoritative source of meter information (Client System database)

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want meters to be automatically synchronized from the Client System to the local Sync database, so that the local system always has current meter configuration.

#### Acceptance Criteria

1. WHEN the meter sync agent starts THEN the system SHALL establish a connection to the Client System database and retrieve all meters
2. WHEN meters exist in the Client System THEN the system SHALL insert new meters into the local database that don't already exist
3. WHEN meters are updated in the Client System THEN the system SHALL update the corresponding local meter records with new values
4. WHEN meters are deleted in the Client System THEN the system SHALL mark the corresponding local meters as inactive
5. WHEN the sync operation completes THEN the system SHALL log the operation with counts of inserted, updated, and deleted meters

### Requirement 2

**User Story:** As a system administrator, I want the meter sync to run automatically on a schedule, so that the local database stays current without manual intervention.

#### Acceptance Criteria

1. WHEN the Sync MCP Server starts THEN the system SHALL schedule the meter sync agent to run every hour
2. WHILE the Sync MCP Server is running THEN the system SHALL execute the meter sync operation at the scheduled interval
3. WHEN a sync operation is in progress THEN the system SHALL prevent concurrent sync operations from starting
4. WHEN a sync operation fails THEN the system SHALL log the error and retry at the next scheduled interval

### Requirement 3

**User Story:** As a system administrator, I want to manually trigger a meter sync from the UI, so that I can immediately update meters without waiting for the scheduled interval.

#### Acceptance Criteria

1. WHEN the Sync Status page loads THEN the system SHALL display a button to manually trigger meter sync
2. WHEN the user clicks the meter sync button THEN the system SHALL trigger an immediate meter sync operation
3. WHEN a meter sync is already in progress THEN the system SHALL disable the button and show a loading state
4. WHEN the meter sync completes THEN the system SHALL update the UI with the operation results (inserted, updated, deleted counts)
5. WHEN a meter sync fails THEN the system SHALL display an error message to the user

### Requirement 4

**User Story:** As a system administrator, I want to see the status of meter synchronization, so that I can monitor the health of the meter sync process.

#### Acceptance Criteria

1. WHEN the Sync Status page loads THEN the system SHALL display the last meter sync timestamp
2. WHEN the Sync Status page loads THEN the system SHALL display the count of meters in the local database
3. WHEN a meter sync operation completes THEN the system SHALL display the counts of inserted, updated, and deleted meters
4. WHEN a meter sync operation fails THEN the system SHALL display the error message and timestamp of the failure

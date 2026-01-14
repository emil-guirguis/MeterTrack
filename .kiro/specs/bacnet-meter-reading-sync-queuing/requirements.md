# Requirements Document: BACnet Meter Reading Sync Queuing

## Introduction

When BACnet meter readings are being collected, the remote-to-local database synchronization should be queued and delayed until the meter reading collection cycle completes. This prevents sync operations from interfering with active meter data collection and ensures data consistency.

## Glossary

- **BACnet_Meter_Reading_Agent**: Service that collects meter readings from BACnet devices on a scheduled interval
- **Remote_To_Local_Sync_Agent**: Service that synchronizes configuration data from the remote Client System database to the local Sync database
- **Collection_Cycle**: A single execution of the BACnet meter reading collection process
- **Sync_Operation**: A single execution of the remote-to-local synchronization process
- **Queued_Sync**: A sync operation that has been scheduled but is waiting for meter collection to complete

## Requirements

### Requirement 1: Detect Active Meter Collection

**User Story:** As a system operator, I want the sync service to detect when meter readings are being collected, so that sync operations don't interfere with active data collection.

#### Acceptance Criteria

1. WHEN the BACnet Meter Reading Agent is executing a collection cycle, THE Remote_To_Local_Sync_Agent SHALL detect that a cycle is in progress
2. WHEN a collection cycle completes, THE Remote_To_Local_Sync_Agent SHALL detect that no cycle is currently executing
3. THE Remote_To_Local_Sync_Agent SHALL query the BACnet_Meter_Reading_Agent status to determine if a cycle is active

### Requirement 2: Skip Sync During Active Collection

**User Story:** As a system operator, I want sync operations to be skipped when meter collection is active, so that meter readings are not interrupted.

#### Acceptance Criteria

1. WHEN a scheduled sync operation is triggered AND a collection cycle is in progress, THE Remote_To_Local_Sync_Agent SHALL skip the sync operation and not execute it
2. WHEN a sync operation is skipped, THE Remote_To_Local_Sync_Agent SHALL log the skip action with the reason "meter collection in progress"
3. WHEN a sync operation is skipped, THE Remote_To_Local_Sync_Agent SHALL include the skip timestamp and collection cycle status in the log entry
4. THE Remote_To_Local_Sync_Agent SHALL not queue or retry skipped sync operations

### Requirement 3: Manual Sync Respects Collection Status

**User Story:** As a system operator, I want manual sync triggers to also respect the meter collection status, so that the system behaves consistently.

#### Acceptance Criteria

1. WHEN a manual sync is triggered AND a collection cycle is in progress, THE Remote_To_Local_Sync_Agent SHALL skip the sync operation and log the skip
2. WHEN a manual sync is triggered AND no collection cycle is in progress, THE Remote_To_Local_Sync_Agent SHALL execute the sync immediately
3. WHEN a manual sync is skipped, THE Remote_To_Local_Sync_Agent SHALL return a response indicating the sync was skipped with the reason

### Requirement 4: Status Reporting

**User Story:** As a system operator, I want to see the current sync status including whether syncs are being skipped, so that I can understand the system behavior.

#### Acceptance Criteria

1. THE Remote_To_Local_Sync_Agent status response SHALL include a field indicating if the last sync was skipped
2. THE Remote_To_Local_Sync_Agent status response SHALL include the reason the last sync was skipped (if applicable)
3. THE Remote_To_Local_Sync_Agent status response SHALL include the timestamp of the last sync attempt (whether executed or skipped)


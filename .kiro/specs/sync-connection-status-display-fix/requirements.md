# Requirements: Sync Connection Status Display Fix

## Introduction

The Sync Frontend displays a "System Connection" card that shows whether the Client System is connected or disconnected. Currently, the card shows "Disconnected" even when the system is actually connected and functioning properly. This causes confusion for users and makes it difficult to understand the actual state of the system.

## Glossary

- **Sync Manager**: Backend service that orchestrates synchronization of meter readings from the Sync Database to the Client System
- **Connectivity Monitor**: Component that monitors Client System connectivity and provides status updates
- **Client System**: The centralized system that receives meter readings from the Sync system
- **Connection Status**: Boolean flag indicating whether the Client System is reachable and responding
- **Frontend**: React-based UI that displays sync status to users
- **Backend API**: Express server that provides endpoints for the frontend to query sync status

## Requirements

### Requirement 1: Accurate Connection Status Reporting

**User Story:** As a sync system operator, I want the connection status card to accurately reflect whether the Client System is connected, so that I can understand the current state of the system.

#### Acceptance Criteria

1. WHEN the Client System is reachable and responding to health checks, THE Sync Manager SHALL report `isClientConnected: true`
2. WHEN the Client System is unreachable or not responding, THE Sync Manager SHALL report `isClientConnected: false`
3. WHEN the frontend fetches sync status, THE API SHALL return the current connection status from the Sync Manager
4. WHEN the connection status changes, THE frontend card SHALL update to reflect the new status within 5 seconds
5. WHEN the system is connected, THE "Connected" chip SHALL display with a green success color
6. WHEN the system is disconnected, THE "Disconnected" chip SHALL display with a red error color

### Requirement 2: Connectivity Monitoring Initialization

**User Story:** As a system administrator, I want the connectivity monitor to properly initialize and start checking connection status, so that the system accurately tracks connectivity from startup.

#### Acceptance Criteria

1. WHEN the Sync Manager starts, THE Connectivity Monitor SHALL immediately perform an initial connection check
2. WHEN the initial check completes, THE Sync Manager status SHALL be updated with the result
3. WHEN the Connectivity Monitor is running, THE connection status SHALL be checked at regular intervals (default 60 seconds)
4. WHEN a connection check succeeds, THE `isClientConnected` flag SHALL be set to `true`
5. WHEN a connection check fails, THE `isClientConnected` flag SHALL be set to `false`

### Requirement 3: Connection Status Persistence

**User Story:** As a system operator, I want the connection status to persist across API calls, so that the frontend always gets the current state.

#### Acceptance Criteria

1. WHEN the Sync Manager's `getStatus()` method is called, THE returned status object SHALL include the current `isClientConnected` value
2. WHEN the API endpoint `/api/local/sync-status` is called, THE response SHALL include the `is_connected` field from the Sync Manager
3. WHEN the connection status changes, THE next API call SHALL return the updated status
4. WHEN multiple API calls are made in quick succession, THE status SHALL remain consistent

### Requirement 4: Connectivity Monitor State Tracking

**User Story:** As a developer, I want the Connectivity Monitor to properly track and report its connection state, so that the system accurately reflects connectivity changes.

#### Acceptance Criteria

1. WHEN the Connectivity Monitor performs a successful connection check, THE internal `status.isConnected` field SHALL be set to `true`
2. WHEN the Connectivity Monitor performs a failed connection check, THE internal `status.isConnected` field SHALL be set to `false`
3. WHEN the `isConnected()` method is called, THE method SHALL return the current connection state
4. WHEN the `getStatus()` method is called, THE returned status object SHALL include the current `isConnected` value
5. WHEN a state change occurs (connected → disconnected or vice versa), THE monitor SHALL emit appropriate events


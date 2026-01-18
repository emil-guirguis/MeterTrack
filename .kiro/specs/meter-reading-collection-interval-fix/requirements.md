# Requirements Document: Meter Reading Collection Interval Fix

## Introduction

The meter reading collection system is currently collecting readings every 1 minute instead of the intended 10-minute interval. This causes excessive database load and unnecessary API calls. The issue stems from an incorrect environment variable configuration in the Sync MCP system.

## Glossary

- **Collection Interval**: The time between successive meter reading collection cycles from BACnet devices
- **BACnet Agent**: The service that collects meter readings from BACnet devices
- **Sync MCP**: The Model Context Protocol server that manages meter data synchronization
- **Environment Variable**: Configuration value loaded from `.env` file at application startup
- **Cron Expression**: A scheduling format that defines when tasks execute (e.g., `*/60 * * * * *` means every 60 seconds)

## Requirements

### Requirement 1: Use Scheduling Constants for Collection Interval

**User Story:** As a system administrator, I want meter readings to be collected every 10 minutes using centralized scheduling constants, so that the system operates with the intended performance characteristics and the configuration is maintainable.

#### Acceptance Criteria

1. WHEN the Sync MCP system starts, THE BACnet agent SHALL use the `getBACnetCollectionIntervalSeconds()` function from `scheduling-constants.ts`
2. WHEN `getBACnetCollectionIntervalSeconds()` is called, THE system SHALL return 600 seconds (10 minutes) as the default value
3. WHEN a collection cycle completes, THE next collection cycle SHALL not start until at least 600 seconds have elapsed
4. WHEN the `COLLECTION_INTERVAL_SECONDS` environment variable is not set, THE system SHALL use the default 600 seconds from the constant
5. WHEN the `COLLECTION_INTERVAL_SECONDS` environment variable is set in `.env`, THE system SHALL use that value to override the default

### Requirement 2: Comment Out Override in Environment File

**User Story:** As a developer, I want the `.env` file to not override the scheduling constants, so that the system uses the centralized configuration by default.

#### Acceptance Criteria

1. WHEN the `.env` file is loaded, THE `COLLECTION_INTERVAL_SECONDS=60` line SHALL be commented out
2. WHEN `COLLECTION_INTERVAL_SECONDS` is commented out in `.env`, THE system SHALL use the default 600 seconds from `scheduling-constants.ts`
3. WHEN a developer needs to override the interval, THEY can uncomment and modify the `COLLECTION_INTERVAL_SECONDS` line in `.env`

### Requirement 3: Verify Collection Interval in Logs

**User Story:** As a developer, I want to see the configured collection interval in the system logs, so that I can verify the system is using the correct timing.

#### Acceptance Criteria

1. WHEN the BACnet agent starts, THE system SHALL log the collection interval in seconds
2. WHEN the collection interval is logged, THE message SHALL clearly state the interval value (e.g., "Scheduling collection cycles every 600 seconds")
3. WHEN a collection cycle executes, THE system SHALL log the cycle execution with a timestamp

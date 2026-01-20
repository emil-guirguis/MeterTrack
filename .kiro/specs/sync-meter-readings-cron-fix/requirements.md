# Requirements Document: Sync Meter Readings Cron Expression Fix

## Introduction

The sync meter readings are currently reading every minute instead of respecting the cron expression defined in the sync constant file. The issue is in the SyncManager class which hardcodes a cron expression instead of using the centralized scheduling constants.

## Glossary

- **SyncManager**: Service that orchestrates synchronization of meter readings from Sync Database to Client System
- **Cron Expression**: A string that defines when a scheduled task should run (e.g., `*/15 * * * *` for every 15 minutes)
- **Scheduling Constants**: Centralized configuration file (`scheduling-constants.ts`) that defines all cron expressions
- **CRON_SYNC_TO_REMOTE**: The constant that defines the upload interval (default: every 15 minutes)

## Requirements

### Requirement 1: Use Centralized Cron Expression

**User Story:** As a developer, I want the SyncManager to use the centralized cron expression from scheduling-constants, so that all scheduling is consistent and configurable in one place.

#### Acceptance Criteria

1. WHEN the SyncManager starts, THE SyncManager SHALL use the cron expression from `CRON_SYNC_TO_REMOTE` constant instead of hardcoding it
2. WHEN the environment variable `BACNET_UPLOAD_CRON` is set, THE SyncManager SHALL use the value from `getBACnetUploadCronExpression()` function
3. WHEN the SyncManager is initialized with a `syncIntervalMinutes` parameter, THE SyncManager SHALL convert it to a cron expression using the scheduling constants utility functions
4. WHEN the SyncManager starts, THE console log SHALL display the actual cron expression being used for scheduling

### Requirement 2: Maintain Backward Compatibility

**User Story:** As a system operator, I want existing configurations to continue working, so that I don't need to update environment variables.

#### Acceptance Criteria

1. WHEN the `syncIntervalMinutes` parameter is provided to SyncManager, THE system SHALL still support it for backward compatibility
2. WHEN no cron expression is explicitly provided, THE system SHALL fall back to the default `CRON_SYNC_TO_REMOTE` constant (every 15 minutes)
3. WHEN environment variables are set, THE system SHALL respect them in the correct precedence order


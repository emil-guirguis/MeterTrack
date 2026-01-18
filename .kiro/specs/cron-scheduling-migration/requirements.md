# Requirements: Cron Scheduling Migration

## Introduction

The sync MCP server scheduling system has been partially migrated from minute-based intervals to cron expressions. However, the migration is incomplete with undefined functions, type mismatches, and inconsistent usage patterns. This spec defines requirements to complete the migration and ensure cron expressions are properly integrated throughout the system.

## Glossary

- **Cron Expression**: A string in the format `minute hour day month day-of-week` that defines when a scheduled task should run (e.g., `*/15 * * * *` means every 15 minutes)
- **Collection Cycle**: The process of reading meter data from BACnet devices
- **Upload Cycle**: The process of uploading collected meter readings to the remote Client System API
- **Remote Sync Cycle**: The process of downloading meter and tenant configuration from remote to local database
- **Scheduling Constants**: Centralized definitions of cron expressions and helper functions in `scheduling-constants.ts`
- **BACnet Agent**: The `BACnetMeterReadingAgent` that orchestrates collection and upload cycles
- **Upload Manager**: The `MeterReadingUploadManager` that handles uploading readings to the remote API

## Requirements

### Requirement 1: Define Scheduling Configuration Functions

**User Story:** As a developer, I want centralized functions to retrieve scheduling configuration from environment variables, so that I can easily override default cron expressions without modifying code.

#### Acceptance Criteria

1. WHEN the application initializes, THE system SHALL provide a function `getBACnetCollectionIntervalSeconds()` that returns the collection interval in seconds
2. WHEN the application initializes, THE system SHALL provide a function `getBACnetUploadCronExpression()` that returns the upload cron expression as a string
3. WHEN the application initializes, THE system SHALL provide a function `getRemoteToLocalSyncCronExpression()` that returns the remote sync cron expression as a string
4. WHEN an environment variable `BACNET_COLLECTION_INTERVAL_SECONDS` is set, THE system SHALL use that value instead of the default
5. WHEN an environment variable `BACNET_UPLOAD_CRON` is set, THE system SHALL use that cron expression instead of the default
6. WHEN an environment variable `REMOTE_TO_LOCAL_SYNC_CRON` is set, THE system SHALL use that cron expression instead of the default
7. WHEN no environment variable is set, THE system SHALL fall back to the default values defined in `scheduling-constants.ts`

### Requirement 2: Fix Type Consistency for Upload Interval

**User Story:** As a developer, I want clear type definitions for scheduling configuration, so that I can understand what format each field expects and avoid runtime errors.

#### Acceptance Criteria

1. THE `BACnetMeterReadingAgentConfig` type SHALL have a field `uploadCronExpression?: string` for the upload schedule
2. THE `BACnetMeterReadingAgentConfig` type SHALL have a field `collectionIntervalSeconds?: number` for the collection interval
3. THE `MeterReadingUploadManagerConfig` type SHALL NOT include `uploadIntervalMinutes` since scheduling is managed by the agent
4. WHEN the `BACnetMeterReadingAgent` is initialized, THE upload cron expression SHALL be passed as a string, not a number
5. WHEN the `MeterReadingUploadManager` is initialized, THE configuration SHALL NOT include interval information (scheduling is external)

### Requirement 3: Update BACnet Agent to Use Cron Expressions

**User Story:** As a developer, I want the BACnet agent to properly use cron expressions for scheduling, so that all scheduling is consistent and configurable.

#### Acceptance Criteria

1. WHEN the `BACnetMeterReadingAgent` starts, THE upload cycle SHALL be scheduled using the cron expression from configuration
2. WHEN the `BACnetMeterReadingAgent` starts, THE collection cycle SHALL use the interval in seconds from configuration
3. WHEN the agent logs scheduling information, THE log message SHALL reference the cron expression or interval value (not the old minute-based format)
4. WHEN the agent is stopped, ALL scheduled cron jobs SHALL be properly cancelled

### Requirement 4: Remove Unused Interval Configuration from Upload Manager

**User Story:** As a developer, I want the upload manager to focus only on uploading data, so that scheduling concerns are separated and managed by the agent.

#### Acceptance Criteria

1. THE `MeterReadingUploadManager` SHALL NOT accept `uploadIntervalMinutes` in its configuration
2. THE `MeterReadingUploadManager` SHALL NOT attempt to schedule its own upload cycles
3. WHEN the upload manager is initialized, THE configuration SHALL only include database, API client, batch size, and retry settings
4. WHEN the upload manager's `performUpload()` method is called, IT SHALL execute the upload without checking any interval

### Requirement 5: Update Index.ts to Properly Initialize Agents

**User Story:** As a developer, I want the main server initialization to properly configure all agents with correct scheduling parameters, so that the system starts correctly without undefined function errors.

#### Acceptance Criteria

1. WHEN the sync MCP server initializes, THE `BACnetMeterReadingAgent` SHALL be created with the result of `getBACnetCollectionIntervalSeconds()`
2. WHEN the sync MCP server initializes, THE `BACnetMeterReadingAgent` SHALL be created with the result of `getBACnetUploadCronExpression()`
3. WHEN the sync MCP server initializes, THE `RemoteToLocalSyncAgent` SHALL be created with the result of `getRemoteToLocalSyncCronExpression()`
4. WHEN the sync MCP server initializes, ALL function calls SHALL be defined and return valid values (no undefined functions)

### Requirement 6: Maintain Backward Compatibility

**User Story:** As an operator, I want the system to continue working with existing environment variable names, so that I don't have to update all my deployment configurations.

#### Acceptance Criteria

1. WHERE the old environment variable `BACNET_COLLECTION_INTERVAL_SECONDS` is set, THE system SHALL use that value
2. WHERE the old environment variable `UPLOAD_INTERVAL_MINUTES` is set, THE system SHALL convert it to a cron expression (e.g., 5 minutes → `*/5 * * * *`)
3. WHERE both old and new environment variables are set, THE new cron expression variables SHALL take precedence
4. WHEN the system starts, IT SHALL log which scheduling configuration source is being used (default, old env var, or new cron env var)

### Requirement 7: Document Scheduling Configuration

**User Story:** As a developer, I want clear documentation about how to configure scheduling, so that I can understand the available options and defaults.

#### Acceptance Criteria

1. THE `scheduling-constants.ts` file SHALL include comments documenting each cron expression and its default value
2. THE configuration functions SHALL include JSDoc comments explaining parameters and return values
3. THE `.env.example` file SHALL include examples of all scheduling-related environment variables
4. THE documentation SHALL explain the cron expression format and provide examples of common intervals

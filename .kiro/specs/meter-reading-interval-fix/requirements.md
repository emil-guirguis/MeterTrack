# Requirements Document: Meter Reading Collection Interval Fix

## Introduction

The meter reading collection system is configured to collect readings every 2 minutes, but actual operational data shows collections are occurring every 6 minutes instead. This discrepancy suggests either a cron scheduling issue, cycle execution overlap prevention, or environment variable override. This spec defines requirements for investigating the root cause and implementing a fix to ensure the configured interval is actually achieved.

## Glossary

- **Collection Cycle**: A complete execution of the meter reading collection process that queries BACnet devices and stores readings
- **Cron Expression**: A scheduling pattern (e.g., `*/2 * * * *`) that defines when jobs should execute
- **Cycle Execution Guard**: The `isCycleExecuting` flag that prevents overlapping collection cycles
- **Configured Interval**: The intended collection frequency (2 minutes) as defined in `CRON_METER_READ`
- **Actual Interval**: The observed collection frequency in production (6 minutes)
- **Cycle Duration**: The time taken for a single collection cycle to complete from start to finish
- **Skipped Cycle**: A scheduled collection that does not execute because the previous cycle is still running
- **BACnetMeterReadingAgent**: The main agent class that schedules and executes collection cycles
- **Node-cron**: The npm library used for scheduling cron jobs

## Requirements

### Requirement 1: Investigate Root Cause of Interval Discrepancy

**User Story:** As a system operator, I want to understand why the meter reading collection is running every 6 minutes instead of the configured 2 minutes, so that I can identify and fix the underlying issue.

#### Acceptance Criteria

1. WHEN the system starts, THE BACnetMeterReadingAgent SHALL log the configured cron expression and collection interval
2. WHEN a cron job is triggered, THE system SHALL log the trigger event with a timestamp
3. WHEN a collection cycle begins, THE system SHALL log the start time and cycle number
4. WHEN a collection cycle completes, THE system SHALL log the end time, duration, and number of readings collected
5. WHEN a collection cycle is skipped due to the execution guard, THE system SHALL log a warning indicating the skip reason
6. WHEN the system is running, THE operator SHALL be able to determine if the issue is caused by: cycle duration exceeding the interval, multiple agent instances, node-cron behavior, or environment variable overrides

### Requirement 2: Add Comprehensive Logging for Interval Tracking

**User Story:** As a developer, I want detailed logging of cron triggers and cycle execution, so that I can diagnose scheduling issues and verify the fix.

#### Acceptance Criteria

1. WHEN a cron job is triggered, THE system SHALL log: trigger timestamp, cron expression, and whether a cycle will execute
2. WHEN a collection cycle starts, THE system SHALL log: cycle start time, cycle number, and expected next trigger time
3. WHEN a collection cycle ends, THE system SHALL log: cycle end time, total duration in milliseconds, readings collected, and errors encountered
4. WHEN a cycle is skipped, THE system SHALL log: skip timestamp, reason (cycle still executing), and duration of the executing cycle
5. WHEN the agent starts, THE system SHALL log all configuration values including cron expression and collection interval
6. THE logging output SHALL be structured to allow easy parsing and analysis of collection intervals

### Requirement 3: Implement Interval Verification

**User Story:** As a system operator, I want to verify that the actual collection interval matches the configured interval, so that I can confirm the fix is working.

#### Acceptance Criteria

1. WHEN collection cycles complete, THE system SHALL track the time between consecutive cycle starts
2. WHEN the system is running, THE operator SHALL be able to query the actual collection interval (average time between cycles)
3. WHEN the actual interval is measured, THE system SHALL compare it against the configured interval
4. IF the actual interval deviates from the configured interval by more than ±10 seconds, THEN the system SHALL log a warning
5. THE system SHALL provide metrics showing: configured interval, actual interval, number of cycles executed, and number of skipped cycles

### Requirement 4: Fix Cycle Overlap Prevention Logic

**User Story:** As a system architect, I want to ensure that cycle overlap prevention doesn't cause unexpected skips, so that collections happen at the configured interval.

#### Acceptance Criteria

1. WHEN a collection cycle is triggered by cron, THE system SHALL check if a previous cycle is still executing
2. IF a previous cycle is still executing, THEN the system SHALL skip the current trigger and log the skip
3. IF the cycle duration consistently exceeds the configured interval, THEN the system SHALL log a warning about potential interval misses
4. THE system SHALL provide a way to detect if cycles are being skipped due to long execution times
5. WHERE a fix is needed, THE system SHALL implement a solution that ensures collections happen at the configured interval (either by: adjusting the interval, implementing queuing, or running cycles in parallel)

### Requirement 5: Detect and Report Environment Variable Overrides

**User Story:** As a system operator, I want to know if environment variables are overriding the configured collection interval, so that I can verify the actual configuration.

#### Acceptance Criteria

1. WHEN the agent starts, THE system SHALL check for environment variable overrides (BACNET_COLLECTION_INTERVAL_SECONDS, BACNET_UPLOAD_CRON, etc.)
2. IF environment variables are set, THEN the system SHALL log which variables are overriding defaults and their values
3. WHEN the agent starts, THE system SHALL log the final resolved cron expression and interval (after applying any overrides)
4. THE system SHALL make it clear whether the configured interval comes from code constants or environment variables

## Notes

- The issue manifests as 6-minute intervals instead of 2-minute intervals, suggesting either 3 skipped cycles per execution or a 3x multiplier somewhere
- The `isCycleExecuting` guard is necessary to prevent overlapping cycles, but may be causing skips if cycles take longer than the interval
- Environment variables like `BACNET_COLLECTION_INTERVAL_SECONDS` can override the cron expression
- The node-cron library behavior should be verified to ensure it's scheduling correctly

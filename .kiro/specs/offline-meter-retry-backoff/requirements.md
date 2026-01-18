# Requirements Document: Offline Meter Retry Backoff

## Introduction

The BACnet meter reading system needs to add a 5-minute pause between retries when a meter is offline, and ensure both collection and upload agents run concurrently without blocking each other.

## Glossary

- **BACnet_Meter**: A physical or virtual meter device communicating via BACnet protocol
- **Collection_Cycle**: A scheduled execution of meter reading collection from all BACnet devices
- **Offline_Meter**: A meter that fails to respond to read requests due to connectivity issues
- **Meter_Reading_Agent**: The BACnetMeterReadingAgent service that orchestrates collection cycles
- **Upload_Manager**: The MeterReadingUploadManager service that uploads readings to Client System

## Requirements

### Requirement 1: 5-Minute Backoff Between Offline Meter Retries

**User Story:** As a system operator, I want offline meters to pause for 5 minutes before retry, so that the meter has time to come back online.

#### Acceptance Criteria

1. WHEN a meter read fails due to offline status, THE Collection_Cycle SHALL skip that meter for 5 minutes
2. WHEN 5 minutes have passed, THE Collection_Cycle SHALL attempt to read the meter again
3. IF the meter is still offline, THE Collection_Cycle SHALL apply another 5-minute backoff
4. WHILE a meter is in backoff, THE Collection_Cycle SHALL continue processing other meters normally

### Requirement 2: Concurrent Agent Execution

**User Story:** As a system operator, I want collection and upload to run at the same time, so that readings are collected and uploaded independently.

#### Acceptance Criteria

1. THE Collection_Cycle SHALL run on its own schedule (every 15 minutes by default)
2. THE Upload_Manager SHALL run on its own schedule (every 5 minutes by default)
3. WHEN Collection_Cycle is executing, THE Upload_Manager SHALL continue running independently
4. WHEN Upload_Manager is executing, THE Collection_Cycle SHALL continue running independently


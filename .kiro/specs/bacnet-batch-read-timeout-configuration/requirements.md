# Requirements: BACnet Batch Read Timeout Configuration Fix

## Introduction

The BACnet meter reading system is experiencing persistent timeouts during batch reads. Meters are timing out after 33 seconds despite being configured for 5-second batch read timeouts. The issue stems from incorrect timeout parameter usage in the collection cycle manager, where the sequential read timeout (3 seconds) is being applied to batch reads instead of the batch-specific timeout (5 seconds).

## Glossary

- **Batch Read**: Reading multiple registers from a BACnet device in a single request
- **Sequential Read**: Reading registers one at a time as a fallback when batch reads fail
- **Timeout**: Maximum time allowed for a read operation before it's considered failed
- **Collection Cycle**: The complete process of reading all meters and their registers
- **Adaptive Batch Sizing**: Dynamic adjustment of batch size based on timeout events

## Requirements

### Requirement 1: Correct Timeout Parameter Usage

**User Story:** As a system operator, I want batch reads to use the correct timeout configuration, so that meters don't experience unnecessary timeouts.

#### Acceptance Criteria

1. WHEN a batch read is initiated, THE Collection_Cycle_Manager SHALL pass the batchReadTimeoutMs parameter to the batch read operation
2. WHEN a sequential fallback read is initiated, THE Collection_Cycle_Manager SHALL pass the sequentialReadTimeoutMs parameter to the sequential read operation
3. WHEN a batch read times out after the configured batchReadTimeoutMs, THE system SHALL record the timeout event and reduce batch size
4. WHEN a sequential read times out after the configured sequentialReadTimeoutMs, THE system SHALL record the timeout event and attempt the next batch

### Requirement 2: Timeout Configuration Consistency

**User Story:** As a developer, I want timeout values to be consistently applied throughout the system, so that the behavior matches the configuration.

#### Acceptance Criteria

1. THE BACnet_Reading_Agent SHALL initialize with separate timeout values for batch reads and sequential reads
2. THE Collection_Cycle_Manager SHALL use batchReadTimeoutMs for batch read operations
3. THE Collection_Cycle_Manager SHALL use sequentialReadTimeoutMs for sequential fallback operations
4. WHEN the agent is started, THE logger SHALL confirm all timeout values are correctly configured

### Requirement 3: Timeout Metrics Accuracy

**User Story:** As a system monitor, I want accurate timeout metrics, so that I can diagnose performance issues.

#### Acceptance Criteria

1. WHEN a batch read times out, THE system SHALL record the actual timeout duration (batchReadTimeoutMs)
2. WHEN a sequential read times out, THE system SHALL record the actual timeout duration (sequentialReadTimeoutMs)
3. WHEN timeout events are accumulated, THE metrics SHALL reflect the correct timeout values for each operation type
4. WHEN the agent status is queried, THE timeout metrics SHALL show accurate recovery times


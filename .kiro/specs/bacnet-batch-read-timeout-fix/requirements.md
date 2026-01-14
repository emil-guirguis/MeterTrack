# Requirements Document: BACnet Batch Read Timeout Fix

## Introduction

The BACnet meter reading system is experiencing batch read timeouts when attempting to read multiple registers from meters. The system currently attempts to read all configured registers for a device in a single batch request, but this is timing out after 5000ms. This spec addresses the need to optimize the batch read strategy to handle timeouts gracefully and improve reliability.

## Glossary

- **BACnet**: Building Automation and Control Networks protocol for device communication
- **Batch Read**: Reading multiple properties from a device in a single request
- **Register**: A data point on a meter (e.g., power_factor_phase_c, power_phase_a)
- **Timeout**: Maximum time allowed for a read operation to complete
- **Collection Cycle**: A complete iteration of reading all meters and their registers
- **Meter**: A physical device that measures energy consumption
- **Device Register**: Configuration mapping between a device and its readable registers

## Requirements

### Requirement 1: Configurable Batch Read Timeout

**User Story:** As a system administrator, I want to configure the batch read timeout, so that I can adjust it based on meter response times and network conditions.

#### Acceptance Criteria

1. WHEN the BACnet client is initialized, THE System SHALL accept a configurable batch read timeout parameter
2. WHEN a batch read is performed, THE System SHALL use the configured timeout value instead of a hardcoded value
3. WHEN the timeout is not specified, THE System SHALL use a sensible default value (minimum 5000ms)
4. WHEN the timeout configuration changes, THE System SHALL apply the new timeout to subsequent batch reads

_Requirements: Configuration management for BACnet operations_

### Requirement 2: Batch Read Timeout Handling

**User Story:** As a developer, I want the system to handle batch read timeouts gracefully, so that individual register failures don't stop the entire collection cycle.

#### Acceptance Criteria

1. WHEN a batch read times out, THE System SHALL log the timeout with details about which registers failed
2. WHEN a batch read times out, THE System SHALL return partial results for any registers that succeeded before the timeout
3. WHEN a batch read times out, THE System SHALL mark failed registers with a timeout error
4. WHEN a batch read times out, THE System SHALL continue processing the next meter instead of stopping the cycle

_Requirements: Error handling and resilience_

### Requirement 3: Batch Size Optimization

**User Story:** As a system operator, I want the system to automatically optimize batch sizes, so that reads complete reliably without timing out.

#### Acceptance Criteria

1. WHEN a batch read times out, THE System SHALL reduce the batch size for subsequent attempts
2. WHEN a batch read succeeds, THE System SHALL maintain or gradually increase the batch size
3. WHEN batch size is reduced, THE System SHALL split the registers into multiple smaller batch requests
4. WHEN processing multiple batches, THE System SHALL maintain the same timeout for each batch

_Requirements: Adaptive batch sizing_

### Requirement 4: Timeout Metrics and Monitoring

**User Story:** As a system administrator, I want to monitor batch read timeout metrics, so that I can identify problematic meters and optimize configuration.

#### Acceptance Criteria

1. WHEN a batch read times out, THE System SHALL record the timeout event with meter ID and register count
2. WHEN a collection cycle completes, THE System SHALL report the number of timeout errors encountered
3. WHEN querying agent status, THE System SHALL include timeout statistics in the response
4. WHEN timeout patterns emerge, THE System SHALL log warnings about consistently slow meters

_Requirements: Observability and diagnostics_

### Requirement 5: Fallback to Sequential Reads

**User Story:** As a system operator, I want the system to fall back to sequential reads when batch reads fail, so that data can still be collected even if batch operations are unreliable.

#### Acceptance Criteria

1. WHEN a batch read fails completely, THE System SHALL attempt to read registers sequentially as a fallback
2. WHEN reading sequentially, THE System SHALL use the same timeout value as batch reads
3. WHEN sequential reads succeed, THE System SHALL log the fallback operation
4. WHEN sequential reads also fail, THE System SHALL record the error and continue to the next meter

_Requirements: Resilience and data collection reliability_

### Requirement 6: Meter Connectivity Check

**User Story:** As a system operator, I want the system to check if a meter is online before attempting to read it, so that timeouts are avoided for offline meters.

#### Acceptance Criteria

1. WHEN a collection cycle begins for a meter, THE System SHALL perform a connectivity check before attempting batch reads
2. WHEN a meter is offline or unreachable, THE System SHALL skip the meter and record it as offline
3. WHEN a meter is online, THE System SHALL proceed with batch read operations
4. WHEN a meter fails the connectivity check, THE System SHALL log the offline status with timestamp
5. WHEN a meter is marked offline, THE System SHALL not attempt batch or sequential reads for that meter

_Requirements: Connectivity validation and resource optimization_


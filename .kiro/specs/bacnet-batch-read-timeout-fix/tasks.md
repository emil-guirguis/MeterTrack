# Implementation Plan: BACnet Batch Read Timeout Fix

## Overview

This implementation plan breaks down the timeout fix into discrete tasks that build incrementally. We'll start by enhancing the BACnet client with timeout configuration and connectivity checking, then add adaptive batch sizing, and finally implement metrics collection and monitoring.

## Tasks

- [x] 1. Enhance BACnet Client Configuration
  - Add configurable timeout parameters to BACnetClient constructor
  - Support `batchReadTimeout`, `sequentialReadTimeout`, and `connectivityCheckTimeout`
  - Add default values (5000ms, 3000ms, 2000ms respectively)
  - Update BACnetClientConfig interface with new timeout fields
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 1.1 Write unit tests for BACnet client configuration
  - Test that configured timeouts are stored and used
  - Test default timeout values are applied when not specified
  - Test timeout values are at least minimum (5000ms for batch reads)
  - _Requirements: 1.1, 1.3_

- [x] 2. Implement Connectivity Check Method
  - Add `checkConnectivity()` method to BACnetClient
  - Perform a simple read (e.g., device type) to verify meter is online
  - Use `connectivityCheckTimeout` for this operation
  - Return boolean indicating if meter is reachable
  - _Requirements: 6.1, 6.3_

- [ ]* 2.1 Write unit tests for connectivity checking
  - Test successful connectivity check for online meter
  - Test failed connectivity check for offline meter
  - Test timeout handling during connectivity check
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Enhance Batch Read with Timeout Handling
  - Modify `readPropertyMultiple()` to handle timeouts gracefully
  - Return partial results for registers that completed before timeout
  - Mark timed-out registers with error message
  - Log timeout events with meter ID and register count
  - _Requirements: 2.1, 2.2, 2.3_

- [x]* 3.1 Write property test for partial results on timeout
  - **Property 2: Partial Results on Batch Timeout**
  - **Validates: Requirements 2.1, 2.2, 2.3**
  - Generate batch reads with some registers succeeding and some timing out
  - Verify results include successful registers and error markers for failed ones

- [x] 4. Implement Sequential Fallback Reads
  - Add `readPropertySequential()` method to BACnetClient
  - Read each register individually with configured timeout
  - Return partial results for any that succeed
  - Log fallback operation details
  - _Requirements: 5.1, 5.2, 5.3_

- [x]* 4.1 Write property test for sequential fallback
  - **Property 6: Sequential Fallback on Batch Failure**
  - **Validates: Requirements 5.1, 5.2, 5.3**
  - Simulate batch read failure and verify sequential fallback is attempted
  - Verify partial results are returned from sequential reads

- [x] 5. Add Adaptive Batch Sizing Logic
  - Create `BatchSizeManager` class to track and adjust batch sizes
  - Implement batch size reduction algorithm (50% reduction on timeout)
  - Maintain batch size on successful reads
  - Track batch size per meter for future cycles
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 5.1 Write property test for batch size reduction
  - **Property 3: Batch Size Reduction on Timeout**
  - **Validates: Requirements 3.1, 3.3**
  - Trigger timeout and verify next batch uses smaller size
  - Verify batch is split into multiple requests

- [x] 6. Integrate Connectivity Check into Collection Cycle
  - Modify `readMeterDataPoints()` in CollectionCycleManager
  - Call `checkConnectivity()` before attempting batch reads
  - Skip meter if connectivity check fails
  - Record offline status with timestamp
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ]* 6.1 Write property test for connectivity check integration
  - **Property 5: Connectivity Check Prevents Reads**
  - **Validates: Requirements 6.1, 6.5**
  - Verify offline meters are skipped
  - Verify no read attempts are made for offline meters

- [x] 7. Integrate Batch Read with Adaptive Sizing
  - Modify `readMeterDataPoints()` to use BatchSizeManager
  - Implement batch read with timeout handling
  - On timeout, reduce batch size and retry
  - On complete failure, attempt sequential fallback
  - _Requirements: 2.4, 3.1, 5.1_

- [ ]* 7.1 Write property test for timeout handling in cycle
  - **Property 8: Cycle Continuation on Meter Failure**
  - **Validates: Requirements 2.4, 5.4, 6.2**
  - Simulate meter timeout and verify cycle continues
  - Verify remaining meters are processed

- [x] 8. Add Timeout Metrics Collection
  - Extend `CollectionCycleResult` to include timeout metrics
  - Track timeout events per meter
  - Record recovery method used (batch reduction, sequential, offline)
  - Calculate average timeout recovery time
  - _Requirements: 4.1, 4.2_

- [ ]* 8.1 Write property test for metrics recording
  - **Property 7: Timeout Metrics Recording**
  - **Validates: Requirements 4.1, 4.2, 4.3**
  - Verify timeout events are recorded with correct details
  - Verify metrics are accurate after collection cycle

- [x] 9. Enhance Agent Status with Timeout Metrics
  - Add `timeoutMetrics` field to AgentStatus interface
  - Track total timeouts, timeouts by meter, average recovery time
  - Add `offlineMeters` field to track consistently offline meters
  - Update `getStatus()` method to include new metrics
  - _Requirements: 4.3, 4.4_

- [ ]* 9.1 Write unit tests for agent status metrics
  - Test that timeout metrics are included in status
  - Test that offline meter tracking is accurate
  - Test that metrics accumulate across cycles

- [x] 10. Add Configuration Support
  - Add timeout configuration to BACnetMeterReadingAgentConfig
  - Support environment variables for timeout settings
  - Add flags for enabling/disabling features (connectivity check, sequential fallback, adaptive batching)
  - Document configuration options
  - _Requirements: 1.1, 1.4_

- [ ]* 10.1 Write unit tests for configuration
  - Test configuration loading from environment variables
  - Test configuration defaults
  - Test feature flags enable/disable functionality

- [x] 11. Add Logging and Observability
  - Add detailed logging for timeout events
  - Log connectivity check results
  - Log batch size changes
  - Log fallback operations
  - Log warning for consistently slow meters
  - _Requirements: 2.1, 4.4, 5.3, 6.4_

- [x]* 11.1 Write unit tests for logging
  - Test that timeout events are logged with correct details
  - Test that offline status is logged with timestamp
  - Test that fallback operations are logged

- [x] 12. Checkpoint - Ensure all tests pass
  - Run full test suite for BACnet collection module
  - Verify all unit tests pass
  - Verify all property tests pass
  - Check code coverage for new functionality
  - _Requirements: All_

- [-] 13. Integration Testing
  - Test complete collection cycle with mixed online/offline meters
  - Test timeout recovery across multiple cycles
  - Test metrics accumulation over multiple cycles
  - Test configuration changes applied to running agent
  - _Requirements: All_

- [ ]* 13.1 Write integration tests
  - Test end-to-end collection with timeouts
  - Test metrics accumulation
  - Test configuration changes

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Run full test suite including integration tests
  - Verify all property tests pass with 100+ iterations
  - Check code coverage meets requirements
  - Verify no regressions in existing functionality
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Configuration is backward compatible with existing code


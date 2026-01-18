# Implementation Plan: BACnet Batch Read Timeout Configuration Fix

## Overview

Fix the critical timeout configuration bug where batch read operations are using the wrong timeout value (3 seconds instead of 5 seconds). This involves updating method signatures to pass the correct timeout parameters through the call stack and adding verification logging.

## Tasks

- [ ] 1. Update Collection Cycle Manager method signatures
  - Add `batchReadTimeoutMs` parameter to `executeCycle()` method
  - Add `batchReadTimeoutMs` parameter to `readMeterDataPoints()` method
  - Add `batchReadTimeoutMs` parameter to `performBatchReadWithAdaptiveSizing()` method
  - Update all method calls to pass the new parameter
  - _Requirements: 1.1, 1.2, 2.2_

- [ ] 2. Fix batch read timeout usage in performBatchReadWithAdaptiveSizing()
  - Replace `readTimeoutMs` with `batchReadTimeoutMs` in batch read call
  - Ensure sequential fallback still uses `readTimeoutMs`
  - Add logging to show which timeout is being used for each operation
  - _Requirements: 1.1, 1.2, 2.2_

- [ ]* 2.1 Write unit tests for timeout parameter passing
  - Test that executeCycle passes batchReadTimeoutMs correctly
  - Test that readMeterDataPoints passes batchReadTimeoutMs correctly
  - Test that performBatchReadWithAdaptiveSizing uses correct timeouts
  - _Requirements: 1.1, 1.2_

- [ ] 3. Update BACnet Reading Agent to pass batchReadTimeoutMs
  - Pass `batchReadTimeoutMs` when calling `cycleManager.executeCycle()`
  - Add logging at startup to confirm all timeout values
  - _Requirements: 2.1, 2.4_

- [ ]* 3.1 Write unit tests for agent timeout configuration
  - Test that agent passes correct timeout values to cycle manager
  - Test that startup logging confirms timeout values
  - _Requirements: 2.1, 2.4_

- [ ] 4. Verify timeout metrics accuracy
  - Ensure timeout events record correct timeout duration for batch operations
  - Ensure timeout events record correct timeout duration for sequential operations
  - Add logging to show timeout values in metrics
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 4.1 Write property test for timeout metrics consistency
  - **Property 3: Timeout Metrics Reflect Operation Type**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 5. Add startup verification logging
  - Log all timeout configuration values when agent starts
  - Log confirmation that batch read timeout is different from sequential timeout
  - _Requirements: 2.4_

- [ ]* 5.1 Write unit test for startup logging
  - Test that startup logs contain all timeout values
  - Test that logs confirm correct configuration
  - _Requirements: 2.4_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify no regressions in existing functionality

- [ ]* 7. Write integration test for complete timeout flow
  - Test batch read with timeout recovery
  - Test sequential fallback with timeout
  - Test timeout metrics accumulation
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 8. Final checkpoint - Verify fix resolves timeout issues
  - Deploy fix to test environment
  - Monitor meter readings for timeout patterns
  - Verify batch size reduction is no longer triggered prematurely
  - Verify timeout metrics show correct values

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The core fix (tasks 1-5) should resolve the timeout issue
- Property tests (marked optional) provide additional confidence in correctness
- Integration tests help verify the fix works end-to-end


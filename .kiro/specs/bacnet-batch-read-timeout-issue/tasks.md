# Implementation Plan: BACnet Batch Read Timeout Issue

## Overview

Fix the batch read timeout issue by ensuring the correct timeout values are passed through the system. The Collection_Cycle_Manager should pass the batchReadTimeout to readPropertyMultiple() instead of the sequential read timeout.

## Tasks

- [ ] 1. Update Collection_Cycle_Manager to use correct timeout values
  - Modify performBatchReadWithAdaptiveSizing() to pass batchReadTimeout to readPropertyMultiple()
  - Modify readMeterDataPoints() to accept separate batch and sequential timeout parameters
  - Update the call to executeCycle() to pass both timeout values
  - _Requirements: 1.2, 2.2_

- [ ]* 1.1 Write unit tests for timeout parameter passing
  - Test that readPropertyMultiple receives batchReadTimeout
  - Test that readPropertySequential receives sequentialReadTimeout
  - _Requirements: 2.1, 2.3_

- [ ] 2. Update BACnet_Client to log actual timeout values used
  - Modify readPropertyMultiple() to log the timeout value being used
  - Modify readPropertySequential() to log the timeout value being used
  - Include timeout value in timeout error messages
  - _Requirements: 3.1, 3.2_

- [ ]* 2.1 Write unit tests for tim
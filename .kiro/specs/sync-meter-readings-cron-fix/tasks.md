# Implementation Plan: Sync Meter Readings Cron Expression Fix

## Overview

Fix the SyncManager to use centralized cron expressions from scheduling-constants instead of hardcoding them. This ensures consistency across the system and allows global configuration through environment variables.

## Tasks

- [ ] 1. Update SyncManager to use centralized cron expression
  - Import `getBACnetUploadCronExpression` from scheduling-constants
  - Update SyncManager constructor to accept optional `uploadCronExpression` parameter
  - Replace hardcoded cron expression with call to `getBACnetUploadCronExpression()`
  - Update console logging to display the actual cron expression being used
  - _Requirements: 1.1, 1.2, 1.4_

- [ ]* 1.1 Write unit tests for SyncManager cron expression handling
  - Test that SyncManager uses `getBACnetUploadCronExpression()` by default
  - Test that explicit `uploadCronExpression` parameter is respected
  - Test that cron job is scheduled with correct expression
  - Test backward compatibility with `syncIntervalMinutes`
  - _Requirements: 1.1, 1.2, 2.1_

- [ ]* 1.2 Write property test for cron expression consistency
  - **Property 1: Cron Expression Consistency**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 1.3 Write property test for environment variable precedence
  - **Property 2: Environment Variable Precedence**
  - **Validates: Requirements 1.2, 2.3**

- [ ] 2. Verify the fix works correctly
  - Start the sync manager and verify it uses the correct cron expression
  - Check that the cron expression is logged correctly
  - Verify that meter readings sync at the expected interval
  - _Requirements: 1.1, 1.4_

- [ ] 3. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The fix maintains backward compatibility with existing configurations
- Environment variables take precedence over hardcoded defaults
- The cron expression should be logged on startup for debugging purposes


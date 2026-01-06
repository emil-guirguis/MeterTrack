# Implementation Plan: Remove Duplicate Database Pool Creation

## Overview

This plan consolidates database pool management by removing duplicate pool creation logic from the Sync MCP Server. The refactoring will use the centralized `remotePool` exported from `connection-manager.ts` instead of creating a duplicate pool in the index file.

## Tasks

- [ ] 1. Remove duplicate pool creation methods from index.ts
  - Remove the `createRemoteDatabasePool()` method
  - Remove the `closeRemotePool()` method
  - Remove the `private remotePool?: Pool` instance variable
  - _Requirements: 1.3, 1.4_

- [ ] 2. Update index.ts to use remotePool from connection-manager
  - Import `remotePool` and `closePools` from connection-manager (update existing imports)
  - Replace `this.createRemoteDatabasePool()` call with direct `remotePool` reference in `initializeServices()`
  - Replace `this.closeRemotePool(remotePool)` call with `closePools()` in `shutdown()`
  - _Requirements: 1.1, 1.2_

- [ ] 3. Clean up unused imports
  - Remove unused imports: `syncPool`, `CollectorConfig`, `createSyncManagerFromEnv`, `ClientSystemApiClient`
  - Keep only the imports that are actively used
  - _Requirements: 3.1, 3.2_

- [ ] 4. Verify TypeScript compilation
  - Compile TypeScript to ensure no errors
  - Verify no unused variable warnings remain
  - _Requirements: 3.3_

- [ ]* 5. Write unit tests for pool usage
  - Verify that `remotePool` is properly imported and used
  - Verify that the Meter Sync Agent receives the correct pool instance
  - _Requirements: 2.1_

- [ ] 6. Checkpoint - Ensure all changes compile and tests pass
  - Ensure TypeScript compilation succeeds
  - Ensure no unused variable warnings
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The refactoring maintains all existing functionality
- Pool configuration remains unchanged
- Error handling is preserved from the connection manager


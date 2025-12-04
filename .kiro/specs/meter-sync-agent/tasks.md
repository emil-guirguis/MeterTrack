# Implementation Plan: Meter Sync Agent

- [x] 1. Create Meter Sync Agent Service





  - Create `sync/mcp/src/sync-service/meter-sync-agent.ts` with MeterSyncAgent class
  - Implement sync orchestration logic that connects to remote database
  - Implement insert/update/delete operations for meters filtered by tenant_id
  - Implement concurrency prevention to prevent concurrent sync operations
  - Implement sync status tracking and logging
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4_

- [ ]* 1.1 Write property test for new meters insertion
  - **Feature: meter-sync-agent, Property 1: New Meters Are Inserted**
  - **Validates: Requirements 1.2**

- [ ]* 1.2 Write property test for meter updates
  - **Feature: meter-sync-agent, Property 2: Existing Meters Are Updated**
  - **Validates: Requirements 1.3**

- [ ]* 1.3 Write property test for meter deactivation
  - **Feature: meter-sync-agent, Property 3: Deleted Meters Are Deactivated**
  - **Validates: Requirements 1.4**

- [ ]* 1.4 Write property test for sync operation logging
  - **Feature: meter-sync-agent, Property 4: Sync Operations Are Logged**
  - **Validates: Requirements 1.5**

- [ ]* 1.5 Write property test for concurrent sync prevention
  - **Feature: meter-sync-agent, Property 5: Concurrent Syncs Are Prevented**
  - **Validates: Requirements 2.3**

- [x] 2. Integrate Meter Sync Agent into Sync MCP Server




  - Add meter sync agent initialization to `sync/mcp/src/index.ts`
  - Schedule meter sync to run every hour using node-cron
  - Add meter sync agent to SyncMcpServer class
  - Start meter sync agent when services are initialized
  - _Requirements: 2.1, 2.2_


- [x] 3. Add Meter Sync API Endpoints


  - Add `GET /api/local/meter-sync-status` endpoint to `sync/mcp/src/api/server.ts`
  - Add `POST /api/local/meter-sync-trigger` endpoint to `sync/mcp/src/api/server.ts`
  - Implement status response with last sync timestamp, counts, and meter count
  - Implement manual trigger response with operation results
  - _Requirements: 3.2, 4.1, 4.2, 4.3, 4.4_

- [ ]* 3.1 Write property test for sync status accuracy
  - **Feature: meter-sync-agent, Property 6: Sync Status Reflects Last Operation**
  - **Validates: Requirements 4.1, 4.3, 4.4**

- [ ]* 3.2 Write property test for meter count accuracy
  - **Feature: meter-sync-agent, Property 7: Meter Count Is Accurate**
  - **Validates: Requirements 4.2**

- [x] 4. Update Frontend Sync Status Page



  - Modify `sync/frontend/src/pages/SyncStatus.tsx` to display meter sync controls
  - Add button to manually trigger meter sync
  - Display last meter sync timestamp
  - Display meter count
  - Display sync operation results (inserted, updated, deleted counts)
  - Display loading state while sync is in progress
  - Display error message if sync fails
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

- [x] 5. Update Frontend API Services




  - Add `meterSyncApi` object to `sync/frontend/src/api/services.ts`
  - Implement `getStatus()` method to fetch meter sync status
  - Implement `triggerSync()` method to manually trigger meter sync
  - Add error handling for API failures
  - _Requirements: 3.2, 3.4, 3.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

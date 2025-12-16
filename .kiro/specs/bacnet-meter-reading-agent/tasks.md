# Implementation Plan: BACnet Meter Reading Agent

- [x] 1. Set up project structure and core types





  - Create `src/bacnet-collection/types.ts` with interfaces for BACnetReadResult, CachedMeter, RegisterMap, CollectionCycleResult, CollectionError
  - Create `src/bacnet-collection/meter-cache.ts` with MeterCache class skeleton
  - Create `src/bacnet-collection/bacnet-client.ts` with BACnetClient class skeleton
  - Create `src/bacnet-collection/collection-cycle-manager.ts` with CollectionCycleManager class skeleton
  - Create `src/bacnet-collection/reading-batcher.ts` with ReadingBatcher class skeleton
  - Create `src/bacnet-collection/bacnet-reading-agent.ts` with BACnetMeterReadingAgent class skeleton
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_



- [x] 2. Implement MeterCache for loading and managing meter configurations



  - Implement `MeterCache.reload()` to query active meters from database and populate cache
  - Implement `MeterCache.getMeters()` to return all cached meters
  - Implement `MeterCache.getMeter(meterId)` to retrieve a specific meter from cache
  - Implement `MeterCache.isValid()` to check if cache contains valid data
  - Add validation logic to ensure register_map is valid JSON with required fields
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.1 Write property test for meter cache loading






  - **Feature: bacnet-meter-reading-agent, Property 4: Meter Cache Loading**
  - **Validates: Requirements 2.1**



- [x] 2.2 Write property test for cache invalidation




  - **Feature: bacnet-meter-reading-agent, Property 6: Cache Invalidation on Update**
  - **Validates: Requirements 2.3**

- [x] 3. Implement BACnetClient for BACnet communication





  - Implement `BACnetClient.readProperty()` to read a single BACnet property using bacstack library
  - Add timeout handling (default 3 seconds) for read operations
  - Add error handling to catch and return BACnet-specific errors
  - Implement `BACnetClient.close()` to gracefully close connections
  - Add logging for successful reads and errors
  - _Requirements: 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [x] 3.1 Write property test for BACnet connection parameters

  - **Feature: bacnet-meter-reading-agent, Property 9: BACnet Connection Parameters**
  - **Validates: Requirements 3.2**

- [x] 3.2 Write property test for connection failure resilience

  - **Feature: bacnet-meter-reading-agent, Property 10: Connection Failure Resilience**
  - **Validates: Requirements 3.3**


- [x] 4. Implement ReadingBatcher for efficient database writes



  - Implement `ReadingBatcher.addReading()` to queue readings in memory
  - Implement `ReadingBatcher.flushBatch()` to batch insert all queued readings in a single transaction
  - Implement `ReadingBatcher.getPendingCount()` to return count of queued readings
  - Add logic to set is_synchronized=false for all inserted readings
  - Add error handling and logging for batch insert failures
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4.1 Write property test for batch insert atomicity

  - **Feature: bacnet-meter-reading-agent, Property 15: Batch Insert Atomicity**
  - **Validates: Requirements 5.1**

- [x] 4.2 Write property test for unsynchronized marking

  - **Feature: bacnet-meter-reading-agent, Property 16: Unsynchronized Marking**
  - **Validates: Requirements 5.2**


- [x] 5. Implement CollectionCycleManager to orchestrate collection cycles




  - Implement `CollectionCycleManager.executeCycle()` to coordinate the full collection process
  - Iterate through all meters in the cache
  - For each meter, attempt BACnet connection using meter IP and port
  - On successful connection, read all data points from the register map
  - Capture value, unit, and timestamp for each read
  - Batch insert all readings for the meter
  - Handle errors at each step (connection, read, write) and continue processing
  - Record cycle results including meters processed, readings collected, and errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_

- [x] 5.1 Write property test for meter iteration

  - **Feature: bacnet-meter-reading-agent, Property 8: Meter Iteration**
  - **Validates: Requirements 3.1**

- [x] 5.2 Write property test for reading persistence

  - **Feature: bacnet-meter-reading-agent, Property 14: Reading Persistence**
  - **Validates: Requirements 4.4**

- [x] 5.3 Write property test for register read failure resilience

  - **Feature: bacnet-meter-reading-agent, Property 13: Register Read Failure Resilience**
  - **Validates: Requirements 4.3**

- [x] 5.4 Write property test for database write failure handling

  - **Feature: bacnet-meter-reading-agent, Property 17: Database Write Failure Handling**
  - **Validates: Requirements 5.3**

- [x] 6. Implement BACnetMeterReadingAgent main class with scheduling









  - Implement `BACnetMeterReadingAgent.start()` to initialize the agent and schedule collection cycles
  - Set up cron job to execute every 60 seconds using node-cron
  - Load meter cache on startup
  - Implement cycle locking to prevent overlapping execution
  - Implement `BACnetMeterReadingAgent.stop()` to gracefully shutdown the agent
  - Close BACnet connections and stop the cron job
  - Implement `BACnetMeterReadingAgent.triggerCollection()` to manually trigger a collection cycle
  - Implement `BACnetMeterReadingAgent.getStatus()` to return agent status and metrics
  - Add logging for agent lifecycle events
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4, 8.2, 8.3_

- [x] 6.1 Write property test for scheduled execution consistency

  - **Feature: bacnet-meter-reading-agent, Property 1: Scheduled Execution Consistency**
  - **Validates: Requirements 1.1, 1.2**

- [x] 6.2 Write property test for non-overlapping cycles

  - **Feature: bacnet-meter-reading-agent, Property 2: Non-Overlapping Cycles**
  - **Validates: Requirements 1.3**

- [x] 6.3 Write property test for graceful shutdown

  - **Feature: bacnet-meter-reading-agent, Property 3: Graceful Shutdown**
  - **Validates: Requirements 1.4**

- [x] 6.4 Write property test for manual trigger isolation

  - **Feature: bacnet-meter-reading-agent, Property 24: Manual Trigger Isolation**
  - **Validates: Requirements 8.3**

- [x] 7. Integrate BACnetMeterReadingAgent into SyncMcpServer




  - Add BACnetMeterReadingAgent initialization in `src/index.ts` initializeServices()
  - Create agent instance with configuration from environment variables
  - Start agent after database initialization
  - Add agent to shutdown sequence
  - Store agent reference for MCP tool handlers
  - _Requirements: 1.1, 1.4_


- [x] 8. Add MCP tools for agent control and monitoring




  - Add `trigger_meter_reading` tool to manually trigger collection cycles
  - Add `get_meter_reading_status` tool to query agent status and metrics
  - Implement tool handlers in SyncMcpServer
  - Return formatted JSON responses with cycle results and status information
  - _Requirements: 8.2, 8.3, 7.2_


- [x] 9. Checkpoint - Ensure all tests pass






  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Add API endpoint for manual trigger on sync status page




  - Create GET `/api/meter-reading/status` endpoint to return agent status
  - Create POST `/api/meter-reading/trigger` endpoint to manually trigger collection
  - Integrate endpoints into LocalApiServer
  - Return JSON responses with cycle results
  - _Requirements: 8.2, 8.3, 8.4_


- [x] 11. Add status card component to sync status page (Frontend)



  - Create React component to display BACnet meter reading agent status
  - Show last cycle results (readings collected, errors, timestamp)
  - Add button to manually trigger collection cycle
  - Display loading state during collection
  - Display error messages if collection fails
  - _Requirements: 8.1, 8.4_



- [x] 12. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

i
# Implementation Plan

- [x] 1. Restructure project directories







  - [x] 1.1 Create client directory structure





    - Create `client/` directory
    - Move existing `backend/` to `client/backend/`
    - Move existing `frontend/` to `client/frontend/`
    - Create `client/mcp/` directory for Client MCP Server
    - Update package.json paths in moved directories
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 1.2 Create sync directory structure



    - Create `sync/` directory
    - Create `sync/frontend/` directory for Sync Frontend
    - Create `sync/mcp/` directory (will adapt existing mcp-modbus-agent)
    - Copy relevant structure from `mcp-modbus-agent/` to `sync/mcp/`
    - Create package.json files for sync/frontend and sync/mcp
    - Create .env.example files for all new components
    - _Requirements: 10.1, 10.4, 10.6_

- [x] 2. Update Client System (backend) API for Sync support






  - [x] 2.1 Create Sync authentication middleware


    - Implement API key validation middleware in client/backend/src/middleware/auth.js
    - Add API key hashing utilities
    - Create getSiteIdFromApiKey function
    - _Requirements: 2.4, 2.5_
  
  - [x] 2.2 Create Sync API endpoints


    - Implement POST /api/sync/auth endpoint for Sync authentication
    - Implement POST /api/sync/readings/batch endpoint for batch meter reading uploads
    - Implement GET /api/sync/config endpoint for configuration download
    - Implement POST /api/sync/heartbeat endpoint for health checks
    - Add request validation using express-validator
    - _Requirements: 2.3, 2.5_
  
  - [x] 2.3 Update Client Database schema


    - Create migration for sites table in client/backend/migrations/
    - Create migration for meters table with site_id foreign key
    - Update meter_readings table to reference meters
    - Add indexes for performance (meter_id, timestamp)
    - _Requirements: 8.4_

- [x] 3. Implement Sync Database layer





  - [x] 3.1 Create Sync Database schema


    - Create migrations directory in sync/mcp/migrations/
    - Create migration for meters table
    - Create migration for meter_readings table with sync tracking
    - Create migration for sync_log table
    - Add indexes for sync queries (is_synchronized, created_at)
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 3.2 Implement Sync Database client


    - Create PostgreSQL connection module in sync/mcp/src/database/postgres.ts
    - Implement query methods for meters
    - Implement query methods for meter_readings with sync status filtering
    - Implement batch insert and delete operations
    - _Requirements: 8.1, 8.2_

- [x] 4. Adapt Meter Collection Service from Modbus to BACnet




  - [x] 4.1 Replace Modbus with BACnet client


    - Remove jsmodbus dependency from sync/mcp/package.json
    - Install BACnet library (bacstack or node-bacnet)
    - Create BACnet client class in sync/mcp/src/meter-collection/bacnet-client.ts
    - Implement device discovery functionality
    - Implement readProperty method for data points
    - Add connection error handling and timeouts
    - _Requirements: 3.1, 3.4_
  
  - [x] 4.2 Update meter collector for BACnet


    - Update existing collector code in sync/mcp/src/meter-collection/
    - Modify to load BACnet meter configuration from config/meters.json
    - Update scheduled collection to use BACnet client
    - Store readings in Sync Database
    - Maintain error handling for unreachable meters
    - Update logging for BACnet-specific metrics
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 5. Implement Sync Service in Sync MCP




  - [x] 5.1 Create Client System API client


    - Create API client class in sync/mcp/src/sync-service/api-client.ts
    - Implement authentication method
    - Implement batch upload method with retry logic
    - Implement config download method
    - Add connection timeout and error handling
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [x] 5.2 Implement sync manager


    - Create SyncManager class in sync/mcp/src/sync-service/sync-manager.ts
    - Implement scheduled sync using node-cron
    - Query unsynchronized readings from Sync Database
    - Batch readings (configurable BATCH_SIZE)
    - Upload batches to Client System API
    - Delete synchronized readings on success
    - Implement exponential backoff retry logic (max 5 retries)
    - Log sync operations to sync_log table
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 5.3 Implement offline operation handling


    - Add Client System connectivity check
    - Queue readings when Client System unreachable
    - Auto-resume sync when connectivity restored
    - Provide connectivity status for frontend
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

- [x] 6. Create Sync Frontend





  - [x] 6.1 Setup Sync Frontend project


    - Initialize React + TypeScript + Vite project in sync/frontend/
    - Install Material-UI, Zustand, Axios dependencies
    - Configure Vite for development and production builds
    - Create basic routing structure
    - _Requirements: 5.3, 5.6_
  
  - [x] 6.2 Implement local dashboard


    - Create LocalDashboard component showing local meter readings
    - Display last 24 hours of data
    - Show meter connectivity status
    - Add real-time updates using polling
    - _Requirements: 5.6, 9.2_
  
  - [x] 6.3 Implement sync status page


    - Create SyncStatus component
    - Display Client System connectivity indicator
    - Show sync queue size
    - Show last successful sync timestamp
    - Add manual sync trigger button
    - Display sync error logs
    - _Requirements: 9.5_
  
  - [x] 6.4 Create Sync local API


    - Create Express server in sync/mcp/src/server.ts (or adapt existing MCP HTTP interface)
    - Implement GET /api/local/meters endpoint
    - Implement GET /api/local/readings endpoint
    - Implement GET /api/local/sync-status endpoint
    - Implement POST /api/local/sync-trigger endpoint
    - _Requirements: 5.4_

- [ ] 7. Update Client Frontend for multi-site support



  - [ ] 7.1 Create multi-site dashboard
    - Update Dashboard component to show data from all sites
    - Add site filter dropdown
    - Display site connectivity status indicators
    - Show aggregated metrics across sites
    - _Requirements: 5.5_
  
  - [ ] 7.2 Create site management page
    - Create Sites component for managing Syncs
    - Display list of registered sites with status
    - Show last heartbeat timestamp
    - Add site registration form (generate API key)
    - _Requirements: 5.5_

- [x] 8. Implement Client MCP Server





  - [x] 8.1 Create Client MCP Server foundation


    - Setup TypeScript project in mcp-client/
    - Install @modelcontextprotocol/sdk and dependencies
    - Create MCP server initialization in mcp-client/src/index.ts
    - Configure connection to Client Database
    - _Requirements: 6.1, 6.2_
  
  - [x] 8.2 Implement Client MCP tools


    - Create query_meters tool for querying meters across all sites
    - Create query_readings tool with filters (site, meter, date range)
    - Create get_site_status tool for Sync connectivity
    - Create generate_report tool for multi-site reports
    - _Requirements: 6.2_
- [x] 9. Implement Sync MCP



- [ ] 9. Implement Sync MCP

  - [x] 9.1 Create Sync MCP foundation


    - Setup TypeScript project in sync/mcp/
    - Install @modelcontextprotocol/sdk and dependencies
    - Create MCP server initialization in sync/mcp/src/index.ts
    - Configure connection to Sync Database
    - _Requirements: 6.3, 6.4_
  
  - [x] 9.2 Implement Sync MCP tools


    - Create start_collection tool to start Meter Collection Service
    - Create stop_collection tool to stop Meter Collection Service
    - Create get_sync_status tool for synchronization status
    - Create trigger_sync tool for manual sync
    - Create query_meter_readings tool for local data queries
    - Create get_meter_status tool for BACnet meter connectivity
    - _Requirements: 6.4, 6.5_

- [ ] 10. Create deployment scripts and documentation
  - [ ] 10.1 Create startup scripts
    - Create scripts/start-client.sh for Client System
    - Create scripts/start-sync.sh for Sync
    - Update root package.json with start:client and start:sync scripts
    - _Requirements: 10.5_
  
  - [ ] 10.2 Create configuration examples
    - Create backend/.env.example with Client System configuration
    - Create sync/.env.example with Sync configuration
    - Create sync/config/meters.example.json with BACnet meter configuration
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 10.3 Create deployment documentation
    - Document Client System deployment steps
    - Document Sync deployment steps
    - Document BACnet meter configuration
    - Document API key generation and registration
    - _Requirements: 7.1, 7.2_

- [ ] 11. Implement error handling and logging
  - [ ] 11.1 Setup Winston logging
    - Configure Winston in Sync Service with file rotation
    - Configure Winston in Meter Collection Service
    - Configure Winston in Client System API
    - Create separate log files for different services
    - _Requirements: 3.4, 4.3_
  
  - [ ] 11.2 Implement error handling
    - Add try-catch blocks for Client System connectivity errors
    - Add try-catch blocks for BACnet meter connectivity errors
    - Add try-catch blocks for database operations
    - Implement error logging with context
    - _Requirements: 3.4, 4.3, 9.1_

- [ ] 12. Add configuration management
  - [ ] 12.1 Implement configuration download
    - Create endpoint in Client System API to serve meter configuration
    - Implement configuration download in Sync Service
    - Store configuration in Sync Database (meters)
    - Update Meter Collection Service to use downloaded configuration
    - _Requirements: 4.5_
  
  - [ ] 12.2 Implement configuration validation
    - Validate BACnet meter configuration format
    - Validate Client System API endpoint configuration
    - Validate database connection parameters
    - _Requirements: 7.3, 7.4, 7.5_

- [ ] 13. Implement monitoring and health checks
  - [ ] 13.1 Implement heartbeat mechanism
    - Create heartbeat sender in Sync Service
    - Send heartbeat to Client System every 5 minutes
    - Update sites.last_heartbeat in Client Database
    - _Requirements: 9.5_
  
  - [ ] 13.2 Add health check endpoints
    - Create GET /health endpoint in Client System API
    - Create GET /health endpoint in Sync local API
    - Include database connectivity status
    - Include service status (collection, sync)
    - _Requirements: 9.5_

- [ ] 14. Add data validation and security
  - [ ] 14.1 Implement request validation
    - Add express-validator schemas for batch upload endpoint
    - Validate meter_external_id, timestamp, data_point, value fields
    - Return 400 errors for invalid data
    - _Requirements: 8.4_
  
  - [ ] 14.2 Implement API security
    - Add rate limiting to sync endpoints (100 req/min per site)
    - Add HTTPS requirement for production
    - Add API key rotation mechanism
    - _Requirements: 2.4_


- [x] 15. Create database migrations



  - [x] 15.1 Create Client Database migrations


    - Create migration script for sites table
    - Create migration script for meters table
    - Create migration script for meter_readings table updates
    - Add rollback scripts
    - _Requirements: 8.3_
  


  - [ ] 15.2 Create Sync Database migrations
    - Create migration script for meters table
    - Create migration script for meter_readings table
    - Create migration script for sync_log table
    - Add rollback scripts
    - _Requirements: 8.3_

- [ ] 16. Integration and system testing
  - [ ] 16.1 Test Sync to Client System integration
    - Test authentication flow
    - Test batch upload with valid data
    - Test batch upload with invalid data
    - Test retry mechanism on failure
    - Test offline queueing and recovery
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 9.3, 9.4_
  
  - [ ] 16.2 Test Meter Collection Service
    - Test BACnet device discovery (with mock devices)
    - Test data point reading
    - Test error handling for unreachable meters
    - Test storage in Sync Database
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 16.3 Test end-to-end flow
    - Test full flow: BACnet read → local storage → sync → Client Database
    - Test offline operation: disconnect Client System → collect → reconnect → sync
    - Test Client Frontend displays synced data
    - Test Sync Frontend displays local data
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

#!/usr/bin/env node

/**
 * Sync MCP Server
 * 
 * Model Context Protocol server for Sync operations.
 * Provides AI tools for controlling meter collection, synchronization, and local data queries.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import winston from 'winston';
import { Pool } from 'pg';
import { syncPool, remotePool, initializePools, closePools } from './data-sync/data-sync.js';
import { MeterCollector, CollectorConfig } from './meter-collection/collector.js';
import { SyncManager, createSyncManagerFromEnv } from './remote_to_local-sync/sync-manager.js';
import { ClientSystemApiClient } from './api/client-system-api.js';
import { LocalApiServer, createAndStartLocalApiServer } from './api/server.js';
import { RemoteToLocalSyncAgent } from './remote_to_local-sync/sync-agent.js';
import { BACnetMeterReadingAgent } from './bacnet-collection/bacnet-reading-agent.js';
import { DeviceRegisterCache, MeterCache, TenantCache } from './cache/index.js';
import { SyncDatabase as SyncDatabaseInterface } from './types/entities.js';
import { SyncDatabase } from './data-sync/data-sync.js';

// Load environment variables from root .env file first, then local .env
// Use __dirname equivalent for ES modules
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') }); // Root .env
dotenv.config({ path: join(__dirname, '../.env') }); // Local .env to override if needed

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/sync-mcp-error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/sync-mcp.log'
    }),
  ],
});

/**
 * Sync MCP Server Class
 */
class SyncMcpServer {
  private server: Server;
  private syncDatabase?: SyncDatabase;
  private deviceRegisterCache?: DeviceRegisterCache;
  private meterCache?: MeterCache;
  private tenantCache?: TenantCache;
  private meterCollector?: MeterCollector;
  private syncManager?: SyncManager;
  private remoteToLocalSyncAgent?: RemoteToLocalSyncAgent;
  private bacnetMeterReadingAgent?: BACnetMeterReadingAgent;
  private apiServer?: LocalApiServer;
  private remotePool?: Pool;
  private isInitialized: boolean = false;

  constructor() {
    this.server = new Server(
      {
        name: 'sync-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }



  /**
   * Initialize services
   */
  private async initializeServices(): Promise<void> {
    if (this.isInitialized) {
      console.log('ℹ️  [Services] Already initialized, skipping...');
      return;
    }

    let remotePool: Pool | undefined;

    try {
      console.log('\n🔧 [Services] Initializing Sync MCP services...');

      // Initialize database pools
      console.log('🔗 [Services] Initializing database pools...');
      initializePools();
      console.log('✅ [Services] Database pools initialized');

      // Initialize BACnet Meter Reading Agent
      console.log('📊 [Services] Initializing BACnet Meter Reading Agent...');
      // Create a real database service
      this.syncDatabase = new SyncDatabase({ 
        host: process.env.POSTGRES_SYNC_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
        database: process.env.POSTGRES_SYNC_DB || 'postgres',
        user: process.env.POSTGRES_SYNC_USER || 'postgres',
        password: process.env.POSTGRES_SYNC_PASSWORD || '',
      });
      console.log('✅ [Services] SyncDatabase service created');
      
      this.bacnetMeterReadingAgent = new BACnetMeterReadingAgent({
        syncDatabase: this.syncDatabase,
        collectionIntervalSeconds: parseInt(process.env.BACNET_COLLECTION_INTERVAL_SECONDS || '60', 10),
        enableAutoStart: process.env.BACNET_AUTO_START !== 'false',
        bacnetInterface: process.env.BACNET_INTERFACE || '0.0.0.0',
        bacnetPort: parseInt(process.env.BACNET_PORT || '47808', 10),
        connectionTimeoutMs: parseInt(process.env.BACNET_CONNECTION_TIMEOUT_MS || '5000', 10),
        readTimeoutMs: parseInt(process.env.BACNET_READ_TIMEOUT_MS || '3000', 10),
        meterCache: this.meterCache,
        deviceRegisterCache: this.deviceRegisterCache,
      }, logger);
      console.log('✅ [Services] BACnet Meter Reading Agent initialized');

      // Load API key from environment variable
      const apiKeyFromEnv = process.env.CLIENT_API_KEY || '';
      if (apiKeyFromEnv) {
        console.log(`✅ [Services] API key loaded from environment: ${apiKeyFromEnv.substring(0, 8)}...`);
      } else {
        console.warn('⚠️  [Services] No API key in environment variable CLIENT_API_KEY');
      }

      // Initialize Meter Sync Agent FIRST (before caches)
      // This ensures device_register data is synced to local DB before cache loads
      console.log('🔄 [Services] Initializing Remote to Local Sync Agent...');
      remotePool = this.createRemoteDatabasePool();
      this.remotePool = remotePool;
      
      // Create empty caches for now - they'll be populated after sync
      this.deviceRegisterCache = new DeviceRegisterCache();
      this.meterCache = new MeterCache();
      this.tenantCache = new TenantCache();
      
      if (this.syncDatabase) {
        this.remoteToLocalSyncAgent = new RemoteToLocalSyncAgent({
          syncDatabase: this.syncDatabase,
          remotePool: remotePool,
          syncIntervalMinutes: parseInt(process.env.METER_SYNC_INTERVAL_MINUTES || '60', 10),
          enableAutoSync: process.env.METER_SYNC_AUTO_START !== 'false',
          bacnetMeterReadingAgent: this.bacnetMeterReadingAgent,
          deviceRegisterCache: this.deviceRegisterCache,
          meterCache: this.meterCache,
        });
        console.log('✅ [Services] Remote to Local Sync Agent initialized');

        // Start Meter Sync Agent (which includes tenant sync as Phase 0)
        console.log('▶️  [Services] Starting Remote to Local Sync Agent...');
        await this.remoteToLocalSyncAgent.start();
        console.log('✅ [Services] Remote to Local Sync Agent started');

        // NOW initialize caches AFTER sync
        console.log('📚 [Services] Initializing TenantCache (after sync)...');
        await this.tenantCache.initialize(this.syncDatabase);
        console.log('✅ [Services] TenantCache initialized');

        console.log('📚 [Services] Initializing DeviceRegisterCache (after sync)...');
        await this.deviceRegisterCache.initialize(this.syncDatabase);
        console.log('✅ [Services] DeviceRegisterCache initialized');

        // Initialize MeterCache AFTER sync
        console.log('🔄 [Services] Initializing MeterCache (after sync)...');
        await this.meterCache.reload(this.syncDatabase);
        console.log('✅ [Services] MeterCache initialized');
      }

      // Start BACnet Meter Reading Agent
      console.log('▶️  [Services] Starting BACnet Meter Reading Agent...');
      await this.bacnetMeterReadingAgent.start();
      console.log('✅ [Services] BACnet Meter Reading Agent started');

      // Store API key in local sync database tenant table
      console.log('🔑 [Services] Storing API key in local sync database...');
      try {
        const tenant = await this.syncDatabase.getTenant();
        if (tenant && apiKeyFromEnv) {
          // Update tenant with API key from environment
          await this.syncDatabase.updateTenantApiKey(apiKeyFromEnv);
          console.log(`✅ [Services] API key stored in database: ${apiKeyFromEnv.substring(0, 8)}...`);
        }
      } catch (err) {
        console.warn('⚠️  [Services] Failed to store API key in database:', err);
      }

      // Initialize Sync Manager
      console.log('🔄 [Services] Initializing Sync Manager...');
      try {
        // Load API key from environment (already loaded above)
        let apiKeyFromDb = apiKeyFromEnv;
        
        // Try to load from database as fallback
        if (!apiKeyFromDb) {
          try {
            if (this.syncDatabase) {
              const tenant = await this.syncDatabase.getTenant();
              if (tenant && tenant.api_key) {
                apiKeyFromDb = tenant.api_key;
                console.log(`✅ [Services] API key loaded from database: ${apiKeyFromDb.substring(0, 8)}...`);
              }
            }
          } catch (err) {
            console.warn('⚠️  [Services] Failed to load API key from database');
          }
        }

        const apiClient = new ClientSystemApiClient({
          apiUrl: process.env.CLIENT_API_URL || 'http://localhost:3001/api',
          apiKey: apiKeyFromDb,
          timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
          maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
        });
        console.log('✅ [Services] Client System API Client created');

        if (this.syncDatabase) {
          this.syncManager = createSyncManagerFromEnv(this.syncDatabase, apiClient);
          console.log('✅ [Services] Sync Manager initialized');

          // Start Sync Manager
          console.log('▶️  [Services] Starting Sync Manager...');
          await this.syncManager.start();
          console.log('✅ [Services] Sync Manager started');
        }
      } catch (error) {
        console.error('❌ [Services] Failed to initialize Sync Manager:', error);
        throw error;
      }

      // Initialize Local API Server
      console.log('🌐 [Services] Initializing Local API Server...');
      if (this.syncDatabase) {
        this.apiServer = await createAndStartLocalApiServer(this.syncDatabase, this.syncManager, this.remoteToLocalSyncAgent, this.bacnetMeterReadingAgent, remotePool);
        console.log('✅ [Services] Local API Server started');
      }

      this.isInitialized = true;
      console.log('✅ [Services] All services initialized successfully\n');
    } catch (error) {
      console.error('❌ [Services] Failed to initialize services:', error);
      if (remotePool) {
        await this.closeRemotePool(remotePool);
      }
      throw error;
    }
  }

  /**
   * Create remote database pool
   */
  private createRemoteDatabasePool(): Pool {
    return new Pool({
      host: process.env.POSTGRES_CLIENT_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_CLIENT_PORT || '5432', 10),
      database: process.env.POSTGRES_CLIENT_DB || 'postgres',
      user: process.env.POSTGRES_CLIENT_USER || 'postgres',
      password: process.env.POSTGRES_CLIENT_PASSWORD || '',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    } as any);
  }

  /**
   * Wait for tenant sync to complete by polling the database
   */
  private async waitForTenantSync(timeoutMs: number = 5000): Promise<void> {
    const startTime = Date.now();
    const pollIntervalMs = 100;

    while (Date.now() - startTime < timeoutMs) {
      try {
        if (this.syncDatabase) {
          const tenant = await this.syncDatabase.getTenant();
          if (tenant && tenant.api_key) {
            console.log('✅ [Services] Tenant sync completed - API key is available');
            return;
          }
        }
      } catch (error) {
        // Ignore errors during polling
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    console.warn('⚠️  [Services] Timeout waiting for tenant sync, proceeding anyway');
  }

  /**
   * Close remote database pool
   */
  private async closeRemotePool(pool: Pool): Promise<void> {
    try {
      await pool.end();
      console.log('✅ Remote pool closed');
    } catch (error) {
      console.error('Failed to close remote pool:', error);
    }
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Ensure services are initialized
        await this.initializeServices();

        // Route to appropriate tool handler
        switch (name) {
          case 'start_collection':
            return await this.handleStartCollection();

          case 'stop_collection':
            return await this.handleStopCollection();

          case 'get_sync_status':
            return await this.handleGetSyncStatus();

          case 'trigger_sync':
            return await this.handleTriggerSync();

          case 'query_meter_reading':
            return await this.handleQueryMeterReadings(args);

          case 'get_meter_status':
            return await this.handleGetMeterStatus(args);

          case 'trigger_meter_reading':
            return await this.handleTriggerMeterReading();

          case 'get_meter_reading_status':
            return await this.handleGetMeterReadingStatus();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool execution error (${name}):`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  /**
   * Get list of available tools
   */
  private getTools(): Tool[] {
    return [
      {
        name: 'start_collection',
        description: 'Start the Meter Collection Service to begin collecting data from BACnet meters',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'stop_collection',
        description: 'Stop the Meter Collection Service',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_sync_status',
        description: 'Get the current synchronization status including connectivity, queue size, and recent sync operations',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'trigger_sync',
        description: 'Manually trigger a synchronization operation to upload queued readings to the Client System',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'query_meter_reading',
        description: 'Query local meter readings with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            meter_id: {
              type: 'string',
              description: 'Filter by meter external ID (optional)',
            },
            hours: {
              type: 'number',
              description: 'Number of hours to look back (default: 24)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of readings to return (default: 100)',
            },
          },
        },
      },
      {
        name: 'get_meter_status',
        description: 'Get the connectivity and health status of BACnet meters',
        inputSchema: {
          type: 'object',
          properties: {
            meter_id: {
              type: 'string',
              description: 'Get status for specific meter (optional, returns all if omitted)',
            },
          },
        },
      },
      {
        name: 'trigger_meter_reading',
        description: 'Manually trigger an immediate BACnet meter reading collection cycle',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_meter_reading_status',
        description: 'Get the current status of the BACnet meter reading agent including cycle results and metrics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * Tool Handler: start_collection
   */
  private async handleStartCollection(): Promise<any> {
    if (!this.meterCollector) {
      throw new Error('Meter Collector not initialized');
    }

    const started = await this.meterCollector.start();

    if (started) {
      const status = await this.meterCollector.getStatus();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Meter collection started successfully',
              status,
            }, null, 2),
          },
        ],
      };
    } else {
      throw new Error('Failed to start meter collection');
    }
  }

  /**
   * Tool Handler: stop_collection
   */
  private async handleStopCollection(): Promise<any> {
    if (!this.meterCollector) {
      throw new Error('Meter Collector not initialized');
    }

    this.meterCollector.stop();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Meter collection stopped',
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Tool Handler: get_sync_status
   */
  private async handleGetSyncStatus(): Promise<any> {
    if (!this.syncManager) {
      throw new Error('Sync Manager not initialized');
    }

    const syncStatus = this.syncManager.getStatus();
    const connectivityStatus = this.syncManager.getConnectivityStatus();
    const syncStats = await this.syncManager.getSyncStats(24);
    // TODO: Implement getRecentSyncLogs when database service is available
    const recentLogs: any[] = [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            sync_status: syncStatus,
            connectivity: connectivityStatus,
            stats_24h: syncStats,
            recent_logs: recentLogs,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Tool Handler: trigger_sync
   */
  private async handleTriggerSync(): Promise<any> {
    if (!this.syncManager) {
      throw new Error('Sync Manager not initialized');
    }

    const statusBefore = this.syncManager.getStatus();

    if (!statusBefore.isClientConnected) {
      throw new Error('Client System is not reachable');
    }

    if (statusBefore.isRunning) {
      throw new Error('Sync is already in progress');
    }

    // Trigger sync
    await this.syncManager.triggerSync();

    const statusAfter = this.syncManager.getStatus();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Sync triggered successfully',
            queue_size_before: statusBefore.queueSize,
            queue_size_after: statusAfter.queueSize,
            last_sync_success: statusAfter.lastSyncSuccess,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Tool Handler: query_meter_reading
   */
  private async handleQueryMeterReadings(args: any): Promise<any> {
    const meterId = args.meter_id as string | undefined;
    const hours = (args.hours as number) || 24;
    const limit = (args.limit as number) || 100;

    let readings: any[] = [];

    if (meterId) {
      // Query specific meter
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
      // TODO: Implement getReadingsByMeterAndTimeRange when database service is available
      readings = [];
      readings = readings.slice(0, limit);
    } else {
      // Query all recent readings
      // TODO: Implement getRecentReadings when database service is available
      readings = [];
      readings = readings.slice(0, limit);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            count: readings.length,
            readings,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Tool Handler: get_meter_status
   */
  private async handleGetMeterStatus(args: any): Promise<any> {
    if (!this.meterCollector) {
      throw new Error('Meter Collector not initialized');
    }

    const meterId = args.meter_id as string | undefined;
    const status = await this.meterCollector.getStatus();

    if (meterId) {
      // Filter for specific meter
      const meterStatus = status.meters.find((m: any) => m.meter_id === meterId);
      if (!meterStatus) {
        throw new Error(`Meter not found: ${meterId}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(meterStatus, null, 2),
          },
        ],
      };
    } else {
      // Return all meters
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Tool Handler: trigger_meter_reading
   * Manually trigger an immediate BACnet meter reading collection cycle
   */
  private async handleTriggerMeterReading(): Promise<any> {
    if (!this.bacnetMeterReadingAgent) {
      throw new Error('BACnet Meter Reading Agent not initialized');
    }

    if (!this.bacnetMeterReadingAgent.getStatus().isRunning) {
      throw new Error('BACnet Meter Reading Agent is not running');
    }

    try {
      const result = await this.bacnetMeterReadingAgent.triggerCollection();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Meter reading collection cycle triggered successfully',
              cycle_result: {
                cycleId: result.cycleId,
                startTime: result.startTime,
                endTime: result.endTime,
                metersProcessed: result.metersProcessed,
                readingsCollected: result.readingsCollected,
                errorCount: result.errors.length,
                errors: result.errors,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to trigger meter reading collection: ${errorMsg}`);
    }
  }

  /**
   * Tool Handler: get_meter_reading_status
   * Get the current status of the BACnet meter reading agent
   */
  private async handleGetMeterReadingStatus(): Promise<any> {
    if (!this.bacnetMeterReadingAgent) {
      throw new Error('BACnet Meter Reading Agent not initialized');
    }

    const status = this.bacnetMeterReadingAgent.getStatus();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            agent_status: {
              isRunning: status.isRunning,
              totalCyclesExecuted: status.totalCyclesExecuted,
              totalReadingsCollected: status.totalReadingsCollected,
              totalErrorsEncountered: status.totalErrorsEncountered,
            },
            last_cycle_result: status.lastCycleResult ? {
              cycleId: status.lastCycleResult.cycleId,
              startTime: status.lastCycleResult.startTime,
              endTime: status.lastCycleResult.endTime,
              metersProcessed: status.lastCycleResult.metersProcessed,
              readingsCollected: status.lastCycleResult.readingsCollected,
              errorCount: status.lastCycleResult.errors.length,
              success: status.lastCycleResult.success,
            } : null,
            active_errors: status.activeErrors.map(err => ({
              meterId: err.meterId,
              dataPoint: err.dataPoint,
              operation: err.operation,
              error: err.error,
              timestamp: err.timestamp,
            })),
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    console.log('\n🚀 [MCP] Starting Sync MCP Server...');

    // Initialize services immediately (including Local API Server)
    console.log('🔧 [MCP] Initializing services before connecting transport...');
    await this.initializeServices();

    const transport = new StdioServerTransport();
    console.log('🔌 [MCP] Connecting to stdio transport...');
    await this.server.connect(transport);

    console.log('✅ [MCP] Sync MCP Server started');
    console.log('📋 [MCP] Available tools: start_collection, stop_collection, get_sync_status, trigger_sync, query_meter_reading, get_meter_status, trigger_meter_reading, get_meter_reading_status');
  }

  /**
   * Shutdown the server
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Sync MCP Server...');

    if (this.meterCollector) {
      await this.meterCollector.shutdown();
    }

    if (this.bacnetMeterReadingAgent) {
      await this.bacnetMeterReadingAgent.stop();
    }

    if (this.syncManager) {
      await this.syncManager.stop();
    }

    if (this.remoteToLocalSyncAgent) {
      await this.remoteToLocalSyncAgent.stop();
    }

    if (this.apiServer) {
      await this.apiServer.stop();
    }

    if (this.remotePool) {
      await this.closeRemotePool(this.remotePool);
    }

    // TODO: Implement close when database service is available
    // if (this.syncDatabase) {
    //   await this.syncDatabase.close();
    // }

    logger.info('Sync MCP Server shutdown complete');
  }
}

// Main execution
const server = new SyncMcpServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.shutdown();
  process.exit(0);
});

// Start server
server.start().catch((error) => {
  logger.error('Failed to start Sync MCP Server:', error);
  process.exit(1);
});

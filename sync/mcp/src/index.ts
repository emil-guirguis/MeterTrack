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
import { SyncDatabase, createDatabaseFromEnv } from './database/postgres.js';
import { MeterCollector, CollectorConfig } from './meter-collection/collector.js';
import { SyncManager, createSyncManagerFromEnv } from './sync-service/sync-manager.js';
import { ClientSystemApiClient } from './sync-service/api-client.js';
import { LocalApiServer, createAndStartLocalApiServer } from './api/server.js';

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
  private database: SyncDatabase;
  private meterCollector?: MeterCollector;
  private syncManager?: SyncManager;
  private apiServer?: LocalApiServer;
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

    // Initialize database
    this.database = createDatabaseFromEnv();

    this.setupHandlers();
  }

  /**
   * Create a remote database pool from environment variables
   */
  private createRemoteDatabasePool(): Pool {
    const remotePool = new Pool({
      host: process.env.POSTGRES_CLIENT_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_CLIENT_PORT || '5432', 10),
      database: process.env.POSTGRES_CLIENT_DB || 'postgres',
      user: process.env.POSTGRES_CLIENT_USER || 'postgres',
      password: process.env.POSTGRES_CLIENT_PASSWORD || '',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    remotePool.on('error', (err) => {
      console.error('Unexpected error on remote database idle client', err);
    });

    return remotePool;
  }

  /**
   * Synchronize tenant from remote database
   */
  private async syncTenantFromRemote(remotePool: Pool): Promise<void> {
    try {
      const tenantId = parseInt(process.env.TENANT_ID || '0', 10);

      if (tenantId === 0) {
        console.warn('⚠️  [Services] TENANT_ID not configured, skipping tenant sync');
        return;
      }

      console.log(`🔄 [Services] Synchronizing tenant ${tenantId} from remote database...`);
      const tenant = await this.database.syncTenantFromRemote(remotePool, tenantId);
      console.log(`✅ [Services] Tenant synchronized successfully:`, JSON.stringify(tenant, null, 2));
    } catch (error) {
      console.error('❌ [Services] Failed to synchronize tenant:', error);
      // Log error but don't fail initialization - tenant sync is important but not critical
      logger.error('Tenant sync error:', error);
    }
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

      // Test database connection
      console.log('🔗 [Services] Testing database connection...');
      const dbConnected = await this.database.testConnectionLocal();
      if (!dbConnected) {
        throw new Error('Failed to connect to Sync Database');
      }
      console.log('✅ [Services] Database connection established');

      // Validate tenant table exists
      console.log('📋 [Services] Validating tenant table...');
      const tenantData = await this.database.validateTenantTable();
      if (tenantData) {
        console.log('✅ [Services] Tenant table validated with existing data');
      } else if (tenantData === null) {
        // Table exists but is empty - this is OK, we'll sync from remote
        console.log('⚠️  [Services] Tenant table is empty');
      }

      // // Synchronize tenant from remote database
      // console.log('🔗 [Services] Connecting to remote database for tenant sync...');
      // remotePool = this.createRemoteDatabasePool();
      // await this.syncTenantFromRemote(remotePool);

      // // Initialize Meter Collector
      // console.log('📊 [Services] Initializing Meter Collector...');
      // const collectorConfig: CollectorConfig = {
      //   bacnet: {
      //     interface: process.env.BACNET_INTERFACE || '0.0.0.0',
      //     port: parseInt(process.env.BACNET_PORT || '47808', 10),
      //     broadcastAddress: process.env.BACNET_BROADCAST_ADDRESS || '255.255.255.255',
      //   },
      //   collectionInterval: parseInt(process.env.COLLECTION_INTERVAL_SECONDS || '60', 10),
      //   configPath: process.env.METER_CONFIG_PATH || 'config/meters.json',
      //   autoStart: false, // Don't auto-start, wait for MCP tool call
      // };

      // this.meterCollector = new MeterCollector(collectorConfig, this.database, logger);
      // console.log('✅ [Services] Meter Collector initialized');

      //   // Initialize Sync Manager
      //   console.log('🔄 [Services] Initializing Sync Manager...');
      //   const apiClient = new ClientSystemApiClient({
      //     apiUrl: process.env.CLIENT_API_URL || '',
      //     apiKey: process.env.CLIENT_API_KEY || '',
      //     timeout: parseInt(process.env.API_TIMEOUT_MS || '30000', 10),
      //   });

      //   this.syncManager = createSyncManagerFromEnv(this.database, apiClient);
      //   console.log('✅ [Services] Sync Manager initialized');

      //   // Start Sync Manager (for scheduled sync)
      //   console.log('▶️  [Services] Starting Sync Manager...');
      //   await this.syncManager.start();
      //   console.log('✅ [Services] Sync Manager started');

        // Initialize Local API Server
        console.log('🌐 [Services] Initializing Local API Server...');
        this.apiServer = await createAndStartLocalApiServer(this.database, this.syncManager);
        console.log('✅ [Services] Local API Server started');

        this.isInitialized = true;
        console.log('✅ [Services] All services initialized successfully\n');
      } catch (error) {
        console.error('❌ [Services] Failed to initialize services:', error);
        throw error;
    } finally {
      // Close remote pool after initialization
      if (remotePool) {
        await this.closeRemotePool(remotePool);
      }
      //   }
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
    const recentLogs = await this.database.getRecentSyncLogs(10);

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

    let readings;

    if (meterId) {
      // Query specific meter
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
      readings = await this.database.getReadingsByMeterAndTimeRange(meterId, startTime, endTime);
      readings = readings.slice(0, limit);
    } else {
      // Query all recent readings
      readings = await this.database.getRecentReadings(hours);
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
      const meterStatus = status.meters.find((m: any) => m.id === meterId);
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
    console.log('📋 [MCP] Available tools: start_collection, stop_collection, get_sync_status, trigger_sync, query_meter_reading, get_meter_status');
  }

  /**
   * Shutdown the server
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Sync MCP Server...');

    if (this.meterCollector) {
      await this.meterCollector.shutdown();
    }

    if (this.syncManager) {
      await this.syncManager.stop();
    }

    if (this.apiServer) {
      await this.apiServer.stop();
    }

    await this.database.close();

    logger.info('Sync MCP Server shutdown complete');
  }

  /**
   * Close remote database pool
   */
  private async closeRemotePool(remotePool: Pool): Promise<void> {
    try {
      await remotePool.end();
      console.log('✅ [Services] Remote database pool closed');
    } catch (error) {
      console.error('❌ [Services] Error closing remote database pool:', error);
    }
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

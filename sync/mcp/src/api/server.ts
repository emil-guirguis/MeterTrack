/**
 * Sync Local API Server
 * 
 * Provides HTTP endpoints for the Sync Frontend to query local data and trigger sync operations.
 * This API serves only local network requests and does not expose data to the internet.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { syncPool } from '../data-sync/data-sync.js';
import { SyncManager } from '../sync-service/sync-manager.js';
import { MeterSyncAgent } from '../sync-service/meter-sync-agent.js';
import { BACnetMeterReadingAgent } from '../bacnet-collection/bacnet-reading-agent.js';
import { SyncDatabase, TenantEntity } from '../types/entities.js';


export interface LocalApiServerConfig {
  port: number;
  database: SyncDatabase;
  syncManager?: SyncManager;
  meterSyncAgent?: MeterSyncAgent;
  bacnetMeterReadingAgent?: BACnetMeterReadingAgent;
}

export class LocalApiServer {
  private app: express.Application;
  private port: number;
  private database: SyncDatabase;
  private syncManager?: SyncManager;
  private meterSyncAgent?: MeterSyncAgent;
  private bacnetMeterReadingAgent?: BACnetMeterReadingAgent;
  private server?: any;

  constructor(config: LocalApiServerConfig) {
    this.port = config.port;
    this.database = config.database;
    this.syncManager = config.syncManager;
    this.meterSyncAgent = config.meterSyncAgent;
    this.bacnetMeterReadingAgent = config.bacnetMeterReadingAgent;
    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Enable CORS for local network access
    this.app.use(cors({
      origin: '*', // Allow all origins on local network
      methods: ['GET', 'POST'],
    }));

    // Parse JSON bodies
    this.app.use(express.json());

    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`\n🌐 [API] ${new Date().toISOString()} - ${req.method} ${req.path}`);
      console.log(`   Client IP: ${req.ip}`);
      console.log(`   User Agent: ${req.get('user-agent')}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Health check for sync database
    this.app.get('/api/health/sync-db', async (_req, res, next) => {
      try {
        console.log('📥 [API] GET /api/health/sync-db - Request received');
        const result = await syncPool.query('SELECT NOW()');
        console.log('✅ [API] Sync database is healthy');
        res.json({ 
          status: 'ok', 
          database: 'sync',
          timestamp: result.rows[0].now,
        });
      } catch (error) {
        console.error('❌ [API] Sync database health check failed:', error);
        res.status(503).json({ 
          status: 'error', 
          database: 'sync',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Health check for remote database
    this.app.get('/api/health/remote-db', async (_req, res, next) => {
      try {
        console.log('📥 [API] GET /api/health/remote-db - Request received');
        // Note: This would need remotePool to be passed in or available
        console.log('✅ [API] Remote database health check endpoint available');
        res.json({ 
          status: 'ok', 
          database: 'remote',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('❌ [API] Remote database health check failed:', error);
        res.status(503).json({ 
          status: 'error', 
          database: 'remote',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Get all meters
    this.app.get('/api/local/meters', async (_req, res, next) => {
      try {
        console.log('📥 [API] GET /api/local/meters - Request received');
        const meters = await this.database.getMeters(true);
        console.log(`📤 [API] GET /api/local/meters - Returning ${meters.length} meter(s)`);
        res.json(meters);
        console.log('✅ [API] GET /api/local/meters - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] GET /api/local/meters - Error:', error);
        next(error);
      }
    });

    // Get recent readings
    this.app.get('/api/local/readings', async (req, res, next) => {
      try {
        const hours = parseInt(req.query.hours as string) || 24;
        console.log(`📥 [API] GET /api/local/readings - Request received (hours: ${hours})`);
        
        // Query the local sync database for recent readings
        const query = `
          SELECT 
            id,
            meter_id,
            timestamp,
            data_point,
            value,
            unit,
            is_synchronized,
            retry_count
          FROM meter_reading
          WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
          ORDER BY timestamp DESC
          LIMIT 1000
        `;
        
        const result = await syncPool.query(query);
        const readings = result.rows;
        
        console.log(`📤 [API] GET /api/local/readings - Returning ${readings.length} reading(s)`);
        res.json(readings);
        console.log('✅ [API] GET /api/local/readings - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] GET /api/local/readings - Error:', error);
        next(error);
      }
    });

    // Get tenant information GET api/local/tenant
    this.app.get('/api/local/tenant', async (_req, res, next) => {
       try {
        console.log('📥 [API] GET /api/local/tenant - Request received');
        
        // First, check if the tenant table exists and has data
        console.log('🔍 [API] Checking tenant table...');
        try {
          const countQuery = `SELECT COUNT(*) as count FROM tenant`;
          console.log('   Executing count query...');
          const countResult = await syncPool.query(countQuery);
          const tenantCount = parseInt(countResult.rows[0].count, 10);
          console.log(`📊 [API] Tenant table has ${tenantCount} record(s)`);
          
          if (tenantCount === 0) {
            console.warn('⚠️  [API] No tenant records found in database');
            res.json(null);
            console.log('✅ [API] GET /api/local/tenant - Response sent (null)');
            return;
          }
          
          if (tenantCount > 1) {
            console.warn(`⚠️  [API] Multiple tenant records found (${tenantCount}), returning first one`);
          }
        } catch (countErr) {
          console.error('❌ [API] Error checking tenant count:', countErr);
          console.error('   Error details:', {
            message: countErr instanceof Error ? countErr.message : String(countErr),
            code: (countErr as any)?.code,
            detail: (countErr as any)?.detail,
          });
          throw countErr;
        }
        
        // Query only the columns that exist in the sync database
        const query = `
          SELECT id, name, url, street, street2, city, state, zip, country, active
          FROM tenant
          LIMIT 1
        `;
        
        console.log('🔍 [API] Executing tenant query...');
        const result = await syncPool.query(query);
        const tenant = result.rows[0] || null;
        
        console.log('📤 [API] GET /api/local/tenant - Returning:', JSON.stringify(tenant, null, 2));
        res.json(tenant);
        console.log('✅ [API] GET /api/local/tenant - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] GET /api/local/tenant - Error:', error);
        console.error('   Error details:', {
          message: error instanceof Error ? error.message : String(error),
          code: (error as any)?.code,
          detail: (error as any)?.detail,
          hint: (error as any)?.hint,
          stack: error instanceof Error ? error.stack : undefined,
        });
        next(error);
      }
    });

    // Create or update tenant information POST api/local/tenant
    this.app.post('/api/local/tenant', async (req, res, next) => {
      try {
        console.log('📥 [API] POST /api/local/tenant - Request received');
        console.log('   Payload:', JSON.stringify(req.body, null, 2));
        
        const { id, name, url, street, street2, city, state, zip, country, active } = req.body;
        
        if (!name) {
          console.error('❌ [API] POST /api/local/tenant - Missing required field: name');
          return res.status(400).json({ error: 'Missing required field: name' });
        }

        // Upsert tenant into local sync database
        const query = `
          INSERT INTO tenant (id, name, url, street, street2, city, state, zip, country, active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            name = $2,
            url = $3,
            street = $4,
            street2 = $5,
            city = $6,
            state = $7,
            zip = $8,
            country = $9,
            active = $10
          RETURNING id, name, url, street, street2, city, state, zip, country, active
        `;
        
        const result = await syncPool.query(query, [
          id || 1,
          name,
          url || null,
          street || null,
          street2 || null,
          city || null,
          state || null,
          zip || null,
          country || null,
          active !== undefined ? active : true,
        ]);
        
        const tenant = result.rows[0];

        console.log('📤 [API] POST /api/local/tenant - Returning:', JSON.stringify(tenant, null, 2));
        res.json(tenant);
        console.log('✅ [API] POST /api/local/tenant - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] POST /api/local/tenant - Error:', error);
        next(error);
      }
    });

    // Get sync status
    this.app.get('/api/local/sync-status', async (_req, res, next) => {
      try {
        console.log('📥 [API] GET /api/local/sync-status - Request received');
        
        let queueSize = 0;
        let recentLogs: any[] = [];
        

        
        try {
          // Query recent sync logs from local sync database
          const logsQuery = `
            SELECT id, batch_size, success, error_message, synced_at
            FROM sync_log
            ORDER BY synced_at DESC
            LIMIT 10
          `;
          const logsResult = await syncPool.query(logsQuery);
          recentLogs = logsResult.rows;
        } catch (err) {
          console.error('❌ [API] Error getting recent logs:', err);
        }
        
        // Get last successful sync
        const successfulLogs = recentLogs.filter((log: any) => log.success);
        const lastSuccessfulSync = successfulLogs.length > 0 
          ? successfulLogs[0].synced_at 
          : null;

        // Get recent errors (last 10 failed syncs)
        const errorLogs = recentLogs
          .filter((log: any) => !log.success)
          .slice(0, 10)
          .map((log: any) => ({
            id: log.id,
            batch_size: log.batch_size,
            error_message: log.error_message || 'Unknown error',
            synced_at: log.synced_at,
          }));

        // Get connectivity status from sync manager if available
        let isConnected = false;
        if (this.syncManager) {
          const syncStatus = this.syncManager.getStatus();
          isConnected = syncStatus.isClientConnected;
        }

        const response = {
          is_connected: isConnected,
          last_sync_at: lastSuccessfulSync,
          queue_size: queueSize,
          sync_errors: errorLogs,
        };
        console.log(`📤 [API] GET /api/local/sync-status - Returning:`, JSON.stringify(response, null, 2));
        res.json(response);
        console.log('✅ [API] GET /api/local/sync-status - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] GET /api/local/sync-status - Error:', error);
        next(error);
      }
    });

    // Trigger manual sync
    this.app.post('/api/local/sync-trigger', async (_req, res, next) => {
      try {
        console.log('📥 [API] POST /api/local/sync-trigger - Request received');
        if (!this.syncManager) {
          console.error('❌ [API] Sync manager not available');
          return res.status(503).json({ 
            error: 'Sync manager not available' 
          });
        }

        const syncStatus = this.syncManager.getStatus();
        if (!syncStatus.isClientConnected) {
          console.error('❌ [API] Client System is not reachable');
          return res.status(503).json({ 
            error: 'Client System is not reachable' 
          });
        }

        if (syncStatus.isRunning) {
          console.warn('⚠️  [API] Sync is already in progress');
          return res.status(409).json({ 
            error: 'Sync is already in progress' 
          });
        }

        // Trigger sync asynchronously
        this.syncManager.triggerManualSync().catch(error => {
          console.error('❌ [API] Manual sync failed:', error);
        });

        const response = { 
          message: 'Sync triggered successfully',
          queue_size: syncStatus.queueSize,
        };
        console.log(`📤 [API] POST /api/local/sync-trigger - Returning:`, JSON.stringify(response, null, 2));
        res.json(response);
        console.log('✅ [API] POST /api/local/sync-trigger - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] POST /api/local/sync-trigger - Error:', error);
        next(error);
      }
    });

    // Get meter sync status
    this.app.get('/api/local/meter-sync-status', async (_req, res, next) => {
      try {
        console.log('📥 [API] GET /api/local/meter-sync-status - Request received');
        
        if (!this.meterSyncAgent) {
          console.error('❌ [API] Meter sync agent not available');
          return res.status(503).json({ 
            error: 'Meter sync agent not available' 
          });
        }

        const syncStatus = this.meterSyncAgent.getStatus();
        
        // Get meter count from database
        let meterCount = 0;
        try {
          const meters = await this.database.getMeters(true);
          meterCount = meters.length;
        } catch (err) {
          console.error('❌ [API] Error getting meter count:', err);
        }

        const response = {
          last_sync_at: syncStatus.lastSyncTime || null,
          last_sync_success: syncStatus.lastSyncSuccess !== undefined ? syncStatus.lastSyncSuccess : null,
          last_sync_error: syncStatus.lastSyncError || null,
          inserted_count: syncStatus.lastInsertedCount,
          updated_count: syncStatus.lastUpdatedCount,
          deleted_count: syncStatus.lastDeletedCount,
          meter_count: meterCount,
          is_syncing: syncStatus.isSyncing,
        };

        console.log(`📤 [API] GET /api/local/meter-sync-status - Returning:`, JSON.stringify(response, null, 2));
        res.json(response);
        console.log('✅ [API] GET /api/local/meter-sync-status - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] GET /api/local/meter-sync-status - Error:', error);
        next(error);
      }
    });

    // Trigger manual meter sync
    this.app.post('/api/local/meter-sync-trigger', async (_req, res, next) => {
      try {
        console.log('📥 [API] POST /api/local/meter-sync-trigger - Request received');
        
        if (!this.meterSyncAgent) {
          console.error('❌ [API] Meter sync agent not available');
          return res.status(503).json({ 
            success: false,
            message: 'Meter sync agent not available',
          });
        }

        const syncStatus = this.meterSyncAgent.getStatus();
        
        if (syncStatus.isSyncing) {
          console.warn('⚠️  [API] Meter sync is already in progress');
          return res.status(409).json({ 
            success: false,
            message: 'Meter sync is already in progress',
          });
        }

        // Trigger sync
        console.log('🔄 [API] Triggering meter sync...');
        const result = await this.meterSyncAgent.triggerSync();

        const response = {
          success: result.success,
          message: result.success 
            ? 'Meter sync completed successfully'
            : `Meter sync failed: ${result.error}`,
          result: {
            inserted: result.inserted,
            updated: result.updated,
            deleted: result.deleted,
            timestamp: result.timestamp,
          },
        };

        console.log(`📤 [API] POST /api/local/meter-sync-trigger - Returning:`, JSON.stringify(response, null, 2));
        res.json(response);
        console.log('✅ [API] POST /api/local/meter-sync-trigger - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] POST /api/local/meter-sync-trigger - Error:', error);
        next(error);
      }
    });

    // Get BACnet meter reading agent status
    this.app.get('/api/meter-reading/status', async (_req, res, next) => {
      try {
        console.log('📥 [API] GET /api/meter-reading/status - Request received');
        
        if (!this.bacnetMeterReadingAgent) {
          console.error('❌ [API] BACnet meter reading agent not available');
          return res.status(503).json({ 
            error: 'BACnet meter reading agent not available',
          });
        }

        const agentStatus = this.bacnetMeterReadingAgent.getStatus();
        
        const response = {
          agent_status: {
            isRunning: agentStatus.isRunning,
            totalCyclesExecuted: agentStatus.totalCyclesExecuted,
            totalReadingsCollected: agentStatus.totalReadingsCollected,
            totalErrorsEncountered: agentStatus.totalErrorsEncountered,
          },
          last_cycle_result: agentStatus.lastCycleResult ? {
            cycleId: agentStatus.lastCycleResult.cycleId,
            startTime: agentStatus.lastCycleResult.startTime,
            endTime: agentStatus.lastCycleResult.endTime,
            metersProcessed: agentStatus.lastCycleResult.metersProcessed,
            readingsCollected: agentStatus.lastCycleResult.readingsCollected,
            errorCount: agentStatus.lastCycleResult.errors.length,
            success: agentStatus.lastCycleResult.success,
          } : null,
          active_errors: agentStatus.activeErrors.map(err => ({
            meterId: err.meterId,
            dataPoint: err.dataPoint,
            operation: err.operation,
            error: err.error,
            timestamp: err.timestamp,
          })),
        };

        console.log(`📤 [API] GET /api/meter-reading/status - Returning:`, JSON.stringify(response, null, 2));
        res.json(response);
        console.log('✅ [API] GET /api/meter-reading/status - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] GET /api/meter-reading/status - Error:', error);
        next(error);
      }
    });

    // Trigger manual BACnet meter reading collection
    this.app.post('/api/meter-reading/trigger', async (_req, res, next) => {
      debugger; // Add this line
      try {
        console.log('📥 [API] POST /api/meter-reading/trigger - Request received');
        
        if (!this.bacnetMeterReadingAgent) {
          console.error('❌ [API] BACnet meter reading agent not available');
          return res.status(503).json({ 
            success: false,
            error: 'BACnet meter reading agent not available',
          });
        }

        const agentStatus = this.bacnetMeterReadingAgent.getStatus();
        
        if (!agentStatus.isRunning) {
          console.error('❌ [API] BACnet meter reading agent is not running');
          return res.status(503).json({ 
            success: false,
            error: 'BACnet meter reading agent is not running',
          });
        }

        // Trigger collection cycle
        console.log('🔄 [API] Triggering BACnet meter reading collection...');
        const result = await this.bacnetMeterReadingAgent.triggerCollection();

        const response = {
          success: true,
          message: 'Meter reading collection cycle triggered successfully',
          cycle_result: {
            cycleId: result.cycleId,
            startTime: result.startTime,
            endTime: result.endTime,
            metersProcessed: result.metersProcessed,
            readingsCollected: result.readingsCollected,
            errorCount: result.errors.length,
            errors: result.errors.map(err => ({
              meterId: err.meterId,
              dataPoint: err.dataPoint,
              operation: err.operation,
              error: err.error,
              timestamp: err.timestamp,
            })),
          },
        };

        console.log(`📤 [API] POST /api/meter-reading/trigger - Returning:`, JSON.stringify(response, null, 2));
        res.json(response);
        console.log('✅ [API] POST /api/meter-reading/trigger - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] POST /api/meter-reading/trigger - Error:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        res.status(409).json({
          success: false,
          error: errorMsg,
        });
      }
    });
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      console.warn(`⚠️  [API] 404 Not Found: ${req.method} ${req.path}`);
      res.status(404).json({ error: 'Not found' });
    });

    // Error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('❌ [API] Internal Server Error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: err.message,
      });
    });
  }

  /**
   * Start the API server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`\n🚀 [API Server] Starting Local API Server on port ${this.port}...`);
        this.server = this.app.listen(this.port, () => {
          console.log(`✅ [API Server] Local API server listening on port ${this.port}`);
          console.log(`   Health check: http://localhost:${this.port}/health`);
          console.log(`   Tenant endpoint: http://localhost:${this.port}/api/local/tenant`);
          console.log(`   Meters endpoint: http://localhost:${this.port}/api/local/meters`);
          console.log(`   Readings endpoint: http://localhost:${this.port}/api/local/readings`);
          console.log(`   Sync status endpoint: http://localhost:${this.port}/api/local/sync-status`);
          console.log(`   Meter sync status endpoint: http://localhost:${this.port}/api/local/meter-sync-status`);
          console.log(`   Meter sync trigger endpoint: http://localhost:${this.port}/api/local/meter-sync-trigger`);
          console.log(`   Meter reading status endpoint: http://localhost:${this.port}/api/meter-reading/status`);
          console.log(`   Meter reading trigger endpoint: http://localhost:${this.port}/api/meter-reading/trigger\n`);
          resolve();
        });

        this.server.on('error', (error: Error) => {
          console.error('❌ [API Server] Failed to start API server:', error);
          reject(error);
        });
      } catch (error) {
        console.error('❌ [API Server] Exception during startup:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err: Error) => {
        if (err) {
          console.error('Error stopping API server:', err);
          reject(err);
        } else {
          console.log('Local API server stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Set sync manager (can be set after construction)
   */
  setSyncManager(syncManager: SyncManager): void {
    this.syncManager = syncManager;
  }
}

/**
 * Create and start local API server from environment variables
 */
export async function createAndStartLocalApiServer(
  database: SyncDatabase,
  syncManager?: SyncManager,
  meterSyncAgent?: MeterSyncAgent,
  bacnetMeterReadingAgent?: BACnetMeterReadingAgent
): Promise<LocalApiServer> {
  const port = parseInt(process.env.LOCAL_API_PORT || '3002', 10);

  const server = new LocalApiServer({
    port,
    database,
    syncManager,
    meterSyncAgent,
    bacnetMeterReadingAgent,
  });

  await server.start();
  return server;
}

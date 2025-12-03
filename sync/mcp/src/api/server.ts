/**
 * Sync Local API Server
 * 
 * Provides HTTP endpoints for the Sync Frontend to query local data and trigger sync operations.
 * This API serves only local network requests and does not expose data to the internet.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { SyncDatabase } from '../database/postgres.js';
import { SyncManager } from '../sync-service/sync-manager.js';

export interface LocalApiServerConfig {
  port: number;
  database: SyncDatabase;
  syncManager?: SyncManager;
}

export class LocalApiServer {
  private app: express.Application;
  private port: number;
  private database: SyncDatabase;
  private syncManager?: SyncManager;
  private server?: any;

  constructor(config: LocalApiServerConfig) {
    this.port = config.port;
    this.database = config.database;
    this.syncManager = config.syncManager;
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
        const readings = await this.database.getRecentReadings(hours);
        console.log(`📤 [API] GET /api/local/readings - Returning ${readings.length} reading(s)`);
        res.json(readings);
        console.log('✅ [API] GET /api/local/readings - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] GET /api/local/readings - Error:', error);
        next(error);
      }
    });

    // Get tenant information
    this.app.get('/api/local/tenant', async (_req, res, next) => {
      try {
        console.log('📥 [API] GET /api/local/tenant - Request received');
        const tenant = await this.database.getTenant();
        console.log('📤 [API] GET /api/local/tenant - Returning:', JSON.stringify(tenant, null, 2));
        res.json(tenant);
        console.log('✅ [API] GET /api/local/tenant - Response sent successfully');
      } catch (error) {
        console.error('❌ [API] GET /api/local/tenant - Error:', error);
        next(error);
      }
    });

    // Create or update tenant information
    this.app.post('/api/local/tenant', async (req, res, next) => {
      try {
        console.log('📥 [API] POST /api/local/tenant - Request received');
        console.log('   Payload:', JSON.stringify(req.body, null, 2));
        
        const { name, external_id, url, address, address2, city, state, zip, country, active } = req.body;
        
        if (!name) {
          console.error('❌ [API] POST /api/local/tenant - Missing required field: name');
          return res.status(400).json({ error: 'Missing required field: name' });
        }

        const tenant = await this.database.upsertTenant({
          name,
          external_id,
          url,
          address,
          address2,
          city,
          state,
          zip,
          country,
          active,
        });

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
          queueSize = await this.database.getUnsynchronizedCount();
        } catch (err) {
          console.error('❌ [API] Error getting queue size:', err);
        }
        
        try {
          recentLogs = await this.database.getRecentSyncLogs(10);
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
          console.log(`   Sync status endpoint: http://localhost:${this.port}/api/local/sync-status\n`);
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
  syncManager?: SyncManager
): Promise<LocalApiServer> {
  const port = parseInt(process.env.LOCAL_API_PORT || '3002', 10);

  const server = new LocalApiServer({
    port,
    database,
    syncManager,
  });

  await server.start();
  return server;
}

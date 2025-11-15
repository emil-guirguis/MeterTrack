/**
 * Sync Local API Server
 *
 * Provides HTTP endpoints for the Sync Frontend to query local data and trigger sync operations.
 * This API serves only local network requests and does not expose data to the internet.
 */
import express from 'express';
import cors from 'cors';
export class LocalApiServer {
    app;
    port;
    database;
    syncManager;
    server;
    constructor(config) {
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
    setupMiddleware() {
        // Enable CORS for local network access
        this.app.use(cors({
            origin: '*', // Allow all origins on local network
            methods: ['GET', 'POST'],
        }));
        // Parse JSON bodies
        this.app.use(express.json());
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        // Get all meters
        this.app.get('/api/local/meters', async (req, res, next) => {
            try {
                const meters = await this.database.getMeters(true);
                res.json(meters);
            }
            catch (error) {
                next(error);
            }
        });
        // Get recent readings
        this.app.get('/api/local/readings', async (req, res, next) => {
            try {
                const hours = parseInt(req.query.hours) || 24;
                const readings = await this.database.getRecentReadings(hours);
                res.json(readings);
            }
            catch (error) {
                next(error);
            }
        });
        // Get sync status
        this.app.get('/api/local/sync-status', async (req, res, next) => {
            try {
                const queueSize = await this.database.getUnsynchronizedCount();
                const recentLogs = await this.database.getRecentSyncLogs(10);
                // Get last successful sync
                const successfulLogs = recentLogs.filter(log => log.success);
                const lastSuccessfulSync = successfulLogs.length > 0
                    ? successfulLogs[0].synced_at
                    : null;
                // Get recent errors (last 10 failed syncs)
                const errorLogs = recentLogs
                    .filter(log => !log.success)
                    .slice(0, 10)
                    .map(log => ({
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
                res.json({
                    is_connected: isConnected,
                    last_sync_at: lastSuccessfulSync,
                    queue_size: queueSize,
                    sync_errors: errorLogs,
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Trigger manual sync
        this.app.post('/api/local/sync-trigger', async (req, res, next) => {
            try {
                if (!this.syncManager) {
                    return res.status(503).json({
                        error: 'Sync manager not available'
                    });
                }
                const syncStatus = this.syncManager.getStatus();
                if (!syncStatus.isClientConnected) {
                    return res.status(503).json({
                        error: 'Client System is not reachable'
                    });
                }
                if (syncStatus.isRunning) {
                    return res.status(409).json({
                        error: 'Sync is already in progress'
                    });
                }
                // Trigger sync asynchronously
                this.syncManager.triggerManualSync().catch(error => {
                    console.error('Manual sync failed:', error);
                });
                res.json({
                    message: 'Sync triggered successfully',
                    queue_size: syncStatus.queueSize,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Setup error handling middleware
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Not found' });
        });
        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('API Error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: err.message,
            });
        });
    }
    /**
     * Start the API server
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    console.log(`Local API server listening on port ${this.port}`);
                    console.log(`Health check: http://localhost:${this.port}/health`);
                    resolve();
                });
                this.server.on('error', (error) => {
                    console.error('Failed to start API server:', error);
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Stop the API server
     */
    async stop() {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }
            this.server.close((err) => {
                if (err) {
                    console.error('Error stopping API server:', err);
                    reject(err);
                }
                else {
                    console.log('Local API server stopped');
                    resolve();
                }
            });
        });
    }
    /**
     * Set sync manager (can be set after construction)
     */
    setSyncManager(syncManager) {
        this.syncManager = syncManager;
    }
}
/**
 * Create and start local API server from environment variables
 */
export async function createAndStartLocalApiServer(database, syncManager) {
    const port = parseInt(process.env.LOCAL_API_PORT || '3002', 10);
    const server = new LocalApiServer({
        port,
        database,
        syncManager,
    });
    await server.start();
    return server;
}

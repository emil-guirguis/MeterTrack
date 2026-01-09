/**
 * Sync Local API Server
 *
 * Provides HTTP endpoints for the Sync Frontend to query local data and trigger sync operations.
 * This API serves only local network requests and does not expose data to the internet.
 */
import { SyncManager } from '../remote_to_local-sync/sync-manager.js';
import { RemoteToLocalSyncAgent } from '../remote_to_local-sync/sync-agent.js';
import { BACnetMeterReadingAgent } from '../bacnet-collection/bacnet-reading-agent.js';
import { SyncDatabase } from '../types/entities.js';
import { Pool } from 'pg';
export interface LocalApiServerConfig {
    port: number;
    database: SyncDatabase;
    syncManager?: SyncManager;
    remoteToLocalSyncAgent?: RemoteToLocalSyncAgent;
    bacnetMeterReadingAgent?: BACnetMeterReadingAgent;
    remotePool?: Pool;
}
export declare class LocalApiServer {
    private app;
    private port;
    private database;
    private syncManager?;
    private remoteToLocalSyncAgent?;
    private bacnetMeterReadingAgent?;
    private remotePool?;
    private server?;
    constructor(config: LocalApiServerConfig);
    /**
     * Setup Express middleware
     */
    private setupMiddleware;
    /**
     * Setup API routes
     */
    private setupRoutes;
    /**
     * Setup error handling middleware
     */
    private setupErrorHandling;
    /**
     * Start the API server
     */
    start(): Promise<void>;
    /**
     * Stop the API server
     */
    stop(): Promise<void>;
    /**
     * Set sync manager (can be set after construction)
     */
    setSyncManager(syncManager: SyncManager): void;
}
/**
 * Create and start local API server from environment variables
 */
export declare function createAndStartLocalApiServer(database: SyncDatabase, syncManager?: SyncManager, remoteToLocalSyncAgent?: RemoteToLocalSyncAgent, bacnetMeterReadingAgent?: BACnetMeterReadingAgent, remotePool?: Pool): Promise<LocalApiServer>;

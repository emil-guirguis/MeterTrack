import { EventEmitter } from 'events';
import winston from 'winston';
import { 
  ConnectionPool, 
  ConnectionPoolConfig, 
  ModbusClientConfig, 
  ModbusConnection,
  ModbusError,
  ModbusErrorType
} from './types/modbus.js';
import { EnhancedModbusClient } from './enhanced-modbus-client.js';

interface PooledConnection {
  connection: EnhancedModbusClient;
  id: string;
  config: ModbusClientConfig;
  inUse: boolean;
  lastUsed: Date;
  createdAt: Date;
  usageCount: number;
  healthCheckFailed: number;
}

interface ConnectionRequest {
  config: ModbusClientConfig;
  resolve: (connection: EnhancedModbusClient) => void;
  reject: (error: Error) => void;
  timestamp: Date;
  timeout: NodeJS.Timeout;
}

/**
 * Connection pool for managing multiple Modbus connections efficiently
 * Supports connection reuse, automatic cleanup, and health monitoring
 */
export class ModbusConnectionPool extends EventEmitter implements ConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private pendingRequests: ConnectionRequest[] = [];
  private config: ConnectionPoolConfig;
  private logger: winston.Logger;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isShuttingDown: boolean = false;

  // Pool statistics
  private stats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    failedConnections: 0,
    pendingRequests: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0
  };

  constructor(config: Partial<ConnectionPoolConfig>, logger: winston.Logger) {
    super();
    this.config = {
      maxConnections: config.maxConnections ?? 10,
      idleTimeout: config.idleTimeout ?? 300000, // 5 minutes
      acquireTimeout: config.acquireTimeout ?? 30000, // 30 seconds
      createRetryInterval: config.createRetryInterval ?? 5000, // 5 seconds
      maxRetries: config.maxRetries ?? 3,
      healthCheckInterval: config.healthCheckInterval ?? 60000, // 1 minute
    };
    this.logger = logger;
    this.startHealthCheck();
    this.startCleanup();
  }

  public async getConnection(config: ModbusClientConfig): Promise<EnhancedModbusClient> {
    if (this.isShuttingDown) {
      throw new ModbusError(
        'Connection pool is shutting down',
        ModbusErrorType.POOL_EXHAUSTED
      );
    }

    this.stats.totalRequests++;
    const connectionKey = this.getConnectionKey(config);

    // Try to find an existing idle connection
    const existingConnection = this.findIdleConnection(connectionKey);
    if (existingConnection) {
      this.markConnectionInUse(existingConnection);
      this.stats.successfulRequests++;
      this.logger.debug(`Reusing existing connection: ${connectionKey}`);
      return existingConnection.connection;
    }

    // Check if we can create a new connection
    if (this.stats.totalConnections < this.config.maxConnections) {
      try {
        const newConnection = await this.createConnection(config);
        this.stats.successfulRequests++;
        return newConnection;
      } catch (error) {
        this.stats.failedRequests++;
        throw error;
      }
    }

    // Pool is full, queue the request
    return this.queueConnectionRequest(config);
  }

  public releaseConnection(connection: EnhancedModbusClient): void {
    const pooledConnection = this.findPooledConnection(connection);
    if (!pooledConnection) {
      this.logger.warn('Attempted to release connection not managed by pool');
      return;
    }

    pooledConnection.inUse = false;
    pooledConnection.lastUsed = new Date();
    pooledConnection.usageCount++;
    
    this.updateStats();
    this.logger.debug(`Released connection: ${pooledConnection.id}`);

    // Process any pending requests
    this.processPendingRequests();
  }

  public async closeAll(): Promise<void> {
    this.isShuttingDown = true;
    
    // Stop health check and cleanup intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Reject all pending requests
    for (const request of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new ModbusError(
        'Connection pool is shutting down',
        ModbusErrorType.POOL_EXHAUSTED
      ));
    }
    this.pendingRequests = [];

    // Close all connections
    const closePromises: Promise<void>[] = [];
    for (const [key, pooledConnection] of this.connections) {
      closePromises.push(this.closeConnection(pooledConnection));
    }

    await Promise.allSettled(closePromises);
    this.connections.clear();
    this.stats.totalConnections = 0;
    this.updateStats();
    
    this.logger.info('Connection pool closed');
    this.emit('closed');
  }

  public async healthCheck(): Promise<void> {
    const healthCheckPromises: Promise<void>[] = [];
    
    for (const [key, pooledConnection] of this.connections) {
      healthCheckPromises.push(this.checkConnectionHealth(pooledConnection));
    }

    await Promise.allSettled(healthCheckPromises);
    this.updateStats();
  }

  public getStats() {
    return { ...this.stats };
  }

  private getConnectionKey(config: ModbusClientConfig): string {
    return `${config.host}:${config.port}:${config.unitId}`;
  }

  private findIdleConnection(connectionKey: string): PooledConnection | null {
    for (const [key, connection] of this.connections) {
      if (key === connectionKey && !connection.inUse && connection.connection.getConnectionStatus()) {
        return connection;
      }
    }
    return null;
  }

  private findPooledConnection(connection: EnhancedModbusClient): PooledConnection | null {
    for (const pooledConnection of this.connections.values()) {
      if (pooledConnection.connection === connection) {
        return pooledConnection;
      }
    }
    return null;
  }

  private async createConnection(config: ModbusClientConfig): Promise<EnhancedModbusClient> {
    const connectionKey = this.getConnectionKey(config);
    const connectionId = `${connectionKey}-${Date.now()}`;

    try {
      const client = new EnhancedModbusClient(config, this.logger);
      
      // Set up event handlers for the connection
      client.on('error', (error) => {
        this.handleConnectionError(connectionId, error);
      });

      client.on('disconnected', () => {
        this.handleConnectionDisconnected(connectionId);
      });

      // Attempt to connect
      const connected = await client.connect();
      if (!connected) {
        throw new ModbusError(
          `Failed to establish connection to ${connectionKey}`,
          ModbusErrorType.CONNECTION_FAILED
        );
      }

      // Create pooled connection entry
      const pooledConnection: PooledConnection = {
        connection: client,
        id: connectionId,
        config,
        inUse: true,
        lastUsed: new Date(),
        createdAt: new Date(),
        usageCount: 0,
        healthCheckFailed: 0
      };

      this.connections.set(connectionKey, pooledConnection);
      this.stats.totalConnections++;
      this.updateStats();

      this.logger.info(`Created new connection: ${connectionId}`);
      this.emit('connectionCreated', connectionId);

      return client;

    } catch (error) {
      this.stats.failedConnections++;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create connection ${connectionId}: ${message}`);
      
      throw new ModbusError(
        `Failed to create connection: ${message}`,
        ModbusErrorType.CONNECTION_FAILED
      );
    }
  }

  private async queueConnectionRequest(config: ModbusClientConfig): Promise<EnhancedModbusClient> {
    return new Promise<EnhancedModbusClient>((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from pending requests
        const index = this.pendingRequests.findIndex(req => req.resolve === resolve);
        if (index !== -1) {
          this.pendingRequests.splice(index, 1);
          this.stats.pendingRequests = this.pendingRequests.length;
        }
        
        this.stats.failedRequests++;
        reject(new ModbusError(
          `Connection request timeout after ${this.config.acquireTimeout}ms`,
          ModbusErrorType.TIMEOUT
        ));
      }, this.config.acquireTimeout);

      const request: ConnectionRequest = {
        config,
        resolve,
        reject,
        timestamp: new Date(),
        timeout
      };

      this.pendingRequests.push(request);
      this.stats.pendingRequests = this.pendingRequests.length;
      
      this.logger.debug(`Queued connection request for ${this.getConnectionKey(config)}`);
    });
  }

  private processPendingRequests(): void {
    if (this.pendingRequests.length === 0) return;

    // Try to fulfill pending requests with available connections
    for (let i = this.pendingRequests.length - 1; i >= 0; i--) {
      const request = this.pendingRequests[i];
      const connectionKey = this.getConnectionKey(request.config);
      const availableConnection = this.findIdleConnection(connectionKey);

      if (availableConnection) {
        // Remove from pending requests
        this.pendingRequests.splice(i, 1);
        clearTimeout(request.timeout);
        
        // Mark connection as in use and fulfill request
        this.markConnectionInUse(availableConnection);
        this.stats.successfulRequests++;
        this.stats.pendingRequests = this.pendingRequests.length;
        
        request.resolve(availableConnection.connection);
        this.logger.debug(`Fulfilled pending request with existing connection: ${connectionKey}`);
      }
    }
  }

  private markConnectionInUse(pooledConnection: PooledConnection): void {
    pooledConnection.inUse = true;
    pooledConnection.lastUsed = new Date();
    this.updateStats();
  }

  private async checkConnectionHealth(pooledConnection: PooledConnection): Promise<void> {
    try {
      const isHealthy = await pooledConnection.connection.testConnection();
      if (isHealthy) {
        pooledConnection.healthCheckFailed = 0;
      } else {
        pooledConnection.healthCheckFailed++;
        this.logger.warn(`Health check failed for connection ${pooledConnection.id}`);
        
        // Remove connection if it fails health checks multiple times
        if (pooledConnection.healthCheckFailed >= 3) {
          await this.removeConnection(pooledConnection);
        }
      }
    } catch (error) {
      pooledConnection.healthCheckFailed++;
      this.logger.error(`Health check error for connection ${pooledConnection.id}:`, error);
      
      if (pooledConnection.healthCheckFailed >= 3) {
        await this.removeConnection(pooledConnection);
      }
    }
  }

  private async removeConnection(pooledConnection: PooledConnection): Promise<void> {
    const connectionKey = this.getConnectionKey(pooledConnection.config);
    
    try {
      await this.closeConnection(pooledConnection);
    } catch (error) {
      this.logger.error(`Error closing connection ${pooledConnection.id}:`, error);
    }
    
    // Find and remove the connection from the map
    for (const [key, connection] of this.connections.entries()) {
      if (connection === pooledConnection) {
        this.connections.delete(key);
        break;
      }
    }
    
    this.stats.totalConnections = Math.max(0, this.stats.totalConnections - 1);
    this.updateStats();
    
    this.logger.info(`Removed unhealthy connection: ${pooledConnection.id}`);
    this.emit('connectionRemoved', pooledConnection.id);
  }

  private async closeConnection(pooledConnection: PooledConnection): Promise<void> {
    try {
      pooledConnection.connection.disconnect();
    } catch (error) {
      this.logger.error(`Error disconnecting connection ${pooledConnection.id}:`, error);
    }
  }

  private handleConnectionError(connectionId: string, error: Error): void {
    this.logger.error(`Connection error for ${connectionId}:`, error);
    this.emit('connectionError', connectionId, error);
  }

  private handleConnectionDisconnected(connectionId: string): void {
    this.logger.info(`Connection disconnected: ${connectionId}`);
    this.emit('connectionDisconnected', connectionId);
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        this.logger.error('Health check failed:', error);
      }
    }, this.config.healthCheckInterval);
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.idleTimeout / 2); // Run cleanup more frequently than idle timeout
  }

  private cleanupIdleConnections(): void {
    const now = new Date();
    const connectionsToRemove: PooledConnection[] = [];

    for (const pooledConnection of this.connections.values()) {
      if (!pooledConnection.inUse) {
        const idleTime = now.getTime() - pooledConnection.lastUsed.getTime();
        if (idleTime > this.config.idleTimeout) {
          connectionsToRemove.push(pooledConnection);
        }
      }
    }

    // Remove idle connections
    for (const connection of connectionsToRemove) {
      this.removeConnection(connection);
      this.logger.debug(`Cleaned up idle connection: ${connection.id}`);
    }
  }

  private updateStats(): void {
    this.stats.activeConnections = 0;
    this.stats.idleConnections = 0;

    for (const connection of this.connections.values()) {
      if (connection.inUse) {
        this.stats.activeConnections++;
      } else {
        this.stats.idleConnections++;
      }
    }

    this.stats.pendingRequests = this.pendingRequests.length;
  }
}
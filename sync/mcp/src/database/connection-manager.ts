/**
 * Database Connection Manager
 * 
 * Manages connections to both local (Sync) and remote (Client) PostgreSQL databases.
 * Provides connection pooling, testing, and retry logic with exponential backoff.
 */

import { Pool, PoolConfig } from 'pg';
import winston from 'winston';
import { ErrorHandler } from './error-handler';

export interface DualDatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface ConnectionManagerConfig {
  local: DualDatabaseConfig;
  remote: DualDatabaseConfig;
  maxConnectionRetries?: number;
  logger?: winston.Logger;
}

export interface ConnectionStatus {
  localConnected: boolean;
  remoteConnected: boolean;
  lastLocalCheck?: Date;
  lastRemoteCheck?: Date;
  localError?: string;
  remoteError?: string;
}

export class DatabaseConnectionManager {
  private localPool: Pool;
  private remotePool: Pool;
  private maxRetries: number;
  private logger: winston.Logger;
  private errorHandler: ErrorHandler;
  private status: ConnectionStatus;

  constructor(config: ConnectionManagerConfig) {
    this.maxRetries = config.maxConnectionRetries || 5;
    this.logger = config.logger || this.createDefaultLogger();
    this.errorHandler = new ErrorHandler(this.logger);

    // Initialize local database pool
    this.localPool = new Pool({
      host: config.local.host,
      port: config.local.port,
      database: config.local.database,
      user: config.local.user,
      password: config.local.password,
      max: config.local.max || 10,
      idleTimeoutMillis: config.local.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.local.connectionTimeoutMillis || 5000,
    });

    // Initialize remote database pool
    this.remotePool = new Pool({
      host: config.remote.host,
      port: config.remote.port,
      database: config.remote.database,
      user: config.remote.user,
      password: config.remote.password,
      max: config.remote.max || 10,
      idleTimeoutMillis: config.remote.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.remote.connectionTimeoutMillis || 5000,
    });

    // Handle pool errors
    this.localPool.on('error', (err) => {
      this.logger.error('Unexpected error on local database idle client:', err);
      this.status.localConnected = false;
      this.status.localError = err.message;
    });

    this.remotePool.on('error', (err) => {
      this.logger.error('Unexpected error on remote database idle client:', err);
      this.status.remoteConnected = false;
      this.status.remoteError = err.message;
    });

    this.status = {
      localConnected: false,
      remoteConnected: false,
    };
  }

  /**
   * Initialize connections with retry logic
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing database connections...');

    // Test local connection with retry
    const localConnected = await this.testLocalConnectionWithRetry();
    if (!localConnected) {
      throw new Error('Failed to connect to local database after maximum retries');
    }

    // Test remote connection with retry
    const remoteConnected = await this.testRemoteConnectionWithRetry();
    if (!remoteConnected) {
      throw new Error('Failed to connect to remote database after maximum retries');
    }

    this.logger.info('Database connections initialized successfully');
  }

  /**
   * Test local database connection with exponential backoff retry
   */
  async testLocalConnectionWithRetry(retryCount: number = 0): Promise<boolean> {
    try {
      const result = await this.localPool.query('SELECT NOW() as current_time');
      this.status.localConnected = true;
      this.status.lastLocalCheck = new Date();
      this.status.localError = undefined;
      
      this.logger.info('Local database connection successful');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.status.localConnected = false;
      this.status.lastLocalCheck = new Date();
      this.status.localError = errorMessage;

      this.logger.error(`Local database connection failed (attempt ${retryCount + 1}/${this.maxRetries}):`, errorMessage);

      if (retryCount < this.maxRetries) {
        const delay = this.calculateBackoff(retryCount);
        this.logger.info(`Retrying local connection in ${delay}ms...`);
        await this.sleep(delay);
        return this.testLocalConnectionWithRetry(retryCount + 1);
      }

      return false;
    }
  }

  /**
   * Test remote database connection with exponential backoff retry
   */
  async testRemoteConnectionWithRetry(retryCount: number = 0): Promise<boolean> {
    try {
      const result = await this.remotePool.query('SELECT NOW() as current_time');
      this.status.remoteConnected = true;
      this.status.lastRemoteCheck = new Date();
      this.status.remoteError = undefined;
      
      this.logger.info('Remote database connection successful');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.status.remoteConnected = false;
      this.status.lastRemoteCheck = new Date();
      this.status.remoteError = errorMessage;

      this.logger.error(`Remote database connection failed (attempt ${retryCount + 1}/${this.maxRetries}):`, errorMessage);

      if (retryCount < this.maxRetries) {
        const delay = this.calculateBackoff(retryCount);
        this.logger.info(`Retrying remote connection in ${delay}ms...`);
        await this.sleep(delay);
        return this.testRemoteConnectionWithRetry(retryCount + 1);
      }

      return false;
    }
  }

  /**
   * Test local database connection (single attempt)
   */
  async testLocalConnection(): Promise<boolean> {
    try {
      await this.localPool.query('SELECT 1');
      this.status.localConnected = true;
      this.status.lastLocalCheck = new Date();
      this.status.localError = undefined;
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.status.localConnected = false;
      this.status.lastLocalCheck = new Date();
      this.status.localError = errorMessage;
      this.logger.error('Local database connection test failed:', errorMessage);
      return false;
    }
  }

  /**
   * Test remote database connection (single attempt)
   */
  async testRemoteConnection(): Promise<boolean> {
    try {
      await this.remotePool.query('SELECT 1');
      this.status.remoteConnected = true;
      this.status.lastRemoteCheck = new Date();
      this.status.remoteError = undefined;
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.status.remoteConnected = false;
      this.status.lastRemoteCheck = new Date();
      this.status.remoteError = errorMessage;
      this.logger.error('Remote database connection test failed:', errorMessage);
      return false;
    }
  }

  /**
   * Get local database pool
   */
  getLocalPool(): Pool {
    return this.localPool;
  }

  /**
   * Get remote database pool
   */
  getRemotePool(): Pool {
    return this.remotePool;
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Close all database connections gracefully
   */
  async close(): Promise<void> {
    this.logger.info('Closing database connections...');

    try {
      await this.localPool.end();
      this.logger.info('Local database connection closed');
    } catch (error) {
      this.logger.error('Error closing local database connection:', error);
    }

    try {
      await this.remotePool.end();
      this.logger.info('Remote database connection closed');
    } catch (error) {
      this.logger.error('Error closing remote database connection:', error);
    }

    this.status.localConnected = false;
    this.status.remoteConnected = false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const baseDelay = 2000; // 2 seconds
    return Math.min(baseDelay * Math.pow(2, retryCount), 32000); // Max 32 seconds
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
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
      ],
    });
  }
}

/**
 * Create Database Connection Manager from environment variables
 * Note: Ensure environment variables are loaded before calling this function
 */
export function createConnectionManagerFromEnv(logger?: winston.Logger): DatabaseConnectionManager {
  // Validate required environment variables
  if (!process.env.POSTGRES_SYNC_HOST) {
    throw new Error('POSTGRES_SYNC_HOST environment variable is required');
  }
  if (!process.env.POSTGRES_CLIENT_HOST) {
    throw new Error('POSTGRES_CLIENT_HOST environment variable is required');
  }

  const config: ConnectionManagerConfig = {
    local: {
      host: process.env.POSTGRES_SYNC_HOST,
      port: parseInt(process.env.POSTGRES_SYNC_PORT || '5432', 10),
      database: process.env.POSTGRES_SYNC_DB || 'postgres',
      user: process.env.POSTGRES_SYNC_USER || 'postgres',
      password: process.env.POSTGRES_SYNC_PASSWORD || '',
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '5000', 10),
    },
    remote: {
      host: process.env.POSTGRES_CLIENT_HOST,
      port: parseInt(process.env.POSTGRES_CLIENT_PORT || '5432', 10),
      database: process.env.POSTGRES_CLIENT_DB || 'postgres',
      user: process.env.POSTGRES_CLIENT_USER || 'postgres',
      password: process.env.POSTGRES_CLIENT_PASSWORD || '',
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '5000', 10),
    },
    maxConnectionRetries: parseInt(process.env.MAX_CONNECTION_RETRIES || '5', 10),
    logger,
  };

  return new DatabaseConnectionManager(config);
}

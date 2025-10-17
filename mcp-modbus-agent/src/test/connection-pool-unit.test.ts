import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import winston from 'winston';
import { ModbusConnectionPool } from '../connection-pool.js';
import { 
  ConnectionPoolConfig, 
  ModbusClientConfig, 
  ModbusError, 
  ModbusErrorType 
} from '../types/modbus.js';

// Mock EnhancedModbusClient
const createMockClient = (config: any = {}) => {
  const client = new EventEmitter();
  return Object.assign(client, {
    connect: vi.fn().mockResolvedValue(config.connectResult ?? true),
    disconnect: vi.fn(),
    testConnection: vi.fn().mockResolvedValue(config.healthResult ?? true),
    getConnectionStatus: vi.fn().mockReturnValue(config.connected ?? true),
    getConfig: vi.fn().mockReturnValue(config.config ?? {}),
    destroy: vi.fn(),
    ...config.overrides
  });
};

vi.mock('../enhanced-modbus-client.js', () => ({
  EnhancedModbusClient: vi.fn()
}));

describe('Connection Pool Unit Tests', () => {
  let pool: ModbusConnectionPool;
  let mockLogger: winston.Logger;
  let poolConfig: Partial<ConnectionPoolConfig>;
  let clientConfig: ModbusClientConfig;
  let mockClientConstructor: any;

  beforeEach(async () => {
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    } as any;

    // Pool configuration
    poolConfig = {
      maxConnections: 5,
      idleTimeout: 60000,
      acquireTimeout: 10000,
      createRetryInterval: 1000,
      maxRetries: 3,
      healthCheckInterval: 30000
    };

    // Client configuration
    clientConfig = {
      host: '192.168.1.100',
      port: 502,
      unitId: 1,
      timeout: 5000
    };

    // Mock the constructor
    const { EnhancedModbusClient } = await import('../enhanced-modbus-client.js');
    mockClientConstructor = vi.mocked(EnhancedModbusClient);
    mockClientConstructor.mockImplementation(() => createMockClient());

    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (pool) {
      await pool.closeAll();
    }
    vi.clearAllTimers();
  });

  describe('Pool Initialization', () => {
    it('should initialize with default configuration', () => {
      pool = new ModbusConnectionPool({}, mockLogger);
      const stats = pool.getStats();

      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
      expect(stats.pendingRequests).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
      const stats = pool.getStats();

      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
    });

    it('should start health check and cleanup intervals', () => {
      vi.useFakeTimers();
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
      
      // Should not throw when timers are advanced
      expect(() => vi.advanceTimersByTime(35000)).not.toThrow();
      
      vi.useRealTimers();
    });
  });

  describe('Connection Creation and Management', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
    });

    it('should create new connection when pool is empty', async () => {
      const connection = await pool.getConnection(clientConfig);

      expect(connection).toBeDefined();
      expect(mockClientConstructor).toHaveBeenCalledWith(clientConfig, mockLogger);
      expect(connection.connect).toHaveBeenCalled();

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.activeConnections).toBe(1);
      expect(stats.successfulRequests).toBe(1);
    });

    it('should reuse existing idle connection with same configuration', async () => {
      // Get first connection
      const connection1 = await pool.getConnection(clientConfig);
      expect(mockClientConstructor).toHaveBeenCalledTimes(1);

      // Release it
      pool.releaseConnection(connection1);

      // Get second connection with same config
      const connection2 = await pool.getConnection(clientConfig);

      expect(connection2).toBe(connection1);
      expect(mockClientConstructor).toHaveBeenCalledTimes(1); // Should not create new client

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.activeConnections).toBe(1);
      expect(stats.idleConnections).toBe(0);
    });

    it('should create separate connections for different configurations', async () => {
      const config1 = { ...clientConfig };
      const config2 = { ...clientConfig, host: '192.168.1.101' };

      const connection1 = await pool.getConnection(config1);
      const connection2 = await pool.getConnection(config2);

      expect(connection1).not.toBe(connection2);
      expect(mockClientConstructor).toHaveBeenCalledTimes(2);

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
    });

    it('should handle connection creation failure', async () => {
      // Mock connection failure
      mockClientConstructor.mockImplementationOnce(() => 
        createMockClient({ connectResult: false })
      );

      await expect(pool.getConnection(clientConfig)).rejects.toThrow(ModbusError);

      const stats = pool.getStats();
      expect(stats.failedConnections).toBe(1);
      expect(stats.failedRequests).toBe(1);
    });

    it('should handle client constructor throwing error', async () => {
      // Mock constructor throwing error
      mockClientConstructor.mockImplementationOnce(() => {
        throw new Error('Constructor failed');
      });

      await expect(pool.getConnection(clientConfig)).rejects.toThrow(ModbusError);

      const stats = pool.getStats();
      expect(stats.failedConnections).toBe(1);
      expect(stats.failedRequests).toBe(1);
    });
  });

  describe('Connection Pooling Logic', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
    });

    it('should queue requests when pool is at capacity', async () => {
      // Fill the pool to capacity
      const connections: any[] = [];
      for (let i = 0; i < 5; i++) {
        const config = { ...clientConfig, unitId: i + 1 };
        const connection = await pool.getConnection(config);
        connections.push(connection);
      }

      let stats = pool.getStats();
      expect(stats.totalConnections).toBe(5);
      expect(stats.activeConnections).toBe(5);

      // Try to get another connection - should be queued
      const queuedPromise = pool.getConnection({ ...clientConfig, unitId: 6 });

      // Check that request is queued
      stats = pool.getStats();
      expect(stats.pendingRequests).toBe(1);

      // Release a connection to fulfill the queued request
      setTimeout(() => {
        pool.releaseConnection(connections[0]);
      }, 100);

      const queuedConnection = await queuedPromise;
      expect(queuedConnection).toBeDefined();

      stats = pool.getStats();
      expect(stats.pendingRequests).toBe(0);
    });

    it('should timeout queued requests after acquireTimeout', async () => {
      // Create pool with short timeout
      pool = new ModbusConnectionPool({ 
        ...poolConfig, 
        maxConnections: 1, 
        acquireTimeout: 100 
      }, mockLogger);

      // Get first connection
      const connection1 = await pool.getConnection(clientConfig);

      // Try to get second connection - should timeout
      await expect(pool.getConnection({ ...clientConfig, unitId: 2 }))
        .rejects.toThrow('timeout');

      const stats = pool.getStats();
      expect(stats.failedRequests).toBe(1);
    });

    it('should process multiple queued requests when connections become available', async () => {
      // Fill the pool
      const connections: any[] = [];
      for (let i = 0; i < 5; i++) {
        const config = { ...clientConfig, unitId: i + 1 };
        const connection = await pool.getConnection(config);
        connections.push(connection);
      }

      // Queue multiple requests
      const queuedPromises = [];
      for (let i = 0; i < 3; i++) {
        queuedPromises.push(pool.getConnection({ ...clientConfig, unitId: i + 10 }));
      }

      let stats = pool.getStats();
      expect(stats.pendingRequests).toBe(3);

      // Release connections to fulfill queued requests
      setTimeout(() => {
        connections.forEach(conn => pool.releaseConnection(conn));
      }, 100);

      const queuedConnections = await Promise.all(queuedPromises);
      expect(queuedConnections).toHaveLength(3);

      stats = pool.getStats();
      expect(stats.pendingRequests).toBe(0);
    });
  });

  describe('Connection Release and Lifecycle', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
    });

    it('should properly release connection and update statistics', async () => {
      const connection = await pool.getConnection(clientConfig);
      
      let stats = pool.getStats();
      expect(stats.activeConnections).toBe(1);
      expect(stats.idleConnections).toBe(0);

      pool.releaseConnection(connection);

      stats = pool.getStats();
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(1);
    });

    it('should handle release of unknown connection gracefully', () => {
      const unknownConnection = createMockClient();
      
      expect(() => pool.releaseConnection(unknownConnection as any)).not.toThrow();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Attempted to release connection not managed by pool'
      );
    });

    it('should clean up idle connections after timeout', async () => {
      vi.useFakeTimers();
      
      // Create pool with short idle timeout
      pool = new ModbusConnectionPool({ 
        ...poolConfig, 
        idleTimeout: 1000 
      }, mockLogger);

      const connection = await pool.getConnection(clientConfig);
      pool.releaseConnection(connection);

      let stats = pool.getStats();
      expect(stats.idleConnections).toBe(1);

      // Fast-forward time past idle timeout
      vi.advanceTimersByTime(2000);

      // Connection should be cleaned up
      stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
    });

    it('should perform health check on all connections', async () => {
      const connection1 = await pool.getConnection(clientConfig);
      const connection2 = await pool.getConnection({ ...clientConfig, unitId: 2 });

      await pool.healthCheck();

      expect(connection1.testConnection).toHaveBeenCalled();
      expect(connection2.testConnection).toHaveBeenCalled();
    });

    it('should remove unhealthy connections after multiple failures', async () => {
      // Create connection that will fail health checks
      mockClientConstructor.mockImplementationOnce(() => 
        createMockClient({ healthResult: false })
      );

      const connection = await pool.getConnection(clientConfig);
      
      // Perform multiple health checks to trigger removal
      await pool.healthCheck();
      await pool.healthCheck();
      await pool.healthCheck();

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('should handle health check errors gracefully', async () => {
      // Create connection that throws during health check
      mockClientConstructor.mockImplementationOnce(() => 
        createMockClient({ 
          overrides: { 
            testConnection: vi.fn().mockRejectedValue(new Error('Health check failed')) 
          }
        })
      );

      const connection = await pool.getConnection(clientConfig);
      
      // Should not throw
      await expect(pool.healthCheck()).resolves.not.toThrow();
      
      // Connection should be removed after multiple failures
      await pool.healthCheck();
      await pool.healthCheck();

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('should reset health check failure count on successful check', async () => {
      let healthCheckCount = 0;
      mockClientConstructor.mockImplementationOnce(() => 
        createMockClient({ 
          overrides: { 
            testConnection: vi.fn().mockImplementation(() => {
              healthCheckCount++;
              // Fail first two, then succeed
              return Promise.resolve(healthCheckCount > 2);
            })
          }
        })
      );

      const connection = await pool.getConnection(clientConfig);
      
      // First two health checks fail
      await pool.healthCheck();
      await pool.healthCheck();
      
      let stats = pool.getStats();
      expect(stats.totalConnections).toBe(1); // Should still be there
      
      // Third health check succeeds
      await pool.healthCheck();
      
      stats = pool.getStats();
      expect(stats.totalConnections).toBe(1); // Should remain
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
    });

    it('should emit connection lifecycle events', async () => {
      const createdSpy = vi.fn();
      const errorSpy = vi.fn();
      const disconnectedSpy = vi.fn();
      const removedSpy = vi.fn();

      pool.on('connectionCreated', createdSpy);
      pool.on('connectionError', errorSpy);
      pool.on('connectionDisconnected', disconnectedSpy);
      pool.on('connectionRemoved', removedSpy);

      const connection = await pool.getConnection(clientConfig);

      expect(createdSpy).toHaveBeenCalled();

      // Simulate connection error
      connection.emit('error', new Error('Test error'));
      expect(errorSpy).toHaveBeenCalled();

      // Simulate disconnection
      connection.emit('disconnected');
      expect(disconnectedSpy).toHaveBeenCalled();
    });

    it('should emit closed event on pool shutdown', async () => {
      const closedSpy = vi.fn();
      pool.on('closed', closedSpy);

      await pool.closeAll();

      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe('Pool Shutdown', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
    });

    it('should close all connections and clear pool', async () => {
      const connection1 = await pool.getConnection(clientConfig);
      const connection2 = await pool.getConnection({ ...clientConfig, unitId: 2 });

      await pool.closeAll();

      expect(connection1.disconnect).toHaveBeenCalled();
      expect(connection2.disconnect).toHaveBeenCalled();

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('should reject pending requests on shutdown', async () => {
      // Fill the pool
      for (let i = 0; i < 5; i++) {
        await pool.getConnection({ ...clientConfig, unitId: i + 1 });
      }

      // Queue a request
      const queuedPromise = pool.getConnection({ ...clientConfig, unitId: 6 });

      // Close pool
      await pool.closeAll();

      // Queued request should be rejected
      await expect(queuedPromise).rejects.toThrow('shutting down');
    });

    it('should prevent new connections after shutdown', async () => {
      await pool.closeAll();

      await expect(pool.getConnection(clientConfig)).rejects.toThrow('shutting down');
    });

    it('should stop health check and cleanup intervals on shutdown', async () => {
      vi.useFakeTimers();
      
      await pool.closeAll();

      // Advancing timers should not cause any activity
      expect(() => vi.advanceTimersByTime(100000)).not.toThrow();
      
      vi.useRealTimers();
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
    });

    it('should handle concurrent connection requests safely', async () => {
      const promises: Promise<any>[] = [];
      const numConcurrentRequests = 10;
      
      // Create multiple concurrent requests with same config to test pooling
      for (let i = 0; i < numConcurrentRequests; i++) {
        promises.push(pool.getConnection(clientConfig));
      }

      const connections = await Promise.all(promises);

      expect(connections).toHaveLength(numConcurrentRequests);
      connections.forEach(connection => {
        expect(connection).toBeDefined();
      });

      // Should respect max connections limit
      const stats = pool.getStats();
      expect(stats.totalConnections).toBeLessThanOrEqual(poolConfig.maxConnections!);
      expect(stats.successfulRequests).toBe(numConcurrentRequests);
    });

    it('should handle concurrent release operations safely', async () => {
      const connections: any[] = [];
      
      // Get multiple connections
      for (let i = 0; i < 5; i++) {
        const connection = await pool.getConnection({ ...clientConfig, unitId: i + 1 });
        connections.push(connection);
      }

      // Release all connections concurrently
      connections.forEach(connection => {
        pool.releaseConnection(connection);
      });

      const stats = pool.getStats();
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(5);
    });

    it('should handle concurrent health checks safely', async () => {
      // Create some connections
      const connections: any[] = [];
      for (let i = 0; i < 3; i++) {
        const connection = await pool.getConnection({ ...clientConfig, unitId: i + 1 });
        connections.push(connection);
      }

      // Run multiple concurrent health checks
      const healthCheckPromises = [];
      for (let i = 0; i < 5; i++) {
        healthCheckPromises.push(pool.healthCheck());
      }

      // Should not throw errors
      await expect(Promise.all(healthCheckPromises)).resolves.not.toThrow();

      // All connections should have been health checked
      connections.forEach(connection => {
        expect(connection.testConnection).toHaveBeenCalled();
      });
    });

    it('should handle mixed concurrent operations (get/release/health)', async () => {
      const operations: Promise<any>[] = [];
      const connections: any[] = [];

      // Mix of different operations
      for (let i = 0; i < 3; i++) {
        operations.push(
          pool.getConnection({ ...clientConfig, unitId: i + 1 }).then(conn => {
            connections.push(conn);
            return conn;
          })
        );
      }

      // Add health check operation
      operations.push(pool.healthCheck());

      await Promise.all(operations);

      // Now do mixed release and get operations
      const mixedOps: Promise<any>[] = [];
      
      // Release some connections
      mixedOps.push(Promise.resolve(pool.releaseConnection(connections[0])));
      
      // Get new connections
      for (let i = 0; i < 2; i++) {
        mixedOps.push(pool.getConnection({ ...clientConfig, unitId: i + 10 }));
      }

      // Add another health check
      mixedOps.push(pool.healthCheck());

      await Promise.all(mixedOps);

      const stats = pool.getStats();
      expect(stats.totalConnections).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(poolConfig, mockLogger);
    });

    it('should recover from connection creation errors', async () => {
      let attemptCount = 0;
      mockClientConstructor.mockImplementation(() => {
        attemptCount++;
        // Fail first attempt, succeed second
        if (attemptCount === 1) {
          throw new Error('Connection failed');
        }
        return createMockClient();
      });

      // First request should fail
      await expect(pool.getConnection(clientConfig)).rejects.toThrow();

      // Second request should succeed
      const connection = await pool.getConnection(clientConfig);
      expect(connection).toBeDefined();

      const stats = pool.getStats();
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(1);
    });

    it('should handle connection errors during operation', async () => {
      const connection = await pool.getConnection(clientConfig);
      
      // Simulate connection error
      const error = new Error('Connection lost');
      connection.emit('error', error);

      // Pool should handle the error gracefully
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1); // Connection still tracked
    });

    it('should handle disconnection events', async () => {
      const connection = await pool.getConnection(clientConfig);
      
      // Simulate disconnection
      connection.emit('disconnected');

      // Pool should handle the disconnection gracefully
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1); // Connection still tracked
    });
  });
});
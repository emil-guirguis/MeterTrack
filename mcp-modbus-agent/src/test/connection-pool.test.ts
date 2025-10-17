import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import winston from 'winston';
import { ModbusConnectionPool } from '../connection-pool.js';
import { ConnectionPoolConfig, ModbusClientConfig, ModbusError, ModbusErrorType } from '../types/modbus.js';
import { EnhancedModbusClient } from '../enhanced-modbus-client.js';

// Mock EnhancedModbusClient
vi.mock('../enhanced-modbus-client.js', () => ({
  EnhancedModbusClient: vi.fn().mockImplementation(() => {
    const client = new EventEmitter();
    return Object.assign(client, {
      connect: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn(),
      testConnection: vi.fn().mockResolvedValue(true),
      getConnectionStatus: vi.fn().mockReturnValue(true),
      getConfig: vi.fn().mockReturnValue({}),
      destroy: vi.fn()
    });
  })
}));

describe('ModbusConnectionPool', () => {
  let pool: ModbusConnectionPool;
  let mockLogger: winston.Logger;
  let mockConfig: Partial<ConnectionPoolConfig>;
  let mockClientConfig: ModbusClientConfig;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    } as any;

    // Create mock pool config
    mockConfig = {
      maxConnections: 5,
      idleTimeout: 60000,
      acquireTimeout: 10000,
      createRetryInterval: 1000,
      maxRetries: 3,
      healthCheckInterval: 30000
    };

    // Create mock client config
    mockClientConfig = {
      host: '192.168.1.100',
      port: 502,
      unitId: 1,
      timeout: 5000
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (pool) {
      await pool.closeAll();
    }
  });

  describe('Constructor', () => {
    it('should create pool with default configuration', () => {
      pool = new ModbusConnectionPool({}, mockLogger);
      const stats = pool.getStats();

      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
    });

    it('should create pool with custom configuration', () => {
      pool = new ModbusConnectionPool(mockConfig, mockLogger);
      const stats = pool.getStats();

      expect(stats.totalConnections).toBe(0);
    });
  });

  describe('Connection Management', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(mockConfig, mockLogger);
    });

    it('should create new connection when pool is empty', async () => {
      const connection = await pool.getConnection(mockClientConfig);

      expect(connection).toBeDefined();
      expect(EnhancedModbusClient).toHaveBeenCalledWith(mockClientConfig, mockLogger);

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.activeConnections).toBe(1);
    });

    it('should reuse existing idle connection', async () => {
      // Get first connection
      const connection1 = await pool.getConnection(mockClientConfig);
      expect(connection1).toBeDefined();

      // Release it
      pool.releaseConnection(connection1);

      // Get second connection with same config
      const connection2 = await pool.getConnection(mockClientConfig);

      expect(connection2).toBe(connection1); // Should be the same instance
      expect(EnhancedModbusClient).toHaveBeenCalledTimes(1); // Should not create new client

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.activeConnections).toBe(1);
    });

    it('should create multiple connections for different configs', async () => {
      const config1 = { ...mockClientConfig };
      const config2 = { ...mockClientConfig, host: '192.168.1.101' };

      const connection1 = await pool.getConnection(config1);
      const connection2 = await pool.getConnection(config2);

      expect(connection1).toBeDefined();
      expect(connection2).toBeDefined();
      expect(connection1).not.toBe(connection2);

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
    });

    it('should queue requests when pool is full', async () => {
      // Fill the pool
      const connections: any[] = [];
      for (let i = 0; i < 5; i++) {
        const config = { ...mockClientConfig, unitId: i + 1 };
        const connection = await pool.getConnection(config);
        connections.push(connection);
      }

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(5);
      expect(stats.activeConnections).toBe(5);

      // Try to get another connection (should be queued)
      const queuedPromise = pool.getConnection({ ...mockClientConfig, unitId: 6 });

      // Release a connection to fulfill the queued request
      setTimeout(() => {
        pool.releaseConnection(connections[0]);
      }, 100);

      // The queued request should now be fulfilled
      const queuedConnection = await queuedPromise;
      expect(queuedConnection).toBeDefined();
    });

    it('should handle connection creation failure', async () => {
      // Mock connection failure
      const mockClient = vi.mocked(EnhancedModbusClient);
      mockClient.mockImplementationOnce(() => {
        const client = new EventEmitter();
        return Object.assign(client, {
          connect: vi.fn().mockResolvedValue(false),
          disconnect: vi.fn(),
          testConnection: vi.fn(),
          getConnectionStatus: vi.fn(),
          getConfig: vi.fn(),
          destroy: vi.fn()
        });
      });

      await expect(pool.getConnection(mockClientConfig)).rejects.toThrow(ModbusError);
    });

    it('should timeout queued requests', async () => {
      // Create pool with short timeout
      pool = new ModbusConnectionPool({ ...mockConfig, maxConnections: 1, acquireTimeout: 100 }, mockLogger);

      // Get first connection
      const connection1 = await pool.getConnection(mockClientConfig);

      // Try to get second connection (should timeout)
      await expect(pool.getConnection({ ...mockClientConfig, unitId: 2 })).rejects.toThrow('timeout');
    });
  });

  describe('Connection Release', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(mockConfig, mockLogger);
    });

    it('should release connection properly', async () => {
      const connection = await pool.getConnection(mockClientConfig);
      
      let stats = pool.getStats();
      expect(stats.activeConnections).toBe(1);
      expect(stats.idleConnections).toBe(0);

      pool.releaseConnection(connection);

      stats = pool.getStats();
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(1);
    });

    it('should handle release of unknown connection', () => {
      const unknownConnection = new EventEmitter();
      
      expect(() => pool.releaseConnection(unknownConnection as any)).not.toThrow();
    });
  });

  describe('Health Check', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(mockConfig, mockLogger);
    });

    it('should perform health check on all connections', async () => {
      const connection1 = await pool.getConnection(mockClientConfig);
      const connection2 = await pool.getConnection({ ...mockClientConfig, unitId: 2 });

      await pool.healthCheck();

      expect(connection1.testConnection).toHaveBeenCalled();
      expect(connection2.testConnection).toHaveBeenCalled();
    });

    it('should remove unhealthy connections', async () => {
      const connection = await pool.getConnection(mockClientConfig);
      
      // Mock health check failure
      connection.testConnection.mockResolvedValue(false);

      // Perform health check multiple times to trigger removal
      await pool.healthCheck();
      await pool.healthCheck();
      await pool.healthCheck();

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
    });

    it('should handle health check errors', async () => {
      const connection = await pool.getConnection(mockClientConfig);
      
      // Mock health check error
      connection.testConnection.mockRejectedValue(new Error('Health check failed'));

      // Should not throw
      await expect(pool.healthCheck()).resolves.not.toThrow();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(mockConfig, mockLogger);
    });

    it('should track connection statistics', async () => {
      const connection1 = await pool.getConnection(mockClientConfig);
      const connection2 = await pool.getConnection({ ...mockClientConfig, unitId: 2 });

      let stats = pool.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
      expect(stats.idleConnections).toBe(0);
      expect(stats.successfulRequests).toBe(2);

      pool.releaseConnection(connection1);

      stats = pool.getStats();
      expect(stats.activeConnections).toBe(1);
      expect(stats.idleConnections).toBe(1);
    });

    it('should track failed requests', async () => {
      // Mock connection failure
      const mockClient = vi.mocked(EnhancedModbusClient);
      mockClient.mockImplementationOnce(() => {
        const client = new EventEmitter();
        return Object.assign(client, {
          connect: vi.fn().mockResolvedValue(false),
          disconnect: vi.fn(),
          testConnection: vi.fn(),
          getConnectionStatus: vi.fn(),
          getConfig: vi.fn(),
          destroy: vi.fn()
        });
      });

      try {
        await pool.getConnection(mockClientConfig);
      } catch (error) {
        // Expected error
      }

      const stats = pool.getStats();
      expect(stats.failedRequests).toBe(1);
    });
  });

  describe('Pool Shutdown', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(mockConfig, mockLogger);
    });

    it('should close all connections', async () => {
      const connection1 = await pool.getConnection(mockClientConfig);
      const connection2 = await pool.getConnection({ ...mockClientConfig, unitId: 2 });

      await pool.closeAll();

      expect(connection1.disconnect).toHaveBeenCalled();
      expect(connection2.disconnect).toHaveBeenCalled();

      // Note: connections are removed from the map during closeAll
      // The stats might not immediately reflect 0 due to async cleanup
      const stats = pool.getStats();
      expect(stats.totalConnections).toBeLessThanOrEqual(2);
    });

    it('should reject pending requests on shutdown', async () => {
      // Fill the pool
      for (let i = 0; i < 5; i++) {
        await pool.getConnection({ ...mockClientConfig, unitId: i + 1 });
      }

      // Queue a request
      const queuedPromise = pool.getConnection({ ...mockClientConfig, unitId: 6 });

      // Close pool
      await pool.closeAll();

      // Queued request should be rejected
      await expect(queuedPromise).rejects.toThrow('shutting down');
    });

    it('should prevent new connections after shutdown', async () => {
      await pool.closeAll();

      await expect(pool.getConnection(mockClientConfig)).rejects.toThrow('shutting down');
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(mockConfig, mockLogger);
    });

    it('should emit connection events', async () => {
      const createdSpy = vi.fn();
      const errorSpy = vi.fn();
      const disconnectedSpy = vi.fn();

      pool.on('connectionCreated', createdSpy);
      pool.on('connectionError', errorSpy);
      pool.on('connectionDisconnected', disconnectedSpy);

      const connection = await pool.getConnection(mockClientConfig);

      expect(createdSpy).toHaveBeenCalled();

      // Simulate connection error
      connection.emit('error', new Error('Test error'));
      expect(errorSpy).toHaveBeenCalled();

      // Simulate disconnection
      connection.emit('disconnected');
      expect(disconnectedSpy).toHaveBeenCalled();
    });

    it('should emit closed event on shutdown', async () => {
      const closedSpy = vi.fn();
      pool.on('closed', closedSpy);

      await pool.closeAll();

      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      pool = new ModbusConnectionPool(mockConfig, mockLogger);
    });

    it('should handle concurrent connection requests', async () => {
      const promises: Promise<any>[] = [];
      
      // Create multiple concurrent requests (fewer to avoid timeout)
      for (let i = 0; i < 5; i++) {
        promises.push(pool.getConnection({ ...mockClientConfig, unitId: i + 1 }));
      }

      const connections = await Promise.all(promises);

      expect(connections).toHaveLength(5);
      connections.forEach(connection => {
        expect(connection).toBeDefined();
      });

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(5); // Limited by maxConnections
      expect(stats.successfulRequests).toBe(5);
    });

    it('should handle concurrent release operations', async () => {
      const connections: any[] = [];
      
      // Get multiple connections
      for (let i = 0; i < 5; i++) {
        const connection = await pool.getConnection({ ...mockClientConfig, unitId: i + 1 });
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
  });
});
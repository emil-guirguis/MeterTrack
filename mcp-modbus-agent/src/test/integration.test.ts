import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import winston from 'winston';
import { EnhancedModbusClient } from '../enhanced-modbus-client.js';
import { ModbusConnectionPool } from '../connection-pool.js';
import { ModbusErrorHandler } from '../error-handler.js';
import { ModbusClientConfig, ModbusError, ModbusErrorType } from '../types/modbus.js';

// Mock jsmodbus
vi.mock('jsmodbus', () => ({
  default: {
    client: {
      TCP: vi.fn().mockImplementation(() => ({
        readHoldingRegisters: vi.fn(),
        readInputRegisters: vi.fn(),
        setTimeout: vi.fn(),
        setUnitId: vi.fn()
      }))
    }
  }
}));

// Mock net module
vi.mock('net', () => ({
  Socket: vi.fn().mockImplementation(() => {
    const socket = new EventEmitter();
    return Object.assign(socket, {
      connect: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
      setTimeout: vi.fn()
    });
  })
}));

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn()
}));

describe('Integration Tests', () => {
  let mockLogger: winston.Logger;
  let mockConfig: ModbusClientConfig;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    } as any;

    // Create mock config
    mockConfig = {
      host: '192.168.1.100',
      port: 502,
      unitId: 1,
      timeout: 5000,
      maxRetries: 3,
      reconnectDelay: 1000,
      keepAlive: true
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('Client with Connection Pool Integration', () => {
    let pool: ModbusConnectionPool;

    afterEach(async () => {
      if (pool) {
        await pool.closeAll();
      }
    });

    it('should manage multiple clients through connection pool', async () => {
      pool = new ModbusConnectionPool({
        maxConnections: 3,
        idleTimeout: 60000,
        acquireTimeout: 10000
      }, mockLogger);

      // Mock successful connections
      const { Socket } = await import('net');
      const mockSocket = new (Socket as any)();
      mockSocket.connect = vi.fn().mockImplementation(() => {
        setTimeout(() => mockSocket.emit('connect'), 10);
      });

      const jsmodbus = await import('jsmodbus');
      const mockModbusClient = {
        readHoldingRegisters: vi.fn().mockResolvedValue({
          response: {
            body: {
              values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
          }
        })
      };
      (jsmodbus.default.client.TCP as any).mockReturnValue(mockModbusClient);

      // Get multiple connections
      const connection1 = await pool.getConnection(mockConfig);
      const connection2 = await pool.getConnection({ ...mockConfig, unitId: 2 });
      const connection3 = await pool.getConnection({ ...mockConfig, unitId: 3 });

      expect(connection1).toBeDefined();
      expect(connection2).toBeDefined();
      expect(connection3).toBeDefined();

      // Test reading data from all connections
      const reading1 = await connection1.readMeterData();
      const reading2 = await connection2.readMeterData();
      const reading3 = await connection3.readMeterData();

      expect(reading1).toBeDefined();
      expect(reading2).toBeDefined();
      expect(reading3).toBeDefined();

      // Release connections
      pool.releaseConnection(connection1);
      pool.releaseConnection(connection2);
      pool.releaseConnection(connection3);

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(3);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(3);
    });

    it('should handle connection failures gracefully in pool', async () => {
      pool = new ModbusConnectionPool({
        maxConnections: 2,
        idleTimeout: 60000,
        acquireTimeout: 5000
      }, mockLogger);

      // Mock connection failure
      const { Socket } = await import('net');
      const mockSocket = new (Socket as any)();
      mockSocket.connect = vi.fn().mockImplementation(() => {
        setTimeout(() => mockSocket.emit('error', new Error('Connection refused')), 10);
      });

      await expect(pool.getConnection(mockConfig)).rejects.toThrow(ModbusError);

      const stats = pool.getStats();
      expect(stats.failedConnections).toBe(1);
      expect(stats.totalConnections).toBe(0);
    });

    it('should reuse connections efficiently', async () => {
      pool = new ModbusConnectionPool({
        maxConnections: 2,
        idleTimeout: 60000,
        acquireTimeout: 10000
      }, mockLogger);

      // Mock successful connection
      const { Socket } = await import('net');
      const mockSocket = new (Socket as any)();
      mockSocket.connect = vi.fn().mockImplementation(() => {
        setTimeout(() => mockSocket.emit('connect'), 10);
      });

      const jsmodbus = await import('jsmodbus');
      (jsmodbus.default.client.TCP as any).mockReturnValue({
        readHoldingRegisters: vi.fn().mockResolvedValue({
          response: { body: { values: [100] } }
        })
      });

      // Get connection, use it, release it
      const connection1 = await pool.getConnection(mockConfig);
      await connection1.testConnection();
      pool.releaseConnection(connection1);

      // Get same connection again
      const connection2 = await pool.getConnection(mockConfig);
      
      expect(connection2).toBe(connection1); // Should be the same instance

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(1); // Only one connection created
    });
  });

  describe('Client with Error Handler Integration', () => {
    let client: EnhancedModbusClient;
    let mockSocket: any;
    let mockModbusClient: any;

    beforeEach(async () => {
      const { Socket } = await import('net');
      mockSocket = new (Socket as any)();
      
      const jsmodbus = await import('jsmodbus');
      mockModbusClient = {
        readHoldingRegisters: vi.fn(),
        readInputRegisters: vi.fn()
      };
      (jsmodbus.default.client.TCP as any).mockReturnValue(mockModbusClient);
    });

    afterEach(() => {
      if (client) {
        client.destroy();
      }
    });

    it('should retry operations on transient failures', async () => {
      client = new EnhancedModbusClient(mockConfig, mockLogger);

      // Mock connection success
      mockSocket.connect = vi.fn().mockImplementation(() => {
        setTimeout(() => mockSocket.emit('connect'), 10);
      });

      await client.connect();

      // Mock register read with initial failures then success
      mockModbusClient.readHoldingRegisters
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Device busy'))
        .mockResolvedValueOnce({
          response: {
            body: {
              values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
          }
        });

      const reading = await client.readMeterData();

      expect(reading).toBeDefined();
      expect(reading?.voltage).toBe(240);
      expect(mockModbusClient.readHoldingRegisters).toHaveBeenCalledTimes(3);
    });

    it('should handle circuit breaker opening on repeated failures', async () => {
      client = new EnhancedModbusClient({
        ...mockConfig,
        maxRetries: 1 // Reduce retries for faster test
      }, mockLogger);

      // Mock connection success
      mockSocket.connect = vi.fn().mockImplementation(() => {
        setTimeout(() => mockSocket.emit('connect'), 10);
      });

      await client.connect();

      // Mock repeated failures
      mockModbusClient.readHoldingRegisters.mockRejectedValue(new Error('Connection failed'));

      // Trigger multiple failures to open circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await client.readMeterData();
        } catch (error) {
          // Expected failures
        }
      }

      const errorStats = client.getErrorStatistics();
      expect(errorStats.totalErrors).toBeGreaterThan(0);
    });

    it('should recover from circuit breaker state', async () => {
      client = new EnhancedModbusClient({
        ...mockConfig,
        maxRetries: 1
      }, mockLogger);

      // Mock connection success
      mockSocket.connect = vi.fn().mockImplementation(() => {
        setTimeout(() => mockSocket.emit('connect'), 10);
      });

      await client.connect();

      // Trigger failures to open circuit breaker
      mockModbusClient.readHoldingRegisters.mockRejectedValue(new Error('Connection failed'));

      for (let i = 0; i < 5; i++) {
        try {
          await client.readMeterData();
        } catch (error) {
          // Expected failures
        }
      }

      // Reset circuit breaker
      client.resetCircuitBreaker();

      // Mock successful read
      mockModbusClient.readHoldingRegisters.mockResolvedValueOnce({
        response: {
          body: {
            values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          }
        }
      });

      const reading = await client.readMeterData();
      expect(reading).toBeDefined();
    });
  });

  describe('Full System Integration', () => {
    let pool: ModbusConnectionPool;
    let clients: EnhancedModbusClient[] = [];

    afterEach(async () => {
      clients.forEach(client => client.destroy());
      clients = [];
      
      if (pool) {
        await pool.closeAll();
      }
    });

    it('should handle concurrent operations across multiple devices', async () => {
      pool = new ModbusConnectionPool({
        maxConnections: 5,
        idleTimeout: 60000,
        acquireTimeout: 10000
      }, mockLogger);

      // Mock successful connections
      const { Socket } = await import('net');
      const mockSocket = new (Socket as any)();
      mockSocket.connect = vi.fn().mockImplementation(() => {
        setTimeout(() => mockSocket.emit('connect'), 10);
      });

      const jsmodbus = await import('jsmodbus');
      const mockModbusClient = {
        readHoldingRegisters: vi.fn().mockResolvedValue({
          response: {
            body: {
              values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
          }
        })
      };
      (jsmodbus.default.client.TCP as any).mockReturnValue(mockModbusClient);

      // Create multiple device configurations
      const deviceConfigs = [
        { ...mockConfig, unitId: 1 },
        { ...mockConfig, unitId: 2 },
        { ...mockConfig, unitId: 3 },
        { ...mockConfig, host: '192.168.1.101', unitId: 1 },
        { ...mockConfig, host: '192.168.1.102', unitId: 1 }
      ];

      // Get connections for all devices concurrently
      const connectionPromises = deviceConfigs.map(config => pool.getConnection(config));
      const connections = await Promise.all(connectionPromises);

      expect(connections).toHaveLength(5);
      connections.forEach(connection => {
        expect(connection).toBeDefined();
      });

      // Read data from all devices concurrently
      const readingPromises = connections.map(connection => connection.readMeterData());
      const readings = await Promise.all(readingPromises);

      expect(readings).toHaveLength(5);
      readings.forEach(reading => {
        expect(reading).toBeDefined();
        expect(reading?.voltage).toBe(240);
        expect(reading?.current).toBe(10);
        expect(reading?.power).toBe(2400);
      });

      // Release all connections
      connections.forEach(connection => pool.releaseConnection(connection));

      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(5);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(5);
      expect(stats.successfulRequests).toBe(10); // 5 get + 5 read operations
    });

    it('should handle mixed success and failure scenarios', async () => {
      pool = new ModbusConnectionPool({
        maxConnections: 3,
        idleTimeout: 60000,
        acquireTimeout: 5000
      }, mockLogger);

      // Mock mixed connection results
      const { Socket } = await import('net');
      let connectionAttempts = 0;
      
      const mockSocket = new (Socket as any)();
      mockSocket.connect = vi.fn().mockImplementation(() => {
        connectionAttempts++;
        if (connectionAttempts <= 2) {
          setTimeout(() => mockSocket.emit('connect'), 10);
        } else {
          setTimeout(() => mockSocket.emit('error', new Error('Connection failed')), 10);
        }
      });

      const jsmodbus = await import('jsmodbus');
      const mockModbusClient = {
        readHoldingRegisters: vi.fn().mockImplementation(() => {
          // First two calls succeed, third fails
          if (mockModbusClient.readHoldingRegisters.mock.calls.length <= 2) {
            return Promise.resolve({
              response: {
                body: {
                  values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                }
              }
            });
          } else {
            return Promise.reject(new Error('Register read failed'));
          }
        })
      };
      (jsmodbus.default.client.TCP as any).mockReturnValue(mockModbusClient);

      const deviceConfigs = [
        { ...mockConfig, unitId: 1 },
        { ...mockConfig, unitId: 2 },
        { ...mockConfig, unitId: 3 }
      ];

      const results = await Promise.allSettled(
        deviceConfigs.map(async config => {
          try {
            const connection = await pool.getConnection(config);
            const reading = await connection.readMeterData();
            pool.releaseConnection(connection);
            return reading;
          } catch (error) {
            throw error;
          }
        })
      );

      // Should have 2 successes and 1 failure
      const successes = results.filter(result => result.status === 'fulfilled');
      const failures = results.filter(result => result.status === 'rejected');

      expect(successes).toHaveLength(2);
      expect(failures).toHaveLength(1);

      const stats = pool.getStats();
      expect(stats.successfulRequests).toBe(2);
      expect(stats.failedRequests).toBe(1);
    });

    it('should maintain performance under load', async () => {
      pool = new ModbusConnectionPool({
        maxConnections: 10,
        idleTimeout: 60000,
        acquireTimeout: 10000
      }, mockLogger);

      // Mock fast successful connections
      const { Socket } = await import('net');
      const mockSocket = new (Socket as any)();
      mockSocket.connect = vi.fn().mockImplementation(() => {
        setTimeout(() => mockSocket.emit('connect'), 1); // Very fast connection
      });

      const jsmodbus = await import('jsmodbus');
      const mockModbusClient = {
        readHoldingRegisters: vi.fn().mockResolvedValue({
          response: {
            body: {
              values: [600, 0, 0, 0, 0, 48000, 1000, 2400, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
          }
        })
      };
      (jsmodbus.default.client.TCP as any).mockReturnValue(mockModbusClient);

      const startTime = Date.now();

      // Simulate 50 concurrent operations
      const operations = Array.from({ length: 50 }, (_, i) => ({
        ...mockConfig,
        unitId: (i % 10) + 1 // Reuse 10 different unit IDs
      }));

      const results = await Promise.all(
        operations.map(async config => {
          const connection = await pool.getConnection(config);
          const reading = await connection.readMeterData();
          pool.releaseConnection(connection);
          return reading;
        })
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(50);
      results.forEach(reading => {
        expect(reading).toBeDefined();
      });

      // Should complete within reasonable time (less than 5 seconds)
      expect(totalTime).toBeLessThan(5000);

      const stats = pool.getStats();
      expect(stats.successfulRequests).toBe(100); // 50 get + 50 read operations
      expect(stats.totalConnections).toBeLessThanOrEqual(10); // Should not exceed max connections
    });
  });
});
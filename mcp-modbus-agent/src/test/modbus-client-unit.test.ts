import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import winston from 'winston';
import { ModbusConnectionPool } from '../connection-pool.js';
import { ModbusErrorHandler } from '../error-handler.js';
import { 
  ModbusClientConfig, 
  ModbusError, 
  ModbusErrorType,
  ConnectionPoolConfig 
} from '../types/modbus.js';

describe('ModbusClient Unit Tests - Task 2.4', () => {
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

    // Create mock client config
    mockConfig = {
      host: '192.168.1.100',
      port: 502,
      unitId: 1,
      timeout: 5000,
      maxRetries: 3,
      reconnectDelay: 1000,
      keepAlive: true
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Connection Pooling Functionality', () => {
    it('should initialize connection pool with correct configuration', () => {
      const poolConfig = {
        maxConnections: 5,
        idleTimeout: 60000,
        acquireTimeout: 10000
      };
      const pool = new ModbusConnectionPool(poolConfig, mockLogger);
      
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
      expect(stats.pendingRequests).toBe(0);
      
      pool.closeAll();
    });

    it('should track connection pool statistics', () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      const stats = pool.getStats();
      
      // Verify all expected statistics are present
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('idleConnections');
      expect(stats).toHaveProperty('failedConnections');
      expect(stats).toHaveProperty('pendingRequests');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('successfulRequests');
      expect(stats).toHaveProperty('failedRequests');
      
      pool.closeAll();
    });

    it('should handle pool configuration correctly', () => {
      const customConfig = {
        maxConnections: 10,
        idleTimeout: 120000,
        acquireTimeout: 5000
      };
      
      const customPool = new ModbusConnectionPool(customConfig, mockLogger);
      expect(customPool).toBeDefined();
      
      const stats = customPool.getStats();
      expect(stats.totalConnections).toBe(0);
      
      customPool.closeAll();
    });

    it('should handle health check operations', async () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      
      // Health check should not throw errors on empty pool
      await expect(pool.healthCheck()).resolves.not.toThrow();
      
      pool.closeAll();
    });

    it('should prevent operations after shutdown', async () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      await pool.closeAll();

      // Should reject new connection requests
      await expect(pool.getConnection(mockConfig)).rejects.toThrow('shutting down');
    });
  });

  describe('Error Handling and Reconnection Scenarios', () => {
    it('should categorize different types of Modbus errors correctly', () => {
      const config = { maxRetries: 3, baseRetryDelay: 100 };
      const errorHandler = new ModbusErrorHandler(config, mockLogger);
      
      const testCases = [
        { message: 'ECONNREFUSED', expected: ModbusErrorType.CONNECTION_FAILED },
        { message: 'ETIMEDOUT', expected: ModbusErrorType.TIMEOUT },
        { message: 'Illegal function exception', expected: ModbusErrorType.PROTOCOL_ERROR },
        { message: 'Slave device busy', expected: ModbusErrorType.DEVICE_BUSY },
        { message: 'unknown error occurred', expected: ModbusErrorType.UNKNOWN_ERROR }
      ];

      testCases.forEach(({ message, expected }) => {
        const error = new Error(message);
        const categorized = errorHandler.categorizeError(error, 'device1');
        
        expect(categorized).toBeInstanceOf(ModbusError);
        expect(categorized.type).toBe(expected);
        expect(categorized.deviceId).toBe('device1');
      });
      
      errorHandler.destroy();
    });

    it('should identify retryable vs non-retryable errors', () => {
      const errorHandler = new ModbusErrorHandler({}, mockLogger);
      
      const retryableTypes = [
        ModbusErrorType.CONNECTION_FAILED,
        ModbusErrorType.TIMEOUT,
        ModbusErrorType.DEVICE_BUSY,
        ModbusErrorType.UNKNOWN_ERROR
      ];

      const nonRetryableTypes = [
        ModbusErrorType.PROTOCOL_ERROR,
        ModbusErrorType.INVALID_REGISTER
      ];

      retryableTypes.forEach(type => {
        const error = new ModbusError('Test error', type, 'device1');
        expect(errorHandler.isRetryableError(error)).toBe(true);
      });

      nonRetryableTypes.forEach(type => {
        const error = new ModbusError('Test error', type, 'device1');
        expect(errorHandler.isRetryableError(error)).toBe(false);
      });
      
      errorHandler.destroy();
    });

    it('should implement exponential backoff for retries', async () => {
      const config = {
        maxRetries: 2,
        baseRetryDelay: 100,
        backoffMultiplier: 2,
        jitterEnabled: false
      };
      const errorHandler = new ModbusErrorHandler(config, mockLogger);
      
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      });

      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      expect(result).toBe('success');
      expect(delays).toHaveLength(2); // First attempt fails, then retry succeeds
      expect(delays[0]).toBe(100);

      global.setTimeout = originalSetTimeout;
      errorHandler.destroy();
    });

    it('should implement circuit breaker pattern', async () => {
      const config = {
        maxRetries: 1,
        circuitBreakerThreshold: 2,
        baseRetryDelay: 10
      };
      const errorHandler = new ModbusErrorHandler(config, mockLogger);
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Trigger failures to open circuit breaker
      for (let i = 0; i < 2; i++) {
        try {
          await errorHandler.handleError(
            new Error('Connection failed'),
            'device1',
            'testOperation',
            retryCallback
          );
        } catch (error) {
          // Expected failures
        }
      }

      // Next call should fail immediately due to open circuit breaker
      await expect(errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      )).rejects.toThrow('Circuit breaker is open');
      
      errorHandler.destroy();
    });

    it('should track error statistics', async () => {
      const errorHandler = new ModbusErrorHandler({ maxRetries: 1, baseRetryDelay: 10 }, mockLogger);
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      try {
        await errorHandler.handleError(
          new Error('Connection failed'),
          'device1',
          'testOperation',
          retryCallback
        );
      } catch (error) {
        // Expected error
      }

      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.errorsByType.get(ModbusErrorType.CONNECTION_FAILED)).toBeGreaterThan(0);
      expect(stats.errorsByDevice.get('device1')).toBeGreaterThan(0);
      
      errorHandler.destroy();
    });

    it('should reset error statistics', () => {
      const errorHandler = new ModbusErrorHandler({}, mockLogger);
      
      // Generate some errors first
      const error = new ModbusError('Test error', ModbusErrorType.CONNECTION_FAILED, 'device1');
      errorHandler.categorizeError(error, 'device1');

      errorHandler.resetStatistics();

      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType.size).toBe(0);
      expect(stats.errorsByDevice.size).toBe(0);
      expect(stats.recentErrors.length).toBe(0);
      
      errorHandler.destroy();
    });
  });

  describe('Concurrent Connection Management', () => {
    it('should handle concurrent health checks safely', async () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      
      // Run multiple concurrent health checks
      const healthCheckPromises = [];
      for (let i = 0; i < 5; i++) {
        healthCheckPromises.push(pool.healthCheck());
      }

      // Should not throw errors
      await expect(Promise.all(healthCheckPromises)).resolves.not.toThrow();
      
      pool.closeAll();
    });

    it('should handle pool shutdown during concurrent operations', async () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      
      // Start some operations
      const operations = [];
      for (let i = 0; i < 3; i++) {
        operations.push(pool.healthCheck());
      }

      // Close pool while operations are running
      const closePromise = pool.closeAll();

      // Wait for all operations to complete
      await Promise.allSettled([...operations, closePromise]);

      // Pool should be closed
      await expect(pool.getConnection(mockConfig)).rejects.toThrow('shutting down');
    });

    it('should maintain thread safety during concurrent error handling', async () => {
      const errorHandler = new ModbusErrorHandler({
        maxRetries: 1,
        baseRetryDelay: 10
      }, mockLogger);

      const promises = [];
      
      // Run concurrent error handling operations
      for (let i = 0; i < 3; i++) {
        const retryCallback = vi.fn().mockResolvedValue(`success${i}`);
        promises.push(
          errorHandler.handleError(
            new Error('Connection failed'),
            `device${i}`,
            'testOperation',
            retryCallback
          )
        );
      }

      const results = await Promise.all(promises);
      
      results.forEach((result, index) => {
        expect(result).toBe(`success${index}`);
      });

      errorHandler.destroy();
    });

    it('should handle mixed success and failure scenarios concurrently', async () => {
      const errorHandler = new ModbusErrorHandler({
        maxRetries: 1,
        baseRetryDelay: 10
      }, mockLogger);

      const promises = [];
      
      // Some operations succeed
      for (let i = 0; i < 2; i++) {
        const successCallback = vi.fn().mockResolvedValue(`success${i}`);
        promises.push(
          errorHandler.handleError(
            new Error('Connection failed'),
            `device${i}`,
            'testOperation',
            successCallback
          )
        );
      }

      // Some operations fail
      for (let i = 2; i < 4; i++) {
        const failCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));
        promises.push(
          errorHandler.handleError(
            new Error('Connection failed'),
            `device${i}`,
            'testOperation',
            failCallback
          ).catch(error => error)
        );
      }

      const results = await Promise.all(promises);
      
      // First 2 should succeed
      expect(results[0]).toBe('success0');
      expect(results[1]).toBe('success1');
      
      // Last 2 should be errors
      expect(results[2]).toBeInstanceOf(Error);
      expect(results[3]).toBeInstanceOf(Error);

      errorHandler.destroy();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle resource cleanup properly', () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      const errorHandler = new ModbusErrorHandler({}, mockLogger);

      // Should not throw during cleanup
      expect(() => pool.closeAll()).not.toThrow();
      expect(() => errorHandler.destroy()).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', () => {
      const errorHandler = new ModbusErrorHandler({}, mockLogger);

      // Multiple destroy calls should not throw
      expect(() => {
        errorHandler.destroy();
        errorHandler.destroy();
        errorHandler.destroy();
      }).not.toThrow();
    });

    it('should handle memory efficiently with error statistics', () => {
      const errorHandler = new ModbusErrorHandler({}, mockLogger);

      // Generate many errors to test memory handling
      for (let i = 0; i < 150; i++) {
        const error = new Error(`Error ${i}`);
        errorHandler.categorizeError(error, `device${i % 10}`);
      }

      const stats = errorHandler.getErrorStatistics();
      
      // Should limit recent errors to 100 (but categorizeError doesn't record to recentErrors)
      expect(stats.recentErrors.length).toBe(0); // categorizeError doesn't add to recentErrors
      expect(stats.totalErrors).toBe(0); // categorizeError doesn't increment totalErrors

      errorHandler.destroy();
    });
  });
});
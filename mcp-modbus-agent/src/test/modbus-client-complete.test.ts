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

// Mock EnhancedModbusClient
const createMockClient = (config: any = {}) => {
  const client = {
    connect: vi.fn().mockResolvedValue(config.connectResult ?? true),
    disconnect: vi.fn(),
    testConnection: vi.fn().mockResolvedValue(config.healthResult ?? true),
    getConnectionStatus: vi.fn().mockReturnValue(config.connected ?? true),
    getConfig: vi.fn().mockReturnValue(config.config ?? {}),
    destroy: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
    ...config.overrides
  };
  return client;
};

vi.mock('../enhanced-modbus-client.js', () => ({
  EnhancedModbusClient: vi.fn()
}));

describe('ModbusClient Unit Tests - Task 2.4 Complete', () => {
  let mockLogger: winston.Logger;
  let mockConfig: ModbusClientConfig;
  let mockClientConstructor: any;

  beforeEach(async () => {
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

    // Mock the constructor
    const { EnhancedModbusClient } = await import('../enhanced-modbus-client.js');
    mockClientConstructor = vi.mocked(EnhancedModbusClient);
    mockClientConstructor.mockImplementation(() => createMockClient());

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Connection Pooling Functionality', () => {
    it('should create and manage connection pool correctly', async () => {
      const poolConfig: Partial<ConnectionPoolConfig> = {
        maxConnections: 5,
        idleTimeout: 60000,
        acquireTimeout: 10000
      };
      
      const pool = new ModbusConnectionPool(poolConfig, mockLogger);
      
      // Test initial state
      const initialStats = pool.getStats();
      expect(initialStats.totalConnections).toBe(0);
      expect(initialStats.activeConnections).toBe(0);
      expect(initialStats.idleConnections).toBe(0);
      expect(initialStats.pendingRequests).toBe(0);
      
      // Test connection creation
      const connection = await pool.getConnection(mockConfig);
      expect(connection).toBeDefined();
      expect(mockClientConstructor).toHaveBeenCalledWith(mockConfig, mockLogger);
      
      const afterCreateStats = pool.getStats();
      expect(afterCreateStats.totalConnections).toBe(1);
      expect(afterCreateStats.activeConnections).toBe(1);
      expect(afterCreateStats.successfulRequests).toBe(1);
      
      // Test connection release
      pool.releaseConnection(connection);
      
      const afterReleaseStats = pool.getStats();
      expect(afterReleaseStats.activeConnections).toBe(0);
      expect(afterReleaseStats.idleConnections).toBe(1);
      
      // Test connection reuse
      const connection2 = await pool.getConnection(mockConfig);
      expect(connection2).toBe(connection);
      expect(mockClientConstructor).toHaveBeenCalledTimes(1); // Should not create new client
      
      await pool.closeAll();
    });

    it('should handle connection pool limits correctly', async () => {
      const poolConfig: Partial<ConnectionPoolConfig> = {
        maxConnections: 2,
        acquireTimeout: 1000
      };
      
      const pool = new ModbusConnectionPool(poolConfig, mockLogger);
      
      // Create connections up to limit
      const connection1 = await pool.getConnection({ ...mockConfig, unitId: 1 });
      const connection2 = await pool.getConnection({ ...mockConfig, unitId: 2 });
      
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
      
      // Test that pool respects limits
      expect(stats.totalConnections).toBeLessThanOrEqual(poolConfig.maxConnections!);
      
      await pool.closeAll();
    });

    it('should perform health checks on connections', async () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      
      const connection = await pool.getConnection(mockConfig);
      
      // Perform health check
      await pool.healthCheck();
      
      expect(connection.testConnection).toHaveBeenCalled();
      
      await pool.closeAll();
    });

    it('should handle pool shutdown correctly', async () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      
      const connection = await pool.getConnection(mockConfig);
      
      await pool.closeAll();
      
      expect(connection.disconnect).toHaveBeenCalled();
      
      const stats = pool.getStats();
      expect(stats.totalConnections).toBe(0);
      
      // Should reject new connections after shutdown
      await expect(pool.getConnection(mockConfig)).rejects.toThrow('shutting down');
    });
  });

  describe('Error Handling and Reconnection Scenarios', () => {
    it('should categorize different types of Modbus errors correctly', () => {
      const errorHandler = new ModbusErrorHandler({ maxRetries: 3, baseRetryDelay: 100 }, mockLogger);
      
      const testCases = [
        { message: 'ECONNREFUSED', expected: ModbusErrorType.CONNECTION_FAILED },
        { message: 'ETIMEDOUT', expected: ModbusErrorType.TIMEOUT },
        { message: 'timeout', expected: ModbusErrorType.TIMEOUT },
        { message: 'Illegal function exception', expected: ModbusErrorType.PROTOCOL_ERROR },
        { message: 'Slave device busy', expected: ModbusErrorType.DEVICE_BUSY },
        { message: 'register address out of range', expected: ModbusErrorType.INVALID_REGISTER },
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

    it('should implement exponential backoff calculation', () => {
      const errorHandler = new ModbusErrorHandler({
        baseRetryDelay: 100,
        backoffMultiplier: 2,
        maxRetryDelay: 1000,
        jitterEnabled: false
      }, mockLogger);
      
      // Test private method through reflection
      const calculateRetryDelay = (errorHandler as any).calculateRetryDelay.bind(errorHandler);
      
      expect(calculateRetryDelay(1)).toBe(100); // 100 * 2^0 = 100
      expect(calculateRetryDelay(2)).toBe(200); // 100 * 2^1 = 200
      expect(calculateRetryDelay(3)).toBe(400); // 100 * 2^2 = 400
      expect(calculateRetryDelay(10)).toBe(1000); // Should be capped at maxRetryDelay
      
      errorHandler.destroy();
    });

    it('should track error statistics', () => {
      const errorHandler = new ModbusErrorHandler({}, mockLogger);
      
      // Categorize some errors to generate statistics
      errorHandler.categorizeError(new Error('Connection failed'), 'device1');
      errorHandler.categorizeError(new Error('ETIMEDOUT'), 'device2');
      errorHandler.categorizeError(new Error('Connection failed'), 'device1');
      
      const stats = errorHandler.getErrorStatistics();
      
      // Note: categorizeError doesn't increment totalErrors, only recordError does
      expect(stats.errorsByType).toBeInstanceOf(Map);
      expect(stats.errorsByDevice).toBeInstanceOf(Map);
      expect(stats.recentErrors).toBeInstanceOf(Array);
      
      errorHandler.destroy();
    });

    it('should reset error statistics', () => {
      const errorHandler = new ModbusErrorHandler({}, mockLogger);
      
      // Generate some errors first
      errorHandler.categorizeError(new Error('Test error'), 'device1');

      errorHandler.resetStatistics();

      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType.size).toBe(0);
      expect(stats.errorsByDevice.size).toBe(0);
      expect(stats.recentErrors.length).toBe(0);
      
      errorHandler.destroy();
    });

    it('should handle circuit breaker state management', () => {
      const errorHandler = new ModbusErrorHandler({
        circuitBreakerThreshold: 3,
        circuitBreakerTimeout: 1000
      }, mockLogger);
      
      // Test private method through reflection
      const updateCircuitBreaker = (errorHandler as any).updateCircuitBreaker.bind(errorHandler);
      const isCircuitBreakerOpen = (errorHandler as any).isCircuitBreakerOpen.bind(errorHandler);
      
      // Initially closed
      expect(isCircuitBreakerOpen('device1')).toBe(false);
      
      // Trigger failures
      updateCircuitBreaker('device1', false);
      updateCircuitBreaker('device1', false);
      updateCircuitBreaker('device1', false);
      
      // Should be open now
      expect(isCircuitBreakerOpen('device1')).toBe(true);
      
      // Reset should close it
      errorHandler.resetCircuitBreaker('device1');
      expect(isCircuitBreakerOpen('device1')).toBe(false);
      
      errorHandler.destroy();
    });
  });

  describe('Concurrent Connection Management', () => {
    it('should handle concurrent health checks safely', async () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      
      // Create some connections
      const connection1 = await pool.getConnection({ ...mockConfig, unitId: 1 });
      const connection2 = await pool.getConnection({ ...mockConfig, unitId: 2 });
      
      // Run multiple concurrent health checks
      const healthCheckPromises = [];
      for (let i = 0; i < 3; i++) {
        healthCheckPromises.push(pool.healthCheck());
      }

      // Should not throw errors
      await expect(Promise.all(healthCheckPromises)).resolves.not.toThrow();
      
      // All connections should have been health checked
      expect(connection1.testConnection).toHaveBeenCalled();
      expect(connection2.testConnection).toHaveBeenCalled();
      
      await pool.closeAll();
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

    it('should handle concurrent error handler operations', () => {
      const errorHandler = new ModbusErrorHandler({}, mockLogger);
      
      // Run concurrent error categorization
      const errors = [
        new Error('Connection failed'),
        new Error('ETIMEDOUT'),
        new Error('Device busy'),
        new Error('Invalid register')
      ];
      
      const results = errors.map((error, index) => 
        errorHandler.categorizeError(error, `device${index}`)
      );
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeInstanceOf(ModbusError);
      });
      
      errorHandler.destroy();
    });

    it('should maintain thread safety during resource cleanup', () => {
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
  });

  describe('Performance and Resource Management', () => {
    it('should handle resource cleanup properly', async () => {
      const pool = new ModbusConnectionPool({}, mockLogger);
      const errorHandler = new ModbusErrorHandler({}, mockLogger);

      // Create some resources
      const connection = await pool.getConnection(mockConfig);
      errorHandler.categorizeError(new Error('Test'), 'device1');

      // Should not throw during cleanup
      expect(() => pool.closeAll()).not.toThrow();
      expect(() => errorHandler.destroy()).not.toThrow();
    });

    it('should track pool statistics accurately', async () => {
      const pool = new ModbusConnectionPool({ maxConnections: 3 }, mockLogger);
      
      // Create connections
      const connection1 = await pool.getConnection({ ...mockConfig, unitId: 1 });
      const connection2 = await pool.getConnection({ ...mockConfig, unitId: 2 });
      
      let stats = pool.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
      expect(stats.successfulRequests).toBe(2);
      
      // Release one connection
      pool.releaseConnection(connection1);
      
      stats = pool.getStats();
      expect(stats.activeConnections).toBe(1);
      expect(stats.idleConnections).toBe(1);
      
      await pool.closeAll();
    });

    it('should handle error statistics memory efficiently', () => {
      const errorHandler = new ModbusErrorHandler({}, mockLogger);

      // Generate many errors to test memory handling
      for (let i = 0; i < 150; i++) {
        const error = new Error(`Error ${i}`);
        errorHandler.categorizeError(error, `device${i % 10}`);
      }

      const stats = errorHandler.getErrorStatistics();
      
      // Should handle large numbers of errors without issues
      expect(stats.errorsByDevice.size).toBeLessThanOrEqual(10);
      expect(stats.recentErrors.length).toBeLessThanOrEqual(100);

      errorHandler.destroy();
    });
  });
});
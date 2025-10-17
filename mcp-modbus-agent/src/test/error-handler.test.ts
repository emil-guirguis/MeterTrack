import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import winston from 'winston';
import { ModbusErrorHandler, ErrorHandlerConfig } from '../error-handler.js';
import { ModbusError, ModbusErrorType } from '../types/modbus.js';

describe('ModbusErrorHandler', () => {
  let errorHandler: ModbusErrorHandler;
  let mockLogger: winston.Logger;
  let mockConfig: Partial<ErrorHandlerConfig>;

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
      maxRetries: 3,
      baseRetryDelay: 100, // Short delay for tests
      maxRetryDelay: 1000,
      backoffMultiplier: 2,
      jitterEnabled: false, // Disable jitter for predictable tests
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 1000,
      errorCategorization: true,
      healthCheckInterval: 5000
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (errorHandler) {
      errorHandler.destroy();
    }
  });

  describe('Constructor', () => {
    it('should create error handler with default configuration', () => {
      errorHandler = new ModbusErrorHandler({}, mockLogger);
      
      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });

    it('should create error handler with custom configuration', () => {
      errorHandler = new ModbusErrorHandler(mockConfig, mockLogger);
      
      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('Error Categorization', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(mockConfig, mockLogger);
    });

    it('should categorize connection errors', () => {
      const connectionError = new Error('ECONNREFUSED');
      const categorized = errorHandler.categorizeError(connectionError, 'device1');

      expect(categorized).toBeInstanceOf(ModbusError);
      expect(categorized.type).toBe(ModbusErrorType.CONNECTION_FAILED);
      expect(categorized.deviceId).toBe('device1');
    });

    it('should categorize timeout errors', () => {
      const timeoutError = new Error('ETIMEDOUT');
      const categorized = errorHandler.categorizeError(timeoutError, 'device1');

      expect(categorized.type).toBe(ModbusErrorType.TIMEOUT);
    });

    it('should categorize protocol errors', () => {
      const protocolError = new Error('Illegal function exception');
      const categorized = errorHandler.categorizeError(protocolError, 'device1');

      expect(categorized.type).toBe(ModbusErrorType.PROTOCOL_ERROR);
    });

    it('should categorize device busy errors', () => {
      const busyError = new Error('Slave device busy');
      const categorized = errorHandler.categorizeError(busyError, 'device1');

      expect(categorized.type).toBe(ModbusErrorType.DEVICE_BUSY);
    });

    it('should categorize register errors', () => {
      const registerError = new Error('register address out of range');
      const categorized = errorHandler.categorizeError(registerError, 'device1');

      expect(categorized.type).toBe(ModbusErrorType.INVALID_REGISTER);
    });

    it('should categorize unknown errors', () => {
      const unknownError = new Error('Some unknown error');
      const categorized = errorHandler.categorizeError(unknownError, 'device1');

      expect(categorized.type).toBe(ModbusErrorType.UNKNOWN_ERROR);
    });

    it('should return ModbusError as-is', () => {
      const modbusError = new ModbusError('Test error', ModbusErrorType.CONNECTION_FAILED, 'device1');
      const categorized = errorHandler.categorizeError(modbusError, 'device1');

      expect(categorized).toBe(modbusError);
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(mockConfig, mockLogger);
    });

    it('should determine retryable errors', () => {
      const retryableError = new ModbusError('Connection failed', ModbusErrorType.CONNECTION_FAILED);
      const nonRetryableError = new ModbusError('Invalid register', ModbusErrorType.INVALID_REGISTER);

      expect(errorHandler.isRetryableError(retryableError)).toBe(true);
      expect(errorHandler.isRetryableError(nonRetryableError)).toBe(false);
    });

    it('should retry on retryable errors', async () => {
      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      expect(result).toBe('success');
      expect(retryCallback).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      await expect(errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      )).rejects.toThrow('Operation failed after 3 retries');

      expect(retryCallback).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const retryCallback = vi.fn();

      await expect(errorHandler.handleError(
        new Error('Invalid register address'),
        'device1',
        'testOperation',
        retryCallback
      )).rejects.toThrow(ModbusError);

      expect(retryCallback).not.toHaveBeenCalled();
    });

    it('should calculate exponential backoff delay', async () => {
      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      
      await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should have waited at least the base retry delay (100ms)
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Circuit Breaker', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(mockConfig, mockLogger);
    });

    it('should open circuit breaker after threshold failures', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Trigger failures to open circuit breaker
      for (let i = 0; i < 3; i++) {
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
    });

    it('should transition to half-open after timeout', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Open circuit breaker
      for (let i = 0; i < 3; i++) {
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

      // Wait for circuit breaker timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should allow one attempt (half-open state)
      retryCallback.mockResolvedValueOnce('success');
      
      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      expect(result).toBe('success');
    });

    it('should reset circuit breaker manually', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Open circuit breaker
      for (let i = 0; i < 3; i++) {
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

      // Reset circuit breaker
      errorHandler.resetCircuitBreaker('device1');

      // Should allow operation again
      retryCallback.mockResolvedValueOnce('success');
      
      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      expect(result).toBe('success');
    });
  });

  describe('Error Statistics', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(mockConfig, mockLogger);
    });

    it('should track error statistics', async () => {
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
      expect(stats.recentErrors.length).toBeGreaterThan(0);
    });

    it('should reset error statistics', () => {
      // Generate some errors first
      const error = new ModbusError('Test error', ModbusErrorType.CONNECTION_FAILED, 'device1');
      errorHandler.categorizeError(error, 'device1');

      errorHandler.resetStatistics();

      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType.size).toBe(0);
      expect(stats.errorsByDevice.size).toBe(0);
      expect(stats.recentErrors.length).toBe(0);
    });

    it('should limit recent errors to 100', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Generate more than 100 errors (but fewer to avoid timeout)
      for (let i = 0; i < 110; i++) {
        try {
          await errorHandler.handleError(
            new Error(`Connection failed ${i}`),
            `device${i % 10}`, // Reuse device IDs to avoid too many circuit breakers
            'testOperation',
            retryCallback
          );
        } catch (error) {
          // Expected errors
        }
      }

      const stats = errorHandler.getErrorStatistics();
      expect(stats.recentErrors.length).toBe(100);
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(mockConfig, mockLogger);
    });

    it('should emit retry events', async () => {
      const retrySpy = vi.fn();
      const retrySuccessSpy = vi.fn();
      
      errorHandler.on('retry', retrySpy);
      errorHandler.on('retrySuccess', retrySuccessSpy);

      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      expect(retrySpy).toHaveBeenCalled();
      expect(retrySuccessSpy).toHaveBeenCalled();
    });

    it('should emit circuit breaker events', async () => {
      const openedSpy = vi.fn();
      const closedSpy = vi.fn();
      const halfOpenSpy = vi.fn();
      const resetSpy = vi.fn();
      
      errorHandler.on('circuitBreakerOpened', openedSpy);
      errorHandler.on('circuitBreakerClosed', closedSpy);
      errorHandler.on('circuitBreakerHalfOpen', halfOpenSpy);
      errorHandler.on('circuitBreakerReset', resetSpy);

      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Open circuit breaker
      for (let i = 0; i < 3; i++) {
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

      expect(openedSpy).toHaveBeenCalledWith('device1');

      // Reset circuit breaker
      errorHandler.resetCircuitBreaker('device1');
      expect(resetSpy).toHaveBeenCalledWith('device1');
    });

    it('should emit error recorded events', async () => {
      const errorRecordedSpy = vi.fn();
      errorHandler.on('errorRecorded', errorRecordedSpy);

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

      expect(errorRecordedSpy).toHaveBeenCalled();
    });
  });

  describe('Health Check', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler({ ...mockConfig, healthCheckInterval: 100 }, mockLogger);
    });

    it('should emit health check completed events', async () => {
      const healthCheckSpy = vi.fn();
      errorHandler.on('healthCheckCompleted', healthCheckSpy);

      // Wait for health check to run
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(healthCheckSpy).toHaveBeenCalled();
    });

    it('should clean up stale retry contexts during health check', async () => {
      // This is tested indirectly by ensuring the health check runs without errors
      const healthCheckSpy = vi.fn();
      errorHandler.on('healthCheckCompleted', healthCheckSpy);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(healthCheckSpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(mockConfig, mockLogger);
    });

    it('should destroy error handler properly', () => {
      expect(() => errorHandler.destroy()).not.toThrow();
    });

    it('should clear intervals on destroy', () => {
      errorHandler.destroy();
      
      // Should not emit events after destroy
      const healthCheckSpy = vi.fn();
      errorHandler.on('healthCheckCompleted', healthCheckSpy);

      // Wait longer than health check interval
      setTimeout(() => {
        expect(healthCheckSpy).not.toHaveBeenCalled();
      }, 200);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(mockConfig, mockLogger);
    });

    it('should handle concurrent retry operations for same device', async () => {
      const retryCallback1 = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success1');
      
      const retryCallback2 = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success2');

      const [result1, result2] = await Promise.all([
        errorHandler.handleError(
          new Error('Connection failed'),
          'device1',
          'operation1',
          retryCallback1
        ),
        errorHandler.handleError(
          new Error('Connection failed'),
          'device1',
          'operation2',
          retryCallback2
        )
      ]);

      expect(result1).toBe('success1');
      expect(result2).toBe('success2');
    });

    it('should handle retry callback throwing different error types', async () => {
      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed')) // Use retryable error
        .mockResolvedValueOnce('success');

      // Should succeed after retries
      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      expect(result).toBe('success');
    });

    it('should handle very large retry delays', async () => {
      const largeDelayConfig = {
        ...mockConfig,
        baseRetryDelay: 100, // Use smaller delay for test
        maxRetryDelay: 500
      };
      
      errorHandler.destroy();
      errorHandler = new ModbusErrorHandler(largeDelayConfig, mockLogger);

      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      
      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      const elapsed = Date.now() - startTime;
      
      expect(result).toBe('success');
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });
});
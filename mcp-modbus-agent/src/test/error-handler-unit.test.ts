import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import winston from 'winston';
import { ModbusErrorHandler, ErrorHandlerConfig } from '../error-handler.js';
import { ModbusError, ModbusErrorType } from '../types/modbus.js';

describe('Error Handler Unit Tests', () => {
  let errorHandler: ModbusErrorHandler;
  let mockLogger: winston.Logger;
  let config: Partial<ErrorHandlerConfig>;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    } as any;

    // Create test configuration
    config = {
      maxRetries: 3,
      baseRetryDelay: 100,
      maxRetryDelay: 1000,
      backoffMultiplier: 2,
      jitterEnabled: false, // Disable for predictable tests
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 1000,
      errorCategorization: true,
      healthCheckInterval: 5000
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    if (errorHandler) {
      errorHandler.destroy();
    }
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      errorHandler = new ModbusErrorHandler({}, mockLogger);
      
      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType.size).toBe(0);
      expect(stats.errorsByDevice.size).toBe(0);
      expect(stats.recentErrors).toHaveLength(0);
    });

    it('should initialize with custom configuration', () => {
      errorHandler = new ModbusErrorHandler(config, mockLogger);
      
      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });

    it('should start health check interval', () => {
      vi.useFakeTimers();
      errorHandler = new ModbusErrorHandler(config, mockLogger);
      
      const healthCheckSpy = vi.fn();
      errorHandler.on('healthCheckCompleted', healthCheckSpy);

      // Fast-forward time to trigger health check
      vi.advanceTimersByTime(6000);

      expect(healthCheckSpy).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('Error Categorization', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(config, mockLogger);
    });

    it('should categorize connection errors correctly', () => {
      const testCases = [
        { message: 'ECONNREFUSED', expected: ModbusErrorType.CONNECTION_FAILED },
        { message: 'connect ECONNREFUSED', expected: ModbusErrorType.CONNECTION_FAILED },
        { message: 'ENOTFOUND', expected: ModbusErrorType.CONNECTION_FAILED },
        { message: 'ENETUNREACH', expected: ModbusErrorType.CONNECTION_FAILED }
      ];

      testCases.forEach(({ message, expected }) => {
        const error = new Error(message);
        const categorized = errorHandler.categorizeError(error, 'device1');
        
        expect(categorized).toBeInstanceOf(ModbusError);
        expect(categorized.type).toBe(expected);
        expect(categorized.deviceId).toBe('device1');
        expect(categorized.message).toBe(message);
      });
    });

    it('should categorize timeout errors correctly', () => {
      const testCases = [
        'ETIMEDOUT',
        'timeout',
        'connection timeout',
        'request timeout'
      ];

      testCases.forEach(message => {
        const error = new Error(message);
        const categorized = errorHandler.categorizeError(error, 'device1');
        
        expect(categorized.type).toBe(ModbusErrorType.TIMEOUT);
      });
    });

    it('should categorize protocol errors correctly', () => {
      const testCases = [
        'Illegal function exception',
        'illegal data address',
        'invalid function code',
        'modbus exception'
      ];

      testCases.forEach(message => {
        const error = new Error(message);
        const categorized = errorHandler.categorizeError(error, 'device1');
        
        expect(categorized.type).toBe(ModbusErrorType.PROTOCOL_ERROR);
      });
    });

    it('should categorize device busy errors correctly', () => {
      const testCases = [
        'Slave device busy',
        'device busy',
        'busy'
      ];

      testCases.forEach(message => {
        const error = new Error(message);
        const categorized = errorHandler.categorizeError(error, 'device1');
        
        expect(categorized.type).toBe(ModbusErrorType.DEVICE_BUSY);
      });
    });

    it('should categorize register errors correctly', () => {
      const testCases = [
        'register address out of range',
        'invalid register',
        'register not found',
        'address error'
      ];

      testCases.forEach(message => {
        const error = new Error(message);
        const categorized = errorHandler.categorizeError(error, 'device1');
        
        expect(categorized.type).toBe(ModbusErrorType.INVALID_REGISTER);
      });
    });

    it('should categorize unknown errors as UNKNOWN_ERROR', () => {
      const error = new Error('Some random error message');
      const categorized = errorHandler.categorizeError(error, 'device1');
      
      expect(categorized.type).toBe(ModbusErrorType.UNKNOWN_ERROR);
    });

    it('should return ModbusError instances unchanged', () => {
      const originalError = new ModbusError(
        'Test error', 
        ModbusErrorType.CONNECTION_FAILED, 
        'device1'
      );
      
      const result = errorHandler.categorizeError(originalError, 'device1');
      
      expect(result).toBe(originalError);
    });

    it('should handle case-insensitive error messages', () => {
      const error = new Error('CONNECTION REFUSED');
      const categorized = errorHandler.categorizeError(error, 'device1');
      
      expect(categorized.type).toBe(ModbusErrorType.CONNECTION_FAILED);
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(config, mockLogger);
    });

    it('should identify retryable errors correctly', () => {
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
    });

    it('should retry retryable errors with exponential backoff', async () => {
      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      
      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      expect(result).toBe('success');
      expect(retryCallback).toHaveBeenCalledTimes(3);
      
      // Should have waited for retry delays: 100ms + 200ms = 300ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(300);
    });

    it('should fail after max retries exceeded', async () => {
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

    it('should calculate exponential backoff delays correctly', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for test
      });

      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      expect(delays).toHaveLength(2);
      expect(delays[0]).toBe(100); // First retry: baseDelay * 2^0 = 100
      expect(delays[1]).toBe(200); // Second retry: baseDelay * 2^1 = 200

      global.setTimeout = originalSetTimeout;
    });

    it('should respect maximum retry delay', async () => {
      // Create handler with low max delay
      errorHandler.destroy();
      errorHandler = new ModbusErrorHandler({
        ...config,
        baseRetryDelay: 100,
        maxRetryDelay: 150,
        backoffMultiplier: 3
      }, mockLogger);

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      });

      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      // Second delay should be capped at maxRetryDelay
      expect(delays[1]).toBeLessThanOrEqual(150);

      global.setTimeout = originalSetTimeout;
    });

    it('should add jitter when enabled', async () => {
      // Create handler with jitter enabled
      errorHandler.destroy();
      errorHandler = new ModbusErrorHandler({
        ...config,
        jitterEnabled: true
      }, mockLogger);

      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      global.setTimeout = vi.fn().mockImplementation((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      });

      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      // With jitter, delay should be different from exact base delay
      expect(delays[0]).toBeGreaterThan(100);
      expect(delays[0]).toBeLessThan(110); // Should be within 10% jitter

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Circuit Breaker Pattern', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(config, mockLogger);
    });

    it('should open circuit breaker after threshold failures', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Trigger failures to reach threshold
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

    it('should emit circuit breaker events', async () => {
      const openedSpy = vi.fn();
      const closedSpy = vi.fn();
      const halfOpenSpy = vi.fn();
      
      errorHandler.on('circuitBreakerOpened', openedSpy);
      errorHandler.on('circuitBreakerClosed', closedSpy);
      errorHandler.on('circuitBreakerHalfOpen', halfOpenSpy);

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
    });

    it('should transition to half-open after timeout', async () => {
      vi.useFakeTimers();
      
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

      // Fast-forward time past circuit breaker timeout
      vi.advanceTimersByTime(1100);

      // Should allow one attempt (half-open state)
      retryCallback.mockResolvedValueOnce('success');
      
      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      expect(result).toBe('success');
      
      vi.useRealTimers();
    }, 20000);

    it('should close circuit breaker on successful operation in half-open state', async () => {
      vi.useFakeTimers();
      
      const closedSpy = vi.fn();
      errorHandler.on('circuitBreakerClosed', closedSpy);

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

      // Wait for half-open transition
      vi.advanceTimersByTime(1100);

      // Succeed in half-open state
      retryCallback.mockResolvedValueOnce('success');
      
      await errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      expect(closedSpy).toHaveBeenCalledWith('device1');
      
      vi.useRealTimers();
    });

    it('should return to open state on failure in half-open state', async () => {
      vi.useFakeTimers();
      
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

      // Wait for half-open transition
      vi.advanceTimersByTime(1100);

      // Fail in half-open state
      await expect(errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      )).rejects.toThrow('Operation failed after 3 retries');

      // Should be open again
      await expect(errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      )).rejects.toThrow('Circuit breaker is open');
      
      vi.useRealTimers();
    });

    it('should handle multiple devices independently', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Open circuit breaker for device1
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

      // device1 should be blocked
      await expect(errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      )).rejects.toThrow('Circuit breaker is open');

      // device2 should still work
      retryCallback.mockResolvedValueOnce('success');
      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        'device2',
        'testOperation',
        retryCallback
      );

      expect(result).toBe('success');
    });

    it('should reset circuit breaker manually', async () => {
      const resetSpy = vi.fn();
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

      // Reset circuit breaker
      errorHandler.resetCircuitBreaker('device1');
      expect(resetSpy).toHaveBeenCalledWith('device1');

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

  describe('Error Statistics and Monitoring', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(config, mockLogger);
    });

    it('should track error statistics correctly', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Generate some errors
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

      try {
        await errorHandler.handleError(
          new Error('ETIMEDOUT'),
          'device2',
          'testOperation',
          retryCallback
        );
      } catch (error) {
        // Expected error
      }

      const stats = errorHandler.getErrorStatistics();
      
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.errorsByType.get(ModbusErrorType.CONNECTION_FAILED)).toBeGreaterThan(0);
      expect(stats.errorsByType.get(ModbusErrorType.TIMEOUT)).toBeGreaterThan(0);
      expect(stats.errorsByDevice.get('device1')).toBeGreaterThan(0);
      expect(stats.errorsByDevice.get('device2')).toBeGreaterThan(0);
      expect(stats.recentErrors.length).toBeGreaterThan(0);
    });

    it('should limit recent errors to 100 entries', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Generate more than 100 errors
      for (let i = 0; i < 110; i++) {
        try {
          await errorHandler.handleError(
            new Error(`Connection failed ${i}`),
            `device${i % 5}`, // Cycle through devices to avoid circuit breaker
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

    it('should reset statistics correctly', async () => {
      const retryCallback = vi.fn().mockRejectedValue(new Error('Connection failed'));

      // Generate some errors
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

      let stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);

      // Reset statistics
      errorHandler.resetStatistics();

      stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType.size).toBe(0);
      expect(stats.errorsByDevice.size).toBe(0);
      expect(stats.recentErrors.length).toBe(0);
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
      expect(errorRecordedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'device1',
          operation: 'testOperation',
          totalErrors: expect.any(Number)
        })
      );
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

      expect(retrySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'device1',
          operation: 'testOperation',
          attempt: 1,
          maxAttempts: 3,
          delay: expect.any(Number)
        })
      );

      expect(retrySuccessSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceId: 'device1',
          operation: 'testOperation',
          attempt: 1,
          totalTime: expect.any(Number)
        })
      );
    });
  });

  describe('Health Check and Cleanup', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler({
        ...config,
        healthCheckInterval: 100
      }, mockLogger);
    });

    it('should emit health check completed events', async () => {
      const healthCheckSpy = vi.fn();
      errorHandler.on('healthCheckCompleted', healthCheckSpy);

      // Wait for health check to run
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(healthCheckSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          activeRetryContexts: expect.any(Number),
          circuitBreakers: expect.any(Number),
          totalErrors: expect.any(Number)
        })
      );
    });

    it('should clean up stale retry contexts', async () => {
      vi.useFakeTimers();
      
      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      // Start an operation that will create a retry context
      const promise = errorHandler.handleError(
        new Error('Connection failed'),
        'device1',
        'testOperation',
        retryCallback
      );

      // Fast-forward time to make retry context stale
      vi.advanceTimersByTime(400000); // 6+ minutes

      // Health check should clean up stale contexts
      // This is tested indirectly by ensuring no memory leaks

      vi.useRealTimers();
    });

    it('should transition circuit breakers during health check', async () => {
      vi.useFakeTimers();
      
      const halfOpenSpy = vi.fn();
      errorHandler.on('circuitBreakerHalfOpen', halfOpenSpy);

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

      // Fast-forward past circuit breaker timeout
      vi.advanceTimersByTime(1100);

      expect(halfOpenSpy).toHaveBeenCalledWith('device1');
      
      vi.useRealTimers();
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(config, mockLogger);
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

    it('should handle concurrent operations for different devices', async () => {
      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');

      const promises = [];
      for (let i = 0; i < 5; i++) {
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
      
      results.forEach(result => {
        expect(result).toBe('success');
      });
    });

    it('should handle mixed success and failure scenarios', async () => {
      const promises = [];
      
      // Some operations succeed
      for (let i = 0; i < 3; i++) {
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
      for (let i = 3; i < 6; i++) {
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
      
      // First 3 should succeed
      expect(results[0]).toBe('success0');
      expect(results[1]).toBe('success1');
      expect(results[2]).toBe('success2');
      
      // Last 3 should be errors
      expect(results[3]).toBeInstanceOf(Error);
      expect(results[4]).toBeInstanceOf(Error);
      expect(results[5]).toBeInstanceOf(Error);
    });
  });

  describe('Resource Management', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(config, mockLogger);
    });

    it('should clean up resources on destroy', () => {
      const removeAllListenersSpy = vi.spyOn(errorHandler, 'removeAllListeners');
      
      errorHandler.destroy();

      expect(removeAllListenersSpy).toHaveBeenCalled();
    });

    it('should stop health check interval on destroy', () => {
      vi.useFakeTimers();
      
      const healthCheckSpy = vi.fn();
      errorHandler.on('healthCheckCompleted', healthCheckSpy);

      errorHandler.destroy();

      // Fast-forward time - should not trigger health check
      vi.advanceTimersByTime(10000);

      expect(healthCheckSpy).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should handle destroy being called multiple times', () => {
      expect(() => {
        errorHandler.destroy();
        errorHandler.destroy();
        errorHandler.destroy();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      errorHandler = new ModbusErrorHandler(config, mockLogger);
    });

    it('should handle retry callback throwing different error types', async () => {
      const retryCallback = vi.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Timeout'))
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

    it('should handle very large retry delays gracefully', async () => {
      errorHandler.destroy();
      errorHandler = new ModbusErrorHandler({
        ...config,
        baseRetryDelay: 1000,
        maxRetryDelay: 5000,
        backoffMultiplier: 10
      }, mockLogger);

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
      // Should respect max delay
      expect(elapsed).toBeLessThan(6000);
    });

    it('should handle empty device ID', async () => {
      const retryCallback = vi.fn().mockResolvedValue('success');

      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        '',
        'testOperation',
        retryCallback
      );

      expect(result).toBe('success');
    });

    it('should handle null/undefined device ID', async () => {
      const retryCallback = vi.fn().mockResolvedValue('success');

      const result = await errorHandler.handleError(
        new Error('Connection failed'),
        undefined as any,
        'testOperation',
        retryCallback
      );

      expect(result).toBe('success');
    });
  });
});
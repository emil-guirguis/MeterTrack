import { EventEmitter } from 'events';
import winston from 'winston';
import { ModbusError, ModbusErrorType, PerformanceMetrics } from './types/modbus.js';

export interface ErrorHandlerConfig {
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  errorCategorization: boolean;
  healthCheckInterval: number;
}

export interface RetryContext {
  attempt: number;
  maxAttempts: number;
  lastError: Error;
  startTime: number;
  deviceId: string;
  operation: string;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export interface ErrorStatistics {
  totalErrors: number;
  errorsByType: Map<ModbusErrorType, number>;
  errorsByDevice: Map<string, number>;
  recentErrors: Array<{
    timestamp: Date;
    error: ModbusError;
    deviceId: string;
    operation: string;
  }>;
  circuitBreakerStates: Map<string, CircuitBreakerState>;
}

/**
 * Enhanced error handling and reconnection logic for Modbus operations
 * Implements exponential backoff, circuit breaker pattern, and comprehensive error categorization
 */
export class ModbusErrorHandler extends EventEmitter {
  private config: ErrorHandlerConfig;
  private logger: winston.Logger;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private retryContexts: Map<string, RetryContext> = new Map();
  private errorStats: ErrorStatistics;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ErrorHandlerConfig>, logger: winston.Logger) {
    super();
    this.config = {
      maxRetries: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 30000,
      backoffMultiplier: 2,
      jitterEnabled: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      errorCategorization: true,
      healthCheckInterval: 30000,
      ...config
    };
    this.logger = logger;
    this.errorStats = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsByDevice: new Map(),
      recentErrors: [],
      circuitBreakerStates: new Map()
    };
    this.startHealthCheck();
  }

  /**
   * Categorizes and handles Modbus errors with appropriate retry logic
   */
  public async handleError(
    error: Error, 
    deviceId: string, 
    operation: string,
    retryCallback: () => Promise<any>
  ): Promise<any> {
    const modbusError = this.categorizeError(error, deviceId);
    this.recordError(modbusError, deviceId, operation);

    // Check circuit breaker state
    if (this.isCircuitBreakerOpen(deviceId)) {
      throw new ModbusError(
        `Circuit breaker is open for device ${deviceId}`,
        ModbusErrorType.CONNECTION_FAILED,
        deviceId
      );
    }

    // Determine if error is retryable
    if (!this.isRetryableError(modbusError)) {
      this.updateCircuitBreaker(deviceId, false);
      throw modbusError;
    }

    // Get or create retry context
    const contextKey = `${deviceId}-${operation}`;
    let retryContext = this.retryContexts.get(contextKey);
    
    if (!retryContext) {
      retryContext = {
        attempt: 0,
        maxAttempts: this.config.maxRetries,
        lastError: modbusError,
        startTime: Date.now(),
        deviceId,
        operation
      };
      this.retryContexts.set(contextKey, retryContext);
    }

    retryContext.attempt++;
    retryContext.lastError = modbusError;

    // Check if we've exceeded max retries
    if (retryContext.attempt > retryContext.maxAttempts) {
      this.retryContexts.delete(contextKey);
      this.updateCircuitBreaker(deviceId, false);
      
      throw new ModbusError(
        `Operation failed after ${retryContext.maxAttempts} retries: ${modbusError.message}`,
        modbusError.type,
        deviceId
      );
    }

    // Calculate retry delay with exponential backoff and jitter
    const delay = this.calculateRetryDelay(retryContext.attempt);
    
    this.logger.warn(`Retrying operation ${operation} for device ${deviceId} in ${delay}ms (attempt ${retryContext.attempt}/${retryContext.maxAttempts})`, {
      error: modbusError.message,
      errorType: modbusError.type,
      delay
    });

    this.emit('retry', {
      deviceId,
      operation,
      attempt: retryContext.attempt,
      maxAttempts: retryContext.maxAttempts,
      delay,
      error: modbusError
    });

    // Wait for retry delay
    await this.sleep(delay);

    try {
      const result = await retryCallback();
      
      // Success - clean up retry context and update circuit breaker
      this.retryContexts.delete(contextKey);
      this.updateCircuitBreaker(deviceId, true);
      
      this.emit('retrySuccess', {
        deviceId,
        operation,
        attempt: retryContext.attempt,
        totalTime: Date.now() - retryContext.startTime
      });

      return result;
    } catch (retryError) {
      // Recursive call to handle the retry error
      return this.handleError(retryError instanceof Error ? retryError : new Error(String(retryError)), deviceId, operation, retryCallback);
    }
  }

  /**
   * Categorizes errors into specific Modbus error types
   */
  public categorizeError(error: Error, deviceId?: string): ModbusError {
    if (error instanceof ModbusError) {
      return error;
    }

    const message = error.message.toLowerCase();
    let errorType: ModbusErrorType;

    // Timeout errors (check first as they can contain 'connect')
    if (message.includes('timeout') || message.includes('etimedout')) {
      errorType = ModbusErrorType.TIMEOUT;
    }
    // Connection-related errors
    else if (message.includes('connect') || message.includes('econnrefused') || 
        message.includes('enotfound') || message.includes('enetunreach')) {
      errorType = ModbusErrorType.CONNECTION_FAILED;
    }
    // Register-related errors (check before protocol errors)
    else if (message.includes('register address out of range') || 
             message.includes('invalid register') || 
             message.includes('register not found') ||
             message.includes('address error')) {
      errorType = ModbusErrorType.INVALID_REGISTER;
    }
    // Protocol errors
    else if (message.includes('illegal') || message.includes('exception') || 
             message.includes('invalid') || message.includes('modbus')) {
      errorType = ModbusErrorType.PROTOCOL_ERROR;
    }
    // Device busy errors
    else if (message.includes('busy') || message.includes('slave device busy')) {
      errorType = ModbusErrorType.DEVICE_BUSY;
    }
    // Default to unknown error
    else {
      errorType = ModbusErrorType.UNKNOWN_ERROR;
    }

    return new ModbusError(error.message, errorType, deviceId);
  }

  /**
   * Determines if an error is retryable based on its type
   */
  public isRetryableError(error: ModbusError): boolean {
    const retryableTypes = [
      ModbusErrorType.CONNECTION_FAILED,
      ModbusErrorType.TIMEOUT,
      ModbusErrorType.DEVICE_BUSY,
      ModbusErrorType.UNKNOWN_ERROR
    ];

    return retryableTypes.includes(error.type);
  }

  /**
   * Calculates retry delay with exponential backoff and optional jitter
   */
  private calculateRetryDelay(attempt: number): number {
    let delay = this.config.baseRetryDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    
    // Apply maximum delay limit
    delay = Math.min(delay, this.config.maxRetryDelay);
    
    // Add jitter to prevent thundering herd
    if (this.config.jitterEnabled) {
      const jitter = Math.random() * 0.1 * delay; // Up to 10% jitter
      delay += jitter;
    }
    
    return Math.round(delay);
  }

  /**
   * Records error statistics for monitoring and analysis
   */
  private recordError(error: ModbusError, deviceId: string, operation: string): void {
    this.errorStats.totalErrors++;
    
    // Update error count by type
    const currentTypeCount = this.errorStats.errorsByType.get(error.type) || 0;
    this.errorStats.errorsByType.set(error.type, currentTypeCount + 1);
    
    // Update error count by device
    const currentDeviceCount = this.errorStats.errorsByDevice.get(deviceId) || 0;
    this.errorStats.errorsByDevice.set(deviceId, currentDeviceCount + 1);
    
    // Add to recent errors (keep last 100)
    this.errorStats.recentErrors.push({
      timestamp: new Date(),
      error,
      deviceId,
      operation
    });
    
    if (this.errorStats.recentErrors.length > 100) {
      this.errorStats.recentErrors.shift();
    }

    this.emit('errorRecorded', {
      error,
      deviceId,
      operation,
      totalErrors: this.errorStats.totalErrors
    });
  }

  /**
   * Circuit breaker implementation to prevent cascading failures
   */
  private updateCircuitBreaker(deviceId: string, success: boolean): void {
    let state = this.circuitBreakers.get(deviceId);
    
    if (!state) {
      state = {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      };
      this.circuitBreakers.set(deviceId, state);
    }

    const now = Date.now();

    if (success) {
      // Reset circuit breaker on success
      if (state.state === 'HALF_OPEN') {
        state.state = 'CLOSED';
        state.failureCount = 0;
        this.logger.info(`Circuit breaker closed for device ${deviceId}`);
        this.emit('circuitBreakerClosed', deviceId);
      } else if (state.state === 'CLOSED') {
        state.failureCount = Math.max(0, state.failureCount - 1);
      }
    } else {
      // Handle failure
      state.failureCount++;
      state.lastFailureTime = now;

      if (state.state === 'CLOSED' && state.failureCount >= this.config.circuitBreakerThreshold) {
        // Open circuit breaker
        state.state = 'OPEN';
        state.nextAttemptTime = now + this.config.circuitBreakerTimeout;
        this.logger.warn(`Circuit breaker opened for device ${deviceId} after ${state.failureCount} failures`);
        this.emit('circuitBreakerOpened', deviceId);
      } else if (state.state === 'HALF_OPEN') {
        // Return to open state
        state.state = 'OPEN';
        state.nextAttemptTime = now + this.config.circuitBreakerTimeout;
        this.logger.warn(`Circuit breaker returned to open state for device ${deviceId}`);
      }
    }

    this.errorStats.circuitBreakerStates.set(deviceId, { ...state });
  }

  /**
   * Checks if circuit breaker is open for a device
   */
  private isCircuitBreakerOpen(deviceId: string): boolean {
    const state = this.circuitBreakers.get(deviceId);
    if (!state) return false;

    const now = Date.now();

    if (state.state === 'OPEN') {
      if (now >= state.nextAttemptTime) {
        // Transition to half-open
        state.state = 'HALF_OPEN';
        this.logger.info(`Circuit breaker transitioned to half-open for device ${deviceId}`);
        this.emit('circuitBreakerHalfOpen', deviceId);
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Gets error statistics for monitoring
   */
  public getErrorStatistics(): ErrorStatistics {
    return {
      totalErrors: this.errorStats.totalErrors,
      errorsByType: new Map(this.errorStats.errorsByType),
      errorsByDevice: new Map(this.errorStats.errorsByDevice),
      recentErrors: [...this.errorStats.recentErrors],
      circuitBreakerStates: new Map(this.errorStats.circuitBreakerStates)
    };
  }

  /**
   * Resets error statistics
   */
  public resetStatistics(): void {
    this.errorStats = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsByDevice: new Map(),
      recentErrors: [],
      circuitBreakerStates: new Map()
    };
    this.emit('statisticsReset');
  }

  /**
   * Manually resets circuit breaker for a device
   */
  public resetCircuitBreaker(deviceId: string): void {
    const state = this.circuitBreakers.get(deviceId);
    if (state) {
      state.state = 'CLOSED';
      state.failureCount = 0;
      state.lastFailureTime = 0;
      state.nextAttemptTime = 0;
      this.logger.info(`Circuit breaker manually reset for device ${deviceId}`);
      this.emit('circuitBreakerReset', deviceId);
    }
  }

  /**
   * Health check to clean up old retry contexts and update circuit breakers
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private performHealthCheck(): void {
    const now = Date.now();
    const staleTimeout = 300000; // 5 minutes

    // Clean up stale retry contexts
    for (const [key, context] of this.retryContexts.entries()) {
      if (now - context.startTime > staleTimeout) {
        this.retryContexts.delete(key);
        this.logger.debug(`Cleaned up stale retry context: ${key}`);
      }
    }

    // Update circuit breaker states
    for (const [deviceId, state] of this.circuitBreakers.entries()) {
      if (state.state === 'OPEN' && now >= state.nextAttemptTime) {
        state.state = 'HALF_OPEN';
        this.logger.info(`Circuit breaker transitioned to half-open for device ${deviceId} during health check`);
        this.emit('circuitBreakerHalfOpen', deviceId);
      }
    }

    this.emit('healthCheckCompleted', {
      activeRetryContexts: this.retryContexts.size,
      circuitBreakers: this.circuitBreakers.size,
      totalErrors: this.errorStats.totalErrors
    });
  }

  /**
   * Utility method for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup method
   */
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.retryContexts.clear();
    this.circuitBreakers.clear();
    this.removeAllListeners();
  }
}
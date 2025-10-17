import { EventEmitter } from 'events';
import winston from 'winston';
import { ModbusError, ModbusErrorType } from './types/modbus.js';
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
export declare class ModbusErrorHandler extends EventEmitter {
    private config;
    private logger;
    private circuitBreakers;
    private retryContexts;
    private errorStats;
    private healthCheckInterval;
    constructor(config: Partial<ErrorHandlerConfig>, logger: winston.Logger);
    /**
     * Categorizes and handles Modbus errors with appropriate retry logic
     */
    handleError(error: Error, deviceId: string, operation: string, retryCallback: () => Promise<any>): Promise<any>;
    /**
     * Categorizes errors into specific Modbus error types
     */
    categorizeError(error: Error, deviceId?: string): ModbusError;
    /**
     * Determines if an error is retryable based on its type
     */
    isRetryableError(error: ModbusError): boolean;
    /**
     * Calculates retry delay with exponential backoff and optional jitter
     */
    private calculateRetryDelay;
    /**
     * Records error statistics for monitoring and analysis
     */
    private recordError;
    /**
     * Circuit breaker implementation to prevent cascading failures
     */
    private updateCircuitBreaker;
    /**
     * Checks if circuit breaker is open for a device
     */
    private isCircuitBreakerOpen;
    /**
     * Gets error statistics for monitoring
     */
    getErrorStatistics(): ErrorStatistics;
    /**
     * Resets error statistics
     */
    resetStatistics(): void;
    /**
     * Manually resets circuit breaker for a device
     */
    resetCircuitBreaker(deviceId: string): void;
    /**
     * Health check to clean up old retry contexts and update circuit breakers
     */
    private startHealthCheck;
    private performHealthCheck;
    /**
     * Utility method for sleeping
     */
    private sleep;
    /**
     * Cleanup method
     */
    destroy(): void;
}

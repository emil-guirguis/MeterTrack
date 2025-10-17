import { EventEmitter } from 'events';
import winston from 'winston';
/**
 * Error types for categorization
 */
export declare enum ErrorType {
    WORKER_STARTUP = "worker_startup",
    WORKER_RUNTIME = "worker_runtime",
    COMMUNICATION = "communication",
    MEMORY = "memory",
    TIMEOUT = "timeout",
    CONFIGURATION = "configuration",
    EXTERNAL_SERVICE = "external_service",
    UNKNOWN = "unknown"
}
/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Recovery strategy types
 */
export declare enum RecoveryStrategy {
    IGNORE = "ignore",
    RETRY = "retry",
    RESTART_WORKER = "restart_worker",
    ESCALATE = "escalate",
    CIRCUIT_BREAKER = "circuit_breaker"
}
/**
 * Error information structure
 */
export interface ErrorInfo {
    id: string;
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    originalError: Error;
    timestamp: Date;
    context?: Record<string, any>;
    stackTrace?: string;
    recoveryStrategy: RecoveryStrategy;
    recoveryAttempts: number;
    maxRecoveryAttempts: number;
}
/**
 * Error handling configuration
 */
export interface ErrorHandlerConfig {
    maxErrorHistory: number;
    errorReportingInterval: number;
    enableErrorAggregation: boolean;
    aggregationWindow: number;
    retryDelays: Record<ErrorType, number[]>;
    maxRecoveryAttempts: Record<ErrorType, number>;
    severityThresholds: Record<ErrorType, ErrorSeverity>;
}
/**
 * Error statistics
 */
export interface ErrorStats {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: ErrorInfo[];
    errorRate: number;
    mostCommonError: {
        type: ErrorType;
        count: number;
    } | null;
}
/**
 * ErrorHandler provides comprehensive error handling and recovery strategies
 */
export declare class ErrorHandler extends EventEmitter {
    private logger;
    private config;
    private errorHistory;
    private errorIdCounter;
    private errorReportingInterval;
    constructor(logger: winston.Logger, config?: Partial<ErrorHandlerConfig>);
    /**
     * Handle an error with automatic categorization and recovery
     */
    handleError(error: Error, context?: Record<string, any>): Promise<ErrorInfo>;
    /**
     * Attempt recovery for a specific error
     */
    attemptRecovery(errorInfo: ErrorInfo): Promise<boolean>;
    /**
     * Get error statistics
     */
    getErrorStats(): ErrorStats;
    /**
     * Clear error history
     */
    clearErrorHistory(): void;
    /**
     * Update error handler configuration
     */
    updateConfig(newConfig: Partial<ErrorHandlerConfig>): void;
    /**
     * Categorize error based on error message and context
     */
    private categorizeError;
    /**
     * Determine recovery strategy based on error type and severity
     */
    private determineRecoveryStrategy;
    /**
     * Retry operation with exponential backoff
     */
    private retryOperation;
    /**
     * Request worker restart
     */
    private restartWorker;
    /**
     * Escalate error to higher level handling
     */
    private escalateError;
    /**
     * Activate circuit breaker for external services
     */
    private activateCircuitBreaker;
    /**
     * Add error to history with size management
     */
    private addToErrorHistory;
    /**
     * Log error with appropriate level
     */
    private logError;
    /**
     * Generate unique error ID
     */
    private generateErrorId;
    /**
     * Start periodic error reporting
     */
    private startErrorReporting;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
//# sourceMappingURL=ErrorHandler.d.ts.map
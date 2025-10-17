import winston from 'winston';
import { EventEmitter } from 'events';
/**
 * Log levels with numeric values for filtering
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    HTTP = 3,
    VERBOSE = 4,
    DEBUG = 5,
    SILLY = 6
}
/**
 * Log entry structure
 */
export interface LogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    message: string;
    context: string;
    correlationId?: string;
    threadId?: string;
    workerId?: string;
    metadata?: Record<string, any>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}
/**
 * Logging configuration
 */
export interface LoggingConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    enableCorrelation: boolean;
    maxLogHistory: number;
    logRotation: {
        enabled: boolean;
        maxSize: string;
        maxFiles: number;
    };
    contexts: {
        [context: string]: {
            level: LogLevel;
            enabled: boolean;
        };
    };
    filters: {
        excludePatterns: string[];
        includePatterns: string[];
    };
}
/**
 * Log statistics
 */
export interface LogStats {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByContext: Record<string, number>;
    recentLogs: LogEntry[];
    errorRate: number;
    averageLogsPerMinute: number;
}
/**
 * LoggingService provides structured logging with correlation and filtering
 */
export declare class LoggingService extends EventEmitter {
    private config;
    private logger;
    private logHistory;
    private logIdCounter;
    private correlationIdCounter;
    private currentCorrelationId;
    private stats;
    constructor(config?: Partial<LoggingConfig>);
    /**
     * Log error message
     */
    error(message: string, context?: string, metadata?: Record<string, any>, error?: Error): void;
    /**
     * Log warning message
     */
    warn(message: string, context?: string, metadata?: Record<string, any>): void;
    /**
     * Log info message
     */
    info(message: string, context?: string, metadata?: Record<string, any>): void;
    /**
     * Log debug message
     */
    debug(message: string, context?: string, metadata?: Record<string, any>): void;
    /**
     * Log verbose message
     */
    verbose(message: string, context?: string, metadata?: Record<string, any>): void;
    /**
     * Start a new correlation context
     */
    startCorrelation(correlationId?: string): string;
    /**
     * End current correlation context
     */
    endCorrelation(): void;
    /**
     * Execute function within correlation context
     */
    withCorrelation<T>(fn: () => Promise<T> | T, correlationId?: string): Promise<T>;
    /**
     * Get current correlation ID
     */
    getCurrentCorrelationId(): string | null;
    /**
     * Log structured message
     */
    log(level: LogLevel, message: string, context?: string, metadata?: Record<string, any>, error?: Error): void;
    /**
     * Get log history
     */
    getLogHistory(options?: {
        limit?: number;
        level?: LogLevel;
        context?: string;
        correlationId?: string;
        since?: Date;
    }): LogEntry[];
    /**
     * Get logging statistics
     */
    getStats(): LogStats;
    /**
     * Clear log history
     */
    clearHistory(): void;
    /**
     * Update logging configuration
     */
    updateConfig(newConfig: Partial<LoggingConfig>): void;
    /**
     * Set log level for specific context
     */
    setContextLevel(context: string, level: LogLevel, enabled?: boolean): void;
    /**
     * Enable/disable context logging
     */
    setContextEnabled(context: string, enabled: boolean): void;
    /**
     * Add log filter pattern
     */
    addFilter(pattern: string, type: 'include' | 'exclude'): void;
    /**
     * Remove log filter pattern
     */
    removeFilter(pattern: string, type: 'include' | 'exclude'): void;
    /**
     * Get Winston logger instance
     */
    getWinstonLogger(): winston.Logger;
    /**
     * Initialize Winston logger
     */
    private initializeWinstonLogger;
    /**
     * Check if message should be logged based on filters
     */
    private shouldLog;
    /**
     * Add log entry to history
     */
    private addToHistory;
    /**
     * Update logging statistics
     */
    private updateStats;
    /**
     * Log with Winston
     */
    private logWithWinston;
    /**
     * Generate unique log ID
     */
    private generateLogId;
    /**
     * Generate correlation ID
     */
    private generateCorrelationId;
    /**
     * Get current thread ID (placeholder)
     */
    private getThreadId;
    /**
     * Get current worker ID (placeholder)
     */
    private getWorkerId;
    /**
     * Parse size string to bytes
     */
    private parseSize;
}
//# sourceMappingURL=LoggingService.d.ts.map
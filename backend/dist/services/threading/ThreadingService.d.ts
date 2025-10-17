import { EventEmitter } from 'events';
import winston from 'winston';
import { ThreadingSystemConfig } from './ConfigurationManager.js';
import { WorkerResponse } from './types.js';
/**
 * Threading service status
 */
export interface ThreadingServiceStatus {
    worker: {
        isRunning: boolean;
        threadId: number | null;
        startTime: Date | null;
        uptime: number;
        restartCount: number;
        errorCount: number;
    };
    health: {
        isHealthy: boolean;
        lastCheck: Date | null;
        consecutiveMissedChecks: number;
        memoryUsage?: {
            rss: number;
            heapUsed: number;
            heapTotal: number;
        };
    };
    restart: {
        canRestart: boolean;
        currentAttempts: number;
        maxAttempts: number;
        circuitBreakerState: string;
    };
    messages: {
        pendingCount: number;
        totalSent: number;
        totalReceived: number;
        averageResponseTime: number;
    };
    errors: {
        totalErrors: number;
        recentErrorRate: number;
        mostCommonErrorType: string | null;
    };
}
/**
 * Message sending options
 */
export interface MessageOptions {
    type: string;
    payload?: any;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    timeout?: number;
    maxRetries?: number;
    correlationId?: string;
}
/**
 * ThreadingService provides a unified interface for managing the MCP threading system
 */
export declare class ThreadingService extends EventEmitter {
    private logger;
    private threadManager;
    private healthMonitor;
    private restartManager;
    private errorHandler;
    private messageQueue;
    private configManager;
    private isInitialized;
    private isStarted;
    constructor(config?: Partial<ThreadingSystemConfig>, logger?: winston.Logger);
    /**
     * Start the threading service
     */
    start(): Promise<{
        success: boolean;
        threadId?: number;
        startTime?: Date;
        error?: string;
    }>;
    /**
     * Stop the threading service
     */
    stop(graceful?: boolean): Promise<{
        success: boolean;
        stopTime: Date;
        error?: string;
    }>;
    /**
     * Restart the worker thread
     */
    restartWorker(reason?: string, config?: Partial<ThreadingSystemConfig>): Promise<{
        success: boolean;
        threadId?: number;
        restartTime?: Date;
        restartCount?: number;
        error?: string;
    }>;
    /**
     * Get comprehensive status of the threading system
     */
    getStatus(): Promise<ThreadingServiceStatus>;
    /**
     * Get detailed health status
     */
    getHealthStatus(): Promise<any>;
    /**
     * Send message to worker thread
     */
    sendMessage(options: MessageOptions): Promise<{
        requestId: string;
        response: WorkerResponse;
        processingTime: number;
    }>;
    /**
     * Get configuration
     */
    getConfig(): Promise<ThreadingSystemConfig>;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<ThreadingSystemConfig>, section?: keyof ThreadingSystemConfig): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
        config?: ThreadingSystemConfig;
    }>;
    /**
     * Perform immediate health check
     */
    performHealthCheck(): Promise<{
        isHealthy: boolean;
        responseTime: number;
        timestamp: Date;
        details: any;
    }>;
    /**
     * Get comprehensive statistics
     */
    getStats(): Promise<any>;
    /**
     * Get pending messages information
     */
    getPendingMessages(): Promise<any>;
    /**
     * Clear pending messages
     */
    clearPendingMessages(reason: string): Promise<{
        clearedCount: number;
    }>;
    /**
     * Get error information
     */
    getErrors(options: {
        limit?: number;
        severity?: string;
        type?: string;
    }): Promise<any>;
    /**
     * Clear error history
     */
    clearErrors(): Promise<{
        clearedCount: number;
    }>;
    /**
     * Get logs (placeholder - would need proper log management)
     */
    getLogs(options: {
        limit?: number;
        level?: string;
        since?: Date;
    }): Promise<any>;
    /**
     * Initialize all threading components
     */
    private initializeComponents;
    /**
     * Setup event handlers for all components
     */
    private setupEventHandlers;
    /**
     * Apply configuration changes to components
     */
    private applyConfigurationChanges;
}
//# sourceMappingURL=ThreadingService.d.ts.map
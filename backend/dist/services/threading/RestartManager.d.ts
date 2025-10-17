import { EventEmitter } from 'events';
import { ThreadManager } from './ThreadManager.js';
import { HealthMonitor } from './HealthMonitor.js';
/**
 * Restart manager configuration
 */
export interface RestartManagerConfig {
    maxRestartAttempts: number;
    initialRestartDelay: number;
    maxRestartDelay: number;
    backoffMultiplier: number;
    resetCounterAfter: number;
    enableCircuitBreaker: boolean;
    circuitBreakerThreshold: number;
    circuitBreakerResetTime: number;
}
/**
 * Restart attempt information
 */
export interface RestartAttempt {
    attemptNumber: number;
    timestamp: Date;
    reason: string;
    success: boolean;
    error?: string;
}
/**
 * Circuit breaker states
 */
export declare enum CircuitBreakerState {
    CLOSED = "closed",// Normal operation
    OPEN = "open",// Circuit breaker is open, blocking restarts
    HALF_OPEN = "half_open"
}
/**
 * RestartManager handles automatic restart logic with exponential backoff
 * Implements circuit breaker pattern to prevent excessive restart attempts
 */
export declare class RestartManager extends EventEmitter {
    private threadManager;
    private healthMonitor;
    private config;
    private restartAttempts;
    private currentRestartCount;
    private lastSuccessfulStart;
    private restartTimeout;
    private isRestarting;
    private circuitBreakerState;
    private circuitBreakerOpenTime;
    private consecutiveFailures;
    constructor(threadManager: ThreadManager, healthMonitor: HealthMonitor, config?: Partial<RestartManagerConfig>);
    /**
     * Start automatic restart management
     */
    startManagement(): void;
    /**
     * Stop automatic restart management
     */
    stopManagement(): void;
    /**
     * Manually trigger a restart
     */
    triggerRestart(reason?: string): Promise<boolean>;
    /**
     * Get restart statistics
     */
    getRestartStats(): {
        currentRestartCount: number;
        totalRestartAttempts: number;
        lastSuccessfulStart: Date | null;
        recentAttempts: RestartAttempt[];
        circuitBreakerState: CircuitBreakerState;
        canRestart: boolean;
    };
    /**
     * Reset restart counter (typically called after successful operation period)
     */
    resetRestartCounter(): void;
    /**
     * Update restart manager configuration
     */
    updateConfig(newConfig: Partial<RestartManagerConfig>): void;
    /**
     * Check if restart is allowed
     */
    private canRestart;
    /**
     * Perform the actual restart
     */
    private performRestart;
    /**
     * Calculate restart delay with exponential backoff
     */
    private calculateRestartDelay;
    /**
     * Schedule reset of restart counter after successful operation period
     */
    private scheduleRestartCounterReset;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Setup event handlers for ThreadManager and HealthMonitor
     */
    private setupEventHandlers;
}
//# sourceMappingURL=RestartManager.d.ts.map
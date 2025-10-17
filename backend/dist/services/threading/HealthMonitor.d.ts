import { EventEmitter } from 'events';
import { ThreadManager } from './ThreadManager.js';
/**
 * Health monitoring configuration
 */
export interface HealthMonitorConfig {
    healthCheckInterval: number;
    healthCheckTimeout: number;
    maxMissedHealthChecks: number;
    enableMemoryMonitoring: boolean;
    memoryThresholdMB: number;
}
/**
 * Health status information
 */
export interface HealthStatus {
    isHealthy: boolean;
    lastHealthCheck: Date | null;
    consecutiveMissedChecks: number;
    memoryUsage?: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
    };
    uptime: number;
    errorCount: number;
    restartCount: number;
}
/**
 * HealthMonitor provides periodic health checks for worker threads
 * Implements ping/pong health check mechanism and automatic recovery
 */
export declare class HealthMonitor extends EventEmitter {
    private threadManager;
    private config;
    private healthCheckInterval;
    private lastHealthCheck;
    private consecutiveMissedChecks;
    private isMonitoring;
    constructor(threadManager: ThreadManager, config?: Partial<HealthMonitorConfig>);
    /**
     * Start health monitoring
     */
    startMonitoring(): void;
    /**
     * Stop health monitoring
     */
    stopMonitoring(): void;
    /**
     * Get current health status
     */
    getHealthStatus(): HealthStatus;
    /**
     * Perform immediate health check
     */
    performHealthCheck(): Promise<boolean>;
    /**
     * Check if worker is considered healthy
     */
    isWorkerHealthy(): boolean;
    /**
     * Get monitoring status
     */
    isMonitoringActive(): boolean;
    /**
     * Update health monitor configuration
     */
    updateConfig(newConfig: Partial<HealthMonitorConfig>): void;
    /**
     * Handle successful health check response
     */
    private handleSuccessfulHealthCheck;
    /**
     * Handle missed or failed health check
     */
    private handleMissedHealthCheck;
    /**
     * Check memory usage against threshold
     */
    private checkMemoryUsage;
    /**
     * Create timeout promise for health check
     */
    private createTimeoutPromise;
    /**
     * Setup event listeners for ThreadManager
     */
    private setupThreadManagerEvents;
}
//# sourceMappingURL=HealthMonitor.d.ts.map
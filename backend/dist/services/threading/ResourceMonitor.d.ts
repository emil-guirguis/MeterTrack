import { EventEmitter } from 'events';
import { ThreadManager } from './ThreadManager.js';
/**
 * Memory usage information
 */
export interface MemoryUsage {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
}
/**
 * Memory usage statistics
 */
export interface MemoryStats {
    current: MemoryUsage;
    peak: MemoryUsage;
    average: MemoryUsage;
    samples: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    growthRate: number;
}
/**
 * Resource limits configuration
 */
export interface ResourceLimits {
    maxMemoryMB: number;
    memoryWarningThresholdMB: number;
    maxHeapMB: number;
    heapWarningThresholdMB: number;
    enableAutoRestart: boolean;
    restartGracePeriodMs: number;
    enableGarbageCollection: boolean;
    gcInterval: number;
}
/**
 * Resource monitoring configuration
 */
export interface ResourceMonitorConfig {
    monitoringInterval: number;
    historySize: number;
    enableTrendAnalysis: boolean;
    trendAnalysisWindow: number;
    alertThresholds: {
        memoryGrowthRateMBPerMin: number;
        heapGrowthRateMBPerMin: number;
        consecutiveWarnings: number;
    };
    limits: ResourceLimits;
}
/**
 * Memory alert information
 */
export interface MemoryAlert {
    type: 'warning' | 'critical' | 'limit_exceeded';
    metric: 'rss' | 'heap' | 'growth_rate';
    currentValue: number;
    threshold: number;
    timestamp: Date;
    recommendation: string;
}
/**
 * ResourceMonitor handles memory usage monitoring and resource management
 */
export declare class ResourceMonitor extends EventEmitter {
    private threadManager;
    private config;
    private monitoringInterval;
    private gcInterval;
    private memoryHistory;
    private peakMemory;
    private lastMemoryCheck;
    private consecutiveWarnings;
    private isMonitoring;
    constructor(threadManager: ThreadManager, config?: Partial<ResourceMonitorConfig>);
    /**
     * Start resource monitoring
     */
    startMonitoring(): void;
    /**
     * Stop resource monitoring
     */
    stopMonitoring(): void;
    /**
     * Get current memory usage from worker thread
     */
    getCurrentMemoryUsage(): Promise<MemoryUsage | null>;
    /**
     * Get memory statistics
     */
    getMemoryStats(): MemoryStats;
    /**
     * Check if memory usage is within limits
     */
    isMemoryWithinLimits(): boolean;
    /**
     * Force garbage collection in worker thread
     */
    forceGarbageCollection(): Promise<boolean>;
    /**
     * Update resource monitor configuration
     */
    updateConfig(newConfig: Partial<ResourceMonitorConfig>): void;
    /**
     * Get resource limits
     */
    getResourceLimits(): ResourceLimits;
    /**
     * Update resource limits
     */
    updateResourceLimits(limits: Partial<ResourceLimits>): void;
    /**
     * Clear memory history
     */
    clearMemoryHistory(): void;
    /**
     * Check memory usage and enforce limits
     */
    private checkMemoryUsage;
    /**
     * Add memory usage to history
     */
    private addToMemoryHistory;
    /**
     * Update peak memory tracking
     */
    private updatePeakMemory;
    /**
     * Check for memory alerts
     */
    private checkMemoryAlerts;
    /**
     * Enforce memory limits
     */
    private enforceMemoryLimits;
    /**
     * Calculate average memory usage
     */
    private calculateAverageMemory;
    /**
     * Analyze memory usage trend
     */
    private analyzeTrend;
    /**
     * Calculate memory growth rate (MB per minute)
     */
    private calculateGrowthRate;
    /**
     * Trigger garbage collection
     */
    private triggerGarbageCollection;
    /**
     * Setup event handlers for ThreadManager
     */
    private setupThreadManagerEvents;
}
//# sourceMappingURL=ResourceMonitor.d.ts.map
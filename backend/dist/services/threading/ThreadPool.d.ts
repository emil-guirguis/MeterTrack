import { EventEmitter } from 'events';
import { ThreadManager } from './ThreadManager.js';
import { HealthMonitor } from './HealthMonitor.js';
import { ResourceMonitor } from './ResourceMonitor.js';
import { WorkerResponse, EnhancedWorkerMessage } from './types.js';
/**
 * Thread pool configuration
 */
export interface ThreadPoolConfig {
    minThreads: number;
    maxThreads: number;
    idleTimeout: number;
    loadBalancingStrategy: 'round_robin' | 'least_loaded' | 'random' | 'priority_based';
    healthCheckInterval: number;
    autoScaling: {
        enabled: boolean;
        scaleUpThreshold: number;
        scaleDownThreshold: number;
        scaleUpCooldown: number;
        scaleDownCooldown: number;
        maxScaleUpRate: number;
        maxScaleDownRate: number;
    };
    resourceLimits: {
        maxMemoryPerThreadMB: number;
        maxTotalMemoryMB: number;
        maxCpuUsagePercent: number;
    };
}
/**
 * Thread pool worker information
 */
export interface PoolWorker {
    id: string;
    threadManager: ThreadManager;
    healthMonitor: HealthMonitor;
    resourceMonitor: ResourceMonitor;
    status: 'starting' | 'idle' | 'busy' | 'stopping' | 'error';
    createdAt: Date;
    lastUsed: Date;
    messageCount: number;
    errorCount: number;
    currentLoad: number;
}
/**
 * Thread pool statistics
 */
export interface ThreadPoolStats {
    totalThreads: number;
    activeThreads: number;
    idleThreads: number;
    busyThreads: number;
    errorThreads: number;
    totalMessages: number;
    averageResponseTime: number;
    queueSize: number;
    loadDistribution: Record<string, number>;
    resourceUsage: {
        totalMemoryMB: number;
        averageMemoryMB: number;
        peakMemoryMB: number;
        cpuUsagePercent: number;
    };
}
/**
 * ThreadPool manages multiple worker threads for improved scalability and load distribution
 */
export declare class ThreadPool extends EventEmitter {
    private config;
    private workers;
    private messageQueue;
    private workerIdCounter;
    private isStarted;
    private lastScaleUp;
    private lastScaleDown;
    private scalingInterval;
    private stats;
    constructor(config?: Partial<ThreadPoolConfig>);
    /**
     * Start the thread pool
     */
    start(): Promise<void>;
    /**
     * Stop the thread pool
     */
    stop(graceful?: boolean): Promise<void>;
    /**
     * Send message to worker thread using load balancing
     */
    sendMessage(message: EnhancedWorkerMessage): Promise<WorkerResponse>;
    /**
     * Get thread pool statistics
     */
    getStats(): ThreadPoolStats;
    /**
     * Get worker information
     */
    getWorkers(): PoolWorker[];
    /**
     * Scale up the thread pool
     */
    scaleUp(count?: number): Promise<number>;
    /**
     * Scale down the thread pool
     */
    scaleDown(count?: number): Promise<number>;
    /**
     * Update thread pool configuration
     */
    updateConfig(newConfig: Partial<ThreadPoolConfig>): void;
    /**
     * Create a new worker thread
     */
    private createWorker;
    /**
     * Stop a worker thread
     */
    private stopWorker;
    /**
     * Process message queue using load balancing
     */
    private processMessageQueue;
    /**
     * Select worker using load balancing strategy
     */
    private selectWorker;
    /**
     * Start auto-scaling monitoring
     */
    private startAutoScaling;
    /**
     * Check if auto-scaling is needed
     */
    private checkAutoScaling;
    /**
     * Setup event handlers for a worker
     */
    private setupWorkerEventHandlers;
    /**
     * Handle worker restart
     */
    private handleWorkerRestart;
}
//# sourceMappingURL=ThreadPool.d.ts.map
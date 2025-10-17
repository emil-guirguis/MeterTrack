import { EventEmitter } from 'events';
import { ThreadManager } from './ThreadManager.js';
/**
 * Resource types that can be tracked and cleaned up
 */
export declare enum ResourceType {
    FILE_HANDLE = "file_handle",
    NETWORK_CONNECTION = "network_connection",
    DATABASE_CONNECTION = "database_connection",
    TIMER = "timer",
    EVENT_LISTENER = "event_listener",
    MEMORY_BUFFER = "memory_buffer",
    WORKER_THREAD = "worker_thread",
    STREAM = "stream"
}
/**
 * Resource information
 */
export interface ResourceInfo {
    id: string;
    type: ResourceType;
    description: string;
    createdAt: Date;
    lastAccessed: Date;
    size?: number;
    path?: string;
    host?: string;
    metadata?: Record<string, any>;
}
/**
 * Resource cleanup configuration
 */
export interface ResourceCleanupConfig {
    enableAutoCleanup: boolean;
    cleanupInterval: number;
    maxResourceAge: number;
    maxIdleTime: number;
    enableLeakDetection: boolean;
    leakDetectionThreshold: number;
    enableResourceLimits: boolean;
    resourceLimits: Record<ResourceType, number>;
    enableGarbageCollection: boolean;
    gcTriggerThreshold: number;
}
/**
 * Resource leak information
 */
export interface ResourceLeak {
    type: ResourceType;
    count: number;
    threshold: number;
    oldestResource: ResourceInfo;
    detectedAt: Date;
    severity: 'warning' | 'critical';
}
/**
 * Cleanup statistics
 */
export interface CleanupStats {
    totalResources: number;
    resourcesByType: Record<ResourceType, number>;
    cleanupOperations: number;
    leaksDetected: number;
    memoryFreed: number;
    lastCleanup: Date | null;
    averageCleanupTime: number;
}
/**
 * ResourceCleanup handles proper cleanup of resources and leak detection
 */
export declare class ResourceCleanup extends EventEmitter {
    private threadManager;
    private config;
    private resources;
    private cleanupInterval;
    private resourceIdCounter;
    private isActive;
    private stats;
    constructor(threadManager: ThreadManager, config?: Partial<ResourceCleanupConfig>);
    /**
     * Start resource cleanup monitoring
     */
    start(): void;
    /**
     * Stop resource cleanup monitoring
     */
    stop(): void;
    /**
     * Register a resource for tracking
     */
    registerResource(type: ResourceType, description: string, metadata?: Record<string, any>): string;
    /**
     * Unregister a resource
     */
    unregisterResource(resourceId: string): boolean;
    /**
     * Update resource access time
     */
    touchResource(resourceId: string): boolean;
    /**
     * Get resource information
     */
    getResource(resourceId: string): ResourceInfo | null;
    /**
     * Get all resources of a specific type
     */
    getResourcesByType(type: ResourceType): ResourceInfo[];
    /**
     * Perform manual cleanup
     */
    performCleanup(): Promise<{
        cleaned: number;
        memoryFreed: number;
        duration: number;
    }>;
    /**
     * Force cleanup of all resources
     */
    forceCleanupAll(): Promise<number>;
    /**
     * Get cleanup statistics
     */
    getStats(): CleanupStats;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ResourceCleanupConfig>): void;
    /**
     * Find expired resources that need cleanup
     */
    private findExpiredResources;
    /**
     * Cleanup a specific resource
     */
    private cleanupResource;
    /**
     * Detect resource leaks
     */
    private detectResourceLeaks;
    /**
     * Check resource limits
     */
    private checkResourceLimits;
    /**
     * Check if garbage collection should be triggered
     */
    private checkGarbageCollection;
    /**
     * Generate unique resource ID
     */
    private generateResourceId;
    /**
     * Setup event handlers for ThreadManager
     */
    private setupThreadManagerEvents;
}
//# sourceMappingURL=ResourceCleanup.d.ts.map
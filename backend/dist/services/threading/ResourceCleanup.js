import { EventEmitter } from 'events';
/**
 * Resource types that can be tracked and cleaned up
 */
export var ResourceType;
(function (ResourceType) {
    ResourceType["FILE_HANDLE"] = "file_handle";
    ResourceType["NETWORK_CONNECTION"] = "network_connection";
    ResourceType["DATABASE_CONNECTION"] = "database_connection";
    ResourceType["TIMER"] = "timer";
    ResourceType["EVENT_LISTENER"] = "event_listener";
    ResourceType["MEMORY_BUFFER"] = "memory_buffer";
    ResourceType["WORKER_THREAD"] = "worker_thread";
    ResourceType["STREAM"] = "stream";
})(ResourceType || (ResourceType = {}));
/**
 * ResourceCleanup handles proper cleanup of resources and leak detection
 */
export class ResourceCleanup extends EventEmitter {
    constructor(threadManager, config = {}) {
        super();
        this.resources = new Map();
        this.cleanupInterval = null;
        this.resourceIdCounter = 0;
        this.isActive = false;
        // Statistics
        this.stats = {
            cleanupOperations: 0,
            leaksDetected: 0,
            memoryFreed: 0,
            cleanupTimes: []
        };
        this.threadManager = threadManager;
        // Default configuration
        this.config = {
            enableAutoCleanup: true,
            cleanupInterval: 60000, // 1 minute
            maxResourceAge: 3600000, // 1 hour
            maxIdleTime: 300000, // 5 minutes
            enableLeakDetection: true,
            leakDetectionThreshold: 100,
            enableResourceLimits: true,
            resourceLimits: {
                [ResourceType.FILE_HANDLE]: 100,
                [ResourceType.NETWORK_CONNECTION]: 50,
                [ResourceType.DATABASE_CONNECTION]: 20,
                [ResourceType.TIMER]: 200,
                [ResourceType.EVENT_LISTENER]: 500,
                [ResourceType.MEMORY_BUFFER]: 50,
                [ResourceType.WORKER_THREAD]: 10,
                [ResourceType.STREAM]: 30
            },
            enableGarbageCollection: true,
            gcTriggerThreshold: 0.8, // Trigger GC when 80% of limits reached
            ...config
        };
        this.setupThreadManagerEvents();
    }
    /**
     * Start resource cleanup monitoring
     */
    start() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        if (this.config.enableAutoCleanup) {
            this.cleanupInterval = setInterval(() => {
                this.performCleanup();
            }, this.config.cleanupInterval);
        }
        this.emit('cleanupStarted');
    }
    /**
     * Stop resource cleanup monitoring
     */
    stop() {
        if (!this.isActive) {
            return;
        }
        this.isActive = false;
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.emit('cleanupStopped');
    }
    /**
     * Register a resource for tracking
     */
    registerResource(type, description, metadata) {
        const resourceId = this.generateResourceId();
        const now = new Date();
        const resource = {
            id: resourceId,
            type,
            description,
            createdAt: now,
            lastAccessed: now,
            metadata: metadata || {}
        };
        this.resources.set(resourceId, resource);
        this.emit('resourceRegistered', {
            resourceId,
            type,
            description,
            totalResources: this.resources.size
        });
        // Check resource limits
        if (this.config.enableResourceLimits) {
            this.checkResourceLimits(type);
        }
        return resourceId;
    }
    /**
     * Unregister a resource
     */
    unregisterResource(resourceId) {
        const resource = this.resources.get(resourceId);
        if (!resource) {
            return false;
        }
        this.resources.delete(resourceId);
        this.emit('resourceUnregistered', {
            resourceId,
            type: resource.type,
            age: Date.now() - resource.createdAt.getTime(),
            totalResources: this.resources.size
        });
        return true;
    }
    /**
     * Update resource access time
     */
    touchResource(resourceId) {
        const resource = this.resources.get(resourceId);
        if (!resource) {
            return false;
        }
        resource.lastAccessed = new Date();
        return true;
    }
    /**
     * Get resource information
     */
    getResource(resourceId) {
        return this.resources.get(resourceId) || null;
    }
    /**
     * Get all resources of a specific type
     */
    getResourcesByType(type) {
        return Array.from(this.resources.values())
            .filter(resource => resource.type === type);
    }
    /**
     * Perform manual cleanup
     */
    async performCleanup() {
        const startTime = Date.now();
        let cleanedCount = 0;
        let memoryFreed = 0;
        try {
            // Clean up expired resources
            const expiredResources = this.findExpiredResources();
            for (const resource of expiredResources) {
                try {
                    const freed = await this.cleanupResource(resource);
                    memoryFreed += freed;
                    cleanedCount++;
                }
                catch (error) {
                    this.emit('cleanupError', {
                        resourceId: resource.id,
                        type: resource.type,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            // Detect resource leaks
            if (this.config.enableLeakDetection) {
                this.detectResourceLeaks();
            }
            // Trigger garbage collection if needed
            if (this.config.enableGarbageCollection) {
                await this.checkGarbageCollection();
            }
            const duration = Date.now() - startTime;
            // Update statistics
            this.stats.cleanupOperations++;
            this.stats.memoryFreed += memoryFreed;
            this.stats.cleanupTimes.push(duration);
            // Keep only last 100 cleanup times
            if (this.stats.cleanupTimes.length > 100) {
                this.stats.cleanupTimes = this.stats.cleanupTimes.slice(-100);
            }
            this.emit('cleanupCompleted', {
                cleaned: cleanedCount,
                memoryFreed,
                duration,
                totalResources: this.resources.size
            });
            return { cleaned: cleanedCount, memoryFreed, duration };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.emit('cleanupFailed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration
            });
            throw error;
        }
    }
    /**
     * Force cleanup of all resources
     */
    async forceCleanupAll() {
        const allResources = Array.from(this.resources.values());
        let cleanedCount = 0;
        for (const resource of allResources) {
            try {
                await this.cleanupResource(resource);
                cleanedCount++;
            }
            catch (error) {
                this.emit('cleanupError', {
                    resourceId: resource.id,
                    type: resource.type,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        this.emit('forceCleanupCompleted', {
            cleaned: cleanedCount,
            total: allResources.length
        });
        return cleanedCount;
    }
    /**
     * Get cleanup statistics
     */
    getStats() {
        const resourcesByType = {};
        // Initialize counters
        Object.values(ResourceType).forEach(type => {
            resourcesByType[type] = 0;
        });
        // Count resources by type
        for (const resource of this.resources.values()) {
            resourcesByType[resource.type]++;
        }
        const averageCleanupTime = this.stats.cleanupTimes.length > 0
            ? this.stats.cleanupTimes.reduce((sum, time) => sum + time, 0) / this.stats.cleanupTimes.length
            : 0;
        return {
            totalResources: this.resources.size,
            resourcesByType,
            cleanupOperations: this.stats.cleanupOperations,
            leaksDetected: this.stats.leaksDetected,
            memoryFreed: this.stats.memoryFreed,
            lastCleanup: this.stats.cleanupTimes.length > 0 ? new Date() : null,
            averageCleanupTime
        };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        const wasActive = this.isActive;
        if (wasActive) {
            this.stop();
        }
        this.config = { ...this.config, ...newConfig };
        if (wasActive) {
            this.start();
        }
        this.emit('configUpdated', this.config);
    }
    /**
     * Find expired resources that need cleanup
     */
    findExpiredResources() {
        const now = Date.now();
        const expired = [];
        for (const resource of this.resources.values()) {
            const age = now - resource.createdAt.getTime();
            const idleTime = now - resource.lastAccessed.getTime();
            if (age > this.config.maxResourceAge || idleTime > this.config.maxIdleTime) {
                expired.push(resource);
            }
        }
        return expired;
    }
    /**
     * Cleanup a specific resource
     */
    async cleanupResource(resource) {
        let memoryFreed = 0;
        try {
            // Send cleanup message to worker thread
            if (this.threadManager.isWorkerRunning()) {
                const response = await this.threadManager.sendMessage({
                    type: 'cleanup',
                    payload: {
                        resourceId: resource.id,
                        resourceType: resource.type,
                        metadata: resource.metadata
                    }
                });
                if (response.type === 'success' && response.payload?.memoryFreed) {
                    memoryFreed = response.payload.memoryFreed;
                }
            }
            // Remove from tracking
            this.unregisterResource(resource.id);
            this.emit('resourceCleaned', {
                resourceId: resource.id,
                type: resource.type,
                age: Date.now() - resource.createdAt.getTime(),
                memoryFreed
            });
            return memoryFreed;
        }
        catch (error) {
            this.emit('resourceCleanupFailed', {
                resourceId: resource.id,
                type: resource.type,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Detect resource leaks
     */
    detectResourceLeaks() {
        const resourceCounts = {};
        // Count resources by type
        for (const resource of this.resources.values()) {
            resourceCounts[resource.type] = (resourceCounts[resource.type] || 0) + 1;
        }
        // Check for leaks
        for (const [type, count] of Object.entries(resourceCounts)) {
            const resourceType = type;
            const threshold = this.config.leakDetectionThreshold;
            if (count > threshold) {
                const resourcesOfType = this.getResourcesByType(resourceType);
                const oldestResource = resourcesOfType.reduce((oldest, current) => current.createdAt < oldest.createdAt ? current : oldest);
                const leak = {
                    type: resourceType,
                    count,
                    threshold,
                    oldestResource,
                    detectedAt: new Date(),
                    severity: count > threshold * 2 ? 'critical' : 'warning'
                };
                this.stats.leaksDetected++;
                this.emit('resourceLeakDetected', leak);
            }
        }
    }
    /**
     * Check resource limits
     */
    checkResourceLimits(type) {
        const count = this.getResourcesByType(type).length;
        const limit = this.config.resourceLimits[type];
        if (count >= limit) {
            this.emit('resourceLimitExceeded', {
                type,
                count,
                limit,
                severity: count >= limit * 1.5 ? 'critical' : 'warning'
            });
        }
    }
    /**
     * Check if garbage collection should be triggered
     */
    async checkGarbageCollection() {
        const totalResources = this.resources.size;
        const totalLimit = Object.values(this.config.resourceLimits)
            .reduce((sum, limit) => sum + limit, 0);
        const utilizationRatio = totalResources / totalLimit;
        if (utilizationRatio >= this.config.gcTriggerThreshold) {
            try {
                if (this.threadManager.isWorkerRunning()) {
                    await this.threadManager.sendMessage({
                        type: 'gc',
                        payload: { force: true, reason: 'resource_cleanup' }
                    });
                    this.emit('garbageCollectionTriggered', {
                        reason: 'resource_threshold',
                        utilizationRatio,
                        threshold: this.config.gcTriggerThreshold
                    });
                }
            }
            catch (error) {
                this.emit('garbageCollectionFailed', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    }
    /**
     * Generate unique resource ID
     */
    generateResourceId() {
        return `res_${++this.resourceIdCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    /**
     * Setup event handlers for ThreadManager
     */
    setupThreadManagerEvents() {
        this.threadManager.on('workerStarted', () => {
            // Reset resource tracking when worker starts
            this.resources.clear();
        });
        this.threadManager.on('workerStopped', () => {
            // Perform final cleanup when worker stops
            this.forceCleanupAll().catch(error => {
                this.emit('finalCleanupError', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            });
        });
        this.threadManager.on('workerError', () => {
            // Mark all resources as potentially leaked on worker error
            const resourceCount = this.resources.size;
            if (resourceCount > 0) {
                this.emit('workerErrorResourceLeak', {
                    resourceCount,
                    message: 'Worker error may have caused resource leaks'
                });
            }
        });
    }
}
//# sourceMappingURL=ResourceCleanup.js.map
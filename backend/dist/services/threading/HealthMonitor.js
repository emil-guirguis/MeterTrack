import { EventEmitter } from 'events';
/**
 * HealthMonitor provides periodic health checks for worker threads
 * Implements ping/pong health check mechanism and automatic recovery
 */
export class HealthMonitor extends EventEmitter {
    constructor(threadManager, config = {}) {
        super();
        this.healthCheckInterval = null;
        this.lastHealthCheck = null;
        this.consecutiveMissedChecks = 0;
        this.isMonitoring = false;
        this.threadManager = threadManager;
        // Default configuration
        this.config = {
            healthCheckInterval: 30000, // 30 seconds
            healthCheckTimeout: 5000, // 5 seconds
            maxMissedHealthChecks: 3, // 3 missed checks before considering unhealthy
            enableMemoryMonitoring: true,
            memoryThresholdMB: 512, // 512MB memory threshold
            ...config
        };
        this.setupThreadManagerEvents();
    }
    /**
     * Start health monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) {
            return;
        }
        this.isMonitoring = true;
        this.consecutiveMissedChecks = 0;
        this.lastHealthCheck = null;
        // Start periodic health checks
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);
        this.emit('monitoringStarted');
    }
    /**
     * Stop health monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        this.emit('monitoringStopped');
    }
    /**
     * Get current health status
     */
    getHealthStatus() {
        const threadStatus = this.threadManager.getStatus();
        const uptime = threadStatus.startTime
            ? Date.now() - threadStatus.startTime.getTime()
            : 0;
        return {
            isHealthy: this.isWorkerHealthy(),
            lastHealthCheck: this.lastHealthCheck,
            consecutiveMissedChecks: this.consecutiveMissedChecks,
            memoryUsage: threadStatus.memoryUsage,
            uptime,
            errorCount: threadStatus.errorCount,
            restartCount: threadStatus.restartCount
        };
    }
    /**
     * Perform immediate health check
     */
    async performHealthCheck() {
        if (!this.threadManager.isWorkerRunning()) {
            this.handleMissedHealthCheck('Worker not running');
            return false;
        }
        try {
            // Send ping message to worker
            const pingMessage = {
                type: 'ping',
                payload: { timestamp: Date.now() }
            };
            const response = await Promise.race([
                this.threadManager.sendMessage(pingMessage),
                this.createTimeoutPromise()
            ]);
            if (response.type === 'pong') {
                this.handleSuccessfulHealthCheck(response);
                return true;
            }
            else {
                this.handleMissedHealthCheck('Invalid response type');
                return false;
            }
        }
        catch (error) {
            this.handleMissedHealthCheck(`Health check failed: ${error}`);
            return false;
        }
    }
    /**
     * Check if worker is considered healthy
     */
    isWorkerHealthy() {
        return this.threadManager.isWorkerRunning() &&
            this.consecutiveMissedChecks < this.config.maxMissedHealthChecks;
    }
    /**
     * Get monitoring status
     */
    isMonitoringActive() {
        return this.isMonitoring;
    }
    /**
     * Update health monitor configuration
     */
    updateConfig(newConfig) {
        const wasMonitoring = this.isMonitoring;
        if (wasMonitoring) {
            this.stopMonitoring();
        }
        this.config = { ...this.config, ...newConfig };
        if (wasMonitoring) {
            this.startMonitoring();
        }
        this.emit('configUpdated', this.config);
    }
    /**
     * Handle successful health check response
     */
    handleSuccessfulHealthCheck(response) {
        this.lastHealthCheck = new Date();
        this.consecutiveMissedChecks = 0;
        // Check memory usage if enabled
        if (this.config.enableMemoryMonitoring && response.payload?.memoryUsage) {
            this.checkMemoryUsage(response.payload.memoryUsage);
        }
        this.emit('healthCheckSuccess', {
            timestamp: this.lastHealthCheck,
            responseTime: response.payload?.responseTime,
            memoryUsage: response.payload?.memoryUsage
        });
    }
    /**
     * Handle missed or failed health check
     */
    handleMissedHealthCheck(reason) {
        this.consecutiveMissedChecks++;
        this.emit('healthCheckFailed', {
            reason,
            consecutiveMissedChecks: this.consecutiveMissedChecks,
            timestamp: new Date()
        });
        // Check if worker should be considered unhealthy
        if (this.consecutiveMissedChecks >= this.config.maxMissedHealthChecks) {
            this.emit('workerUnhealthy', {
                reason: `${this.consecutiveMissedChecks} consecutive missed health checks`,
                lastHealthCheck: this.lastHealthCheck
            });
        }
    }
    /**
     * Check memory usage against threshold
     */
    checkMemoryUsage(memoryUsage) {
        const memoryUsageMB = memoryUsage.rss / (1024 * 1024);
        if (memoryUsageMB > this.config.memoryThresholdMB) {
            this.emit('memoryThresholdExceeded', {
                currentUsageMB: memoryUsageMB,
                thresholdMB: this.config.memoryThresholdMB,
                memoryUsage
            });
        }
    }
    /**
     * Create timeout promise for health check
     */
    createTimeoutPromise() {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Health check timeout after ${this.config.healthCheckTimeout}ms`));
            }, this.config.healthCheckTimeout);
        });
    }
    /**
     * Setup event listeners for ThreadManager
     */
    setupThreadManagerEvents() {
        this.threadManager.on('workerStarted', () => {
            this.consecutiveMissedChecks = 0;
            this.lastHealthCheck = null;
            if (this.isMonitoring) {
                // Perform initial health check after worker starts
                setTimeout(() => {
                    this.performHealthCheck();
                }, 1000);
            }
        });
        this.threadManager.on('workerStopped', () => {
            this.consecutiveMissedChecks = 0;
            this.lastHealthCheck = null;
        });
        this.threadManager.on('workerError', (error) => {
            this.emit('workerError', error);
        });
        this.threadManager.on('workerExit', (code) => {
            this.consecutiveMissedChecks = 0;
            this.lastHealthCheck = null;
            this.emit('workerExit', code);
        });
    }
}
//# sourceMappingURL=HealthMonitor.js.map
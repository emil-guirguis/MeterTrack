/**
 * Modbus Monitoring and Health Check System
 * Monitors the new TypeScript Modbus implementation performance and health
 */
import { EventEmitter } from 'events';
import modbusService from '../services/modbusService.js';
export class ModbusMonitoring extends EventEmitter {
    constructor() {
        super();
        this.healthCheckInterval = null;
        this.metricsInterval = null;
        this.responseTimes = [];
        this.maxResponseTimeHistory = 100;
        this.startTime = new Date();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            connectionPoolStats: {
                totalConnections: 0,
                activeConnections: 0,
                idleConnections: 0
            },
            errorCounts: new Map(),
            lastHealthCheck: new Date(),
            uptime: 0
        };
        this.startMonitoring();
    }
    /**
     * Start monitoring intervals
     */
    startMonitoring() {
        // Health check every 30 seconds
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 30000);
        // Update metrics every 10 seconds
        this.metricsInterval = setInterval(() => {
            this.updateMetrics();
        }, 10000);
        console.log('[ModbusMonitoring] Monitoring started');
    }
    /**
     * Record a Modbus operation
     */
    recordOperation(success, responseTime, error) {
        this.metrics.totalRequests++;
        if (success) {
            this.metrics.successfulRequests++;
        }
        else {
            this.metrics.failedRequests++;
            if (error) {
                const errorType = error.constructor.name;
                const currentCount = this.metrics.errorCounts.get(errorType) || 0;
                this.metrics.errorCounts.set(errorType, currentCount + 1);
            }
        }
        // Track response times
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > this.maxResponseTimeHistory) {
            this.responseTimes.shift();
        }
        // Update average response time
        this.metrics.averageResponseTime =
            this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        this.updateMetrics();
        return { ...this.metrics };
    }
    /**
     * Perform comprehensive health check
     */
    async performHealthCheck() {
        const timestamp = new Date();
        const issues = [];
        // Update connection pool stats
        this.updateConnectionPoolStats();
        // Check connection pool health
        const poolHealthy = this.checkConnectionPoolHealth(issues);
        // Check memory usage
        const memoryHealthy = this.checkMemoryHealth(issues);
        // Check response time
        const responseTimeHealthy = this.checkResponseTimeHealth(issues);
        // Check error rate
        const errorRateHealthy = this.checkErrorRateHealth(issues);
        // Determine overall status
        let status;
        const healthyChecks = [poolHealthy, memoryHealthy, responseTimeHealthy, errorRateHealthy];
        const healthyCount = healthyChecks.filter(Boolean).length;
        if (healthyCount === 4) {
            status = 'healthy';
        }
        else if (healthyCount >= 2) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        const result = {
            status,
            timestamp,
            checks: {
                connectionPool: poolHealthy,
                memoryUsage: memoryHealthy,
                responseTime: responseTimeHealthy,
                errorRate: errorRateHealthy
            },
            metrics: this.getMetrics(),
            issues
        };
        this.metrics.lastHealthCheck = timestamp;
        this.emit('healthCheck', result);
        // Log health status
        if (status !== 'healthy') {
            console.warn(`[ModbusMonitoring] Health check: ${status.toUpperCase()}`, {
                issues,
                metrics: this.metrics
            });
        }
        return result;
    }
    /**
     * Update internal metrics
     */
    updateMetrics() {
        this.metrics.uptime = Date.now() - this.startTime.getTime();
        this.updateConnectionPoolStats();
    }
    /**
     * Update connection pool statistics
     */
    updateConnectionPoolStats() {
        try {
            const poolStats = modbusService.getPoolStats();
            this.metrics.connectionPoolStats = {
                totalConnections: poolStats.totalConnections,
                activeConnections: poolStats.activeConnections,
                idleConnections: poolStats.idleConnections
            };
        }
        catch (error) {
            console.error('[ModbusMonitoring] Failed to get pool stats:', error);
        }
    }
    /**
     * Check connection pool health
     */
    checkConnectionPoolHealth(issues) {
        const stats = this.metrics.connectionPoolStats;
        // Check for excessive connections
        if (stats.totalConnections > 50) {
            issues.push(`High connection count: ${stats.totalConnections}`);
            return false;
        }
        // Check for connection leaks (all connections active for extended period)
        if (stats.totalConnections > 0 && stats.idleConnections === 0 && stats.activeConnections > 10) {
            issues.push('Possible connection leak detected');
            return false;
        }
        return true;
    }
    /**
     * Check memory health
     */
    checkMemoryHealth(issues) {
        const memUsage = process.memoryUsage();
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
        // Check for excessive memory usage
        if (heapUsedMB > 500) {
            issues.push(`High memory usage: ${heapUsedMB.toFixed(2)} MB`);
            return false;
        }
        // Check for memory leaks (heap usage > 80% of total)
        if (heapUsedMB / heapTotalMB > 0.8) {
            issues.push('Possible memory leak detected');
            return false;
        }
        return true;
    }
    /**
     * Check response time health
     */
    checkResponseTimeHealth(issues) {
        if (this.responseTimes.length === 0) {
            return true; // No data yet
        }
        const avgResponseTime = this.metrics.averageResponseTime;
        // Check for slow response times
        if (avgResponseTime > 5000) {
            issues.push(`Slow response times: ${avgResponseTime.toFixed(2)}ms average`);
            return false;
        }
        // Check for response time spikes
        const recentTimes = this.responseTimes.slice(-10);
        const maxRecentTime = Math.max(...recentTimes);
        if (maxRecentTime > 10000) {
            issues.push(`Response time spike detected: ${maxRecentTime.toFixed(2)}ms`);
            return false;
        }
        return true;
    }
    /**
     * Check error rate health
     */
    checkErrorRateHealth(issues) {
        if (this.metrics.totalRequests === 0) {
            return true; // No requests yet
        }
        const errorRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
        // Check for high error rate
        if (errorRate > 10) {
            issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
            return false;
        }
        // Check for specific error patterns
        for (const [errorType, count] of this.metrics.errorCounts.entries()) {
            const errorTypeRate = (count / this.metrics.totalRequests) * 100;
            if (errorTypeRate > 5) {
                issues.push(`High ${errorType} error rate: ${errorTypeRate.toFixed(2)}%`);
                return false;
            }
        }
        return true;
    }
    /**
     * Get monitoring dashboard data
     */
    getDashboardData() {
        const errorBreakdown = Array.from(this.metrics.errorCounts.entries()).map(([type, count]) => ({
            type,
            count,
            percentage: (count / this.metrics.totalRequests) * 100
        }));
        return {
            status: this.getOverallStatus(),
            metrics: this.getMetrics(),
            recentResponseTimes: [...this.responseTimes],
            errorBreakdown
        };
    }
    /**
     * Get overall system status
     */
    getOverallStatus() {
        const successRate = this.metrics.totalRequests > 0
            ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
            : 100;
        if (successRate > 95 && this.metrics.averageResponseTime < 1000) {
            return 'excellent';
        }
        else if (successRate > 90 && this.metrics.averageResponseTime < 3000) {
            return 'good';
        }
        else if (successRate > 80) {
            return 'degraded';
        }
        else {
            return 'poor';
        }
    }
    /**
     * Reset metrics (useful for testing or periodic resets)
     */
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            connectionPoolStats: {
                totalConnections: 0,
                activeConnections: 0,
                idleConnections: 0
            },
            errorCounts: new Map(),
            lastHealthCheck: new Date(),
            uptime: Date.now() - this.startTime.getTime()
        };
        this.responseTimes = [];
        console.log('[ModbusMonitoring] Metrics reset');
    }
    /**
     * Stop monitoring
     */
    stop() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
        console.log('[ModbusMonitoring] Monitoring stopped');
    }
}
// Create singleton instance
const modbusMonitoring = new ModbusMonitoring();
export default modbusMonitoring;
//# sourceMappingURL=modbusMonitoring.js.map
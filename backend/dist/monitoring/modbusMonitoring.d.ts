/**
 * Modbus Monitoring and Health Check System
 * Monitors the new TypeScript Modbus implementation performance and health
 */
import { EventEmitter } from 'events';
interface MonitoringMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    connectionPoolStats: {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
    };
    errorCounts: Map<string, number>;
    lastHealthCheck: Date;
    uptime: number;
}
interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    checks: {
        connectionPool: boolean;
        memoryUsage: boolean;
        responseTime: boolean;
        errorRate: boolean;
    };
    metrics: MonitoringMetrics;
    issues: string[];
}
export declare class ModbusMonitoring extends EventEmitter {
    private metrics;
    private startTime;
    private healthCheckInterval;
    private metricsInterval;
    private responseTimes;
    private maxResponseTimeHistory;
    constructor();
    /**
     * Start monitoring intervals
     */
    private startMonitoring;
    /**
     * Record a Modbus operation
     */
    recordOperation(success: boolean, responseTime: number, error?: Error): void;
    /**
     * Get current metrics
     */
    getMetrics(): MonitoringMetrics;
    /**
     * Perform comprehensive health check
     */
    performHealthCheck(): Promise<HealthCheckResult>;
    /**
     * Update internal metrics
     */
    private updateMetrics;
    /**
     * Update connection pool statistics
     */
    private updateConnectionPoolStats;
    /**
     * Check connection pool health
     */
    private checkConnectionPoolHealth;
    /**
     * Check memory health
     */
    private checkMemoryHealth;
    /**
     * Check response time health
     */
    private checkResponseTimeHealth;
    /**
     * Check error rate health
     */
    private checkErrorRateHealth;
    /**
     * Get monitoring dashboard data
     */
    getDashboardData(): {
        status: string;
        metrics: MonitoringMetrics;
        recentResponseTimes: number[];
        errorBreakdown: Array<{
            type: string;
            count: number;
            percentage: number;
        }>;
    };
    /**
     * Get overall system status
     */
    private getOverallStatus;
    /**
     * Reset metrics (useful for testing or periodic resets)
     */
    resetMetrics(): void;
    /**
     * Stop monitoring
     */
    stop(): void;
}
declare const modbusMonitoring: ModbusMonitoring;
export default modbusMonitoring;
//# sourceMappingURL=modbusMonitoring.d.ts.map
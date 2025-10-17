import { EventEmitter } from 'events';
import { ThreadManager } from './ThreadManager.js';
import { HealthMonitor } from './HealthMonitor.js';
import { ResourceMonitor } from './ResourceMonitor.js';
import { LoggingService } from './LoggingService.js';
/**
 * Metric types
 */
export declare enum MetricType {
    COUNTER = "counter",
    GAUGE = "gauge",
    HISTOGRAM = "histogram",
    TIMER = "timer"
}
/**
 * Metric data point
 */
export interface MetricDataPoint {
    timestamp: Date;
    value: number;
    labels?: Record<string, string>;
}
/**
 * Metric definition
 */
export interface Metric {
    name: string;
    type: MetricType;
    description: string;
    unit?: string;
    labels?: string[];
    dataPoints: MetricDataPoint[];
    currentValue?: number;
}
/**
 * Alert rule
 */
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metricName: string;
    condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: number;
    severity: 'info' | 'warning' | 'critical';
    enabled: boolean;
    labels?: Record<string, string>;
}
/**
 * Alert instance
 */
export interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    startTime: Date;
    endTime?: Date;
    status: 'firing' | 'resolved';
    labels?: Record<string, string>;
    currentValue: number;
    threshold: number;
}
/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
    enabled: boolean;
    metricsRetentionDays: number;
    collectionInterval: number;
    enableAlerts: boolean;
    alertCheckInterval: number;
    maxMetricsPerType: number;
    enableDashboard: boolean;
    dashboardPort?: number;
    exportMetrics: {
        enabled: boolean;
        format: 'prometheus' | 'json';
        endpoint: string;
    };
}
/**
 * Dashboard data
 */
export interface DashboardData {
    overview: {
        totalThreads: number;
        activeThreads: number;
        totalMessages: number;
        errorRate: number;
        averageResponseTime: number;
        uptime: number;
    };
    metrics: Metric[];
    alerts: Alert[];
    recentLogs: any[];
    systemHealth: {
        status: 'healthy' | 'warning' | 'critical';
        checks: Array<{
            name: string;
            status: 'pass' | 'fail';
            message?: string;
        }>;
    };
}
/**
 * MonitoringService provides comprehensive monitoring and alerting
 */
export declare class MonitoringService extends EventEmitter {
    private config;
    private threadManager;
    private healthMonitor;
    private resourceMonitor;
    private loggingService;
    private metrics;
    private alertRules;
    private activeAlerts;
    private collectionInterval;
    private alertCheckInterval;
    private alertIdCounter;
    private isMonitoring;
    constructor(threadManager: ThreadManager, healthMonitor: HealthMonitor, resourceMonitor: ResourceMonitor, loggingService: LoggingService, config?: Partial<MonitoringConfig>);
    /**
     * Start monitoring
     */
    start(): void;
    /**
     * Stop monitoring
     */
    stop(): void;
    /**
     * Record a metric value
     */
    recordMetric(name: string, value: number, labels?: Record<string, string>, timestamp?: Date): void;
    /**
     * Increment a counter metric
     */
    incrementCounter(name: string, labels?: Record<string, string>): void;
    /**
     * Set a gauge metric
     */
    setGauge(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Record a timer metric (in milliseconds)
     */
    recordTimer(name: string, duration: number, labels?: Record<string, string>): void;
    /**
     * Start a timer and return a function to end it
     */
    startTimer(name: string, labels?: Record<string, string>): () => void;
    /**
     * Get metric by name
     */
    getMetric(name: string): Metric | undefined;
    /**
     * Get all metrics
     */
    getAllMetrics(): Metric[];
    /**
     * Create a new metric
     */
    createMetric(name: string, type: MetricType, description: string, unit?: string, labels?: string[]): void;
    /**
     * Delete a metric
     */
    deleteMetric(name: string): boolean;
    /**
     * Create an alert rule
     */
    createAlertRule(rule: Omit<AlertRule, 'id'>): string;
    /**
     * Update an alert rule
     */
    updateAlertRule(id: string, updates: Partial<AlertRule>): boolean;
    /**
     * Delete an alert rule
     */
    deleteAlertRule(id: string): boolean;
    /**
     * Get all alert rules
     */
    getAlertRules(): AlertRule[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Get dashboard data
     */
    getDashboardData(): DashboardData;
    /**
     * Export metrics in specified format
     */
    exportMetrics(format?: 'prometheus' | 'json'): string;
    /**
     * Update monitoring configuration
     */
    updateConfig(newConfig: Partial<MonitoringConfig>): void;
    /**
     * Initialize default metrics
     */
    private initializeDefaultMetrics;
    /**
     * Initialize default alert rules
     */
    private initializeDefaultAlerts;
    /**
     * Collect metrics from various sources
     */
    private collectMetrics;
    /**
     * Check alert rules and fire/resolve alerts
     */
    private checkAlerts;
    /**
     * Fire an alert
     */
    private fireAlert;
    /**
     * Resolve an alert
     */
    private resolveAlert;
    /**
     * Export metrics in Prometheus format
     */
    private exportPrometheusMetrics;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
}
//# sourceMappingURL=MonitoringService.d.ts.map
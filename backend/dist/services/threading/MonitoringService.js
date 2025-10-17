import { EventEmitter } from 'events';
/**
 * Metric types
 */
export var MetricType;
(function (MetricType) {
    MetricType["COUNTER"] = "counter";
    MetricType["GAUGE"] = "gauge";
    MetricType["HISTOGRAM"] = "histogram";
    MetricType["TIMER"] = "timer";
})(MetricType || (MetricType = {}));
/**
 * MonitoringService provides comprehensive monitoring and alerting
 */
export class MonitoringService extends EventEmitter {
    constructor(threadManager, healthMonitor, resourceMonitor, loggingService, config = {}) {
        super();
        this.metrics = new Map();
        this.alertRules = new Map();
        this.activeAlerts = new Map();
        this.collectionInterval = null;
        this.alertCheckInterval = null;
        this.alertIdCounter = 0;
        this.isMonitoring = false;
        this.threadManager = threadManager;
        this.healthMonitor = healthMonitor;
        this.resourceMonitor = resourceMonitor;
        this.loggingService = loggingService;
        // Default configuration
        this.config = {
            enabled: true,
            metricsRetentionDays: 7,
            collectionInterval: 10000, // 10 seconds
            enableAlerts: true,
            alertCheckInterval: 30000, // 30 seconds
            maxMetricsPerType: 1000,
            enableDashboard: false,
            dashboardPort: 3002,
            exportMetrics: {
                enabled: false,
                format: 'json',
                endpoint: '/metrics'
            },
            ...config
        };
        this.initializeDefaultMetrics();
        this.initializeDefaultAlerts();
        this.setupEventHandlers();
    }
    /**
     * Start monitoring
     */
    start() {
        if (!this.config.enabled || this.isMonitoring) {
            return;
        }
        this.isMonitoring = true;
        // Start metrics collection
        this.collectionInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.collectionInterval);
        // Start alert checking
        if (this.config.enableAlerts) {
            this.alertCheckInterval = setInterval(() => {
                this.checkAlerts();
            }, this.config.alertCheckInterval);
        }
        this.loggingService.info('Monitoring service started', 'monitoring');
        this.emit('monitoringStarted');
    }
    /**
     * Stop monitoring
     */
    stop() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
        if (this.alertCheckInterval) {
            clearInterval(this.alertCheckInterval);
            this.alertCheckInterval = null;
        }
        this.loggingService.info('Monitoring service stopped', 'monitoring');
        this.emit('monitoringStopped');
    }
    /**
     * Record a metric value
     */
    recordMetric(name, value, labels, timestamp) {
        const metric = this.metrics.get(name);
        if (!metric) {
            this.loggingService.warn(`Metric ${name} not found`, 'monitoring');
            return;
        }
        const dataPoint = {
            timestamp: timestamp || new Date(),
            value,
            labels
        };
        metric.dataPoints.push(dataPoint);
        metric.currentValue = value;
        // Maintain data point limit
        if (metric.dataPoints.length > this.config.maxMetricsPerType) {
            metric.dataPoints = metric.dataPoints.slice(-this.config.maxMetricsPerType);
        }
        this.emit('metricRecorded', { name, value, labels, timestamp: dataPoint.timestamp });
    }
    /**
     * Increment a counter metric
     */
    incrementCounter(name, labels) {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== MetricType.COUNTER) {
            return;
        }
        const currentValue = metric.currentValue || 0;
        this.recordMetric(name, currentValue + 1, labels);
    }
    /**
     * Set a gauge metric
     */
    setGauge(name, value, labels) {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== MetricType.GAUGE) {
            return;
        }
        this.recordMetric(name, value, labels);
    }
    /**
     * Record a timer metric (in milliseconds)
     */
    recordTimer(name, duration, labels) {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== MetricType.TIMER) {
            return;
        }
        this.recordMetric(name, duration, labels);
    }
    /**
     * Start a timer and return a function to end it
     */
    startTimer(name, labels) {
        const startTime = Date.now();
        return () => {
            const duration = Date.now() - startTime;
            this.recordTimer(name, duration, labels);
        };
    }
    /**
     * Get metric by name
     */
    getMetric(name) {
        return this.metrics.get(name);
    }
    /**
     * Get all metrics
     */
    getAllMetrics() {
        return Array.from(this.metrics.values());
    }
    /**
     * Create a new metric
     */
    createMetric(name, type, description, unit, labels) {
        if (this.metrics.has(name)) {
            this.loggingService.warn(`Metric ${name} already exists`, 'monitoring');
            return;
        }
        const metric = {
            name,
            type,
            description,
            unit,
            labels,
            dataPoints: [],
            currentValue: type === MetricType.COUNTER ? 0 : undefined
        };
        this.metrics.set(name, metric);
        this.loggingService.debug(`Created metric: ${name}`, 'monitoring', { type, description });
    }
    /**
     * Delete a metric
     */
    deleteMetric(name) {
        const deleted = this.metrics.delete(name);
        if (deleted) {
            this.loggingService.debug(`Deleted metric: ${name}`, 'monitoring');
        }
        return deleted;
    }
    /**
     * Create an alert rule
     */
    createAlertRule(rule) {
        const id = `alert_${++this.alertIdCounter}_${Date.now()}`;
        const alertRule = { ...rule, id };
        this.alertRules.set(id, alertRule);
        this.loggingService.info(`Created alert rule: ${rule.name}`, 'monitoring', { id, metricName: rule.metricName });
        return id;
    }
    /**
     * Update an alert rule
     */
    updateAlertRule(id, updates) {
        const rule = this.alertRules.get(id);
        if (!rule) {
            return false;
        }
        Object.assign(rule, updates);
        this.loggingService.info(`Updated alert rule: ${rule.name}`, 'monitoring', { id });
        return true;
    }
    /**
     * Delete an alert rule
     */
    deleteAlertRule(id) {
        const deleted = this.alertRules.delete(id);
        if (deleted) {
            // Resolve any active alerts for this rule
            for (const [alertId, alert] of this.activeAlerts) {
                if (alert.ruleId === id) {
                    this.resolveAlert(alertId);
                }
            }
            this.loggingService.info(`Deleted alert rule: ${id}`, 'monitoring');
        }
        return deleted;
    }
    /**
     * Get all alert rules
     */
    getAlertRules() {
        return Array.from(this.alertRules.values());
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    /**
     * Get dashboard data
     */
    getDashboardData() {
        const threadStatus = this.threadManager.getStatus();
        const healthStatus = this.healthMonitor.getHealthStatus();
        const messageStats = this.threadManager.getMessageStats();
        const recentLogs = this.loggingService.getLogHistory({ limit: 50 });
        return {
            overview: {
                totalThreads: 1, // Single thread for now
                activeThreads: threadStatus.isRunning ? 1 : 0,
                totalMessages: messageStats.pendingMessages,
                errorRate: threadStatus.errorCount,
                averageResponseTime: messageStats.averageMessageAge,
                uptime: healthStatus.uptime
            },
            metrics: this.getAllMetrics(),
            alerts: this.getActiveAlerts(),
            recentLogs,
            systemHealth: {
                status: healthStatus.isHealthy ? 'healthy' : 'critical',
                checks: [
                    {
                        name: 'Worker Thread',
                        status: threadStatus.isRunning ? 'pass' : 'fail',
                        message: threadStatus.isRunning ? 'Running' : 'Not running'
                    },
                    {
                        name: 'Health Monitor',
                        status: healthStatus.isHealthy ? 'pass' : 'fail',
                        message: healthStatus.isHealthy ? 'Healthy' : `${healthStatus.consecutiveMissedChecks} missed checks`
                    },
                    {
                        name: 'Memory Usage',
                        status: healthStatus.memoryUsage ? 'pass' : 'fail',
                        message: healthStatus.memoryUsage
                            ? `${Math.round(healthStatus.memoryUsage.rss / 1024 / 1024)}MB RSS`
                            : 'No memory data'
                    }
                ]
            }
        };
    }
    /**
     * Export metrics in specified format
     */
    exportMetrics(format = 'json') {
        if (format === 'prometheus') {
            return this.exportPrometheusMetrics();
        }
        else {
            return JSON.stringify(this.getAllMetrics(), null, 2);
        }
    }
    /**
     * Update monitoring configuration
     */
    updateConfig(newConfig) {
        const wasMonitoring = this.isMonitoring;
        if (wasMonitoring) {
            this.stop();
        }
        this.config = { ...this.config, ...newConfig };
        if (wasMonitoring) {
            this.start();
        }
        this.emit('configUpdated', this.config);
    }
    /**
     * Initialize default metrics
     */
    initializeDefaultMetrics() {
        // Thread metrics
        this.createMetric('thread_status', MetricType.GAUGE, 'Thread running status (1=running, 0=stopped)');
        this.createMetric('thread_restarts', MetricType.COUNTER, 'Total thread restarts');
        this.createMetric('thread_errors', MetricType.COUNTER, 'Total thread errors');
        // Message metrics
        this.createMetric('messages_sent', MetricType.COUNTER, 'Total messages sent');
        this.createMetric('messages_received', MetricType.COUNTER, 'Total messages received');
        this.createMetric('messages_pending', MetricType.GAUGE, 'Current pending messages');
        this.createMetric('message_response_time', MetricType.TIMER, 'Message response time', 'ms');
        // Memory metrics
        this.createMetric('memory_rss', MetricType.GAUGE, 'Resident Set Size memory', 'bytes');
        this.createMetric('memory_heap_used', MetricType.GAUGE, 'Used heap memory', 'bytes');
        this.createMetric('memory_heap_total', MetricType.GAUGE, 'Total heap memory', 'bytes');
        // Health metrics
        this.createMetric('health_checks_total', MetricType.COUNTER, 'Total health checks performed');
        this.createMetric('health_checks_failed', MetricType.COUNTER, 'Failed health checks');
        this.createMetric('health_check_duration', MetricType.TIMER, 'Health check duration', 'ms');
        // Error metrics
        this.createMetric('errors_total', MetricType.COUNTER, 'Total errors by type', undefined, ['type', 'severity']);
        this.createMetric('error_rate', MetricType.GAUGE, 'Current error rate', 'errors/min');
    }
    /**
     * Initialize default alert rules
     */
    initializeDefaultAlerts() {
        // Thread down alert
        this.createAlertRule({
            name: 'Thread Down',
            description: 'Worker thread is not running',
            metricName: 'thread_status',
            condition: 'lt',
            threshold: 1,
            duration: 30000, // 30 seconds
            severity: 'critical',
            enabled: true
        });
        // High error rate alert
        this.createAlertRule({
            name: 'High Error Rate',
            description: 'Error rate is above threshold',
            metricName: 'error_rate',
            condition: 'gt',
            threshold: 10, // 10 errors per minute
            duration: 60000, // 1 minute
            severity: 'warning',
            enabled: true
        });
        // High memory usage alert
        this.createAlertRule({
            name: 'High Memory Usage',
            description: 'Memory usage is above threshold',
            metricName: 'memory_rss',
            condition: 'gt',
            threshold: 512 * 1024 * 1024, // 512MB
            duration: 120000, // 2 minutes
            severity: 'warning',
            enabled: true
        });
        // Health check failures
        this.createAlertRule({
            name: 'Health Check Failures',
            description: 'Multiple consecutive health check failures',
            metricName: 'health_checks_failed',
            condition: 'gt',
            threshold: 3,
            duration: 60000, // 1 minute
            severity: 'critical',
            enabled: true
        });
    }
    /**
     * Collect metrics from various sources
     */
    async collectMetrics() {
        try {
            // Thread metrics
            const threadStatus = this.threadManager.getStatus();
            this.setGauge('thread_status', threadStatus.isRunning ? 1 : 0);
            this.setGauge('thread_restarts', threadStatus.restartCount);
            this.setGauge('thread_errors', threadStatus.errorCount);
            // Message metrics
            const messageStats = this.threadManager.getMessageStats();
            this.setGauge('messages_pending', messageStats.pendingMessages);
            // Memory metrics (if available)
            const healthStatus = this.healthMonitor.getHealthStatus();
            if (healthStatus.memoryUsage) {
                this.setGauge('memory_rss', healthStatus.memoryUsage.rss);
                this.setGauge('memory_heap_used', healthStatus.memoryUsage.heapUsed);
                this.setGauge('memory_heap_total', healthStatus.memoryUsage.heapTotal);
            }
            // Error rate
            const logStats = this.loggingService.getStats();
            this.setGauge('error_rate', logStats.errorRate);
        }
        catch (error) {
            this.loggingService.error('Failed to collect metrics', 'monitoring', {}, error);
        }
    }
    /**
     * Check alert rules and fire/resolve alerts
     */
    checkAlerts() {
        for (const rule of this.alertRules.values()) {
            if (!rule.enabled) {
                continue;
            }
            const metric = this.metrics.get(rule.metricName);
            if (!metric || metric.currentValue === undefined) {
                continue;
            }
            const currentValue = metric.currentValue;
            const threshold = rule.threshold;
            let conditionMet = false;
            switch (rule.condition) {
                case 'gt':
                    conditionMet = currentValue > threshold;
                    break;
                case 'gte':
                    conditionMet = currentValue >= threshold;
                    break;
                case 'lt':
                    conditionMet = currentValue < threshold;
                    break;
                case 'lte':
                    conditionMet = currentValue <= threshold;
                    break;
                case 'eq':
                    conditionMet = currentValue === threshold;
                    break;
            }
            const existingAlert = Array.from(this.activeAlerts.values())
                .find(alert => alert.ruleId === rule.id && alert.status === 'firing');
            if (conditionMet) {
                if (!existingAlert) {
                    // Fire new alert
                    this.fireAlert(rule, currentValue);
                }
            }
            else {
                if (existingAlert) {
                    // Resolve existing alert
                    this.resolveAlert(existingAlert.id);
                }
            }
        }
    }
    /**
     * Fire an alert
     */
    fireAlert(rule, currentValue) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const alert = {
            id: alertId,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: `${rule.description} - Current: ${currentValue}, Threshold: ${rule.threshold}`,
            startTime: new Date(),
            status: 'firing',
            labels: rule.labels,
            currentValue,
            threshold: rule.threshold
        };
        this.activeAlerts.set(alertId, alert);
        this.loggingService.warn(`Alert fired: ${rule.name}`, 'monitoring', {
            alertId,
            ruleId: rule.id,
            currentValue,
            threshold: rule.threshold,
            severity: rule.severity
        });
        this.emit('alertFired', alert);
    }
    /**
     * Resolve an alert
     */
    resolveAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            return;
        }
        alert.status = 'resolved';
        alert.endTime = new Date();
        this.activeAlerts.delete(alertId);
        this.loggingService.info(`Alert resolved: ${alert.ruleName}`, 'monitoring', {
            alertId,
            duration: alert.endTime.getTime() - alert.startTime.getTime()
        });
        this.emit('alertResolved', alert);
    }
    /**
     * Export metrics in Prometheus format
     */
    exportPrometheusMetrics() {
        let output = '';
        for (const metric of this.metrics.values()) {
            // Add metric help
            output += `# HELP ${metric.name} ${metric.description}\n`;
            // Add metric type
            let promType = 'gauge';
            switch (metric.type) {
                case MetricType.COUNTER:
                    promType = 'counter';
                    break;
                case MetricType.HISTOGRAM:
                    promType = 'histogram';
                    break;
                case MetricType.TIMER:
                    promType = 'histogram';
                    break;
            }
            output += `# TYPE ${metric.name} ${promType}\n`;
            // Add current value
            if (metric.currentValue !== undefined) {
                output += `${metric.name} ${metric.currentValue}\n`;
            }
        }
        return output;
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Thread manager events
        this.threadManager.on('workerStarted', () => {
            this.incrementCounter('thread_restarts');
        });
        this.threadManager.on('workerError', () => {
            this.incrementCounter('thread_errors');
        });
        // Health monitor events
        this.healthMonitor.on('healthCheckSuccess', () => {
            this.incrementCounter('health_checks_total');
        });
        this.healthMonitor.on('healthCheckFailed', () => {
            this.incrementCounter('health_checks_total');
            this.incrementCounter('health_checks_failed');
        });
        // Message events (would need to be added to ThreadManager)
        this.threadManager.on('messageSent', () => {
            this.incrementCounter('messages_sent');
        });
        this.threadManager.on('messageReceived', (data) => {
            this.incrementCounter('messages_received');
            if (data.responseTime) {
                this.recordTimer('message_response_time', data.responseTime);
            }
        });
    }
}
//# sourceMappingURL=MonitoringService.js.map
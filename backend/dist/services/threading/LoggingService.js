import winston from 'winston';
import { EventEmitter } from 'events';
/**
 * Log levels with numeric values for filtering
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["HTTP"] = 3] = "HTTP";
    LogLevel[LogLevel["VERBOSE"] = 4] = "VERBOSE";
    LogLevel[LogLevel["DEBUG"] = 5] = "DEBUG";
    LogLevel[LogLevel["SILLY"] = 6] = "SILLY";
})(LogLevel || (LogLevel = {}));
/**
 * LoggingService provides structured logging with correlation and filtering
 */
export class LoggingService extends EventEmitter {
    constructor(config = {}) {
        super();
        this.logHistory = [];
        this.logIdCounter = 0;
        this.correlationIdCounter = 0;
        this.currentCorrelationId = null;
        // Statistics
        this.stats = {
            totalLogs: 0,
            logsByLevel: {},
            logsByContext: {},
            startTime: Date.now()
        };
        // Default configuration
        this.config = {
            level: LogLevel.INFO,
            enableConsole: true,
            enableFile: true,
            enableCorrelation: true,
            maxLogHistory: 1000,
            logRotation: {
                enabled: true,
                maxSize: '10m',
                maxFiles: 5
            },
            contexts: {
                'threading': { level: LogLevel.DEBUG, enabled: true },
                'worker': { level: LogLevel.INFO, enabled: true },
                'health': { level: LogLevel.INFO, enabled: true },
                'resource': { level: LogLevel.INFO, enabled: true },
                'message': { level: LogLevel.DEBUG, enabled: true },
                'error': { level: LogLevel.ERROR, enabled: true },
                'performance': { level: LogLevel.INFO, enabled: true }
            },
            filters: {
                excludePatterns: [],
                includePatterns: []
            },
            ...config
        };
        // Initialize statistics
        Object.values(LogLevel).forEach(level => {
            if (typeof level === 'number') {
                this.stats.logsByLevel[level] = 0;
            }
        });
        this.initializeWinstonLogger();
    }
    /**
     * Log error message
     */
    error(message, context = 'general', metadata, error) {
        this.log(LogLevel.ERROR, message, context, metadata, error);
    }
    /**
     * Log warning message
     */
    warn(message, context = 'general', metadata) {
        this.log(LogLevel.WARN, message, context, metadata);
    }
    /**
     * Log info message
     */
    info(message, context = 'general', metadata) {
        this.log(LogLevel.INFO, message, context, metadata);
    }
    /**
     * Log debug message
     */
    debug(message, context = 'general', metadata) {
        this.log(LogLevel.DEBUG, message, context, metadata);
    }
    /**
     * Log verbose message
     */
    verbose(message, context = 'general', metadata) {
        this.log(LogLevel.VERBOSE, message, context, metadata);
    }
    /**
     * Start a new correlation context
     */
    startCorrelation(correlationId) {
        if (!this.config.enableCorrelation) {
            return '';
        }
        this.currentCorrelationId = correlationId || this.generateCorrelationId();
        this.debug('Correlation started', 'correlation', {
            correlationId: this.currentCorrelationId
        });
        return this.currentCorrelationId;
    }
    /**
     * End current correlation context
     */
    endCorrelation() {
        if (!this.config.enableCorrelation || !this.currentCorrelationId) {
            return;
        }
        this.debug('Correlation ended', 'correlation', {
            correlationId: this.currentCorrelationId
        });
        this.currentCorrelationId = null;
    }
    /**
     * Execute function within correlation context
     */
    async withCorrelation(fn, correlationId) {
        const id = this.startCorrelation(correlationId);
        try {
            const result = await fn();
            return result;
        }
        finally {
            this.endCorrelation();
        }
    }
    /**
     * Get current correlation ID
     */
    getCurrentCorrelationId() {
        return this.currentCorrelationId;
    }
    /**
     * Log structured message
     */
    log(level, message, context = 'general', metadata, error) {
        // Check if logging is enabled for this context
        const contextConfig = this.config.contexts[context];
        if (contextConfig && (!contextConfig.enabled || level > contextConfig.level)) {
            return;
        }
        // Check global log level
        if (level > this.config.level) {
            return;
        }
        // Apply filters
        if (!this.shouldLog(message, context)) {
            return;
        }
        const logEntry = {
            id: this.generateLogId(),
            timestamp: new Date(),
            level,
            message,
            context,
            correlationId: this.currentCorrelationId || undefined,
            threadId: this.getThreadId(),
            workerId: this.getWorkerId(),
            metadata: metadata || {},
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        };
        // Add to history
        this.addToHistory(logEntry);
        // Update statistics
        this.updateStats(logEntry);
        // Log with Winston
        this.logWithWinston(logEntry);
        // Emit log event
        this.emit('log', logEntry);
        // Emit level-specific events
        this.emit(`log:${LogLevel[level].toLowerCase()}`, logEntry);
    }
    /**
     * Get log history
     */
    getLogHistory(options = {}) {
        let logs = [...this.logHistory];
        // Apply filters
        if (options.level !== undefined) {
            logs = logs.filter(log => log.level === options.level);
        }
        if (options.context) {
            logs = logs.filter(log => log.context === options.context);
        }
        if (options.correlationId) {
            logs = logs.filter(log => log.correlationId === options.correlationId);
        }
        if (options.since) {
            logs = logs.filter(log => log.timestamp >= options.since);
        }
        // Apply limit
        if (options.limit) {
            logs = logs.slice(-options.limit);
        }
        return logs;
    }
    /**
     * Get logging statistics
     */
    getStats() {
        const now = Date.now();
        const uptimeMinutes = (now - this.stats.startTime) / (1000 * 60);
        const averageLogsPerMinute = uptimeMinutes > 0 ? this.stats.totalLogs / uptimeMinutes : 0;
        // Calculate error rate (errors per minute)
        const errorCount = this.stats.logsByLevel[LogLevel.ERROR] || 0;
        const errorRate = uptimeMinutes > 0 ? errorCount / uptimeMinutes : 0;
        return {
            totalLogs: this.stats.totalLogs,
            logsByLevel: { ...this.stats.logsByLevel },
            logsByContext: { ...this.stats.logsByContext },
            recentLogs: this.logHistory.slice(-10),
            errorRate,
            averageLogsPerMinute
        };
    }
    /**
     * Clear log history
     */
    clearHistory() {
        this.logHistory = [];
        this.emit('historyClear');
    }
    /**
     * Update logging configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Reinitialize Winston logger if needed
        if (newConfig.level !== undefined ||
            newConfig.enableConsole !== undefined ||
            newConfig.enableFile !== undefined ||
            newConfig.logRotation !== undefined) {
            this.initializeWinstonLogger();
        }
        this.emit('configUpdated', this.config);
    }
    /**
     * Set log level for specific context
     */
    setContextLevel(context, level, enabled = true) {
        this.config.contexts[context] = { level, enabled };
        this.emit('contextUpdated', { context, level, enabled });
    }
    /**
     * Enable/disable context logging
     */
    setContextEnabled(context, enabled) {
        if (this.config.contexts[context]) {
            this.config.contexts[context].enabled = enabled;
        }
        else {
            this.config.contexts[context] = { level: this.config.level, enabled };
        }
        this.emit('contextUpdated', { context, enabled });
    }
    /**
     * Add log filter pattern
     */
    addFilter(pattern, type) {
        if (type === 'include') {
            this.config.filters.includePatterns.push(pattern);
        }
        else {
            this.config.filters.excludePatterns.push(pattern);
        }
        this.emit('filterAdded', { pattern, type });
    }
    /**
     * Remove log filter pattern
     */
    removeFilter(pattern, type) {
        if (type === 'include') {
            const index = this.config.filters.includePatterns.indexOf(pattern);
            if (index > -1) {
                this.config.filters.includePatterns.splice(index, 1);
            }
        }
        else {
            const index = this.config.filters.excludePatterns.indexOf(pattern);
            if (index > -1) {
                this.config.filters.excludePatterns.splice(index, 1);
            }
        }
        this.emit('filterRemoved', { pattern, type });
    }
    /**
     * Get Winston logger instance
     */
    getWinstonLogger() {
        return this.logger;
    }
    /**
     * Initialize Winston logger
     */
    initializeWinstonLogger() {
        const transports = [];
        // Console transport
        if (this.config.enableConsole) {
            transports.push(new winston.transports.Console({
                level: LogLevel[this.config.level].toLowerCase(),
                format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), winston.format.printf(({ timestamp, level, message, context, correlationId, threadId, workerId, metadata }) => {
                    let logMessage = `${timestamp} [${level}]`;
                    if (context && context !== 'general') {
                        logMessage += ` [${context}]`;
                    }
                    if (correlationId) {
                        logMessage += ` [${correlationId}]`;
                    }
                    if (threadId) {
                        logMessage += ` [T:${threadId}]`;
                    }
                    if (workerId) {
                        logMessage += ` [W:${workerId}]`;
                    }
                    logMessage += `: ${message}`;
                    if (metadata && Object.keys(metadata).length > 0) {
                        logMessage += ` ${JSON.stringify(metadata)}`;
                    }
                    return logMessage;
                }))
            }));
        }
        // File transport
        if (this.config.enableFile) {
            const fileTransportOptions = {
                filename: 'logs/threading.log',
                level: LogLevel[this.config.level].toLowerCase(),
                format: winston.format.combine(winston.format.timestamp(), winston.format.json())
            };
            if (this.config.logRotation.enabled) {
                Object.assign(fileTransportOptions, {
                    maxsize: this.parseSize(this.config.logRotation.maxSize),
                    maxFiles: this.config.logRotation.maxFiles
                });
            }
            transports.push(new winston.transports.File(fileTransportOptions));
        }
        this.logger = winston.createLogger({
            level: LogLevel[this.config.level].toLowerCase(),
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
            transports,
            exitOnError: false
        });
    }
    /**
     * Check if message should be logged based on filters
     */
    shouldLog(message, context) {
        // Check exclude patterns
        for (const pattern of this.config.filters.excludePatterns) {
            if (message.includes(pattern) || context.includes(pattern)) {
                return false;
            }
        }
        // Check include patterns (if any exist, message must match at least one)
        if (this.config.filters.includePatterns.length > 0) {
            let matches = false;
            for (const pattern of this.config.filters.includePatterns) {
                if (message.includes(pattern) || context.includes(pattern)) {
                    matches = true;
                    break;
                }
            }
            if (!matches) {
                return false;
            }
        }
        return true;
    }
    /**
     * Add log entry to history
     */
    addToHistory(logEntry) {
        this.logHistory.push(logEntry);
        // Maintain history size
        if (this.logHistory.length > this.config.maxLogHistory) {
            this.logHistory = this.logHistory.slice(-this.config.maxLogHistory);
        }
    }
    /**
     * Update logging statistics
     */
    updateStats(logEntry) {
        this.stats.totalLogs++;
        this.stats.logsByLevel[logEntry.level] = (this.stats.logsByLevel[logEntry.level] || 0) + 1;
        this.stats.logsByContext[logEntry.context] = (this.stats.logsByContext[logEntry.context] || 0) + 1;
    }
    /**
     * Log with Winston
     */
    logWithWinston(logEntry) {
        const winstonLevel = LogLevel[logEntry.level].toLowerCase();
        this.logger.log(winstonLevel, logEntry.message, {
            context: logEntry.context,
            correlationId: logEntry.correlationId,
            threadId: logEntry.threadId,
            workerId: logEntry.workerId,
            metadata: logEntry.metadata,
            error: logEntry.error,
            logId: logEntry.id,
            timestamp: logEntry.timestamp.toISOString()
        });
    }
    /**
     * Generate unique log ID
     */
    generateLogId() {
        return `log_${++this.logIdCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    /**
     * Generate correlation ID
     */
    generateCorrelationId() {
        return `corr_${++this.correlationIdCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    /**
     * Get current thread ID (placeholder)
     */
    getThreadId() {
        // In a real implementation, this would get the actual thread ID
        return process.pid ? `main_${process.pid}` : undefined;
    }
    /**
     * Get current worker ID (placeholder)
     */
    getWorkerId() {
        // This would be set by the worker context
        return undefined;
    }
    /**
     * Parse size string to bytes
     */
    parseSize(sizeStr) {
        const units = {
            'b': 1,
            'k': 1024,
            'm': 1024 * 1024,
            'g': 1024 * 1024 * 1024
        };
        const match = sizeStr.toLowerCase().match(/^(\d+)([bkmg]?)$/);
        if (!match) {
            return 10 * 1024 * 1024; // Default 10MB
        }
        const [, size, unit] = match;
        return parseInt(size) * (units[unit] || 1);
    }
}
//# sourceMappingURL=LoggingService.js.map
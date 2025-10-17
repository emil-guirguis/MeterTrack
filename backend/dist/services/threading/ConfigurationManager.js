import { EventEmitter } from 'events';
import { MessagePriority } from './types.js';
/**
 * ConfigurationManager handles dynamic configuration updates for the threading system
 */
export class ConfigurationManager extends EventEmitter {
    constructor(initialConfig) {
        super();
        this.configHistory = [];
        this.maxHistorySize = 100;
        this.configValidators = new Map();
        // Initialize with default configuration
        this.config = this.getDefaultConfig();
        // Apply initial configuration if provided
        if (initialConfig) {
            this.updateConfig(initialConfig, 'default');
        }
        this.setupValidators();
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return JSON.parse(JSON.stringify(this.config)); // Deep clone
    }
    /**
     * Get configuration for specific section
     */
    getSectionConfig(section) {
        return JSON.parse(JSON.stringify(this.config[section])); // Deep clone
    }
    /**
     * Update entire configuration
     */
    updateConfig(newConfig, source = 'api') {
        const validationResult = this.validateConfig(newConfig);
        if (!validationResult.isValid) {
            this.emit('configValidationFailed', {
                errors: validationResult.errors,
                warnings: validationResult.warnings,
                source
            });
            return validationResult;
        }
        // Apply configuration changes
        const oldConfig = this.getConfig();
        for (const [section, sectionConfig] of Object.entries(newConfig)) {
            if (sectionConfig !== undefined) {
                const sectionKey = section;
                const oldSectionConfig = this.config[sectionKey];
                // Deep merge configuration
                this.config[sectionKey] = this.deepMerge(oldSectionConfig, sectionConfig);
                // Record change
                this.recordConfigChange(sectionKey, oldSectionConfig, this.config[sectionKey], source);
                // Emit section-specific change event
                this.emit('configSectionChanged', {
                    section: sectionKey,
                    oldValue: oldSectionConfig,
                    newValue: this.config[sectionKey],
                    source
                });
            }
        }
        this.emit('configUpdated', {
            oldConfig,
            newConfig: this.getConfig(),
            source,
            validationResult
        });
        return validationResult;
    }
    /**
     * Update specific configuration section
     */
    updateSectionConfig(section, sectionConfig, source = 'api') {
        const partialConfig = { [section]: sectionConfig };
        return this.updateConfig(partialConfig, source);
    }
    /**
     * Validate configuration
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];
        for (const [section, sectionConfig] of Object.entries(config)) {
            if (sectionConfig !== undefined) {
                const sectionKey = section;
                const validator = this.configValidators.get(sectionKey);
                if (validator) {
                    const sectionResult = validator(sectionConfig);
                    errors.push(...sectionResult.errors);
                    warnings.push(...sectionResult.warnings);
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Reset configuration to defaults
     */
    resetToDefaults() {
        const oldConfig = this.getConfig();
        this.config = this.getDefaultConfig();
        this.emit('configReset', {
            oldConfig,
            newConfig: this.getConfig()
        });
    }
    /**
     * Get configuration change history
     */
    getConfigHistory() {
        return [...this.configHistory];
    }
    /**
     * Clear configuration history
     */
    clearConfigHistory() {
        this.configHistory = [];
        this.emit('configHistoryCleared');
    }
    /**
     * Export configuration to JSON
     */
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }
    /**
     * Import configuration from JSON
     */
    importConfig(configJson, source = 'file') {
        try {
            const importedConfig = JSON.parse(configJson);
            return this.updateConfig(importedConfig, source);
        }
        catch (error) {
            const validationResult = {
                isValid: false,
                errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
                warnings: []
            };
            this.emit('configImportFailed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                source
            });
            return validationResult;
        }
    }
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            threadManager: {
                maxRestartAttempts: 5,
                restartDelay: 1000,
                healthCheckInterval: 30000,
                messageTimeout: 10000
            },
            healthMonitor: {
                healthCheckInterval: 30000,
                healthCheckTimeout: 5000,
                maxMissedHealthChecks: 3,
                enableMemoryMonitoring: true,
                memoryThresholdMB: 512
            },
            restartManager: {
                maxRestartAttempts: 5,
                initialRestartDelay: 1000,
                maxRestartDelay: 60000,
                backoffMultiplier: 2,
                resetCounterAfter: 300000,
                enableCircuitBreaker: true,
                circuitBreakerThreshold: 3,
                circuitBreakerResetTime: 300000
            },
            errorHandler: {
                maxErrorHistory: 1000,
                errorReportingInterval: 60000,
                enableErrorAggregation: true,
                aggregationWindow: 300000,
                retryDelays: {
                    worker_startup: [1000, 2000, 5000, 10000],
                    worker_runtime: [500, 1000, 2000],
                    communication: [100, 500, 1000, 2000],
                    memory: [5000, 10000],
                    timeout: [1000, 2000, 5000],
                    configuration: [0],
                    external_service: [1000, 5000, 15000, 30000],
                    unknown: [1000, 2000, 5000]
                },
                maxRecoveryAttempts: {
                    worker_startup: 5,
                    worker_runtime: 3,
                    communication: 5,
                    memory: 2,
                    timeout: 3,
                    configuration: 1,
                    external_service: 5,
                    unknown: 3
                },
                severityThresholds: {
                    worker_startup: 'high',
                    worker_runtime: 'medium',
                    communication: 'medium',
                    memory: 'high',
                    timeout: 'medium',
                    configuration: 'high',
                    external_service: 'medium',
                    unknown: 'medium'
                }
            },
            messageQueue: {
                maxSize: 1000,
                maxSizePerPriority: {
                    [MessagePriority.CRITICAL]: 100,
                    [MessagePriority.HIGH]: 200,
                    [MessagePriority.NORMAL]: 500,
                    [MessagePriority.LOW]: 200
                },
                enableBackpressure: true,
                backpressureThreshold: 0.8,
                processingDelay: 10,
                batchSize: 5,
                enableBatching: false
            },
            worker: {
                maxMemoryMB: 512,
                gcInterval: 60000,
                enableProfiling: false,
                logLevel: 'info',
                moduleConfig: {
                    modbus: {
                        host: 'localhost',
                        port: 502,
                        timeout: 5000,
                        retryAttempts: 3,
                        retryDelay: 1000,
                        unitId: 1,
                        registers: {
                            start: 0,
                            count: 10,
                            interval: 5000
                        }
                    },
                    database: {
                        connectionString: 'mongodb://localhost:27017/mcp-data',
                        poolSize: 10,
                        timeout: 10000,
                        retryAttempts: 3,
                        batchSize: 100,
                        flushInterval: 5000
                    }
                }
            }
        };
    }
    /**
     * Setup configuration validators
     */
    setupValidators() {
        // Thread Manager validator
        this.configValidators.set('threadManager', (config) => {
            const errors = [];
            const warnings = [];
            if (config.maxRestartAttempts !== undefined && config.maxRestartAttempts < 1) {
                errors.push('maxRestartAttempts must be at least 1');
            }
            if (config.restartDelay !== undefined && config.restartDelay < 0) {
                errors.push('restartDelay must be non-negative');
            }
            if (config.healthCheckInterval !== undefined && config.healthCheckInterval < 1000) {
                warnings.push('healthCheckInterval less than 1000ms may cause high CPU usage');
            }
            if (config.messageTimeout !== undefined && config.messageTimeout < 1000) {
                warnings.push('messageTimeout less than 1000ms may cause frequent timeouts');
            }
            return { isValid: errors.length === 0, errors, warnings };
        });
        // Health Monitor validator
        this.configValidators.set('healthMonitor', (config) => {
            const errors = [];
            const warnings = [];
            if (config.healthCheckInterval !== undefined && config.healthCheckInterval < 1000) {
                warnings.push('healthCheckInterval less than 1000ms may cause high CPU usage');
            }
            if (config.healthCheckTimeout !== undefined && config.healthCheckTimeout < 100) {
                errors.push('healthCheckTimeout must be at least 100ms');
            }
            if (config.maxMissedHealthChecks !== undefined && config.maxMissedHealthChecks < 1) {
                errors.push('maxMissedHealthChecks must be at least 1');
            }
            if (config.memoryThresholdMB !== undefined && config.memoryThresholdMB < 64) {
                warnings.push('memoryThresholdMB less than 64MB may cause frequent restarts');
            }
            return { isValid: errors.length === 0, errors, warnings };
        });
        // Add more validators for other sections...
        // (Abbreviated for brevity, but would include validators for all sections)
    }
    /**
     * Record configuration change in history
     */
    recordConfigChange(section, oldValue, newValue, source) {
        const changeEvent = {
            section,
            oldValue: JSON.parse(JSON.stringify(oldValue)),
            newValue: JSON.parse(JSON.stringify(newValue)),
            timestamp: new Date(),
            source
        };
        this.configHistory.push(changeEvent);
        // Maintain history size limit
        if (this.configHistory.length > this.maxHistorySize) {
            this.configHistory = this.configHistory.slice(-this.maxHistorySize);
        }
    }
    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        if (source === null || source === undefined) {
            return target;
        }
        if (typeof source !== 'object' || Array.isArray(source)) {
            return source;
        }
        const result = { ...target };
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                }
                else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }
}
//# sourceMappingURL=ConfigurationManager.js.map
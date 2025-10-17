import { EventEmitter } from 'events';
import { ThreadManagerConfig } from './types.js';
import { HealthMonitorConfig } from './HealthMonitor.js';
import { RestartManagerConfig } from './RestartManager.js';
import { ErrorHandlerConfig } from './ErrorHandler.js';
import { MessageQueueConfig } from './MessageQueue.js';
/**
 * Complete threading system configuration
 */
export interface ThreadingSystemConfig {
    threadManager: ThreadManagerConfig;
    healthMonitor: HealthMonitorConfig;
    restartManager: RestartManagerConfig;
    errorHandler: ErrorHandlerConfig;
    messageQueue: MessageQueueConfig;
    worker: WorkerConfig;
}
/**
 * Worker-specific configuration
 */
export interface WorkerConfig {
    maxMemoryMB: number;
    gcInterval: number;
    enableProfiling: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    moduleConfig: {
        modbus: ModbusWorkerConfig;
        database: DatabaseWorkerConfig;
    };
}
/**
 * Modbus configuration for worker
 */
export interface ModbusWorkerConfig {
    host: string;
    port: number;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    unitId: number;
    registers: {
        start: number;
        count: number;
        interval: number;
    };
}
/**
 * Database configuration for worker
 */
export interface DatabaseWorkerConfig {
    connectionString: string;
    poolSize: number;
    timeout: number;
    retryAttempts: number;
    batchSize: number;
    flushInterval: number;
}
/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
    section: keyof ThreadingSystemConfig;
    oldValue: any;
    newValue: any;
    timestamp: Date;
    source: 'api' | 'file' | 'environment' | 'default';
}
/**
 * ConfigurationManager handles dynamic configuration updates for the threading system
 */
export declare class ConfigurationManager extends EventEmitter {
    private config;
    private configHistory;
    private maxHistorySize;
    private configValidators;
    constructor(initialConfig?: Partial<ThreadingSystemConfig>);
    /**
     * Get current configuration
     */
    getConfig(): ThreadingSystemConfig;
    /**
     * Get configuration for specific section
     */
    getSectionConfig<K extends keyof ThreadingSystemConfig>(section: K): ThreadingSystemConfig[K];
    /**
     * Update entire configuration
     */
    updateConfig(newConfig: Partial<ThreadingSystemConfig>, source?: 'api' | 'file' | 'environment' | 'default'): ConfigValidationResult;
    /**
     * Update specific configuration section
     */
    updateSectionConfig<K extends keyof ThreadingSystemConfig>(section: K, sectionConfig: Partial<ThreadingSystemConfig[K]>, source?: 'api' | 'file' | 'environment' | 'default'): ConfigValidationResult;
    /**
     * Validate configuration
     */
    validateConfig(config: Partial<ThreadingSystemConfig>): ConfigValidationResult;
    /**
     * Reset configuration to defaults
     */
    resetToDefaults(): void;
    /**
     * Get configuration change history
     */
    getConfigHistory(): ConfigChangeEvent[];
    /**
     * Clear configuration history
     */
    clearConfigHistory(): void;
    /**
     * Export configuration to JSON
     */
    exportConfig(): string;
    /**
     * Import configuration from JSON
     */
    importConfig(configJson: string, source?: 'api' | 'file'): ConfigValidationResult;
    /**
     * Get default configuration
     */
    private getDefaultConfig;
    /**
     * Setup configuration validators
     */
    private setupValidators;
    /**
     * Record configuration change in history
     */
    private recordConfigChange;
    /**
     * Deep merge two objects
     */
    private deepMerge;
}
//# sourceMappingURL=ConfigurationManager.d.ts.map
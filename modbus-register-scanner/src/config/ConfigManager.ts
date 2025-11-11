import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration for Modbus scanning
 */
export interface ModbusScanConfig {
  // Connection settings
  connection: {
    host?: string;
    port?: number;
    slaveId?: number;
    timeout?: number;
    retries?: number;
  };

  // Scanning parameters
  scanning: {
    startAddress?: number;
    endAddress?: number;
    functionCodes?: number[];
    batchSize?: number;
    enableBatching?: boolean;
    enableStreaming?: boolean;
    streamingThreshold?: number;
  };

  // Performance optimization
  performance: {
    enableMemoryOptimization?: boolean;
    enableNetworkOptimization?: boolean;
    maxMemoryUsage?: number;
    requestDelay?: number;
    maxConcurrentRequests?: number;
    adaptiveDelay?: boolean;
  };

  // Export settings
  export: {
    format?: 'csv' | 'json' | 'both';
    outputPath?: string;
    includeTimestamp?: boolean;
    includeInaccessibleRegisters?: boolean;
  };

  // Advanced options
  advanced: {
    enableAutoSave?: boolean;
    autoSaveInterval?: number;
    enableProgressReporting?: boolean;
    progressInterval?: number;
    enableErrorLogging?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<ModbusScanConfig> = {
  connection: {
    host: '10.10.10.11',
    port: 502,
    slaveId: 1,
    timeout: 5000,
    retries: 3
  },
  scanning: {
    startAddress: 0,
    endAddress: 65535,
    functionCodes: [1, 2, 3, 4],
    batchSize: 125,
    enableBatching: true,
    enableStreaming: false,
    streamingThreshold: 10000
  },
  performance: {
    enableMemoryOptimization: true,
    enableNetworkOptimization: true,
    maxMemoryUsage: 500 * 1024 * 1024, // 500MB
    requestDelay: 10,
    maxConcurrentRequests: 1,
    adaptiveDelay: true
  },
  export: {
    format: 'both',
    outputPath: './scan-results',
    includeTimestamp: true,
    includeInaccessibleRegisters: false
  },
  advanced: {
    enableAutoSave: true,
    autoSaveInterval: 30000,
    enableProgressReporting: true,
    progressInterval: 1000,
    enableErrorLogging: true,
    logLevel: 'info'
  }
};

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * ConfigManager handles loading, saving, and validating configuration files
 */
export class ConfigManager {
  private config: Required<ModbusScanConfig>;
  private configPath?: string;

  constructor(configPath?: string) {
    this.config = { ...DEFAULT_CONFIG };
    this.configPath = configPath;
  }

  /**
   * Load configuration from file
   */
  public async loadConfig(filePath?: string): Promise<void> {
    const configFile = filePath || this.configPath;
    
    if (!configFile) {
      throw new Error('No configuration file path provided');
    }

    if (!fs.existsSync(configFile)) {
      throw new Error(`Configuration file not found: ${configFile}`);
    }

    try {
      const configData = fs.readFileSync(configFile, 'utf8');
      let parsedConfig: Partial<ModbusScanConfig>;

      // Support both JSON and YAML formats
      if (configFile.endsWith('.json')) {
        parsedConfig = JSON.parse(configData);
      } else if (configFile.endsWith('.yaml') || configFile.endsWith('.yml')) {
        // For YAML support, we'd need to add a YAML parser dependency
        // For now, just support JSON
        throw new Error('YAML configuration files are not yet supported. Please use JSON format.');
      } else {
        // Try to parse as JSON by default
        parsedConfig = JSON.parse(configData);
      }

      // Merge with defaults
      this.config = this.mergeWithDefaults(parsedConfig);
      this.configPath = configFile;

      // Validate the loaded configuration
      const validation = this.validateConfig();
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('Configuration warnings:', validation.warnings.join(', '));
      }

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in configuration file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Save current configuration to file
   */
  public async saveConfig(filePath?: string): Promise<void> {
    const configFile = filePath || this.configPath;
    
    if (!configFile) {
      throw new Error('No configuration file path provided');
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(configFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write configuration as formatted JSON
      const configData = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(configFile, configData, 'utf8');
      
      this.configPath = configFile;
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a default configuration file
   */
  public async createDefaultConfig(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      throw new Error(`Configuration file already exists: ${filePath}`);
    }

    this.config = { ...DEFAULT_CONFIG };
    await this.saveConfig(filePath);
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<ModbusScanConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<ModbusScanConfig>): void {
    this.config = this.mergeWithDefaults(updates, this.config);
    
    // Validate updated configuration
    const validation = this.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Invalid configuration update: ${validation.errors.join(', ')}`);
    }
  }

  /**
   * Get configuration for a specific section
   */
  public getConnectionConfig() {
    return { ...this.config.connection };
  }

  public getScanningConfig() {
    return { ...this.config.scanning };
  }

  public getPerformanceConfig() {
    return { ...this.config.performance };
  }

  public getExportConfig() {
    return { ...this.config.export };
  }

  public getAdvancedConfig() {
    return { ...this.config.advanced };
  }

  /**
   * Validate current configuration
   */
  public validateConfig(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get merged config with all defaults filled in
    const fullConfig = this.mergeWithDefaults({}, this.config) as Required<ModbusScanConfig>;

    // Validate connection settings
    if (fullConfig.connection.port! < 1 || fullConfig.connection.port! > 65535) {
      errors.push('Port must be between 1 and 65535');
    }

    if (fullConfig.connection.slaveId! < 1 || fullConfig.connection.slaveId! > 247) {
      errors.push('Slave ID must be between 1 and 247');
    }

    if (fullConfig.connection.timeout! < 1000) {
      warnings.push('Timeout less than 1000ms may cause connection issues');
    }

    if (fullConfig.connection.retries! < 0 || fullConfig.connection.retries! > 10) {
      errors.push('Retries must be between 0 and 10');
    }

    // Validate scanning settings
    if (fullConfig.scanning.startAddress! < 0 || fullConfig.scanning.startAddress! > 65535) {
      errors.push('Start address must be between 0 and 65535');
    }

    if (fullConfig.scanning.endAddress! < 0 || fullConfig.scanning.endAddress! > 65535) {
      errors.push('End address must be between 0 and 65535');
    }

    if (fullConfig.scanning.startAddress! > fullConfig.scanning.endAddress!) {
      errors.push('Start address must be less than or equal to end address');
    }

    if (fullConfig.scanning.batchSize! < 1 || fullConfig.scanning.batchSize! > 125) {
      errors.push('Batch size must be between 1 and 125');
    }

    const validFunctionCodes = [1, 2, 3, 4];
    for (const fc of fullConfig.scanning.functionCodes!) {
      if (!validFunctionCodes.includes(fc)) {
        errors.push(`Invalid function code: ${fc}. Must be 1, 2, 3, or 4`);
      }
    }

    if (fullConfig.scanning.functionCodes!.length === 0) {
      errors.push('At least one function code must be specified');
    }

    // Validate performance settings
    if (fullConfig.performance.maxMemoryUsage! < 50 * 1024 * 1024) { // 50MB minimum
      warnings.push('Maximum memory usage is very low and may impact performance');
    }

    if (fullConfig.performance.requestDelay! < 0) {
      errors.push('Request delay cannot be negative');
    }

    if (fullConfig.performance.maxConcurrentRequests! < 1 || fullConfig.performance.maxConcurrentRequests! > 10) {
      warnings.push('Max concurrent requests should typically be between 1 and 10 for Modbus devices');
    }

    // Validate export settings
    const validFormats = ['csv', 'json', 'both'] as const;
    if (!validFormats.includes(fullConfig.export.format! as any)) {
      errors.push(`Invalid export format: ${fullConfig.export.format}. Must be csv, json, or both`);
    }

    // Validate advanced settings
    if (fullConfig.advanced.autoSaveInterval! < 5000) {
      warnings.push('Auto-save interval less than 5 seconds may impact performance');
    }

    if (fullConfig.advanced.progressInterval! < 100) {
      warnings.push('Progress interval less than 100ms may impact performance');
    }

    const validLogLevels = ['error', 'warn', 'info', 'debug'] as const;
    if (!validLogLevels.includes(fullConfig.advanced.logLevel! as any)) {
      errors.push(`Invalid log level: ${fullConfig.advanced.logLevel}. Must be error, warn, info, or debug`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration schema for documentation
   */
  public getConfigSchema(): any {
    return {
      type: 'object',
      properties: {
        connection: {
          type: 'object',
          properties: {
            host: { type: 'string', description: 'Target Modbus device IP address' },
            port: { type: 'number', minimum: 1, maximum: 65535, description: 'TCP port number' },
            slaveId: { type: 'number', minimum: 1, maximum: 247, description: 'Modbus slave ID' },
            timeout: { type: 'number', minimum: 1000, description: 'Request timeout in milliseconds' },
            retries: { type: 'number', minimum: 0, maximum: 10, description: 'Maximum retry attempts' }
          }
        },
        scanning: {
          type: 'object',
          properties: {
            startAddress: { type: 'number', minimum: 0, maximum: 65535, description: 'Starting register address' },
            endAddress: { type: 'number', minimum: 0, maximum: 65535, description: 'Ending register address' },
            functionCodes: { type: 'array', items: { type: 'number', enum: [1, 2, 3, 4] }, description: 'Modbus function codes to scan' },
            batchSize: { type: 'number', minimum: 1, maximum: 125, description: 'Maximum registers per batch' },
            enableBatching: { type: 'boolean', description: 'Enable batch optimization' },
            enableStreaming: { type: 'boolean', description: 'Enable streaming for large scans' },
            streamingThreshold: { type: 'number', minimum: 1000, description: 'Register count threshold for streaming' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            enableMemoryOptimization: { type: 'boolean', description: 'Enable memory optimization' },
            enableNetworkOptimization: { type: 'boolean', description: 'Enable network optimization' },
            maxMemoryUsage: { type: 'number', minimum: 50000000, description: 'Maximum memory usage in bytes' },
            requestDelay: { type: 'number', minimum: 0, description: 'Delay between requests in milliseconds' },
            maxConcurrentRequests: { type: 'number', minimum: 1, maximum: 10, description: 'Maximum concurrent requests' },
            adaptiveDelay: { type: 'boolean', description: 'Enable adaptive request delay' }
          }
        },
        export: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['csv', 'json', 'both'], description: 'Export format' },
            outputPath: { type: 'string', description: 'Output file path (without extension)' },
            includeTimestamp: { type: 'boolean', description: 'Include timestamp in filename' },
            includeInaccessibleRegisters: { type: 'boolean', description: 'Include inaccessible registers in export' }
          }
        },
        advanced: {
          type: 'object',
          properties: {
            enableAutoSave: { type: 'boolean', description: 'Enable automatic state saving' },
            autoSaveInterval: { type: 'number', minimum: 5000, description: 'Auto-save interval in milliseconds' },
            enableProgressReporting: { type: 'boolean', description: 'Enable progress reporting' },
            progressInterval: { type: 'number', minimum: 100, description: 'Progress update interval in milliseconds' },
            enableErrorLogging: { type: 'boolean', description: 'Enable error logging' },
            logLevel: { type: 'string', enum: ['error', 'warn', 'info', 'debug'], description: 'Logging level' }
          }
        }
      }
    };
  }

  /**
   * Merge partial configuration with defaults
   */
  private mergeWithDefaults(
    partial: Partial<ModbusScanConfig>, 
    base: Required<ModbusScanConfig> = DEFAULT_CONFIG
  ): Required<ModbusScanConfig> {
    return {
      connection: { ...base.connection, ...partial.connection },
      scanning: { ...base.scanning, ...partial.scanning },
      performance: { ...base.performance, ...partial.performance },
      export: { ...base.export, ...partial.export },
      advanced: { ...base.advanced, ...partial.advanced }
    };
  }

  /**
   * Get default configuration
   */
  public static getDefaultConfig(): Required<ModbusScanConfig> {
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Create example configuration file content
   */
  public static createExampleConfig(): string {
    const exampleConfig = {
      connection: {
        host: "192.168.1.100",
        port: 502,
        slaveId: 1,
        timeout: 5000,
        retries: 3
      },
      scanning: {
        startAddress: 0,
        endAddress: 1000,
        functionCodes: [3, 4],
        batchSize: 50,
        enableBatching: true,
        enableStreaming: false,
        streamingThreshold: 10000
      },
      performance: {
        enableMemoryOptimization: true,
        enableNetworkOptimization: true,
        maxMemoryUsage: 268435456,
        requestDelay: 10,
        maxConcurrentRequests: 1,
        adaptiveDelay: true
      },
      export: {
        format: "both",
        outputPath: "./scan-results",
        includeTimestamp: true,
        includeInaccessibleRegisters: false
      },
      advanced: {
        enableAutoSave: true,
        autoSaveInterval: 30000,
        enableProgressReporting: true,
        progressInterval: 1000,
        enableErrorLogging: true,
        logLevel: "info"
      }
    };

    return JSON.stringify(exampleConfig, null, 2);
  }
}
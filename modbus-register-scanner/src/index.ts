#!/usr/bin/env node

import { Command } from 'commander';
import { ScanConfig } from './types';
import { ExportFormat } from './export';
import { ConfigManager, ModbusScanConfig } from './config';

// Export all components for library usage
export * from './types';
export * from './connection';
export * from './reader';
export * from './optimizer';
export * from './scanner';
export * from './export';
export { ProgressReporter, ErrorLogger } from './reporter';

const program = new Command();

program
  .name('modbus-scanner')
  .description('Scan Modbus TCP devices to discover available registers')
  .version('1.0.0');

// Add configuration file commands
program
  .command('init-config')
  .description('Create a default configuration file')
  .option('-f, --file <path>', 'Configuration file path', './modbus-scanner.config.json')
  .option('--force', 'Overwrite existing configuration file')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager();
      
      if (require('fs').existsSync(options.file) && !options.force) {
        console.error(`Configuration file already exists: ${options.file}`);
        console.log('Use --force to overwrite the existing file');
        process.exit(1);
      }

      if (options.force && require('fs').existsSync(options.file)) {
        require('fs').unlinkSync(options.file);
      }

      await configManager.createDefaultConfig(options.file);
      console.log(`✅ Default configuration created: ${options.file}`);
      console.log('Edit the file to customize your scanning parameters');
    } catch (error) {
      console.error('❌ Failed to create configuration:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('validate-config')
  .description('Validate a configuration file')
  .option('-f, --file <path>', 'Configuration file path', './modbus-scanner.config.json')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager();
      await configManager.loadConfig(options.file);
      
      const validation = configManager.validateConfig();
      
      if (validation.isValid) {
        console.log('✅ Configuration is valid');
        if (validation.warnings.length > 0) {
          console.log('\n⚠️  Warnings:');
          validation.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
      } else {
        console.log('❌ Configuration is invalid');
        console.log('\nErrors:');
        validation.errors.forEach(error => console.log(`  - ${error}`));
        
        if (validation.warnings.length > 0) {
          console.log('\nWarnings:');
          validation.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to validate configuration:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('show-config')
  .description('Display current configuration')
  .option('-f, --file <path>', 'Configuration file path', './modbus-scanner.config.json')
  .option('--schema', 'Show configuration schema instead of values')
  .action(async (options) => {
    try {
      const configManager = new ConfigManager();
      
      if (options.schema) {
        console.log('Configuration Schema:');
        console.log('===================');
        console.log(JSON.stringify(configManager.getConfigSchema(), null, 2));
      } else {
        await configManager.loadConfig(options.file);
        const config = configManager.getConfig();
        
        console.log('Current Configuration:');
        console.log('=====================');
        console.log(JSON.stringify(config, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to show configuration:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('example-config')
  .description('Generate an example configuration file')
  .action(() => {
    console.log('Example Configuration:');
    console.log('=====================');
    console.log(ConfigManager.createExampleConfig());
  });

// Add examples to help text
program.addHelpText('after', `
Examples:
  Basic scanning:
    $ modbus-scanner scan --host 10.10.10.11
    $ modbus-scanner scan --host 10.10.10.11 --port 502 --slave-id 1

  Using configuration files:
    $ modbus-scanner init-config --file my-config.json
    $ modbus-scanner scan --config my-config.json
    $ modbus-scanner validate-config --file my-config.json

  Advanced scanning options:
    $ modbus-scanner scan --host 10.10.10.11 --enable-streaming --streaming-threshold 5000
    $ modbus-scanner scan --host 10.10.10.11 --no-memory-optimization --max-memory 1000
    $ modbus-scanner scan --host 10.10.10.11 --request-delay 50 --log-level debug

  Range and format options:
    $ modbus-scanner scan --host 10.10.10.11 --start-address 1000 --end-address 2000
    $ modbus-scanner scan --host 10.10.10.11 --function-codes 3,4 --format csv
    $ modbus-scanner scan --host 10.10.10.11 --no-batching --output custom-results

  State management:
    $ modbus-scanner scan --host 10.10.10.11 --resume
    $ modbus-scanner scan --state-info
    $ modbus-scanner scan --clear-state

Configuration commands:
  $ modbus-scanner init-config                    # Create default config
  $ modbus-scanner validate-config               # Validate config file
  $ modbus-scanner show-config                   # Display current config
  $ modbus-scanner example-config                # Show example config
`);

// Main scan command
program
  .command('scan', { isDefault: true })
  .description('Scan Modbus TCP device for available registers')
  .option('-c, --config <file>', 'Configuration file path')
  .option('-h, --host <ip>', 'Target Modbus device IP address')
  .option('-p, --port <number>', 'TCP port number (default: 502)')
  .option('-s, --slave-id <number>', 'Modbus slave ID 1-247 (default: 1)')
  .option('-t, --timeout <number>', 'Request timeout in milliseconds (default: 5000)')
  .option('-r, --retries <number>', 'Maximum retry attempts (default: 3)')
  .option('-b, --batch-size <number>', 'Maximum registers per batch read (default: 125)')
  .option('-o, --output <file>', 'Output file path without extension')
  .option('-f, --format <type>', 'Export format: csv, json, or both (default: both)')
  .option('--start-address <number>', 'Starting register address (default: 0)')
  .option('--end-address <number>', 'Ending register address (default: 65535)')
  .option('--function-codes <codes>', 'Comma-separated function codes to scan: 1,2,3,4 (default: 1,2,3,4)')
  .option('--smart-scan', 'Use smart scanning mode focusing on common industrial register ranges')
  .option('--no-batching', 'Disable batch optimization (scan registers individually)')
  .option('--enable-streaming', 'Enable streaming mode for large scans')
  .option('--streaming-threshold <number>', 'Register count threshold for streaming (default: 10000)')
  .option('--no-memory-optimization', 'Disable memory optimization')
  .option('--no-network-optimization', 'Disable network optimization')
  .option('--request-delay <number>', 'Delay between requests in milliseconds (default: 10)')
  .option('--max-memory <number>', 'Maximum memory usage in MB (default: 500)')
  .option('--resume', 'Resume from previously saved scan state if available')
  .option('--clear-state', 'Clear any saved scan state and start fresh')
  .option('--state-info', 'Show information about saved scan state and exit')
  .option('--no-auto-save', 'Disable automatic state saving')
  .option('--auto-save-interval <number>', 'Auto-save interval in seconds (default: 30)')
  .option('--log-level <level>', 'Logging level: error, warn, info, debug (default: info)')
  .option('--progress-interval <number>', 'Progress update interval in milliseconds (default: 1000)')
  .action(async (options) => {
    try {
      // Handle state information request
      if (options.stateInfo) {
        await handleStateInfo();
        return;
      }

      // Handle clear state request
      if (options.clearState) {
        await handleClearState();
        return;
      }

      // Load configuration from file if provided
      let configManager: ConfigManager | undefined;
      let fileConfig: ModbusScanConfig | undefined;

      if (options.config) {
        configManager = new ConfigManager();
        await configManager.loadConfig(options.config);
        fileConfig = configManager.getConfig();
        console.log(`📁 Loaded configuration from: ${options.config}`);
      }

      // Merge CLI options with file configuration (CLI options take precedence)
      const config: ScanConfig = {
        host: options.host || fileConfig?.connection.host || '10.10.10.11',
        port: parseInt(options.port || fileConfig?.connection.port?.toString() || '502'),
        slaveId: parseInt(options.slaveId || fileConfig?.connection.slaveId?.toString() || '1'),
        timeout: parseInt(options.timeout || fileConfig?.connection.timeout?.toString() || '5000'),
        retries: parseInt(options.retries || fileConfig?.connection.retries?.toString() || '3'),
        batchSize: parseInt(options.batchSize || fileConfig?.scanning.batchSize?.toString() || '125')
      };

      // Parse additional scan options with config file fallbacks
      const smartScan = options.smartScan || false;
      let startAddress = parseInt(options.startAddress || fileConfig?.scanning.startAddress?.toString() || '0');
      let endAddress = parseInt(options.endAddress || fileConfig?.scanning.endAddress?.toString() || '65535');
      
      // Apply smart scanning ranges if enabled
      if (smartScan && !options.startAddress && !options.endAddress) {
        // Focus on common industrial device register ranges
        startAddress = 0;
        endAddress = 9999; // Most industrial devices use registers 0-9999
        console.log('🧠 Smart scan mode enabled - focusing on common industrial register ranges (0-9999)');
      }
      const functionCodes = options.functionCodes 
        ? options.functionCodes.split(',').map((fc: string) => parseInt(fc.trim()))
        : fileConfig?.scanning.functionCodes || [1, 2, 3, 4];
      const enableBatching = options.noBatching ? false : (fileConfig?.scanning.enableBatching ?? true);
      const enableStreaming = options.enableStreaming || (fileConfig?.scanning.enableStreaming ?? false);
      const streamingThreshold = parseInt(options.streamingThreshold || fileConfig?.scanning.streamingThreshold?.toString() || '10000');
      const enableMemoryOptimization = options.noMemoryOptimization ? false : (fileConfig?.performance.enableMemoryOptimization ?? true);
      const enableNetworkOptimization = options.noNetworkOptimization ? false : (fileConfig?.performance.enableNetworkOptimization ?? true);
      const requestDelay = parseInt(options.requestDelay || fileConfig?.performance.requestDelay?.toString() || '10');
      const maxMemoryMB = parseInt(options.maxMemory || (fileConfig?.performance.maxMemoryUsage ? (fileConfig.performance.maxMemoryUsage / (1024 * 1024)).toString() : '500'));
      const outputFile = options.output || fileConfig?.export.outputPath || 'modbus-scan-results';
      const exportFormat = (options.format || fileConfig?.export.format || 'both').toLowerCase();
      const enableAutoSave = options.noAutoSave ? false : (fileConfig?.advanced.enableAutoSave ?? true);
      const autoSaveInterval = parseInt(options.autoSaveInterval || (fileConfig?.advanced.autoSaveInterval ? (fileConfig.advanced.autoSaveInterval / 1000).toString() : '30')) * 1000;
      const logLevel = options.logLevel || fileConfig?.advanced.logLevel || 'info';
      const progressInterval = parseInt(options.progressInterval || fileConfig?.advanced.progressInterval?.toString() || '1000');

      // Validate configuration
      validateConfig(config);
      validateScanOptions(startAddress, endAddress, functionCodes);
      validateExportOptions(exportFormat);
      validateAdvancedOptions(requestDelay, maxMemoryMB, autoSaveInterval, logLevel, progressInterval);

      console.log('Modbus Register Scanner');
      console.log('======================');
      console.log(`Target: ${config.host}:${config.port}`);
      console.log(`Slave ID: ${config.slaveId}`);
      console.log(`Timeout: ${config.timeout}ms`);
      console.log(`Retries: ${config.retries}`);
      console.log(`Batch Size: ${config.batchSize}`);
      console.log(`Address Range: ${startAddress} - ${endAddress}`);
      console.log(`Function Codes: ${functionCodes.join(', ')}`);
      console.log(`Smart Scan: ${smartScan ? 'Enabled (optimized for industrial devices)' : 'Disabled'}`);
      console.log(`Batching: ${enableBatching ? 'Enabled' : 'Disabled'}`);
      console.log(`Streaming: ${enableStreaming ? 'Enabled' : 'Disabled'} (threshold: ${streamingThreshold.toLocaleString()})`);
      console.log(`Memory Optimization: ${enableMemoryOptimization ? 'Enabled' : 'Disabled'} (max: ${maxMemoryMB}MB)`);
      console.log(`Network Optimization: ${enableNetworkOptimization ? 'Enabled' : 'Disabled'} (delay: ${requestDelay}ms)`);
      console.log(`Auto-save: ${enableAutoSave ? 'Enabled' : 'Disabled'} (interval: ${autoSaveInterval / 1000}s)`);
      console.log(`Export Format: ${exportFormat}`);
      console.log(`Output File: ${outputFile}`);
      console.log(`Log Level: ${logLevel}`);
      if (options.config) {
        console.log(`Configuration: ${options.config}`);
      }
      console.log('');

      // Store options for main application flow
      const appOptions = {
        config,
        startAddress,
        endAddress,
        functionCodes,
        enableBatching,
        enableStreaming,
        streamingThreshold,
        enableMemoryOptimization,
        enableNetworkOptimization,
        requestDelay,
        maxMemoryUsage: maxMemoryMB * 1024 * 1024, // Convert MB to bytes
        outputFile,
        exportFormat,
        enableAutoSave,
        autoSaveInterval,
        logLevel,
        progressInterval,
        resume: options.resume
      };

      // Execute main application flow
      await runScannerApplication(appOptions);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

/**
 * Validate scan configuration
 */
function validateConfig(config: ScanConfig): void {
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }

  if (config.slaveId < 1 || config.slaveId > 247) {
    throw new Error('Slave ID must be between 1 and 247');
  }

  if (config.timeout < 1000) {
    throw new Error('Timeout must be at least 1000ms');
  }

  if (config.batchSize < 1 || config.batchSize > 125) {
    throw new Error('Batch size must be between 1 and 125');
  }

  // Validate IP address format
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (!ipRegex.test(config.host)) {
    throw new Error('Invalid IP address format');
  }
}

/**
 * Validate scan options
 */
function validateScanOptions(startAddress: number, endAddress: number, functionCodes: number[]): void {
  if (startAddress < 0 || startAddress > 65535) {
    throw new Error('Start address must be between 0 and 65535');
  }

  if (endAddress < 0 || endAddress > 65535) {
    throw new Error('End address must be between 0 and 65535');
  }

  if (startAddress > endAddress) {
    throw new Error('Start address must be less than or equal to end address');
  }

  const validFunctionCodes = [1, 2, 3, 4];
  for (const fc of functionCodes) {
    if (!validFunctionCodes.includes(fc)) {
      throw new Error(`Invalid function code: ${fc}. Must be 1, 2, 3, or 4`);
    }
  }

  if (functionCodes.length === 0) {
    throw new Error('At least one function code must be specified');
  }
}

/**
 * Validate export options
 */
function validateExportOptions(format: string): void {
  const validFormats = ['csv', 'json', 'both'];
  if (!validFormats.includes(format)) {
    throw new Error(`Invalid export format: ${format}. Must be csv, json, or both`);
  }
}

/**
 * Validate advanced options
 */
function validateAdvancedOptions(
  requestDelay: number,
  maxMemoryMB: number,
  autoSaveInterval: number,
  logLevel: string,
  progressInterval: number
): void {
  if (requestDelay < 0) {
    throw new Error('Request delay cannot be negative');
  }

  if (maxMemoryMB < 50) {
    throw new Error('Maximum memory usage must be at least 50MB');
  }

  if (autoSaveInterval < 5000) {
    throw new Error('Auto-save interval must be at least 5 seconds');
  }

  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`Invalid log level: ${logLevel}. Must be error, warn, info, or debug`);
  }

  if (progressInterval < 100) {
    throw new Error('Progress interval must be at least 100ms');
  }
}

/**
 * Main application interface options
 */
interface ApplicationOptions {
  config: ScanConfig;
  startAddress: number;
  endAddress: number;
  functionCodes: number[];
  enableBatching: boolean;
  enableStreaming: boolean;
  streamingThreshold: number;
  enableMemoryOptimization: boolean;
  enableNetworkOptimization: boolean;
  requestDelay: number;
  maxMemoryUsage: number;
  outputFile: string;
  exportFormat: string;
  enableAutoSave: boolean;
  autoSaveInterval: number;
  logLevel: string;
  progressInterval: number;
  resume: boolean;
}

/**
 * Main scanner application flow
 */
async function runScannerApplication(options: ApplicationOptions): Promise<void> {
  // Import components (dynamic imports to avoid circular dependencies)
  const { ConnectionManager } = await import('./connection/ConnectionManager');
  const { RegisterReader } = await import('./reader/RegisterReader');
  const { BatchOptimizer } = await import('./optimizer/BatchOptimizer');
  const { ScannerEngine } = await import('./scanner/ScannerEngine');
  const { ProgressReporter } = await import('./reporter/ProgressReporter');
  const { ErrorLogger } = await import('./reporter/ErrorLogger');
  const { ExportManager, ExportFormat } = await import('./export/ExportManager');

  // Initialize components
  const connectionManager = new ConnectionManager(options.config);
  
  // Connect first to get the client
  await connectionManager.connect();
  const registerReader = new RegisterReader(connectionManager.getClient(), options.config.slaveId);
  const batchOptimizer = new BatchOptimizer(registerReader);
  const errorLogger = new ErrorLogger(true);
  
  // Calculate total registers to scan for progress reporting
  const totalAddresses = options.endAddress - options.startAddress + 1;
  const totalRegisters = totalAddresses * options.functionCodes.length;
  const progressReporter = new ProgressReporter(totalRegisters);

  // Initialize scanner engine with callbacks
  const scannerEngine = new ScannerEngine(
    connectionManager,
    registerReader,
    batchOptimizer,
    options.config,
    {
      startAddress: options.startAddress,
      endAddress: options.endAddress,
      functionCodes: options.functionCodes,
      enableBatching: options.enableBatching,
      enableStreaming: options.enableStreaming,
      enableMemoryOptimization: options.enableMemoryOptimization,
      enableNetworkOptimization: options.enableNetworkOptimization,
      streamingThreshold: options.streamingThreshold,
      progressCallback: (progress) => {
        progressReporter.updateProgress(progress.currentAddress, progress.currentFunctionCode);
      },
      registerDiscoveredCallback: (register) => {
        progressReporter.reportDiscoveredRegister(register);
      },
      errorCallback: (error) => {
        errorLogger.logGenericError(error, 'unknown', 'medium');
      }
    }
  );

  try {
    // Check if we should resume from saved state
    if (options.resume) {
      const canResume = await scannerEngine.canResumeScan();
      if (canResume) {
        const stateInfo = await scannerEngine.getSavedStateInfo();
        console.log(`Found saved scan state from ${stateInfo.lastSaved}`);
        console.log(`Progress: ${stateInfo.progress}% (${stateInfo.discoveredRegisters} registers found)`);
        console.log('Resuming scan...\n');
        
        // Resume from saved state
        const results = await scannerEngine.resumeFromSavedState();
        await handleScanResults(results, options, progressReporter, errorLogger);
        return;
      } else {
        console.log('No saved scan state found. Starting fresh scan...\n');
      }
    }

    // Start fresh scan
    progressReporter.startScan({
      host: options.config.host,
      port: options.config.port,
      slaveId: options.config.slaveId
    });

    // Enable auto-save if configured
    if (options.enableAutoSave) {
      scannerEngine.enableAutoSave(options.autoSaveInterval);
    }

    // Start the scan
    const results = await scannerEngine.startScan();
    
    // Handle scan completion
    await handleScanResults(results, options, progressReporter, errorLogger);

  } catch (error) {
    console.error('\n❌ Scan failed:', error instanceof Error ? error.message : 'Unknown error');
    
    // Log the error
    errorLogger.logGenericError(
      error instanceof Error ? error.message : 'Unknown scan error',
      'unknown',
      'critical'
    );

    // Display error statistics
    const errorStats = errorLogger.getErrorStatistics();
    if (errorStats.totalErrors > 0) {
      console.log('\n📊 Error Summary:');
      console.log(`Total errors: ${errorStats.totalErrors}`);
      console.log(`Error rate: ${errorStats.errorRate.toFixed(2)} errors/minute`);
      console.log(`Most common: ${errorStats.mostCommonError.type} (${errorStats.mostCommonError.count} occurrences)`);
    }

    process.exit(1);
  } finally {
    // Cleanup
    scannerEngine.cleanup();
    await connectionManager.disconnect();
  }
}

/**
 * Handle scan results and export
 */
async function handleScanResults(
  results: any, // ScanResults type
  options: ApplicationOptions,
  progressReporter: any, // ProgressReporter type
  errorLogger: any // ErrorLogger type
): Promise<void> {
  // Complete progress reporting
  progressReporter.completeScan();

  // Display final statistics
  console.log('\n📊 Scan Statistics:');
  console.log(`Duration: ${((results.endTime.getTime() - results.startTime.getTime()) / 1000).toFixed(1)}s`);
  console.log(`Total registers scanned: ${results.totalRegisters.toLocaleString()}`);
  console.log(`Accessible registers found: ${results.accessibleRegisters.toLocaleString()}`);
  console.log(`Success rate: ${results.totalRegisters > 0 ? ((results.accessibleRegisters / results.totalRegisters) * 100).toFixed(2) : 0}%`);

  // Show error statistics if any errors occurred
  const errorStats = errorLogger.getErrorStatistics();
  if (errorStats.totalErrors > 0) {
    console.log(`\n⚠️  Errors encountered: ${errorStats.totalErrors}`);
    console.log(`Error rate: ${errorStats.errorRate.toFixed(2)} errors/minute`);
    console.log(`Most common error: ${errorStats.mostCommonError.type}`);
  }

  // Export results
  if (results.accessibleRegisters > 0) {
    console.log('\n💾 Exporting results...');
    await exportScanResults(results, options);
  } else {
    console.log('\n⚠️  No accessible registers found. Skipping export.');
  }

  // Generate error report if there were significant errors
  if (errorStats.totalErrors > 10) {
    console.log('\n📋 Generating error report...');
    const errorReport = errorLogger.generateErrorReport();
    const errorReportPath = `${options.outputFile}_error_report.txt`;
    require('fs').writeFileSync(errorReportPath, errorReport);
    console.log(`Error report saved to: ${errorReportPath}`);
  }
}

/**
 * Export scan results in the specified format(s)
 */
async function exportScanResults(results: any, options: ApplicationOptions): Promise<void> {
  const { ExportManager, ExportFormat } = await import('./export/ExportManager');
  const exportManager = new ExportManager();

  try {
    const formats = options.exportFormat === 'both' ? ['csv', 'json'] : [options.exportFormat];
    
    for (const format of formats) {
      const exportFormat = format === 'csv' ? ExportFormat.CSV : ExportFormat.JSON;
      const filePath = await exportManager.exportResults(results, {
        format: exportFormat,
        filename: options.outputFile,
        includeTimestamp: true
      });
      
      console.log(`✅ ${format.toUpperCase()} export saved to: ${filePath}`);
    }
  } catch (error) {
    console.error('❌ Export failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Handle state information request
 */
async function handleStateInfo(): Promise<void> {
  try {
    const { ScanStateManager } = await import('./scanner/ScanStateManager');
    const stateManager = new ScanStateManager();
    
    const hasSavedState = await stateManager.hasSavedState();
    if (!hasSavedState) {
      console.log('No saved scan state found.');
      return;
    }

    const stateInfo = await stateManager.getSavedStateInfo();
    console.log('Saved Scan State Information:');
    console.log('============================');
    console.log(`Last Saved: ${stateInfo.lastSaved}`);
    console.log(`Progress: ${stateInfo.progress}%`);
    console.log(`Version: ${stateInfo.version}`);
    console.log(`Total Registers: ${stateInfo.totalRegisters}`);
    console.log(`Discovered Registers: ${stateInfo.discoveredRegisters}`);
    console.log('\nUse --resume flag to continue this scan.');
  } catch (error) {
    console.error('Error getting state info:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Handle clear state request
 */
async function handleClearState(): Promise<void> {
  try {
    const { ScanStateManager } = await import('./scanner/ScanStateManager');
    const stateManager = new ScanStateManager();
    
    const hasSavedState = await stateManager.hasSavedState();
    if (!hasSavedState) {
      console.log('No saved scan state found to clear.');
      return;
    }

    await stateManager.clearSavedState();
    console.log('✅ Saved scan state cleared successfully.');
  } catch (error) {
    console.error('Error clearing state:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Global error handlers for graceful shutdown
let isShuttingDown = false;

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  if (!isShuttingDown) {
    console.error('\n❌ Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
    gracefulShutdown(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  if (!isShuttingDown) {
    console.error('\n❌ Uncaught Exception:', error);
    gracefulShutdown(1);
  }
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  if (!isShuttingDown) {
    console.log('\n\n🛑 Scan interrupted by user (Ctrl+C)');
    console.log('Saving current state for later resumption...');
    gracefulShutdown(0);
  }
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  if (!isShuttingDown) {
    console.log('\n\n🛑 Scan terminated');
    console.log('Saving current state for later resumption...');
    gracefulShutdown(0);
  }
});

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(exitCode: number): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    // Note: The ScannerEngine handles its own graceful shutdown via interruption handlers
    // This is just a fallback for any remaining cleanup
    console.log('Performing final cleanup...');
    
    // Give a moment for any ongoing operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (exitCode === 0) {
      console.log('✅ Shutdown complete. You can resume the scan later using --resume flag.');
    }
  } catch (error) {
    console.error('Error during shutdown:', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    process.exit(exitCode);
  }
}

program.parse();
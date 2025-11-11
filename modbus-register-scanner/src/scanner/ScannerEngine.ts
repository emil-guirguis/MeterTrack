import { RegisterInfo, ScanConfig, ScanResults } from '../types';
import { ConnectionManager } from '../connection/ConnectionManager';
import { RegisterReader } from '../reader/RegisterReader';
import { BatchOptimizer } from '../optimizer/BatchOptimizer';
import { ScanStateManager, PersistentScanState } from './ScanStateManager';
import { MemoryOptimizer, NetworkOptimizer, StreamingScanner } from '../performance';

/**
 * Scan state for tracking progress and enabling resumption
 */
export interface ScanState {
  currentAddress: number;
  currentFunctionCode: number;
  totalAddresses: number;
  totalFunctionCodes: number;
  scannedAddresses: number;
  discoveredRegisters: number;
  startTime: Date;
  lastUpdateTime: Date;
  isRunning: boolean;
  isPaused: boolean;
  errors: string[];
}

/**
 * Progress information for real-time updates
 */
export interface ScanProgress {
  currentAddress: number;
  currentFunctionCode: number;
  totalProgress: number; // Percentage (0-100)
  addressProgress: number; // Percentage for current function code
  scannedCount: number;
  discoveredCount: number;
  elapsedTime: number; // Milliseconds
  estimatedTimeRemaining: number; // Milliseconds
  scanRate: number; // Addresses per second
}

/**
 * Configuration for scan behavior
 */
export interface ScanOptions {
  startAddress?: number; // Default: 0
  endAddress?: number; // Default: 65535
  functionCodes?: number[]; // Default: [1, 2, 3, 4]
  enableBatching?: boolean; // Default: true
  enableStreaming?: boolean; // Default: false (for large scans)
  enableMemoryOptimization?: boolean; // Default: true
  enableNetworkOptimization?: boolean; // Default: true
  streamingThreshold?: number; // Default: 10000 (registers)
  progressCallback?: (progress: ScanProgress) => void;
  registerDiscoveredCallback?: (register: RegisterInfo) => void;
  errorCallback?: (error: string) => void;
  streamCallback?: (registers: RegisterInfo[]) => Promise<void>;
}

/**
 * ScannerEngine orchestrates the register discovery process across all function codes
 * and register addresses with progress tracking and state management
 */
export class ScannerEngine {
  private connectionManager: ConnectionManager;
  private registerReader: RegisterReader;
  private batchOptimizer: BatchOptimizer;
  private config: ScanConfig;
  private options: Required<ScanOptions>;
  private state: ScanState;
  private discoveredRegisters: RegisterInfo[] = [];
  private scanInterrupted = false;
  private progressUpdateInterval?: NodeJS.Timeout;
  private stateManager: ScanStateManager;
  private interruptionHandlers: Array<() => void> = [];
  private memoryOptimizer?: MemoryOptimizer;
  private networkOptimizer?: NetworkOptimizer;
  private streamingScanner?: StreamingScanner;

  constructor(
    connectionManager: ConnectionManager,
    registerReader: RegisterReader,
    batchOptimizer: BatchOptimizer,
    config: ScanConfig,
    options: ScanOptions = {},
    stateDirectory?: string
  ) {
    this.connectionManager = connectionManager;
    this.registerReader = registerReader;
    this.batchOptimizer = batchOptimizer;
    this.config = config;
    
    // Set default options
    this.options = {
      startAddress: options.startAddress ?? 0,
      endAddress: options.endAddress ?? 65535,
      functionCodes: options.functionCodes ?? [1, 2, 3, 4],
      enableBatching: options.enableBatching ?? true,
      enableStreaming: options.enableStreaming ?? false,
      enableMemoryOptimization: options.enableMemoryOptimization ?? true,
      enableNetworkOptimization: options.enableNetworkOptimization ?? true,
      streamingThreshold: options.streamingThreshold ?? 10000,
      progressCallback: options.progressCallback ?? (() => {}),
      registerDiscoveredCallback: options.registerDiscoveredCallback ?? (() => {}),
      errorCallback: options.errorCallback ?? (() => {}),
      streamCallback: options.streamCallback || (async () => {})
    };

    // Validate options
    this.validateOptions();

    // Initialize scan state
    this.state = this.createInitialState();

    // Initialize state manager
    this.stateManager = new ScanStateManager(stateDirectory);

    // Initialize performance optimizers
    this.initializeOptimizers();

    // Set up interruption handlers (Ctrl+C, etc.)
    this.setupInterruptionHandlers();
  }

  /**
   * Validate scan options
   */
  private validateOptions(): void {
    if (this.options.startAddress < 0 || this.options.startAddress > 65535) {
      throw new Error('Start address must be between 0 and 65535');
    }
    
    if (this.options.endAddress < 0 || this.options.endAddress > 65535) {
      throw new Error('End address must be between 0 and 65535');
    }
    
    if (this.options.startAddress > this.options.endAddress) {
      throw new Error('Start address must be less than or equal to end address');
    }
    
    const validFunctionCodes = [1, 2, 3, 4];
    for (const fc of this.options.functionCodes) {
      if (!validFunctionCodes.includes(fc)) {
        throw new Error(`Invalid function code: ${fc}. Must be 1, 2, 3, or 4`);
      }
    }
  }

  /**
   * Create initial scan state
   */
  private createInitialState(): ScanState {
    const totalAddresses = this.options.endAddress - this.options.startAddress + 1;
    const totalFunctionCodes = this.options.functionCodes.length;
    
    return {
      currentAddress: this.options.startAddress,
      currentFunctionCode: this.options.functionCodes[0],
      totalAddresses,
      totalFunctionCodes,
      scannedAddresses: 0,
      discoveredRegisters: 0,
      startTime: new Date(),
      lastUpdateTime: new Date(),
      isRunning: false,
      isPaused: false,
      errors: []
    };
  }

  /**
   * Initialize performance optimizers
   */
  private initializeOptimizers(): void {
    const totalRegisters = (this.options.endAddress - this.options.startAddress + 1) * this.options.functionCodes.length;
    
    // Initialize memory optimizer if enabled
    if (this.options.enableMemoryOptimization) {
      this.memoryOptimizer = new MemoryOptimizer({
        maxRegistersInMemory: Math.min(this.options.streamingThreshold, 10000),
        streamingThreshold: Math.min(this.options.streamingThreshold / 2, 5000),
        gcInterval: 30000,
        memoryCheckInterval: 5000
      });
    }

    // Initialize network optimizer if enabled
    if (this.options.enableNetworkOptimization) {
      this.networkOptimizer = new NetworkOptimizer({
        maxConcurrentRequests: 1, // Conservative for Modbus
        requestDelay: 10,
        adaptiveDelay: true,
        requestTimeout: this.config.timeout
      });
    }

    // Initialize streaming scanner for large scans
    if (this.options.enableStreaming || totalRegisters > this.options.streamingThreshold) {
      this.streamingScanner = new StreamingScanner(
        this.connectionManager,
        this.registerReader,
        this.batchOptimizer,
        this.config,
        {
          chunkSize: Math.min(1000, Math.floor(this.options.streamingThreshold / 10)),
          streamThreshold: this.options.streamingThreshold,
          maxMemoryUsage: 500 * 1024 * 1024, // 500MB
          enableNetworkOptimization: this.options.enableNetworkOptimization,
          enableMemoryOptimization: this.options.enableMemoryOptimization,
          progressInterval: 1000
        }
      );
    }
  }

  /**
   * Start the scanning process
   */
  public async startScan(): Promise<ScanResults> {
    if (this.state.isRunning) {
      throw new Error('Scan is already running');
    }

    // Ensure connection is established
    if (!this.connectionManager.isConnected()) {
      await this.connectionManager.connect();
    }

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.startTime = new Date();
    this.scanInterrupted = false;
    this.discoveredRegisters = [];

    const totalRegisters = (this.options.endAddress - this.options.startAddress + 1) * this.options.functionCodes.length;

    // Initialize optimizers
    if (this.memoryOptimizer) {
      this.memoryOptimizer.initialize(this.options.streamCallback);
    }

    // Start progress reporting
    this.startProgressReporting();

    try {
      // Use streaming scanner for large scans
      if (this.streamingScanner && (this.options.enableStreaming || totalRegisters > this.options.streamingThreshold)) {
        await this.performStreamingScan();
      } else {
        // Use traditional scanning for smaller scans
        await this.performTraditionalScan();
      }

      // Complete the scan
      this.state.isRunning = false;
      this.stopProgressReporting();

      // Final memory flush
      if (this.memoryOptimizer) {
        const remainingRegisters = await this.memoryOptimizer.flushBuffer();
        if (remainingRegisters.length > 0) {
          this.discoveredRegisters.push(...remainingRegisters);
        }
      }

      return this.createScanResults();
    } catch (error) {
      this.state.isRunning = false;
      this.stopProgressReporting();
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown scan error';
      this.state.errors.push(errorMessage);
      this.options.errorCallback(errorMessage);
      
      throw error;
    } finally {
      this.cleanupOptimizers();
    }
  }

  /**
   * Perform streaming scan for large register sets
   */
  private async performStreamingScan(): Promise<void> {
    if (!this.streamingScanner) {
      throw new Error('Streaming scanner not initialized');
    }

    let streamedRegisters: RegisterInfo[] = [];

    await this.streamingScanner.startStreamingScan(
      this.options.startAddress,
      this.options.endAddress,
      this.options.functionCodes,
      {
        progressCallback: (streamingProgress) => {
          // Convert streaming progress to regular progress
          const progress: ScanProgress = {
            currentAddress: streamingProgress.currentAddress,
            currentFunctionCode: streamingProgress.currentFunctionCode,
            totalProgress: (streamingProgress.processedAddresses / streamingProgress.totalAddresses) * 100,
            addressProgress: 0, // Not applicable in streaming mode
            scannedCount: streamingProgress.processedAddresses,
            discoveredCount: streamingProgress.discoveredRegisters,
            elapsedTime: Date.now() - this.state.startTime.getTime(),
            estimatedTimeRemaining: streamingProgress.estimatedTimeRemaining,
            scanRate: streamingProgress.processedAddresses / ((Date.now() - this.state.startTime.getTime()) / 1000)
          };
          
          this.options.progressCallback(progress);
        },
        streamCallback: async (registers) => {
          // Handle streamed registers
          if (this.options.streamCallback) {
            await this.options.streamCallback(registers);
          } else {
            // Accumulate registers if no stream callback provided
            streamedRegisters.push(...registers);
          }
          
          // Update discovered count
          const accessibleCount = registers.filter(reg => reg.accessible).length;
          this.state.discoveredRegisters += accessibleCount;
          
          // Call register discovered callback for each accessible register
          for (const register of registers) {
            if (register.accessible) {
              this.options.registerDiscoveredCallback(register);
            }
          }
        },
        errorCallback: this.options.errorCallback
      }
    );

    // Add streamed registers to discovered registers if no stream callback was provided
    if (!this.options.streamCallback) {
      this.discoveredRegisters.push(...streamedRegisters);
    }
  }

  /**
   * Perform traditional scan for smaller register sets
   */
  private async performTraditionalScan(): Promise<void> {
    // Scan each function code
    for (let fcIndex = 0; fcIndex < this.options.functionCodes.length; fcIndex++) {
      if (this.scanInterrupted) break;

      const functionCode = this.options.functionCodes[fcIndex];
      this.state.currentFunctionCode = functionCode;

      await this.scanFunctionCode(functionCode);
    }
  }

  /**
   * Scan all addresses for a specific function code
   */
  private async scanFunctionCode(functionCode: number): Promise<void> {
    if (this.options.enableBatching) {
      await this.scanFunctionCodeWithBatching(functionCode);
    } else {
      await this.scanFunctionCodeIndividually(functionCode);
    }
  }

  /**
   * Scan function code using batch optimization
   */
  private async scanFunctionCodeWithBatching(functionCode: number): Promise<void> {
    // Create address ranges for batching
    const addresses: number[] = [];
    for (let addr = this.options.startAddress; addr <= this.options.endAddress; addr++) {
      addresses.push(addr);
    }

    // Use batch optimizer to read registers efficiently
    try {
      let registers: RegisterInfo[];
      
      if (this.networkOptimizer) {
        // Use network-optimized batch reading
        registers = await this.networkOptimizer.executeRequest(
          () => this.batchOptimizer.readOptimizedBatches(addresses, functionCode),
          1, // Higher priority for batch operations
          addresses.length * 10 // Estimated bytes
        );
      } else {
        registers = await this.batchOptimizer.readOptimizedBatches(addresses, functionCode);
      }
      
      for (const register of registers) {
        if (this.scanInterrupted) break;
        
        await this.processDiscoveredRegister(register);
        this.state.scannedAddresses++;
        this.updateProgress();
      }
    } catch (error) {
      const errorMessage = `Batch scanning failed for function code ${functionCode}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.state.errors.push(errorMessage);
      this.options.errorCallback(errorMessage);
      
      // Fall back to individual scanning
      await this.scanFunctionCodeIndividually(functionCode);
    }
  }

  /**
   * Scan function code with individual register reads
   */
  private async scanFunctionCodeIndividually(functionCode: number): Promise<void> {
    for (let address = this.options.startAddress; address <= this.options.endAddress; address++) {
      if (this.scanInterrupted) break;

      this.state.currentAddress = address;

      try {
        let register: RegisterInfo;
        
        if (this.networkOptimizer) {
          // Use network-optimized request
          register = await this.networkOptimizer.executeRequest(
            () => this.registerReader.readSingleRegister(address, functionCode),
            0, // Default priority
            10 // Estimated bytes per register
          );
        } else {
          register = await this.registerReader.readSingleRegister(address, functionCode);
        }
        
        await this.processDiscoveredRegister(register);
      } catch (error) {
        const errorMessage = `Failed to read register ${address} (FC${functionCode}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.state.errors.push(errorMessage);
        this.options.errorCallback(errorMessage);
      }

      this.state.scannedAddresses++;
      this.updateProgress();

      // Small delay to prevent overwhelming the device (unless network optimizer handles it)
      if (!this.networkOptimizer) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }

  /**
   * Process a discovered register
   */
  private async processDiscoveredRegister(register: RegisterInfo): Promise<void> {
    // Use memory optimizer if available
    if (this.memoryOptimizer) {
      await this.memoryOptimizer.addRegisters([register]);
    } else {
      this.discoveredRegisters.push(register);
    }
    
    if (register.accessible) {
      this.state.discoveredRegisters++;
      this.options.registerDiscoveredCallback(register);
    }
  }

  /**
   * Cleanup performance optimizers
   */
  private cleanupOptimizers(): void {
    if (this.memoryOptimizer) {
      this.memoryOptimizer.cleanup();
    }

    if (this.networkOptimizer) {
      this.networkOptimizer.clearQueue();
    }

    if (this.streamingScanner) {
      // Streaming scanner handles its own cleanup
    }
  }

  /**
   * Update scan progress and call progress callback
   */
  private updateProgress(): void {
    const progress = this.calculateProgress();
    this.options.progressCallback(progress);
    this.state.lastUpdateTime = new Date();
  }

  /**
   * Calculate current scan progress
   */
  private calculateProgress(): ScanProgress {
    const totalOperations = this.state.totalAddresses * this.state.totalFunctionCodes;
    const completedOperations = this.state.scannedAddresses;
    const totalProgress = totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0;
    
    // Calculate progress within current function code
    const currentFcIndex = this.options.functionCodes.indexOf(this.state.currentFunctionCode);
    const addressesInCurrentFc = this.state.scannedAddresses - (currentFcIndex * this.state.totalAddresses);
    const addressProgress = this.state.totalAddresses > 0 ? (addressesInCurrentFc / this.state.totalAddresses) * 100 : 0;
    
    // Calculate timing information
    const elapsedTime = Date.now() - this.state.startTime.getTime();
    const scanRate = elapsedTime > 0 ? (completedOperations / elapsedTime) * 1000 : 0; // addresses per second
    const remainingOperations = totalOperations - completedOperations;
    const estimatedTimeRemaining = scanRate > 0 ? (remainingOperations / scanRate) * 1000 : 0;

    return {
      currentAddress: this.state.currentAddress,
      currentFunctionCode: this.state.currentFunctionCode,
      totalProgress: Math.min(100, Math.max(0, totalProgress)),
      addressProgress: Math.min(100, Math.max(0, addressProgress)),
      scannedCount: completedOperations,
      discoveredCount: this.state.discoveredRegisters,
      elapsedTime,
      estimatedTimeRemaining,
      scanRate
    };
  }

  /**
   * Start periodic progress reporting
   */
  private startProgressReporting(): void {
    this.progressUpdateInterval = setInterval(() => {
      if (this.state.isRunning && !this.state.isPaused) {
        this.updateProgress();
      }
    }, 1000); // Update every second
  }

  /**
   * Stop progress reporting
   */
  private stopProgressReporting(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
      this.progressUpdateInterval = undefined;
    }
  }

  /**
   * Pause the scanning process
   */
  public pauseScan(): void {
    if (!this.state.isRunning) {
      throw new Error('No scan is currently running');
    }
    
    this.state.isPaused = true;
  }

  /**
   * Resume a paused scan
   */
  public resumeScan(): void {
    if (!this.state.isRunning) {
      throw new Error('No scan is currently running');
    }
    
    if (!this.state.isPaused) {
      throw new Error('Scan is not paused');
    }
    
    this.state.isPaused = false;
  }

  /**
   * Stop the scanning process gracefully
   */
  public stopScan(): void {
    this.scanInterrupted = true;
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.stopProgressReporting();
  }

  /**
   * Get current scan state
   */
  public getScanState(): ScanState {
    return { ...this.state };
  }

  /**
   * Get current scan progress
   */
  public getScanProgress(): ScanProgress {
    return this.calculateProgress();
  }

  /**
   * Get discovered registers so far
   */
  public getDiscoveredRegisters(): RegisterInfo[] {
    return [...this.discoveredRegisters];
  }

  /**
   * Check if scan is currently running
   */
  public isScanning(): boolean {
    return this.state.isRunning;
  }

  /**
   * Check if scan is paused
   */
  public isPaused(): boolean {
    return this.state.isPaused;
  }

  /**
   * Create final scan results
   */
  private createScanResults(): ScanResults {
    const endTime = new Date();
    const accessibleRegisters = this.discoveredRegisters.filter(reg => reg.accessible).length;

    return {
      config: this.config,
      startTime: this.state.startTime,
      endTime,
      totalRegisters: this.discoveredRegisters.length,
      accessibleRegisters,
      registers: [...this.discoveredRegisters],
      errors: [...this.state.errors]
    };
  }

  /**
   * Reset scanner state for a new scan
   */
  public reset(): void {
    if (this.state.isRunning) {
      throw new Error('Cannot reset while scan is running');
    }

    this.state = this.createInitialState();
    this.discoveredRegisters = [];
    this.scanInterrupted = false;
    this.stopProgressReporting();
  }

  /**
   * Update scan options (requires reset)
   */
  public updateOptions(newOptions: ScanOptions): void {
    if (this.state.isRunning) {
      throw new Error('Cannot update options while scan is running');
    }

    // Merge with existing options
    this.options = {
      ...this.options,
      ...newOptions,
      startAddress: newOptions.startAddress ?? this.options.startAddress,
      endAddress: newOptions.endAddress ?? this.options.endAddress,
      functionCodes: newOptions.functionCodes ?? this.options.functionCodes,
      enableBatching: newOptions.enableBatching ?? this.options.enableBatching
    };

    // Validate new options
    this.validateOptions();

    // Reset state with new options
    this.reset();
  }

  /**
   * Get scan statistics
   */
  public getScanStatistics() {
    const batchStats = this.batchOptimizer.getStats();
    const progress = this.calculateProgress();
    
    const stats = {
      scanProgress: progress,
      batchOptimization: batchStats,
      scanState: this.state,
      totalDiscovered: this.discoveredRegisters.length,
      accessibleCount: this.discoveredRegisters.filter(reg => reg.accessible).length,
      errorCount: this.state.errors.length,
      memoryStats: this.memoryOptimizer?.getMemorySummary(),
      networkStats: this.networkOptimizer?.getPerformanceSummary(),
      streamingStats: this.streamingScanner?.getStreamingStats()
    };

    return stats;
  }

  /**
   * Get performance optimization recommendations
   */
  public getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    // Get recommendations from optimizers
    if (this.memoryOptimizer) {
      recommendations.push(...this.memoryOptimizer.getOptimizationRecommendations());
    }

    if (this.networkOptimizer) {
      recommendations.push(...this.networkOptimizer.getOptimizationRecommendations());
    }

    if (this.streamingScanner) {
      recommendations.push(...this.streamingScanner.getOptimizationRecommendations());
    }

    // Add scanner-specific recommendations
    const stats = this.getScanStatistics();
    const totalRegisters = (this.options.endAddress - this.options.startAddress + 1) * this.options.functionCodes.length;

    if (totalRegisters > 50000 && !this.options.enableStreaming) {
      recommendations.push('Large scan detected. Consider enabling streaming mode for better memory efficiency.');
    }

    if (stats.batchOptimization.batchEfficiency < 50) {
      recommendations.push('Low batch efficiency detected. Consider adjusting batch sizes or checking device compatibility.');
    }

    if (stats.scanProgress.scanRate < 10) {
      recommendations.push('Low scanning rate detected. Consider optimizing network settings or reducing delays.');
    }

    return recommendations;
  }

  /**
   * Set up interruption handlers for graceful shutdown
   */
  private setupInterruptionHandlers(): void {
    const handleInterruption = async () => {
      if (this.state.isRunning) {
        console.log('\nScan interruption detected. Saving state...');
        await this.handleGracefulInterruption();
      }
      process.exit(0);
    };

    // Handle Ctrl+C (SIGINT)
    process.on('SIGINT', handleInterruption);
    
    // Handle termination (SIGTERM)
    process.on('SIGTERM', handleInterruption);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      if (this.state.isRunning) {
        await this.handleGracefulInterruption();
      }
      process.exit(1);
    });

    // Store handlers for cleanup
    this.interruptionHandlers.push(handleInterruption);
  }

  /**
   * Handle graceful interruption by saving current state
   */
  private async handleGracefulInterruption(): Promise<void> {
    try {
      this.scanInterrupted = true;
      this.state.isRunning = false;
      this.stopProgressReporting();

      // Save current state for resumption
      await this.saveCurrentState();
      console.log('Scan state saved successfully. You can resume later.');
    } catch (error) {
      console.error('Failed to save scan state:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Save current scan state to persistent storage
   */
  public async saveCurrentState(): Promise<void> {
    if (!this.state.isRunning && this.discoveredRegisters.length === 0) {
      throw new Error('No scan state to save');
    }

    await this.stateManager.saveScanState(
      this.config,
      this.options,
      this.state,
      this.discoveredRegisters
    );
  }

  /**
   * Check if a saved state exists that can be resumed
   */
  public async canResumeScan(): Promise<boolean> {
    return await this.stateManager.hasSavedState();
  }

  /**
   * Get information about saved state
   */
  public async getSavedStateInfo() {
    return await this.stateManager.getSavedStateInfo();
  }

  /**
   * Resume scan from saved state
   */
  public async resumeFromSavedState(): Promise<ScanResults> {
    if (this.state.isRunning) {
      throw new Error('Cannot resume while another scan is running');
    }

    // Load saved state
    const savedState = await this.stateManager.loadScanState();
    if (!savedState) {
      throw new Error('No saved state found to resume');
    }

    // Validate saved state
    const validation = await this.stateManager.validateSavedState();
    if (!validation.isValid) {
      throw new Error(`Invalid saved state: ${validation.errors.join(', ')}`);
    }

    // Restore state
    this.config = savedState.config;
    this.options = {
      ...savedState.options,
      // Restore callback functions from current instance
      progressCallback: this.options.progressCallback,
      registerDiscoveredCallback: this.options.registerDiscoveredCallback,
      errorCallback: this.options.errorCallback
    };
    this.state = savedState.state;
    this.discoveredRegisters = savedState.discoveredRegisters;

    console.log(`Resuming scan from address ${this.state.currentAddress}, function code ${this.state.currentFunctionCode}`);
    console.log(`Progress: ${this.calculateProgress().totalProgress.toFixed(1)}% (${this.state.discoveredRegisters} registers discovered)`);

    // Ensure connection is established
    if (!this.connectionManager.isConnected()) {
      await this.connectionManager.connect();
    }

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.scanInterrupted = false;

    // Start progress reporting
    this.startProgressReporting();

    // Enable auto-save during resumed scan
    this.stateManager.enableAutoSave(30000, () => this.saveCurrentState());

    try {
      // Continue scanning from where we left off
      await this.continueScanning();

      // Complete the scan
      this.state.isRunning = false;
      this.stopProgressReporting();
      this.stateManager.disableAutoSave();

      // Clear saved state after successful completion
      await this.stateManager.clearSavedState();

      return this.createScanResults();
    } catch (error) {
      this.state.isRunning = false;
      this.stopProgressReporting();
      this.stateManager.disableAutoSave();
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown scan error';
      this.state.errors.push(errorMessage);
      this.options.errorCallback(errorMessage);
      
      throw error;
    }
  }

  /**
   * Continue scanning from current state (used for resumption)
   */
  private async continueScanning(): Promise<void> {
    const currentFcIndex = this.options.functionCodes.indexOf(this.state.currentFunctionCode);
    
    // Continue with current function code
    if (currentFcIndex >= 0) {
      await this.scanFunctionCodeFromAddress(this.state.currentFunctionCode, this.state.currentAddress);
    }

    // Continue with remaining function codes
    for (let fcIndex = currentFcIndex + 1; fcIndex < this.options.functionCodes.length; fcIndex++) {
      if (this.scanInterrupted) break;

      const functionCode = this.options.functionCodes[fcIndex];
      this.state.currentFunctionCode = functionCode;
      this.state.currentAddress = this.options.startAddress;

      await this.scanFunctionCode(functionCode);
    }
  }

  /**
   * Scan function code starting from a specific address
   */
  private async scanFunctionCodeFromAddress(functionCode: number, startAddress: number): Promise<void> {
    if (this.options.enableBatching) {
      await this.scanFunctionCodeWithBatchingFromAddress(functionCode, startAddress);
    } else {
      await this.scanFunctionCodeIndividuallyFromAddress(functionCode, startAddress);
    }
  }

  /**
   * Scan function code with batching starting from a specific address
   */
  private async scanFunctionCodeWithBatchingFromAddress(functionCode: number, startAddress: number): Promise<void> {
    // Create address ranges for batching from the start address
    const addresses: number[] = [];
    for (let addr = startAddress; addr <= this.options.endAddress; addr++) {
      addresses.push(addr);
    }

    // Use batch optimizer to read registers efficiently
    try {
      const registers = await this.batchOptimizer.readOptimizedBatches(addresses, functionCode);
      
      for (const register of registers) {
        if (this.scanInterrupted) break;
        
        this.processDiscoveredRegister(register);
        this.state.scannedAddresses++;
        this.state.currentAddress = register.address + 1;
        this.updateProgress();
      }
    } catch (error) {
      const errorMessage = `Batch scanning failed for function code ${functionCode}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.state.errors.push(errorMessage);
      this.options.errorCallback(errorMessage);
      
      // Fall back to individual scanning
      await this.scanFunctionCodeIndividuallyFromAddress(functionCode, startAddress);
    }
  }

  /**
   * Scan function code individually starting from a specific address
   */
  private async scanFunctionCodeIndividuallyFromAddress(functionCode: number, startAddress: number): Promise<void> {
    for (let address = startAddress; address <= this.options.endAddress; address++) {
      if (this.scanInterrupted) break;

      this.state.currentAddress = address;

      try {
        const register = await this.registerReader.readSingleRegister(address, functionCode);
        this.processDiscoveredRegister(register);
      } catch (error) {
        const errorMessage = `Failed to read register ${address} (FC${functionCode}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.state.errors.push(errorMessage);
        this.options.errorCallback(errorMessage);
      }

      this.state.scannedAddresses++;
      this.updateProgress();

      // Small delay to prevent overwhelming the device
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  /**
   * Clear saved scan state
   */
  public async clearSavedState(): Promise<void> {
    await this.stateManager.clearSavedState();
  }

  /**
   * Create a backup of current saved state
   */
  public async backupSavedState(): Promise<string> {
    return await this.stateManager.backupState();
  }

  /**
   * Enable automatic state saving during scan
   */
  public enableAutoSave(intervalMs: number = 30000): void {
    this.stateManager.enableAutoSave(intervalMs, () => this.saveCurrentState());
  }

  /**
   * Disable automatic state saving
   */
  public disableAutoSave(): void {
    this.stateManager.disableAutoSave();
  }

  /**
   * Check if auto-save is enabled
   */
  public isAutoSaveEnabled(): boolean {
    return this.stateManager.isAutoSaveEnabled();
  }

  /**
   * Cleanup interruption handlers
   */
  public cleanup(): void {
    this.stateManager.disableAutoSave();
    this.stopProgressReporting();
    this.cleanupOptimizers();
    
    // Remove process event listeners
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('uncaughtException');
    
    this.interruptionHandlers = [];
  }
}
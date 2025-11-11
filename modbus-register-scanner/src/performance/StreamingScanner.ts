import { RegisterInfo, ScanConfig } from '../types';
import { MemoryOptimizer, RegisterStreamCallback } from './MemoryOptimizer';
import { NetworkOptimizer } from './NetworkOptimizer';
import { ConnectionManager } from '../connection/ConnectionManager';
import { RegisterReader } from '../reader/RegisterReader';
import { BatchOptimizer } from '../optimizer/BatchOptimizer';

/**
 * Configuration for streaming scanner
 */
export interface StreamingConfig {
  chunkSize: number;           // Number of registers to process in each chunk
  streamThreshold: number;     // Start streaming when this many registers are in memory
  maxMemoryUsage: number;      // Maximum memory usage in bytes
  enableNetworkOptimization: boolean;
  enableMemoryOptimization: boolean;
  progressInterval: number;    // Progress reporting interval (ms)
}

/**
 * Streaming scan progress information
 */
export interface StreamingProgress {
  totalAddresses: number;
  processedAddresses: number;
  currentAddress: number;
  currentFunctionCode: number;
  discoveredRegisters: number;
  memoryUsage: number;
  networkThroughput: number;
  estimatedTimeRemaining: number;
  chunksProcessed: number;
  chunksStreamed: number;
}

/**
 * StreamingScanner implements memory-efficient scanning for very large register sets
 * by streaming results and optimizing network patterns
 */
export class StreamingScanner {
  private config: StreamingConfig;
  private memoryOptimizer: MemoryOptimizer;
  private networkOptimizer: NetworkOptimizer;
  private connectionManager: ConnectionManager;
  private registerReader: RegisterReader;
  private batchOptimizer: BatchOptimizer;
  private scanConfig: ScanConfig;
  
  private isScanning = false;
  private isPaused = false;
  private totalAddresses = 0;
  private processedAddresses = 0;
  private discoveredRegisters = 0;
  private chunksProcessed = 0;
  private chunksStreamed = 0;
  private startTime = 0;
  
  private progressCallback?: (progress: StreamingProgress) => void;
  private streamCallback?: RegisterStreamCallback;
  private errorCallback?: (error: string) => void;

  constructor(
    connectionManager: ConnectionManager,
    registerReader: RegisterReader,
    batchOptimizer: BatchOptimizer,
    scanConfig: ScanConfig,
    config: Partial<StreamingConfig> = {}
  ) {
    this.connectionManager = connectionManager;
    this.registerReader = registerReader;
    this.batchOptimizer = batchOptimizer;
    this.scanConfig = scanConfig;
    
    this.config = {
      chunkSize: config.chunkSize ?? 1000,
      streamThreshold: config.streamThreshold ?? 5000,
      maxMemoryUsage: config.maxMemoryUsage ?? 500 * 1024 * 1024, // 500MB
      enableNetworkOptimization: config.enableNetworkOptimization ?? true,
      enableMemoryOptimization: config.enableMemoryOptimization ?? true,
      progressInterval: config.progressInterval ?? 1000,
      ...config
    };

    // Initialize optimizers
    this.memoryOptimizer = new MemoryOptimizer({
      maxRegistersInMemory: this.config.streamThreshold,
      streamingThreshold: this.config.streamThreshold,
      gcInterval: 30000,
      memoryCheckInterval: 5000
    });

    this.networkOptimizer = new NetworkOptimizer({
      maxConcurrentRequests: 1, // Conservative for Modbus
      requestDelay: 10,
      adaptiveDelay: true,
      requestTimeout: scanConfig.timeout
    });
  }

  /**
   * Start streaming scan
   */
  public async startStreamingScan(
    startAddress: number,
    endAddress: number,
    functionCodes: number[],
    callbacks: {
      progressCallback?: (progress: StreamingProgress) => void;
      streamCallback?: RegisterStreamCallback;
      errorCallback?: (error: string) => void;
    } = {}
  ): Promise<void> {
    if (this.isScanning) {
      throw new Error('Streaming scan is already running');
    }

    this.progressCallback = callbacks.progressCallback;
    this.streamCallback = callbacks.streamCallback;
    this.errorCallback = callbacks.errorCallback;

    this.isScanning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.totalAddresses = (endAddress - startAddress + 1) * functionCodes.length;
    this.processedAddresses = 0;
    this.discoveredRegisters = 0;
    this.chunksProcessed = 0;
    this.chunksStreamed = 0;

    // Initialize optimizers
    if (this.config.enableMemoryOptimization) {
      this.memoryOptimizer.initialize(this.streamCallback);
    }

    try {
      // Ensure connection
      if (!this.connectionManager.isConnected()) {
        await this.connectionManager.connect();
      }

      // Process each function code
      for (const functionCode of functionCodes) {
        if (!this.isScanning || this.isPaused) break;

        await this.scanFunctionCodeStreaming(startAddress, endAddress, functionCode);
      }

      // Final flush
      if (this.config.enableMemoryOptimization) {
        await this.memoryOptimizer.flushBuffer();
      }

      this.isScanning = false;
      console.log('Streaming scan completed successfully');

    } catch (error) {
      this.isScanning = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown streaming scan error';
      if (this.errorCallback) {
        this.errorCallback(errorMessage);
      }
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Scan a function code using streaming approach
   */
  private async scanFunctionCodeStreaming(
    startAddress: number,
    endAddress: number,
    functionCode: number
  ): Promise<void> {
    const totalAddresses = endAddress - startAddress + 1;
    
    // Process addresses in chunks
    for (let chunkStart = startAddress; chunkStart <= endAddress; chunkStart += this.config.chunkSize) {
      if (!this.isScanning || this.isPaused) break;

      const chunkEnd = Math.min(chunkStart + this.config.chunkSize - 1, endAddress);
      const chunkAddresses: number[] = [];
      
      for (let addr = chunkStart; addr <= chunkEnd; addr++) {
        chunkAddresses.push(addr);
      }

      await this.processChunk(chunkAddresses, functionCode);
      this.chunksProcessed++;

      // Update progress
      this.processedAddresses += chunkAddresses.length;
      this.reportProgress(chunkStart, functionCode);

      // Check memory usage and stream if needed
      if (this.config.enableMemoryOptimization && !this.memoryOptimizer.isMemoryUsageHealthy()) {
        await this.memoryOptimizer.flushBuffer();
        this.chunksStreamed++;
      }
    }
  }

  /**
   * Process a chunk of addresses
   */
  private async processChunk(addresses: number[], functionCode: number): Promise<void> {
    try {
      let registers: RegisterInfo[];

      if (this.config.enableNetworkOptimization) {
        // Use network-optimized batch reading
        registers = await this.networkOptimizer.executeRequest(
          () => this.batchOptimizer.readOptimizedBatches(addresses, functionCode),
          1, // Priority
          addresses.length * 10 // Estimated bytes per register
        );
      } else {
        // Standard batch reading
        registers = await this.batchOptimizer.readOptimizedBatches(addresses, functionCode);
      }

      // Count discovered registers
      const accessibleCount = registers.filter(reg => reg.accessible).length;
      this.discoveredRegisters += accessibleCount;

      // Add to memory optimizer
      if (this.config.enableMemoryOptimization) {
        await this.memoryOptimizer.addRegisters(registers);
      } else if (this.streamCallback) {
        // Direct streaming without memory optimization
        await this.streamCallback(registers);
      }

    } catch (error) {
      const errorMessage = `Failed to process chunk starting at ${addresses[0]} (FC${functionCode}): ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (this.errorCallback) {
        this.errorCallback(errorMessage);
      }
      console.warn(errorMessage);
    }
  }

  /**
   * Report progress to callback
   */
  private reportProgress(currentAddress: number, currentFunctionCode: number): void {
    if (!this.progressCallback) return;

    const elapsedTime = Date.now() - this.startTime;
    const progressRatio = this.totalAddresses > 0 ? this.processedAddresses / this.totalAddresses : 0;
    const estimatedTotalTime = progressRatio > 0 ? elapsedTime / progressRatio : 0;
    const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime);

    const memoryStats = this.config.enableMemoryOptimization 
      ? this.memoryOptimizer.getCurrentMemoryStats()
      : { heapUsed: process.memoryUsage().heapUsed };

    const networkStats = this.config.enableNetworkOptimization
      ? this.networkOptimizer.getStats()
      : { requestsPerSecond: 0 };

    const progress: StreamingProgress = {
      totalAddresses: this.totalAddresses,
      processedAddresses: this.processedAddresses,
      currentAddress,
      currentFunctionCode,
      discoveredRegisters: this.discoveredRegisters,
      memoryUsage: memoryStats.heapUsed,
      networkThroughput: networkStats.requestsPerSecond,
      estimatedTimeRemaining,
      chunksProcessed: this.chunksProcessed,
      chunksStreamed: this.chunksStreamed
    };

    this.progressCallback(progress);
  }

  /**
   * Pause the streaming scan
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume the streaming scan
   */
  public resume(): void {
    this.isPaused = false;
  }

  /**
   * Stop the streaming scan
   */
  public stop(): void {
    this.isScanning = false;
    this.isPaused = false;
  }

  /**
   * Check if currently scanning
   */
  public isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  /**
   * Check if currently paused
   */
  public isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Get streaming statistics
   */
  public getStreamingStats() {
    const memoryStats = this.config.enableMemoryOptimization 
      ? this.memoryOptimizer.getMemorySummary()
      : null;

    const networkStats = this.config.enableNetworkOptimization
      ? this.networkOptimizer.getPerformanceSummary()
      : null;

    return {
      scanning: this.isScanning,
      paused: this.isPaused,
      totalAddresses: this.totalAddresses,
      processedAddresses: this.processedAddresses,
      discoveredRegisters: this.discoveredRegisters,
      chunksProcessed: this.chunksProcessed,
      chunksStreamed: this.chunksStreamed,
      elapsedTime: this.startTime > 0 ? Date.now() - this.startTime : 0,
      memoryStats,
      networkStats,
      config: this.config
    };
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.config.enableMemoryOptimization) {
      recommendations.push(...this.memoryOptimizer.getOptimizationRecommendations());
    }

    if (this.config.enableNetworkOptimization) {
      recommendations.push(...this.networkOptimizer.getOptimizationRecommendations());
    }

    // Add streaming-specific recommendations
    const stats = this.getStreamingStats();
    if (stats.chunksStreamed / stats.chunksProcessed < 0.5 && stats.processedAddresses > 10000) {
      recommendations.push('Consider reducing chunk size or streaming threshold for better memory efficiency.');
    }

    if (stats.elapsedTime > 0 && stats.processedAddresses / (stats.elapsedTime / 1000) < 100) {
      recommendations.push('Low scanning throughput detected. Consider optimizing network settings or batch sizes.');
    }

    return recommendations;
  }

  /**
   * Update streaming configuration
   */
  public updateConfig(newConfig: Partial<StreamingConfig>): void {
    if (this.isScanning) {
      throw new Error('Cannot update configuration while scanning');
    }

    this.config = { ...this.config, ...newConfig };

    // Update optimizer configurations
    if (this.config.enableMemoryOptimization) {
      this.memoryOptimizer.updateConfig({
        maxRegistersInMemory: this.config.streamThreshold,
        streamingThreshold: this.config.streamThreshold
      });
    }

    if (this.config.enableNetworkOptimization) {
      this.networkOptimizer.updateConfig({
        requestTimeout: this.scanConfig.timeout
      });
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): StreamingConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.config.enableMemoryOptimization) {
      this.memoryOptimizer.cleanup();
    }

    if (this.config.enableNetworkOptimization) {
      this.networkOptimizer.clearQueue();
    }
  }
}
import { RegisterInfo } from '../types';

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  registersInMemory: number;
  estimatedMemoryPerRegister: number;
}

/**
 * Configuration for memory optimization
 */
export interface MemoryConfig {
  maxRegistersInMemory: number; // Maximum registers to keep in memory
  streamingThreshold: number;   // Start streaming when this many registers are reached
  gcInterval: number;          // Interval for garbage collection hints (ms)
  memoryCheckInterval: number; // Interval for memory monitoring (ms)
}

/**
 * Callback for streaming register data
 */
export type RegisterStreamCallback = (registers: RegisterInfo[]) => Promise<void>;

/**
 * MemoryOptimizer manages memory usage during large scans by implementing
 * streaming and garbage collection strategies
 */
export class MemoryOptimizer {
  private config: MemoryConfig;
  private registersBuffer: RegisterInfo[] = [];
  private streamCallback?: RegisterStreamCallback;
  private memoryMonitorInterval?: NodeJS.Timeout;
  private gcHintInterval?: NodeJS.Timeout;
  private totalRegistersProcessed = 0;
  private memoryStats: MemoryStats[] = [];
  private readonly maxStatsHistory = 100;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxRegistersInMemory: config.maxRegistersInMemory ?? 10000,
      streamingThreshold: config.streamingThreshold ?? 5000,
      gcInterval: config.gcInterval ?? 30000, // 30 seconds
      memoryCheckInterval: config.memoryCheckInterval ?? 5000, // 5 seconds
      ...config
    };
  }

  /**
   * Initialize memory optimization with streaming callback
   */
  public initialize(streamCallback?: RegisterStreamCallback): void {
    this.streamCallback = streamCallback;
    this.startMemoryMonitoring();
    this.startGarbageCollectionHints();
  }

  /**
   * Add registers to the buffer with automatic streaming
   */
  public async addRegisters(registers: RegisterInfo[]): Promise<void> {
    this.registersBuffer.push(...registers);
    this.totalRegistersProcessed += registers.length;

    // Check if we need to stream data
    if (this.registersBuffer.length >= this.config.streamingThreshold) {
      await this.flushBuffer();
    }

    // Force garbage collection if memory usage is high
    const memStats = this.getCurrentMemoryStats();
    if (memStats.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
      this.forceGarbageCollection();
    }
  }

  /**
   * Flush the current buffer to the stream callback
   */
  public async flushBuffer(): Promise<RegisterInfo[]> {
    if (this.registersBuffer.length === 0) {
      return [];
    }

    const registersToFlush = [...this.registersBuffer];
    this.registersBuffer = [];

    if (this.streamCallback) {
      await this.streamCallback(registersToFlush);
      return [];
    }

    return registersToFlush;
  }

  /**
   * Get current memory statistics
   */
  public getCurrentMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    const registersInMemory = this.registersBuffer.length;
    const estimatedMemoryPerRegister = registersInMemory > 0 
      ? memUsage.heapUsed / registersInMemory 
      : 0;

    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rss: memUsage.rss,
      registersInMemory,
      estimatedMemoryPerRegister
    };
  }

  /**
   * Get memory usage history
   */
  public getMemoryHistory(): MemoryStats[] {
    return [...this.memoryStats];
  }

  /**
   * Get memory usage summary
   */
  public getMemorySummary() {
    const current = this.getCurrentMemoryStats();
    const history = this.memoryStats;
    
    if (history.length === 0) {
      return {
        current,
        peak: current,
        average: current,
        totalProcessed: this.totalRegistersProcessed
      };
    }

    const peak = history.reduce((max, stats) => 
      stats.heapUsed > max.heapUsed ? stats : max
    );

    const avgHeapUsed = history.reduce((sum, stats) => sum + stats.heapUsed, 0) / history.length;
    const avgRegisters = history.reduce((sum, stats) => sum + stats.registersInMemory, 0) / history.length;

    return {
      current,
      peak,
      average: {
        ...current,
        heapUsed: avgHeapUsed,
        registersInMemory: avgRegisters
      },
      totalProcessed: this.totalRegistersProcessed
    };
  }

  /**
   * Check if memory usage is within acceptable limits
   */
  public isMemoryUsageHealthy(): boolean {
    const stats = this.getCurrentMemoryStats();
    const heapUsageMB = stats.heapUsed / (1024 * 1024);
    
    // Consider memory usage unhealthy if:
    // - Heap usage exceeds 1GB
    // - More than max registers in memory
    return heapUsageMB < 1024 && stats.registersInMemory <= this.config.maxRegistersInMemory;
  }

  /**
   * Get recommendations for memory optimization
   */
  public getOptimizationRecommendations(): string[] {
    const stats = this.getCurrentMemoryStats();
    const recommendations: string[] = [];
    const heapUsageMB = stats.heapUsed / (1024 * 1024);

    if (heapUsageMB > 500) {
      recommendations.push('High memory usage detected. Consider reducing batch sizes or enabling streaming.');
    }

    if (stats.registersInMemory > this.config.maxRegistersInMemory) {
      recommendations.push('Too many registers in memory. Enable streaming or reduce buffer size.');
    }

    if (stats.estimatedMemoryPerRegister > 1000) { // More than 1KB per register seems high
      recommendations.push('High memory usage per register. Check for memory leaks or optimize data structures.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory usage is within acceptable limits.');
    }

    return recommendations;
  }

  /**
   * Start monitoring memory usage
   */
  private startMemoryMonitoring(): void {
    this.memoryMonitorInterval = setInterval(() => {
      const stats = this.getCurrentMemoryStats();
      this.memoryStats.push(stats);

      // Limit history size
      if (this.memoryStats.length > this.maxStatsHistory) {
        this.memoryStats.shift();
      }

      // Log warning if memory usage is high
      if (!this.isMemoryUsageHealthy()) {
        console.warn(`High memory usage detected: ${(stats.heapUsed / (1024 * 1024)).toFixed(1)}MB heap, ${stats.registersInMemory} registers in memory`);
      }
    }, this.config.memoryCheckInterval);
  }

  /**
   * Start periodic garbage collection hints
   */
  private startGarbageCollectionHints(): void {
    this.gcHintInterval = setInterval(() => {
      this.forceGarbageCollection();
    }, this.config.gcInterval);
  }

  /**
   * Force garbage collection if available
   */
  private forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Stop memory monitoring and cleanup
   */
  public cleanup(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = undefined;
    }

    if (this.gcHintInterval) {
      clearInterval(this.gcHintInterval);
      this.gcHintInterval = undefined;
    }

    // Final flush
    this.registersBuffer = [];
    this.forceGarbageCollection();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): MemoryConfig {
    return { ...this.config };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.memoryStats = [];
    this.totalRegistersProcessed = 0;
  }
}
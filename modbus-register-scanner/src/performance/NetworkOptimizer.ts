import { RegisterInfo } from '../types';

/**
 * Network performance statistics
 */
export interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalBytes: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  bytesPerSecond: number;
  errorRate: number;
  connectionDrops: number;
  retries: number;
}

/**
 * Network request timing information
 */
export interface RequestTiming {
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  bytes: number;
  error?: string;
}

/**
 * Configuration for network optimization
 */
export interface NetworkConfig {
  maxConcurrentRequests: number;  // Maximum concurrent network requests
  requestDelay: number;           // Delay between requests (ms)
  adaptiveDelay: boolean;         // Enable adaptive delay based on response times
  connectionPooling: boolean;     // Enable connection pooling
  requestTimeout: number;         // Individual request timeout (ms)
  retryBackoffMultiplier: number; // Multiplier for retry backoff
}

/**
 * Request queue item
 */
interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
  timestamp: number;
}

/**
 * NetworkOptimizer manages network request patterns and timing to optimize
 * communication efficiency with Modbus devices
 */
export class NetworkOptimizer {
  private config: NetworkConfig;
  private stats: NetworkStats;
  private requestTimings: RequestTiming[] = [];
  private readonly maxTimingHistory = 1000;
  private requestQueue: QueuedRequest[] = [];
  private activeRequests = 0;
  private requestCounter = 0;
  private startTime = Date.now();
  private adaptiveDelayValue: number;

  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = {
      maxConcurrentRequests: config.maxConcurrentRequests ?? 1, // Conservative default for Modbus
      requestDelay: config.requestDelay ?? 10, // 10ms default delay
      adaptiveDelay: config.adaptiveDelay ?? true,
      connectionPooling: config.connectionPooling ?? false, // Not typically used with Modbus TCP
      requestTimeout: config.requestTimeout ?? 5000,
      retryBackoffMultiplier: config.retryBackoffMultiplier ?? 1.5,
      ...config
    };

    this.adaptiveDelayValue = this.config.requestDelay;
    this.stats = this.createInitialStats();
  }

  /**
   * Create initial stats object
   */
  private createInitialStats(): NetworkStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalBytes: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0,
      bytesPerSecond: 0,
      errorRate: 0,
      connectionDrops: 0,
      retries: 0
    };
  }

  /**
   * Execute a network request with optimization
   */
  public async executeRequest<T>(
    requestFn: () => Promise<T>,
    priority: number = 0,
    estimatedBytes: number = 100
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = `req_${++this.requestCounter}`;
      
      const queuedRequest: QueuedRequest = {
        id: requestId,
        execute: async () => {
          const result = await this.executeWithTiming(requestFn, estimatedBytes);
          this.recordRequestTiming(result.timing);
          this.updateAdaptiveDelay(result.timing);
          return result.result;
        },
        resolve: (result) => resolve(result),
        reject,
        priority,
        timestamp: Date.now()
      };

      this.requestQueue.push(queuedRequest);
      this.processQueue();
    });
  }

  /**
   * Execute request with timing measurement
   */
  private async executeWithTiming<T>(
    requestFn: () => Promise<T>,
    estimatedBytes: number
  ): Promise<{ result: T; timing: RequestTiming }> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let result: T;
    let timing: RequestTiming;

    try {
      result = await requestFn();
      success = true;
      this.stats.successfulRequests++;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      this.stats.failedRequests++;
      throw err;
    } finally {
      const endTime = Date.now();
      timing = {
        startTime,
        endTime,
        duration: endTime - startTime,
        success,
        bytes: estimatedBytes,
        error
      };

      this.stats.totalRequests++;
      this.stats.totalBytes += estimatedBytes;
    }

    return { result: result!, timing: timing! };
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.activeRequests >= this.config.maxConcurrentRequests || this.requestQueue.length === 0) {
      return;
    }

    // Sort queue by priority (higher priority first)
    this.requestQueue.sort((a, b) => b.priority - a.priority);

    const request = this.requestQueue.shift();
    if (!request) return;

    this.activeRequests++;

    try {
      // Apply delay before request
      if (this.config.adaptiveDelay) {
        await this.sleep(this.adaptiveDelayValue);
      } else {
        await this.sleep(this.config.requestDelay);
      }

      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.activeRequests--;
      // Process next request in queue
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Record request timing for statistics
   */
  private recordRequestTiming(timing: RequestTiming): void {
    this.requestTimings.push(timing);

    // Limit timing history
    if (this.requestTimings.length > this.maxTimingHistory) {
      this.requestTimings.shift();
    }

    // Update statistics
    this.updateStats();
  }

  /**
   * Update adaptive delay based on response times
   */
  private updateAdaptiveDelay(timing: RequestTiming): void {
    if (!this.config.adaptiveDelay) return;

    const recentTimings = this.requestTimings.slice(-20); // Last 20 requests
    if (recentTimings.length < 5) return;

    const avgResponseTime = recentTimings.reduce((sum, t) => sum + t.duration, 0) / recentTimings.length;
    const errorRate = recentTimings.filter(t => !t.success).length / recentTimings.length;

    // Increase delay if error rate is high or response times are slow
    if (errorRate > 0.1 || avgResponseTime > 1000) {
      this.adaptiveDelayValue = Math.min(this.adaptiveDelayValue * 1.2, 1000);
    } else if (errorRate < 0.05 && avgResponseTime < 200) {
      // Decrease delay if performance is good
      this.adaptiveDelayValue = Math.max(this.adaptiveDelayValue * 0.9, this.config.requestDelay);
    }
  }

  /**
   * Update network statistics
   */
  private updateStats(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.startTime) / 1000;

    if (this.requestTimings.length > 0) {
      this.stats.averageResponseTime = this.requestTimings.reduce((sum, t) => sum + t.duration, 0) / this.requestTimings.length;
    }

    this.stats.requestsPerSecond = elapsedSeconds > 0 ? this.stats.totalRequests / elapsedSeconds : 0;
    this.stats.bytesPerSecond = elapsedSeconds > 0 ? this.stats.totalBytes / elapsedSeconds : 0;
    this.stats.errorRate = this.stats.totalRequests > 0 ? this.stats.failedRequests / this.stats.totalRequests : 0;
  }

  /**
   * Get current network statistics
   */
  public getStats(): NetworkStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get network performance summary
   */
  public getPerformanceSummary() {
    const stats = this.getStats();
    const recentTimings = this.requestTimings.slice(-100); // Last 100 requests
    
    let p95ResponseTime = 0;
    let p99ResponseTime = 0;
    
    if (recentTimings.length > 0) {
      const sortedTimes = recentTimings.map(t => t.duration).sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p99Index = Math.floor(sortedTimes.length * 0.99);
      
      p95ResponseTime = sortedTimes[p95Index] || 0;
      p99ResponseTime = sortedTimes[p99Index] || 0;
    }

    return {
      ...stats,
      p95ResponseTime,
      p99ResponseTime,
      currentDelay: this.adaptiveDelayValue,
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests
    };
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const stats = this.getStats();
    const recommendations: string[] = [];

    if (stats.errorRate > 0.1) {
      recommendations.push('High error rate detected. Consider increasing request delays or reducing batch sizes.');
    }

    if (stats.averageResponseTime > 1000) {
      recommendations.push('Slow response times detected. Consider reducing concurrent requests or increasing timeouts.');
    }

    if (stats.requestsPerSecond < 1) {
      recommendations.push('Low request throughput. Consider reducing delays or increasing concurrency (if device supports it).');
    }

    if (this.requestQueue.length > 100) {
      recommendations.push('Large request queue detected. Consider optimizing request patterns or increasing processing capacity.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Network performance is within acceptable parameters.');
    }

    return recommendations;
  }

  /**
   * Optimize request pattern for a batch of operations
   */
  public async executeBatchOptimized<T>(
    requests: Array<() => Promise<T>>,
    batchSize?: number
  ): Promise<T[]> {
    const effectiveBatchSize = batchSize || this.config.maxConcurrentRequests;
    const results: T[] = [];
    
    // Process requests in batches
    for (let i = 0; i < requests.length; i += effectiveBatchSize) {
      const batch = requests.slice(i, i + effectiveBatchSize);
      
      const batchPromises = batch.map((request, index) => 
        this.executeRequest(request, 0, 100) // Default priority and estimated bytes
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          throw result.reason;
        }
      }
      
      // Add inter-batch delay if needed
      if (i + effectiveBatchSize < requests.length) {
        await this.sleep(this.adaptiveDelayValue);
      }
    }
    
    return results;
  }

  /**
   * Reset network statistics
   */
  public resetStats(): void {
    this.stats = this.createInitialStats();
    this.requestTimings = [];
    this.startTime = Date.now();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.adaptiveDelayValue = this.config.requestDelay;
  }

  /**
   * Get current configuration
   */
  public getConfig(): NetworkConfig {
    return { ...this.config };
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear request queue
   */
  public clearQueue(): void {
    // Reject all pending requests
    for (const request of this.requestQueue) {
      request.reject(new Error('Request queue cleared'));
    }
    this.requestQueue = [];
  }

  /**
   * Get queue status
   */
  public getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.config.maxConcurrentRequests,
      currentDelay: this.adaptiveDelayValue
    };
  }
}
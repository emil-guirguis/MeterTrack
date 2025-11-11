/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Manages retry logic with exponential backoff for connection operations
 */
export class RetryManager {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  /**
   * Execute an operation with retry logic and exponential backoff
   * @param operation The async operation to retry
   * @param operationName Name for logging purposes
   * @returns Promise that resolves with the operation result
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // If this was the last attempt, throw the error
        if (attempt === this.config.maxRetries) {
          throw new Error(`${operationName} failed after ${this.config.maxRetries + 1} attempts: ${lastError.message}`);
        }

        // Calculate delay for exponential backoff: baseDelay * 2^attempt
        const delay = Math.min(
          this.config.baseDelayMs * Math.pow(2, attempt),
          this.config.maxDelayMs
        );

        console.log(`${operationName} attempt ${attempt + 1} failed: ${lastError.message}. Retrying in ${delay}ms...`);
        
        // Wait before next attempt
        await this.delay(delay);
      }
    }

    // This should never be reached due to the throw above, but TypeScript requires it
    throw lastError!;
  }

  /**
   * Create a delay promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the current retry configuration
   */
  public getConfig(): RetryConfig {
    return { ...this.config };
  }

  /**
   * Update retry configuration
   */
  public updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
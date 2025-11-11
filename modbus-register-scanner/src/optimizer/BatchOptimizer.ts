import { RegisterReader } from '../reader/RegisterReader';
import { RegisterInfo } from '../types';

/**
 * Represents a batch of consecutive registers to read
 */
export interface RegisterBatch {
  startAddress: number;
  count: number;
  functionCode: number;
}

/**
 * Result of a batch read operation
 */
export interface BatchReadResult {
  success: boolean;
  registers: RegisterInfo[];
  error?: Error;
}

/**
 * Statistics for batch optimization performance
 */
export interface BatchStats {
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  fallbackReads: number;
  totalRegisters: number;
  batchEfficiency: number; // Percentage of registers read in batches vs individual
  averageBatchSize: number;
  successRateBySize: Map<number, { attempts: number; successes: number }>;
}

/**
 * BatchOptimizer groups consecutive register reads into efficient batches
 * and provides fallback to individual reads when batch operations fail
 */
export class BatchOptimizer {
  private readonly maxBatchSize: number;
  private readonly registerReader: RegisterReader;
  private stats: BatchStats;
  private adaptiveBatchSize: number;
  private readonly minBatchSize: number = 1;
  private readonly adaptiveThreshold: number = 5; // Number of batches before adapting
  private batchHistory: Array<{ size: number; success: boolean; timestamp: Date }> = [];
  private readonly maxHistorySize: number = 100;

  constructor(registerReader: RegisterReader, maxBatchSize: number = 125) {
    this.registerReader = registerReader;
    this.maxBatchSize = Math.min(maxBatchSize, 125); // Enforce Modbus protocol limit
    this.adaptiveBatchSize = this.maxBatchSize; // Start with maximum size
    this.stats = {
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      fallbackReads: 0,
      totalRegisters: 0,
      batchEfficiency: 0,
      averageBatchSize: 0,
      successRateBySize: new Map()
    };
  }

  /**
   * Group consecutive register addresses into optimal batches using adaptive sizing
   * @param addresses Array of register addresses to read
   * @param functionCode Modbus function code (1, 2, 3, or 4)
   * @returns Array of RegisterBatch objects
   */
  public createBatches(addresses: number[], functionCode: number): RegisterBatch[] {
    if (addresses.length === 0) {
      return [];
    }

    // Sort addresses to ensure consecutive grouping works correctly
    const sortedAddresses = [...addresses].sort((a, b) => a - b);
    const batches: RegisterBatch[] = [];
    
    let currentBatchStart = sortedAddresses[0];
    let currentBatchSize = 1;
    const effectiveBatchSize = this.getEffectiveBatchSize();

    for (let i = 1; i < sortedAddresses.length; i++) {
      const currentAddress = sortedAddresses[i];
      const previousAddress = sortedAddresses[i - 1];

      // Check if current address is consecutive and batch size is within adaptive limit
      if (currentAddress === previousAddress + 1 && currentBatchSize < effectiveBatchSize) {
        currentBatchSize++;
      } else {
        // Create batch for previous consecutive group
        batches.push({
          startAddress: currentBatchStart,
          count: currentBatchSize,
          functionCode
        });

        // Start new batch
        currentBatchStart = currentAddress;
        currentBatchSize = 1;
      }
    }

    // Add the final batch
    batches.push({
      startAddress: currentBatchStart,
      count: currentBatchSize,
      functionCode
    });

    return batches;
  }

  /**
   * Execute a batch read operation with fallback to individual reads
   * @param batch RegisterBatch to execute
   * @returns BatchReadResult with success status and register data
   */
  public async executeBatch(batch: RegisterBatch): Promise<BatchReadResult> {
    this.stats.totalBatches++;
    this.stats.totalRegisters += batch.count;

    const batchStartTime = new Date();
    let batchSuccess = false;

    try {
      // Attempt batch read
      const registers = await this.registerReader.readMultipleRegisters(
        batch.startAddress,
        batch.count,
        batch.functionCode
      );

      // Check if all registers in the batch were successfully read
      const allAccessible = registers.every(reg => reg.accessible);
      
      if (allAccessible) {
        this.stats.successfulBatches++;
        batchSuccess = true;
        
        // Record successful batch for adaptive learning
        this.recordBatchResult(batch.count, true, batchStartTime);
        
        // Update adaptive batch size if we have enough history
        if (this.batchHistory.length >= this.adaptiveThreshold) {
          this.updateAdaptiveBatchSize();
        }
        
        return {
          success: true,
          registers
        };
      } else {
        // Some registers failed, fall back to individual reads
        this.recordBatchResult(batch.count, false, batchStartTime);
        
        // Update adaptive batch size if we have enough history
        if (this.batchHistory.length >= this.adaptiveThreshold) {
          this.updateAdaptiveBatchSize();
        }
        
        return await this.fallbackToIndividualReads(batch);
      }
    } catch (error) {
      // Batch read failed completely, fall back to individual reads
      this.recordBatchResult(batch.count, false, batchStartTime);
      
      // Update adaptive batch size if we have enough history
      if (this.batchHistory.length >= this.adaptiveThreshold) {
        this.updateAdaptiveBatchSize();
      }
      
      return await this.fallbackToIndividualReads(batch, error as Error);
    }
  }

  /**
   * Fall back to individual register reads when batch operation fails
   * @param batch The failed batch
   * @param batchError Optional error from the batch operation
   * @returns BatchReadResult with individual read results
   */
  private async fallbackToIndividualReads(
    batch: RegisterBatch, 
    batchError?: Error
  ): Promise<BatchReadResult> {
    this.stats.failedBatches++;
    this.stats.fallbackReads += batch.count;

    const registers: RegisterInfo[] = [];
    const errors: Error[] = [];

    // Read each register individually
    for (let i = 0; i < batch.count; i++) {
      const address = batch.startAddress + i;
      
      try {
        const register = await this.registerReader.readSingleRegister(address, batch.functionCode);
        registers.push(register);
      } catch (error) {
        // If individual read also fails, create an inaccessible register entry
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(new Error(`Failed to read register ${address}: ${errorMessage}`));
        
        // Create inaccessible register info
        const dataType = this.getDataTypeForFunctionCode(batch.functionCode);
        const defaultValue = (batch.functionCode === 1 || batch.functionCode === 2) ? false : 0;
        
        registers.push({
          address,
          functionCode: batch.functionCode,
          dataType,
          value: defaultValue,
          accessible: false,
          timestamp: new Date(),
          error: {
            message: errorMessage,
            description: 'Individual read failed after batch read failure'
          }
        });
      }
    }

    // Update batch efficiency statistics
    this.updateBatchEfficiency();

    return {
      success: registers.some(reg => reg.accessible),
      registers,
      error: batchError || (errors.length > 0 ? errors[0] : undefined)
    };
  }

  /**
   * Read multiple register addresses using optimized batching
   * @param addresses Array of register addresses to read
   * @param functionCode Modbus function code (1, 2, 3, or 4)
   * @returns Array of RegisterInfo for all requested addresses
   */
  public async readOptimizedBatches(addresses: number[], functionCode: number): Promise<RegisterInfo[]> {
    if (addresses.length === 0) {
      return [];
    }

    // Create optimal batches
    const batches = this.createBatches(addresses, functionCode);
    const allRegisters: RegisterInfo[] = [];

    // Execute each batch
    for (const batch of batches) {
      const result = await this.executeBatch(batch);
      allRegisters.push(...result.registers);
    }

    // Sort results by address to maintain original order expectation
    allRegisters.sort((a, b) => a.address - b.address);

    return allRegisters;
  }

  /**
   * Get data type string for function code
   * @param functionCode Modbus function code
   * @returns Data type string
   */
  private getDataTypeForFunctionCode(functionCode: number): string {
    switch (functionCode) {
      case 1: return 'coil';
      case 2: return 'discrete';
      case 3: return 'holding';
      case 4: return 'input';
      default: return 'unknown';
    }
  }

  /**
   * Update batch efficiency statistics
   */
  private updateBatchEfficiency(): void {
    if (this.stats.totalRegisters === 0) {
      this.stats.batchEfficiency = 0;
      this.stats.averageBatchSize = 0;
      return;
    }

    const registersReadInBatches = this.stats.totalRegisters - this.stats.fallbackReads;
    this.stats.batchEfficiency = (registersReadInBatches / this.stats.totalRegisters) * 100;
    
    // Calculate average batch size
    if (this.stats.totalBatches > 0) {
      this.stats.averageBatchSize = this.stats.totalRegisters / this.stats.totalBatches;
    }
  }

  /**
   * Get current batch optimization statistics
   * @returns BatchStats object with performance metrics
   */
  public getStats(): BatchStats {
    this.updateBatchEfficiency();
    return { ...this.stats };
  }

  /**
   * Reset batch optimization statistics
   */
  public resetStats(): void {
    this.stats = {
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0,
      fallbackReads: 0,
      totalRegisters: 0,
      batchEfficiency: 0,
      averageBatchSize: 0,
      successRateBySize: new Map()
    };
    this.resetAdaptiveBatchSize();
  }

  /**
   * Get the maximum batch size configured for this optimizer
   * @returns Maximum batch size
   */
  public getMaxBatchSize(): number {
    return this.maxBatchSize;
  }

  /**
   * Calculate optimal batch size based on success rate
   * This method can be used for adaptive batch sizing in future enhancements
   * @returns Recommended batch size based on current statistics
   */
  public getRecommendedBatchSize(): number {
    if (this.stats.totalBatches === 0) {
      return this.maxBatchSize;
    }

    const successRate = this.stats.successfulBatches / this.stats.totalBatches;
    
    // If success rate is high, use full batch size
    if (successRate >= 0.8) {
      return this.maxBatchSize;
    }
    
    // If success rate is moderate, use smaller batches
    if (successRate >= 0.5) {
      return Math.floor(this.maxBatchSize * 0.5);
    }
    
    // If success rate is low, use very small batches
    return Math.min(10, this.maxBatchSize);
  }

  /**
   * Get the effective batch size to use for creating batches
   * Uses adaptive sizing based on recent performance
   * @returns Current effective batch size
   */
  private getEffectiveBatchSize(): number {
    // Update adaptive batch size if we have enough history
    if (this.batchHistory.length >= this.adaptiveThreshold) {
      this.updateAdaptiveBatchSize();
    }
    
    return Math.max(this.minBatchSize, Math.min(this.adaptiveBatchSize, this.maxBatchSize));
  }

  /**
   * Record the result of a batch operation for adaptive learning
   * @param batchSize Size of the batch that was attempted
   * @param success Whether the batch was successful
   * @param timestamp When the batch was executed
   */
  private recordBatchResult(batchSize: number, success: boolean, timestamp: Date): void {
    // Add to batch history
    this.batchHistory.push({ size: batchSize, success, timestamp });
    
    // Limit history size to prevent memory growth
    if (this.batchHistory.length > this.maxHistorySize) {
      this.batchHistory.shift();
    }

    // Update success rate statistics by batch size
    const sizeStats = this.stats.successRateBySize.get(batchSize) || { attempts: 0, successes: 0 };
    sizeStats.attempts++;
    if (success) {
      sizeStats.successes++;
    }
    this.stats.successRateBySize.set(batchSize, sizeStats);
  }

  /**
   * Update the adaptive batch size based on recent performance
   */
  private updateAdaptiveBatchSize(): void {
    // Get recent batch history (last 20 batches or last 30 seconds)
    const recentThreshold = new Date(Date.now() - 30000); // 30 seconds ago
    const recentBatches = this.batchHistory
      .slice(-20) // Last 20 batches
      .filter(batch => batch.timestamp >= recentThreshold);

    if (recentBatches.length < 3) {
      return; // Not enough recent data
    }

    // Calculate success rate for recent batches
    const recentSuccesses = recentBatches.filter(batch => batch.success).length;
    const recentSuccessRate = recentSuccesses / recentBatches.length;

    // Adjust batch size based on success rate
    if (recentSuccessRate >= 0.9) {
      // Very high success rate - try to increase batch size
      this.adaptiveBatchSize = Math.min(
        this.maxBatchSize,
        Math.floor(this.adaptiveBatchSize * 1.2)
      );
    } else if (recentSuccessRate >= 0.7) {
      // Good success rate - maintain or slightly increase
      this.adaptiveBatchSize = Math.min(
        this.maxBatchSize,
        Math.floor(this.adaptiveBatchSize * 1.1)
      );
    } else if (recentSuccessRate >= 0.4) {
      // Moderate success rate - slightly decrease
      this.adaptiveBatchSize = Math.max(
        this.minBatchSize,
        Math.floor(this.adaptiveBatchSize * 0.8)
      );
    } else {
      // Low success rate - significantly decrease
      this.adaptiveBatchSize = Math.max(
        this.minBatchSize,
        Math.floor(this.adaptiveBatchSize * 0.5)
      );
    }
  }

  /**
   * Get the current adaptive batch size
   * @returns Current adaptive batch size
   */
  public getCurrentAdaptiveBatchSize(): number {
    return this.adaptiveBatchSize;
  }

  /**
   * Get success rate statistics by batch size
   * @returns Map of batch sizes to their success rates
   */
  public getSuccessRatesBySize(): Map<number, number> {
    const successRates = new Map<number, number>();
    
    for (const [size, stats] of this.stats.successRateBySize) {
      if (stats.attempts > 0) {
        successRates.set(size, stats.successes / stats.attempts);
      }
    }
    
    return successRates;
  }

  /**
   * Get batch history for analysis
   * @param limit Optional limit on number of recent entries to return
   * @returns Array of recent batch results
   */
  public getBatchHistory(limit?: number): Array<{ size: number; success: boolean; timestamp: Date }> {
    if (limit) {
      return this.batchHistory.slice(-limit);
    }
    return [...this.batchHistory];
  }

  /**
   * Reset adaptive batch size to maximum
   */
  public resetAdaptiveBatchSize(): void {
    this.adaptiveBatchSize = this.maxBatchSize;
    this.batchHistory = [];
  }
}
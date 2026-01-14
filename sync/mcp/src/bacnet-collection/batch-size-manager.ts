/**
 * Manages adaptive batch sizing for BACnet meter reads
 * 
 * Tracks batch sizes per meter and adjusts them based on timeout events.
 * When a batch read times out, the batch size is reduced by 50%.
 * When a batch read succeeds, the batch size is maintained.
 * 
 * This allows the system to automatically optimize batch sizes for different
 * meters based on their response characteristics.
 */

export interface BatchSizeConfig {
  initialBatchSize?: number | 'all'; // Starting batch size (default: 'all')
  minBatchSize?: number;              // Minimum batch size before sequential (default: 1)
  reductionFactor?: number;           // Factor to reduce batch size on timeout (default: 0.5)
}

export interface MeterBatchState {
  meterId: number;
  currentBatchSize: number;
  totalRegisters: number;
  lastSuccessfulBatchSize?: number;
  consecutiveTimeouts: number;
  consecutiveSuccesses: number;
  lastUpdated: Date;
}

export class BatchSizeManager {
  private meterStates: Map<number, MeterBatchState> = new Map();
  private readonly initialBatchSize: number | 'all';
  private readonly minBatchSize: number;
  private readonly reductionFactor: number;
  private logger: any;

  constructor(config: BatchSizeConfig = {}, logger?: any) {
    this.initialBatchSize = config.initialBatchSize ?? 'all';
    this.minBatchSize = config.minBatchSize ?? 1;
    this.reductionFactor = config.reductionFactor ?? 0.5;
    this.logger = logger || console;

    // Validate configuration
    if (this.minBatchSize < 1) {
      throw new Error('minBatchSize must be at least 1');
    }
    if (this.reductionFactor <= 0 || this.reductionFactor >= 1) {
      throw new Error('reductionFactor must be between 0 and 1 (exclusive)');
    }
  }

  /**
   * Get the batch size for a meter
   * 
   * If the meter hasn't been seen before, initializes it with the configured
   * initial batch size. If initialBatchSize is 'all', uses totalRegisters.
   */
  getBatchSize(meterId: number, totalRegisters: number): number {
    let state = this.meterStates.get(meterId);

    if (!state) {
      // Initialize new meter state
      const initialSize =
        this.initialBatchSize === 'all' ? totalRegisters : this.initialBatchSize;

      state = {
        meterId,
        currentBatchSize: Math.max(initialSize, this.minBatchSize),
        totalRegisters,
        consecutiveTimeouts: 0,
        consecutiveSuccesses: 0,
        lastUpdated: new Date(),
      };

      this.meterStates.set(meterId, state);
      this.logger.debug(
        `Initialized batch size for meter ${meterId}: ${state.currentBatchSize} (total registers: ${totalRegisters})`
      );
    }

    return state.currentBatchSize;
  }

  /**
   * Record a successful batch read
   * 
   * Maintains the current batch size and increments the consecutive success counter.
   * Could be extended in the future to gradually increase batch size.
   */
  recordSuccess(meterId: number): void {
    const state = this.meterStates.get(meterId);

    if (!state) {
      this.logger.warn(`Attempted to record success for unknown meter ${meterId}`);
      return;
    }

    state.lastSuccessfulBatchSize = state.currentBatchSize;
    state.consecutiveSuccesses++;
    state.consecutiveTimeouts = 0;
    state.lastUpdated = new Date();

    this.logger.debug(
      `Batch read successful for meter ${meterId}: batch size ${state.currentBatchSize}, consecutive successes: ${state.consecutiveSuccesses}`
    );
  }

  /**
   * Record a batch read timeout
   * 
   * Reduces the batch size by the configured reduction factor (default 50%).
   * If the new batch size would be less than minBatchSize, sets it to minBatchSize.
   * Increments the consecutive timeout counter.
   */
  recordTimeout(meterId: number): void {
    const state = this.meterStates.get(meterId);

    if (!state) {
      this.logger.warn(`Attempted to record timeout for unknown meter ${meterId}`);
      return;
    }

    const previousBatchSize = state.currentBatchSize;
    const newBatchSize = Math.max(
      Math.floor(state.currentBatchSize * this.reductionFactor),
      this.minBatchSize
    );

    state.currentBatchSize = newBatchSize;
    state.consecutiveTimeouts++;
    state.consecutiveSuccesses = 0;
    state.lastUpdated = new Date();

    this.logger.info(
      `Batch read timeout for meter ${meterId}: reduced batch size from ${previousBatchSize} to ${newBatchSize}, consecutive timeouts: ${state.consecutiveTimeouts}`
    );
  }

  /**
   * Get the current state for a meter
   */
  getMeterState(meterId: number): MeterBatchState | undefined {
    return this.meterStates.get(meterId);
  }

  /**
   * Get all meter states
   */
  getAllMeterStates(): MeterBatchState[] {
    return Array.from(this.meterStates.values());
  }

  /**
   * Clear state for a specific meter
   */
  clearMeterState(meterId: number): void {
    this.meterStates.delete(meterId);
    this.logger.debug(`Cleared batch size state for meter ${meterId}`);
  }

  /**
   * Clear all meter states
   */
  clearAllStates(): void {
    this.meterStates.clear();
    this.logger.debug('Cleared all batch size states');
  }

  /**
   * Get meters that have experienced timeouts
   */
  getMetersWithTimeouts(): number[] {
    return Array.from(this.meterStates.values())
      .filter((state) => state.consecutiveTimeouts > 0)
      .map((state) => state.meterId);
  }

  /**
   * Get meters that are at minimum batch size (may need sequential fallback)
   */
  getMetersAtMinBatchSize(): number[] {
    return Array.from(this.meterStates.values())
      .filter((state) => state.currentBatchSize === this.minBatchSize)
      .map((state) => state.meterId);
  }

  /**
   * Get summary statistics for all meters
   */
  getSummary(): {
    totalMeters: number;
    metersWithTimeouts: number;
    metersAtMinBatchSize: number;
    averageBatchSize: number;
    averageConsecutiveTimeouts: number;
  } {
    const states = Array.from(this.meterStates.values());

    if (states.length === 0) {
      return {
        totalMeters: 0,
        metersWithTimeouts: 0,
        metersAtMinBatchSize: 0,
        averageBatchSize: 0,
        averageConsecutiveTimeouts: 0,
      };
    }

    const metersWithTimeouts = states.filter((s) => s.consecutiveTimeouts > 0).length;
    const metersAtMinBatchSize = states.filter((s) => s.currentBatchSize === this.minBatchSize).length;
    const averageBatchSize = states.reduce((sum, s) => sum + s.currentBatchSize, 0) / states.length;
    const averageConsecutiveTimeouts =
      states.reduce((sum, s) => sum + s.consecutiveTimeouts, 0) / states.length;

    return {
      totalMeters: states.length,
      metersWithTimeouts,
      metersAtMinBatchSize,
      averageBatchSize,
      averageConsecutiveTimeouts,
    };
  }
}

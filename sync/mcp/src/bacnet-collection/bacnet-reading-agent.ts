/**
 * Main BACnet meter reading agent with scheduling
 */

import * as cron from 'node-cron';
import { BACnetMeterReadingAgentConfig, CollectionCycleResult, AgentStatus, TimeoutMetrics, OfflineMeterStatus } from './types.js';
import { MeterCache, DeviceRegisterCache } from '../cache/index.js';
import { BACnetClient } from './bacnet-client.js';
import { CollectionCycleManager } from './collection-cycle-manager.js';

export class BACnetMeterReadingAgent {
  private config: BACnetMeterReadingAgentConfig;
  private meterCache: MeterCache;
  private deviceRegisterCache: DeviceRegisterCache;
  private bacnetClient: BACnetClient;
  private cycleManager: CollectionCycleManager;
  private isRunning: boolean = false;
  private isCycleExecuting: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;
  private totalCyclesExecuted: number = 0;
  private totalReadingsCollected: number = 0;
  private totalErrorsEncountered: number = 0;
  private lastCycleResult?: CollectionCycleResult;
  private cumulativeTimeoutMetrics: TimeoutMetrics = {
    totalTimeouts: 0,
    timeoutsByMeter: {},
    averageTimeoutRecoveryMs: 0,
    timeoutEvents: [],
  };
  private offlineMetersMap: Map<string, OfflineMeterStatus> = new Map();
  private logger: any;

  constructor(config: BACnetMeterReadingAgentConfig, logger?: any) {
    this.config = {
      collectionIntervalSeconds: 60,
      enableAutoStart: true,
      bacnetInterface: '0.0.0.0',
      bacnetPort: 47808,
      connectionTimeoutMs: 5000,
      readTimeoutMs: 3000,
      batchReadTimeoutMs: 5000,
      sequentialReadTimeoutMs: 3000,
      connectivityCheckTimeoutMs: 2000,
      enableConnectivityCheck: true,
      enableSequentialFallback: true,
      adaptiveBatchSizing: true,
      ...config,
    };

    this.logger = logger || console;
    // Use shared cache instances if provided, otherwise create new ones
    this.meterCache = config.meterCache || new MeterCache();
    this.deviceRegisterCache = config.deviceRegisterCache || new DeviceRegisterCache();
    this.bacnetClient = new BACnetClient({
      bacnetInterface: this.config.bacnetInterface,
      bacnetPort: this.config.bacnetPort,
      apduTimeout: this.config.connectionTimeoutMs,
      batchReadTimeout: this.config.batchReadTimeoutMs,
      sequentialReadTimeout: this.config.sequentialReadTimeoutMs,
      connectivityCheckTimeout: this.config.connectivityCheckTimeoutMs,
    }, this.logger);
    this.cycleManager = new CollectionCycleManager(this.deviceRegisterCache, this.logger);
  }

  /**
   * Start the agent and schedule collection cycles
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Agent is already running');
      return;
    }

    try {
      this.logger.info('Starting BACnet Meter Reading Agent');

      // Load meter cache on startup only if not already loaded
      if (!this.meterCache.isValid()) {
        await this.meterCache.reload(this.config.syncDatabase);
        this.logger.info(`Loaded ${this.meterCache.getMeters().length} meters into cache`);
      } else {
        this.logger.info(`Using existing meter cache with ${this.meterCache.getMeters().length} meters`);
      }

      // Load device register cache on startup only if not already loaded
      if (!this.deviceRegisterCache.isValid()) {
        await this.deviceRegisterCache.initialize(this.config.syncDatabase);
        this.logger.info('DeviceRegisterCache initialized');
      } else {
        this.logger.info('Using existing DeviceRegisterCache');
      }

      // Set up cron job to execute every N seconds
      const cronExpression = `*/${this.config.collectionIntervalSeconds} * * * * *`;
      this.logger.info(`Scheduling collection cycles every ${this.config.collectionIntervalSeconds} seconds`);

      this.cronJob = cron.schedule(cronExpression, async () => {
        // Execute collection cycle if one is not already running
        if (!this.isCycleExecuting) {
          await this.executeCycleInternal();
        } else {
          this.logger.warn('Skipping collection cycle: previous cycle still executing');
        }
      });

      this.isRunning = true;
      this.logger.info('BACnet Meter Reading Agent started successfully');

      // Auto-start first cycle if enabled
      if (this.config.enableAutoStart) {
        this.logger.info('Triggering initial collection cycle');
        await this.executeCycleInternal();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to start agent: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Stop the agent gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Agent is not running');
      return;
    }

    try {
      this.logger.info('Stopping BACnet Meter Reading Agent');

      // Stop the cron job
      if (this.cronJob) {
        this.cronJob.stop();
        this.cronJob = null;
        this.logger.info('Cron job stopped');
      }

      // Close BACnet connections
      await this.bacnetClient.close();
      this.logger.info('BACnet client closed');

      this.isRunning = false;
      this.logger.info('BACnet Meter Reading Agent stopped successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error during shutdown: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * Manually trigger a collection cycle
   */
  async triggerCollection(): Promise<CollectionCycleResult> {
    if (!this.isRunning) {
      throw new Error('Agent is not running');
    }

    // Prevent overlapping execution with scheduled cycle
    if (this.isCycleExecuting) {
      throw new Error('Collection cycle is already executing');
    }

    return this.executeCycleInternal();
  }

  /**
   * Internal method to execute a collection cycle
   */
  private async executeCycleInternal(): Promise<CollectionCycleResult> {
    // Set lock to prevent overlapping execution
    this.isCycleExecuting = true;

    try {
      // Note: Do NOT reload meter cache on every cycle
      // The cache is loaded at startup and reloaded by the sync agent when data changes
      // Reloading on every cycle would cause unnecessary database queries

      // Execute the collection cycle
      const result = await this.cycleManager.executeCycle(
        this.meterCache,
        this.bacnetClient,
        this.config.syncDatabase,
        this.config.readTimeoutMs
      );

      // Update metrics
      this.totalCyclesExecuted++;
      this.totalReadingsCollected += result.readingsCollected;
      this.totalErrorsEncountered += result.errors.length;
      this.lastCycleResult = result;

      // Accumulate timeout metrics from this cycle
      if (result.timeoutMetrics) {
        this.accumulateTimeoutMetrics(result.timeoutMetrics);
      }

      // Update offline meters tracking from cycle result
      this.updateOfflineMetersFromCycle(result);

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Collection cycle failed: ${errorMsg}`);

      // Record the error in metrics
      this.totalCyclesExecuted++;
      this.totalErrorsEncountered++;

      throw error;
    } finally {
      // Release the lock
      this.isCycleExecuting = false;
    }
  }

  /**
   * Accumulate timeout metrics from a cycle into cumulative metrics
   */
  private accumulateTimeoutMetrics(cycleMetrics: TimeoutMetrics): void {
    // Add to total timeouts
    this.cumulativeTimeoutMetrics.totalTimeouts += cycleMetrics.totalTimeouts;

    // Merge timeout counts by meter
    for (const [meterId, count] of Object.entries(cycleMetrics.timeoutsByMeter)) {
      if (!this.cumulativeTimeoutMetrics.timeoutsByMeter[meterId]) {
        this.cumulativeTimeoutMetrics.timeoutsByMeter[meterId] = 0;
      }
      this.cumulativeTimeoutMetrics.timeoutsByMeter[meterId] += count;
    }

    // Update last timeout time
    if (cycleMetrics.lastTimeoutTime) {
      this.cumulativeTimeoutMetrics.lastTimeoutTime = cycleMetrics.lastTimeoutTime;
    }

    // Accumulate timeout events
    if (cycleMetrics.timeoutEvents) {
      this.cumulativeTimeoutMetrics.timeoutEvents.push(...cycleMetrics.timeoutEvents);
    }

    // Recalculate average timeout recovery time
    if (this.cumulativeTimeoutMetrics.totalTimeouts > 0) {
      const totalRecoveryTime = this.cumulativeTimeoutMetrics.timeoutEvents.reduce(
        (sum, event) => sum + event.timeoutMs,
        0
      );
      this.cumulativeTimeoutMetrics.averageTimeoutRecoveryMs =
        totalRecoveryTime / this.cumulativeTimeoutMetrics.totalTimeouts;
    }

    this.logger.debug(
      `Accumulated timeout metrics: total=${this.cumulativeTimeoutMetrics.totalTimeouts}, ` +
      `average recovery=${this.cumulativeTimeoutMetrics.averageTimeoutRecoveryMs.toFixed(2)}ms`
    );
  }

  /**
   * Track offline meter status
   */
  private trackOfflineMeter(meterId: string): void {
    const meterIdStr = String(meterId);
    const now = new Date();

    if (this.offlineMetersMap.has(meterIdStr)) {
      // Meter already offline, increment consecutive failures
      const status = this.offlineMetersMap.get(meterIdStr)!;
      status.consecutiveFailures++;
      status.lastCheckedAt = now;
    } else {
      // New offline meter
      const status: OfflineMeterStatus = {
        meterId: meterIdStr,
        lastCheckedAt: now,
        consecutiveFailures: 1,
        offlineSince: now,
      };
      this.offlineMetersMap.set(meterIdStr, status);
      this.logger.warn(`🔴 Meter ${meterIdStr} marked as offline`);
    }
  }

  /**
   * Clear offline status for a meter when it comes back online
   */
  private clearOfflineMeter(meterId: string): void {
    const meterIdStr = String(meterId);
    if (this.offlineMetersMap.has(meterIdStr)) {
      this.offlineMetersMap.delete(meterIdStr);
      this.logger.info(`✅ Meter ${meterIdStr} is back online`);
    }
  }

  /**
   * Check for consistently slow meters and log warnings
   */
  private checkForSlowMeters(): void {
    const slowMeterThreshold = 3; // Number of timeouts to consider a meter slow
    const slowMeters: string[] = [];

    for (const [meterId, count] of Object.entries(this.cumulativeTimeoutMetrics.timeoutsByMeter)) {
      if (count >= slowMeterThreshold) {
        slowMeters.push(`${meterId} (${count} timeouts)`);
      }
    }

    if (slowMeters.length > 0) {
      this.logger.warn(
        `⚠️  Consistently slow meters detected: ${slowMeters.join(', ')}. Consider increasing timeout values or reducing batch sizes.`
      );
    }
  }

  /**
   * Update offline meters from cycle result
   */
  private updateOfflineMetersFromCycle(result: CollectionCycleResult): void {
    // Track meters that had connectivity errors
    for (const error of result.errors) {
      if (error.operation === 'connectivity') {
        this.trackOfflineMeter(error.meterId);
      }
    }

    // Track meters that had offline timeout events
    if (result.timeoutMetrics?.timeoutEvents) {
      for (const event of result.timeoutMetrics.timeoutEvents) {
        if (event.recoveryMethod === 'offline') {
          this.trackOfflineMeter(event.meterId);
        }
      }
    }

    // Check for consistently slow meters
    this.checkForSlowMeters();
  }

  /**
   * Get current agent status
   */
  getStatus(): AgentStatus {
    return {
      isRunning: this.isRunning,
      lastCycleResult: this.lastCycleResult,
      totalCyclesExecuted: this.totalCyclesExecuted,
      totalReadingsCollected: this.totalReadingsCollected,
      totalErrorsEncountered: this.totalErrorsEncountered,
      activeErrors: this.lastCycleResult?.errors || [],
      timeoutMetrics: this.cumulativeTimeoutMetrics,
      offlineMeters: Array.from(this.offlineMetersMap.values()),
    };
  }
}

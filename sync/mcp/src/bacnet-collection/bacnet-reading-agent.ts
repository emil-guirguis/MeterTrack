/**
 * Main BACnet meter reading agent with scheduling
 */

import * as cron from 'node-cron';
import { BACnetMeterReadingAgentConfig, CollectionCycleResult, AgentStatus } from './types.js';
import { MeterCache } from './meter-cache.js';
import { BACnetClient } from './bacnet-client.js';
import { CollectionCycleManager } from './collection-cycle-manager.js';

export class BACnetMeterReadingAgent {
  private config: BACnetMeterReadingAgentConfig;
  private meterCache: MeterCache;
  private bacnetClient: BACnetClient;
  private cycleManager: CollectionCycleManager;
  private isRunning: boolean = false;
  private isCycleExecuting: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;
  private totalCyclesExecuted: number = 0;
  private totalReadingsCollected: number = 0;
  private totalErrorsEncountered: number = 0;
  private lastCycleResult?: CollectionCycleResult;
  private logger: any;

  constructor(config: BACnetMeterReadingAgentConfig, logger?: any) {
    this.config = {
      collectionIntervalSeconds: 60,
      enableAutoStart: true,
      bacnetInterface: '0.0.0.0',
      bacnetPort: 47808,
      connectionTimeoutMs: 5000,
      readTimeoutMs: 3000,
      ...config,
    };

    this.logger = logger || console;
    this.meterCache = new MeterCache();
    this.bacnetClient = new BACnetClient(
      this.config.bacnetInterface,
      this.config.bacnetPort
    );
    this.cycleManager = new CollectionCycleManager(this.logger);
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

      // Load meter cache on startup
      await this.meterCache.reload(this.config.syncDatabase);
      this.logger.info(`Loaded ${this.meterCache.getMeters().length} meters into cache`);

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
      // Reload meter cache to pick up any updates
      await this.meterCache.reload(this.config.syncDatabase);

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
    };
  }
}

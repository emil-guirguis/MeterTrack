/**
 * Orchestrates a single collection cycle
 */

import { CollectionCycleResult, CollectionError, PendingReading, TimeoutEvent, TimeoutMetrics } from './types.js';
import { MeterCache, DeviceRegisterCache } from '../cache/index.js';
import { BACnetClient, BatchReadRequest } from './bacnet-client.js';
import { ReadingBatcher } from './reading-batcher.js';
import { BatchSizeManager, BatchSizeConfig } from './batch-size-manager.js';

export class CollectionCycleManager {
  private logger: any;
  private deviceRegisterCache: DeviceRegisterCache;
  private batchSizeManager: BatchSizeManager;
  private timeoutEvents: TimeoutEvent[] = [];

  constructor(deviceRegisterCache: DeviceRegisterCache, logger?: any, batchSizeConfig?: BatchSizeConfig) {
    this.deviceRegisterCache = deviceRegisterCache;
    this.logger = logger || console;
    this.batchSizeManager = new BatchSizeManager(batchSizeConfig, logger);
  }

  /**
   * Generate a simple cycle ID
   */
  private generateCycleId(): string {
    return `cycle-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Record a timeout event for metrics tracking
   */
  private recordTimeoutEvent(
    meterId: string,
    registerCount: number,
    batchSize: number,
    timeoutMs: number,
    recoveryMethod: 'sequential' | 'reduced_batch' | 'offline',
    success: boolean
  ): void {
    const event: TimeoutEvent = {
      meterId,
      timestamp: new Date(),
      registerCount,
      batchSize,
      timeoutMs,
      recoveryMethod,
      success,
    };

    this.timeoutEvents.push(event);
    this.logger.warn(
      `⏱️  Timeout event recorded for meter ${meterId}: ${registerCount} registers, batch size ${batchSize}, recovery method: ${recoveryMethod}, success: ${success}`
    );
  }

  /**
   * Calculate timeout metrics from collected events
   */
  private calculateTimeoutMetrics(): TimeoutMetrics {
    const timeoutsByMeter: Record<string, number> = {};
    let totalRecoveryTime = 0;

    // Count timeouts per meter and calculate average recovery time
    for (const event of this.timeoutEvents) {
      if (!timeoutsByMeter[event.meterId]) {
        timeoutsByMeter[event.meterId] = 0;
      }
      timeoutsByMeter[event.meterId]++;
      totalRecoveryTime += event.timeoutMs;
    }

    const averageTimeoutRecoveryMs =
      this.timeoutEvents.length > 0 ? totalRecoveryTime / this.timeoutEvents.length : 0;

    return {
      totalTimeouts: this.timeoutEvents.length,
      timeoutsByMeter,
      averageTimeoutRecoveryMs,
      lastTimeoutTime: this.timeoutEvents.length > 0 ? this.timeoutEvents[this.timeoutEvents.length - 1].timestamp : undefined,
      timeoutEvents: [...this.timeoutEvents],
    };
  }

  /**
   * Clear timeout events for the next cycle
   */
  private clearTimeoutEvents(): void {
    this.timeoutEvents = [];
  }

  /**
   * Execute a complete collection cycle
   * 
   * Iterates through all meters in the cache, connects to each via BACnet,
   * reads all configured data points, and persists readings to the database.
   * 
   * If the cache is empty, it will be loaded from the database before processing.
   * After the cycle completes, the cache is cleared to ensure fresh data on next cycle.
   */
  async executeCycle(
    meterCache: MeterCache,
    bacnetClient: BACnetClient,
    database: any,
    readTimeoutMs: number = 3000
  ): Promise<CollectionCycleResult> {
    const cycleId = this.generateCycleId();
    const startTime = new Date();
    const errors: CollectionError[] = [];
    let metersProcessed = 0;
    let readingsCollected = 0;
    let success = true;

    // Clear timeout events from previous cycle
    this.clearTimeoutEvents();

    this.logger.info(`Starting collection cycle ${cycleId}`);

    try {
      // Load cache from database if it's empty
      if (!meterCache.isValid()) {
        this.logger.info('Cache is empty or invalid, loading from database');
        try {
          await meterCache.reload(database);
          this.logger.info(`Loaded ${meterCache.getMeters().length} meters into cache`);
        } catch (reloadError) {
          const errorMsg = reloadError instanceof Error ? reloadError.message : String(reloadError);
          this.logger.error(`Failed to load meter cache from database: ${errorMsg}`);
          errors.push({
            meterId: 'system',
            operation: 'connect',
            error: `Cache reload failed: ${errorMsg}`,
            timestamp: new Date(),
          });
          success = false;
        }
      }

      // Get all meters from cache
      const meters = meterCache.getMeters();

      if (meters.length === 0) {
        this.logger.warn('No meters in cache for collection cycle');
        return {
          cycleId,
          startTime,
          endTime: new Date(),
          metersProcessed: 0,
          readingsCollected: 0,
          errors,
          success: success && errors.length === 0,
          timeoutMetrics: this.calculateTimeoutMetrics(),
        };
      }

      // Process each meter
      for (const meter of meters) {
        try {
          // Log meter info including device_id
          this.logger.info(`🔍 Processing Meter: ID=${meter.meter_id}, Name=${meter.name}, Device ID=${meter.device_id}, IP=${meter.ip}:${meter.port}`);

          // Create a batcher for this meter's readings
          const batcher = new ReadingBatcher(this.logger);

          // Attempt to read all data points from this meter
          const meterReadings = await this.readMeterDataPoints(
            meter,
            bacnetClient,
            readTimeoutMs,
            errors
          );

          // Add readings to batcher
          for (const reading of meterReadings) {
            batcher.addReading(reading);
          }

          // Flush readings to database
          if (batcher.getPendingCount() > 0) {
            try {
              const insertedCount = await batcher.flushBatch(database);
              readingsCollected += insertedCount;
              this.logger.info(
                `Meter ${meter.meter_id}: inserted ${insertedCount} readings`
              );
            } catch (writeError) {
              const errorMsg = writeError instanceof Error ? writeError.message : String(writeError);
              this.logger.error(
                `Failed to write readings for meter ${meter.meter_id}: ${errorMsg}`
              );
              errors.push({
                meterId: meter.meter_id,
                operation: 'write',
                error: errorMsg,
                timestamp: new Date(),
              });
              success = false;
            }
          }

          metersProcessed++;
        } catch (meterError) {
          const errorMsg = meterError instanceof Error ? meterError.message : String(meterError);
          this.logger.error(`Error processing meter ${meter.meter_id}: ${errorMsg}`);
          errors.push({
            meterId: meter.meter_id,
            operation: 'connect',
            error: errorMsg,
            timestamp: new Date(),
          });
          success = false;
          // Continue to next meter
        }
      }

      const endTime = new Date();
      const result: CollectionCycleResult = {
        cycleId,
        startTime,
        endTime,
        metersProcessed,
        readingsCollected,
        errors,
        success: success && errors.length === 0,
        timeoutMetrics: this.calculateTimeoutMetrics(),
      };

      this.logger.info(
        `Collection cycle ${cycleId} completed: ` +
        `${metersProcessed} meters, ${readingsCollected} readings, ${errors.length} errors, ` +
        `${result.timeoutMetrics?.totalTimeouts || 0} timeouts`
      );

      return result;
    } catch (cycleError) {
      const errorMsg = cycleError instanceof Error ? cycleError.message : String(cycleError);
      this.logger.error(`Collection cycle ${cycleId} failed: ${errorMsg}`);

      return {
        cycleId,
        startTime,
        endTime: new Date(),
        metersProcessed,
        readingsCollected,
        errors,
        success: false,
        timeoutMetrics: this.calculateTimeoutMetrics(),
      };
    } finally {
      // Clear cache after cycle completes to ensure fresh data on next cycle
      this.logger.debug(`Clearing meter cache after cycle ${cycleId}`);
      meterCache.clear();
    }
  }

  /**
   * Read all data points from a meter with adaptive batch sizing
   * 
   * First checks if the meter is online via connectivity check.
   * If offline, skips the meter and records offline status.
   * If online, gets all configured registers for the device from the register cache,
   * then reads registers using adaptive batch sizing:
   * - Starts with batch size from BatchSizeManager
   * - On timeout, reduces batch size and retries
   * - On complete failure, attempts sequential fallback
   * - Records metrics for monitoring
   */
  private async readMeterDataPoints(
    meter: any,
    bacnetClient: BACnetClient,
    readTimeoutMs: number,
    errors: CollectionError[]
  ): Promise<PendingReading[]> {
    const readings: PendingReading[] = [];

    try {
      // Check if meter is online before attempting to read
      this.logger.info(`Checking connectivity for meter ${meter.meter_id} at ${meter.ip}:${meter.port || 47808}`);
      const isOnline = await bacnetClient.checkConnectivity(meter.ip, meter.port || 47808);

      if (!isOnline) {
        // Meter is offline, skip it and record offline status with timestamp
        this.logger.warn(`Meter ${meter.meter_id} is offline or unreachable, skipping meter`);
        errors.push({
          meterId: String(meter.meter_id),
          operation: 'connectivity',
          error: `Meter offline or unreachable at ${meter.ip}:${meter.port || 47808}`,
          timestamp: new Date(),
        });

        // Record offline timeout event for metrics
        this.recordTimeoutEvent(
          String(meter.meter_id),
          0,
          0,
          readTimeoutMs,
          'offline',
          false
        );

        return readings;
      }

      this.logger.info(`Meter ${meter.meter_id} is online, proceeding with batch read`);

      // Get all configured registers for this device from cache
      const deviceRegisters = this.deviceRegisterCache.getDeviceRegisters(meter.device_id);
      
      if (deviceRegisters.length === 0) {
        this.logger.warn(`No registers configured for device ${meter.device_id} (meter ${meter.meter_id}), skipping meter`);
        errors.push({
          meterId: String(meter.meter_id),
          operation: 'read',
          error: `No registers configured for device ${meter.device_id}`,
          timestamp: new Date(),
        });
        return readings;
      }

      this.logger.info(`Found ${deviceRegisters.length} configured registers for device ${meter.device_id}`);
      
      // Log all register details for debugging
      this.logger.info(`📋 Device ${meter.device_id} Registers:`);
      deviceRegisters.forEach((reg: any, index: number) => {
        this.logger.info(`  [${index + 1}] Register ID: ${reg.register_id}, Register #: ${reg.register}, Field: ${reg.field_name}, Unit: ${reg.unit}`);
      });
      this.logger.info(`📊 Total Register Numbers: [${deviceRegisters.map((r: any) => r.register).join(', ')}]`);

      // Build batch read requests for all registers
      const batchRequests: BatchReadRequest[] = deviceRegisters.map((register: any) => ({
        objectType: 'analogInput',
        objectInstance: register.register,
        propertyId: 'presentValue',
        fieldName: register.field_name,
      }));

      // Perform batch read with adaptive sizing and timeout handling
      const batchResults = await this.performBatchReadWithAdaptiveSizing(
        meter,
        bacnetClient,
        batchRequests,
        deviceRegisters,
        readTimeoutMs,
        errors
      );

      // Process batch results
      batchResults.forEach((result: any, index: number) => {
        const register = deviceRegisters[index];

        if (result && result.success && result.value !== undefined) {
          let readValue = result.value;
          
          // If value is still an object, try to extract the numeric value
          if (typeof readValue === 'object' && readValue !== null) {
            // Try common property names for BACnet wrapped values
            if ('value' in readValue) {
              readValue = readValue.value;
            } else if ('_value' in readValue) {
              readValue = readValue._value;
            } else {
              // Last resort: convert to string and log the structure
              this.logger.warn(`⚠️ Unexpected value structure for register ${register.register}: ${JSON.stringify(readValue)}`);
              readValue = Object.values(readValue)[0] || readValue;
            }
          }
          
          readings.push({
            meter_id: meter.meter_id,
            timestamp: new Date(),
            data_point: register.field_name,
            value: Number(readValue),
            unit: register.unit || 'unknown',
          });
          this.logger.info(
            `✅ Successfully read register ${register.register} (${register.field_name}) from meter ${meter.meter_id}: value=${readValue}`
          );
        } else {
          const errorMsg = (result && result.error) || 'Unknown error';
          this.logger.warn(
            `⚠️ Failed to read register ${register.register} (${register.field_name}) from meter ${meter.meter_id}: ${errorMsg}`
          );
          errors.push({
            meterId: String(meter.meter_id),
            dataPoint: register.field_name,
            operation: 'read',
            error: errorMsg,
            timestamp: new Date(),
          });
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error reading meter data points for meter ${meter.meter_id}: ${errorMsg}`);
      errors.push({
        meterId: String(meter.meter_id),
        operation: 'read',
        error: errorMsg,
        timestamp: new Date(),
      });
    }

    return readings;
  }

  /**
   * Perform batch read with adaptive sizing and timeout handling
   * 
   * Implements the following strategy:
   * 1. Get current batch size from BatchSizeManager
   * 2. Split registers into batches of that size
   * 3. Read each batch with timeout handling
   * 4. On timeout, reduce batch size and retry
   * 5. On complete failure, attempt sequential fallback
   * 6. Record success/timeout for metrics
   */
  private async performBatchReadWithAdaptiveSizing(
    meter: any,
    bacnetClient: BACnetClient,
    allRequests: BatchReadRequest[],
    deviceRegisters: any[],
    readTimeoutMs: number,
    errors: CollectionError[]
  ): Promise<any[]> {
    const allResults: any[] = new Array(allRequests.length).fill(null);
    const port = meter.port || 47808;

    // Get initial batch size from manager
    let currentBatchSize = this.batchSizeManager.getBatchSize(meter.meter_id, allRequests.length);
    const isReadingAllAtOnce = currentBatchSize === allRequests.length;
    this.logger.info(
      `📦 Starting batch read for meter ${meter.meter_id}: ${isReadingAllAtOnce ? '✅ Reading ALL' : '⚠️ Reading in chunks'} ${allRequests.length} registers in batch size ${currentBatchSize}`
    );

    // Process all registers in batches
    let batchIndex = 0;

    for (let i = 0; i < allRequests.length; i += currentBatchSize) {
      const batchEnd = Math.min(i + currentBatchSize, allRequests.length);
      const batchRequests = allRequests.slice(i, batchEnd);
      const batchNumber = batchIndex + 1;

      this.logger.info(
        `📋 Batch ${batchNumber}: Reading registers ${i + 1}-${batchEnd} (batch size: ${batchRequests.length})`
      );

      try {
        // Attempt batch read with timeout
        const batchResults = await bacnetClient.readPropertyMultiple(
          meter.ip,
          port,
          batchRequests,
          readTimeoutMs
        );

        // Check if any results indicate timeout
        const hasTimeoutError = batchResults.some((r: any) => 
          r.error && r.error.includes('timeout')
        );

        if (hasTimeoutError) {
          // Batch read timed out - reduce batch size and retry
          this.logger.warn(
            `⏱️  Batch ${batchNumber} timed out for meter ${meter.meter_id}, reducing batch size`
          );

          // Record timeout event with reduced_batch recovery method
          this.recordTimeoutEvent(
            String(meter.meter_id),
            batchRequests.length,
            currentBatchSize,
            readTimeoutMs,
            'reduced_batch',
            false
          );

          this.batchSizeManager.recordTimeout(meter.meter_id);

          // Get new batch size and retry this batch
          const previousBatchSize = currentBatchSize;
          currentBatchSize = this.batchSizeManager.getBatchSize(meter.meter_id, allRequests.length);
          this.logger.info(
            `📉 Batch size reduced from ${previousBatchSize} to ${currentBatchSize}, retrying batch ${batchNumber}`
          );

          // Retry this batch with smaller size
          i -= currentBatchSize; // Back up to retry this batch
          batchIndex++;
          continue;
        }

        // Store successful results
        batchResults.forEach((result: any, index: number) => {
          allResults[i + index] = result;
        });

        // Record success for metrics
        this.batchSizeManager.recordSuccess(meter.meter_id);
        this.logger.info(`✅ Batch ${batchNumber} completed successfully for meter ${meter.meter_id}`);

      } catch (batchError) {
        // Batch read failed completely - attempt sequential fallback
        const errorMsg = batchError instanceof Error ? batchError.message : String(batchError);
        this.logger.error(
          `🔴 Batch ${batchNumber} failed for meter ${meter.meter_id}: ${errorMsg}, attempting sequential fallback`
        );

        // Attempt sequential fallback for this batch
        const sequentialResults = await bacnetClient.readPropertySequential(
          meter.ip,
          port,
          batchRequests,
          readTimeoutMs
        );

        // Store sequential results
        sequentialResults.forEach((result: any, index: number) => {
          allResults[i + index] = result;
        });

        // Record timeout event with sequential recovery method
        const successCount = sequentialResults.filter((r: any) => r.success).length;
        this.recordTimeoutEvent(
          String(meter.meter_id),
          batchRequests.length,
          currentBatchSize,
          readTimeoutMs,
          'sequential',
          successCount > 0
        );

        // Record timeout for metrics since we had to fall back
        this.batchSizeManager.recordTimeout(meter.meter_id);
      }

      batchIndex++;
    }

    // Log final status
    const successCount = allResults.filter((r: any) => r && r.success).length;
    const failureCount = allResults.filter((r: any) => r && !r.success).length;
    this.logger.info(
      `📊 Batch read completed for meter ${meter.meter_id}: ${successCount} succeeded, ${failureCount} failed`
    );

    return allResults;
  }

}

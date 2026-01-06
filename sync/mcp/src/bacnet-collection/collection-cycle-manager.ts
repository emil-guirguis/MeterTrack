/**
 * Orchestrates a single collection cycle
 */

import { CollectionCycleResult, CollectionError, PendingReading } from './types.js';
import { MeterCache } from './meter-cache.js';
import { BACnetClient } from './bacnet-client.js';
import { ReadingBatcher } from './reading-batcher.js';

export class CollectionCycleManager {
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || console;
  }

  /**
   * Generate a simple cycle ID
   */
  private generateCycleId(): string {
    return `cycle-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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
        };
      }

      // Process each meter
      for (const meter of meters) {
        try {
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
                `Meter ${meter.id}: inserted ${insertedCount} readings`
              );
            } catch (writeError) {
              const errorMsg = writeError instanceof Error ? writeError.message : String(writeError);
              this.logger.error(
                `Failed to write readings for meter ${meter.id}: ${errorMsg}`
              );
              errors.push({
                meterId: meter.id,
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
          this.logger.error(`Error processing meter ${meter.id}: ${errorMsg}`);
          errors.push({
            meterId: meter.id,
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
      };

      this.logger.info(
        `Collection cycle ${cycleId} completed: ` +
        `${metersProcessed} meters, ${readingsCollected} readings, ${errors.length} errors`
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
      };
    } finally {
      // Clear cache after cycle completes to ensure fresh data on next cycle
      this.logger.debug(`Clearing meter cache after cycle ${cycleId}`);
      meterCache.clear();
    }
  }

  /**
   * Read all data points from a meter
   */
  private async readMeterDataPoints(
    meter: any,
    bacnetClient: BACnetClient,
    readTimeoutMs: number,
    errors: CollectionError[]
  ): Promise<PendingReading[]> {
    const readings: PendingReading[] = [];

    try {
      // For now, we'll read a default set of data points
      // In a full implementation, this would come from meter configuration
      const defaultDataPoints = [
        { name: 'presentValue', objectType: 'analogInput', objectInstance: 0, property: 'presentValue' },
      ];

      for (const dataPoint of defaultDataPoints) {
        try {
          this.logger.debug(`Reading ${dataPoint.name} from meter ${meter.id}`);

          const result = await bacnetClient.readProperty(
            meter.ip,
            meter.port || 47808,
            dataPoint.objectType,
            dataPoint.objectInstance,
            dataPoint.property,
            readTimeoutMs
          );

          if (result.success && result.value !== undefined) {
            readings.push({
              meter_id: meter.id,
              timestamp: new Date(),
              data_point: dataPoint.name,
              value: Number(result.value),
              unit: 'unknown',
            });
            this.logger.debug(`Successfully read ${dataPoint.name} from meter ${meter.id}: ${result.value}`);
          } else {
            const errorMsg = result.error || 'Unknown error';
            this.logger.warn(`Failed to read ${dataPoint.name} from meter ${meter.id}: ${errorMsg}`);
            errors.push({
              meterId: String(meter.id),
              dataPoint: dataPoint.name,
              operation: 'read',
              error: errorMsg,
              timestamp: new Date(),
            });
          }
        } catch (dpError) {
          const errorMsg = dpError instanceof Error ? dpError.message : String(dpError);
          this.logger.error(`Error reading data point ${dataPoint.name} from meter ${meter.id}: ${errorMsg}`);
          errors.push({
            meterId: String(meter.id),
            dataPoint: dataPoint.name,
            operation: 'read',
            error: errorMsg,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error reading meter data points for meter ${meter.id}: ${errorMsg}`);
      errors.push({
        meterId: String(meter.id),
        operation: 'read',
        error: errorMsg,
        timestamp: new Date(),
      });
    }

    return readings;
  }
}
